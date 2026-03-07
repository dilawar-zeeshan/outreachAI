import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import nodemailer from "npm:nodemailer"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, subject, message, niche } = await req.json()
    
    // 1. Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address format.' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const domain = email.split('@')[1].toLowerCase();
    
    // 2. Common typo detection
    const commonTypos: Record<string, string> = {
      'gomail.com': 'gmail.com',
      'gmal.com': 'gmail.com',
      'gmeil.com': 'gmail.com',
      'gnail.com': 'gmail.com',
      'hotmial.com': 'hotmail.com',
      'outlok.com': 'outlook.com'
    };

    if (commonTypos[domain]) {
      return new Response(JSON.stringify({ 
        error: `Typo detected: Did you mean "${commonTypos[domain]}" instead of "${domain}"?` 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // 3. DNS MX Record Check (via Google DoH)
    // This ensures the domain actually exists and is configured to receive emails.
    try {
      const dnsRes = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
      const dnsData = await dnsRes.json();
      
      if (!dnsData.Answer || dnsData.Answer.length === 0) {
        return new Response(JSON.stringify({ 
          error: `The domain "@${domain}" does not appear to be a valid email host (no MX records found).` 
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }
    } catch (e) {
      console.error("DNS check failed, skipping validation:", e);
      // If DNS check itself fails (network issue), we proceed to send so we don't block valid users.
    }

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const transporter = nodemailer.createTransport({
      host: Deno.env.get('SMTP_HOST'),
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      secure: Deno.env.get('SMTP_PORT') === '465',
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASS'),
      },
    })

    await transporter.sendMail({
      from: Deno.env.get('ADMIN_EMAIL'),
      to: email,
      subject: subject || 'AI chatbot for your business',
      text: message,
    })

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

    await supabaseAdmin.from('outreach_emails').insert({
      user_id: user.id,
      email: email,
      email_content: message,
      company_name: niche || 'Unknown',
      status: 'sent'
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
