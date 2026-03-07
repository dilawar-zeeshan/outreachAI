import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // GET Request - Fetch all existing knowledge documents
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('knowledge_documents')
        .select('id, content')
        .order('created_at', { ascending: true })

      if (error) throw error

      return new Response(JSON.stringify({ documents: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // POST Request - Update knowledge base blocks
    if (req.method === 'POST') {
      const { documents } = await req.json()
      
      if (!Array.isArray(documents)) {
         return new Response(JSON.stringify({ error: 'Expected an array of documents.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)
      const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" })

      // Clear the existing knowledge base completely for refresh
      const { error: deleteError } = await supabaseAdmin.from('knowledge_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`)

      // Insert new documents
      for (const content of documents) {
          if (!content.trim()) continue;

          const embedResult = await embeddingModel.embedContent(content)
          const embedding = embedResult.embedding.values

          const { error: insertError } = await supabaseAdmin.from('knowledge_documents').insert({
              content: content.trim(),
              embedding: embedding
          })
          
          if (insertError) throw new Error(`Insert failed: ${insertError.message}`)
      }

      return new Response(JSON.stringify({ success: true, message: "Knowledge Base updated perfectly!" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })
  } catch (error: any) {
    console.error("Knowledge function error:", error)
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
