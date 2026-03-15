import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import nodemailer from "npm:nodemailer"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

const CRON_SECRET = "outreach_background_worker_v1_69e42"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const cronSecret = req.headers.get('x-cron-secret')
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let isAuthorized = false;

    if (cronSecret === CRON_SECRET) {
        isAuthorized = true;
    } else if (authHeader && authHeader.replace('Bearer ', '') === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
        isAuthorized = true;
    } else if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        ).auth.getUser(token)
        if (!userError && user) isAuthorized = true;
    }

    if (!isAuthorized) throw new Error('Unauthorized')

    // Call atomic SQL function to pick one email and mark as 'processing'
    const { data: emailData, error: rpcErr } = await supabaseAdmin.rpc('process_next_email_in_queue')

    if (rpcErr) throw rpcErr

    if (!emailData || emailData.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending emails in queue' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const emailObj = emailData[0]

    try {
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
          to: emailObj.email,
          subject: emailObj.email_subject,
          text: emailObj.email_content,
        })

        // Finalize status as 'sent'
        await supabaseAdmin
          .from('outreach_emails')
          .update({ status: 'sent' })
          .eq('id', emailObj.id)

        return new Response(JSON.stringify({ success: true, processed: emailObj.email }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (sendErr: any) {
        // If sending fails, mark it back as 'pending' (or 'failed') so it can be retried or inspected
        await supabaseAdmin
          .from('outreach_emails')
          .update({ status: 'pending' }) // or 'failed'
          .eq('id', emailObj.id)
        
        throw sendErr;
    }

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
