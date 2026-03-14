-- Add email_subject column to outreach_emails
alter table outreach_emails add column if not exists email_subject text;
