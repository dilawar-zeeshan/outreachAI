-- Atomic function to pick and lock one pending email
create or replace function public.process_next_email_in_queue()
returns table (
  id uuid,
  email text,
  email_subject text,
  email_content text
) as $$
declare
  target_record_id uuid;
begin
  -- Update one pending record to 'processing' to lock it
  update outreach_emails
  set status = 'processing'
  where outreach_emails.id = (
    select outreach_emails.id
    from outreach_emails
    where status = 'pending'
    order by created_at asc
    for update skip locked
    limit 1
  )
  returning outreach_emails.id into target_record_id;

  if target_record_id is null then
    return;
  end if;

  -- Return the details of the locked record
  return query
  select 
    outreach_emails.id, 
    outreach_emails.email, 
    outreach_emails.email_subject, 
    outreach_emails.email_content
  from outreach_emails
  where outreach_emails.id = target_record_id;
end;
$$ language plpgsql security definer;
