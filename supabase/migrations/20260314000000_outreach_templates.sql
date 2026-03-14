create table if not exists outreach_templates (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) default auth.uid(),
    name text not null,
    subject text,
    body text,
    created_at timestamp default now()
);

alter table outreach_templates enable row level security;

create policy "Users can only see their own templates"
on outreach_templates for select
using ( auth.uid() = user_id );

create policy "Users can only insert their own templates"
on outreach_templates for insert
with check ( auth.uid() = user_id );

create policy "Users can only update their own templates"
on outreach_templates for update
using ( auth.uid() = user_id );

create policy "Users can only delete their own templates"
on outreach_templates for delete
using ( auth.uid() = user_id );
