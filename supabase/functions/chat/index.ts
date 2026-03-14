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
      match_count: 5,
      p_user_id: user.id
    })

    if (matchError) throw matchError

    const retrieved_documents = documents?.map((doc: any) => doc.content).join('\n\n') || ''

    // 3. Generate AI response using Gemini
    const chatModel = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      systemInstruction: `You are an AI assistant (E-LABZ AI). Your job is to help users write outreach emails based on their private knowledge base.

SENDER IDENTITY (Use this for "From" and Signatures):
${retrieved_documents}

STRICT RULES:
1. ALWAYS identify the sender's Name, Email, and WhatsApp from the "SENDER IDENTITY" section above. 
2. ALWAYS use the Sender's information for the email signature. 
3. For WhatsApp, ALWAYS format it as a clickable link if a number is found: https://wa.me/[number_without_plus].
4. THE RECIPIENT is the person/business the user mentioned. NEVER use the recipient's email address in your signature. 
5. For RECIPIENT details: If you don't know their name, use "Hi Team at (Business Name)" or "Hi there". NEVER use placeholders like [Recipient Name] or [Business Name].
6. DO NOT include the subject line inside the "body" text. Keep them strictly separate.
7. Output MUST be a valid JSON object.

JSON SCHEMA:
{ 
  "reply": "friendly status update about the draft",
  "subject": "compelling email subject line",
  "body": "professional email body (WITHOUT the subject line)",
  "recipient_email": "literal email address of the recipient",
  "niche": "industry/category"
}`
    })

    const contents = [
      ...(history || []),
      { role: "user", parts: [{ text: message }] }
    ];

    const result = await chatModel.generateContent({
      contents,
      generationConfig: { 
        responseMimeType: "application/json",
        temperature: 0.1
      }
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
        subject: "Outreach from E-LABZ AI",
        body: responseText,
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
