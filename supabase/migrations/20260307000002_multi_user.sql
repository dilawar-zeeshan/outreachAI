-- Add user_id column to tables
alter table knowledge_documents add column user_id uuid references auth.users(id) default auth.uid();
alter table outreach_emails add column user_id uuid references auth.users(id) default auth.uid();
alter table chat_history add column user_id uuid references auth.users(id) default auth.uid();

-- Enable Row Level Security
alter table knowledge_documents enable row level security;
alter table outreach_emails enable row level security;
alter table chat_history enable row level security;

-- Create Policies for Knowledge Documents
create policy "Users can only see their own knowledge"
on knowledge_documents for select
using ( auth.uid() = user_id );

create policy "Users can only insert their own knowledge"
on knowledge_documents for insert
with check ( auth.uid() = user_id );

create policy "Users can only update their own knowledge"
on knowledge_documents for update
using ( auth.uid() = user_id );

create policy "Users can only delete their own knowledge"
on knowledge_documents for delete
using ( auth.uid() = user_id );

-- Create Policies for Outreach Emails
create policy "Users can only see their own emails"
on outreach_emails for select
using ( auth.uid() = user_id );

create policy "Users can only insert their own emails"
on outreach_emails for insert
with check ( auth.uid() = user_id );

-- Create Policies for Chat History
create policy "Users can only see their own chat history"
on chat_history for select
using ( auth.uid() = user_id );

create policy "Users can only insert their own chat history"
on chat_history for insert
with check ( auth.uid() = user_id );

-- Update match_documents to filter by user_id
create or replace function match_documents(
  query_embedding vector(3072),
  match_count int default 5
) returns table (
  content text
)
language plpgsql
as $$
begin
  return query
  select knowledge_documents.content
  from knowledge_documents
  where knowledge_documents.user_id = auth.uid()
  order by knowledge_documents.embedding <-> query_embedding
  limit match_count;
end;
$$;
