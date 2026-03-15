-- Enable Extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Create a helper function to call our process-queue function
create or replace function public.process_outreach_queue_job()
returns void as $$
begin
  -- Use pg_net to call the process-queue Edge Function
  -- This will trigger the oldest pending email to be sent
  perform
    net.http_post(
      url := 'https://ogazudmtczzopyvnzror.supabase.co/functions/v1/process-queue',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', 'outreach_background_worker_v1_69e42'
      ),
      body := '{}'
    );
end;
$$ language plpgsql security definer;

-- Schedule the job to run every 3 minutes
-- '*/3' means at every 3rd minute
select cron.schedule(
  'process-outreach-queue', -- job name
  '*/3 * * * *',           -- cron expression (every 3 minutes)
  'select public.process_outreach_queue_job()'
);
