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
    const { message, history } = await req.json()
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" })
    
    // 1. Generate embedding for message
    const embedResult = await embeddingModel.embedContent(message)
    const embedding = embedResult.embedding.values
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No auth header')
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    ).auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Perform vector similarity search
    const { data: documents, error: matchError } = await supabaseAdmin.rpc('match_documents', {
      query_embedding: embedding,
      match_count: 5
    })

    if (matchError) throw matchError

    const retrieved_documents = documents?.map((doc: any) => doc.content).join('\n\n') || ''

    // 3. Generate AI response using Gemini
    const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const systemPrompt = `You are an AI assistant (E-LABZ AI). 
Developer Context: ${retrieved_documents}

Look at conversation history for recipient emails, business niches, and especially user corrections to previous turns. 

Respond with a JSON object:
{ 
  "reply": "friendly message mentioning what you did",
  "draft_email": "professional outreach email. IMPORTANT: DO NOT USE placeholders like [Recipient Name] or [Business Name]. If the name is unknown, use 'Hi Team at (Niche Name)' or 'Hi there'. Write a complete, ready-to-send email.",
  "recipient_email": "literal email address (use corrected version from history if user corrected it)",
  "niche": "business category / industry"
}`;

    const contents = [
      ...(history || []),
      { role: "user", parts: [{ text: `${systemPrompt}\n\nUser request: ${message}` }] }
    ];

    const result = await chatModel.generateContent({
      contents,
      generationConfig: { responseMimeType: "application/json" }
    })
    
    const responseText = result.response.text()
    let parsed
    try {
      const cleanJson = responseText.replace(/^```json/m, '').replace(/```$/m, '').trim()
      parsed = JSON.parse(cleanJson)
    } catch(e) {
      console.error("Failed to parse AI response:", responseText)
      // Fallback
      parsed = {
        reply: "I generated an email for you.",
        draft_email: responseText,
        recipient_email: null,
        niche: "Unknown"
      }
    }

    // 4. Store conversation in chat_history
    await supabaseAdmin.from('chat_history').insert({
      user_id: user.id,
      user_message: message,
      ai_response: parsed.reply
    })

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error("Function error:", error)
    return new Response(JSON.stringify({ 
      error: error.message || String(error),
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
