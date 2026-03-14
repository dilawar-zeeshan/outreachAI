create extension if not exists vector;

create table if not exists knowledge_documents (
    id uuid primary key default gen_random_uuid(),
    content text not null,
    embedding vector(768),
    metadata jsonb,
    created_at timestamp default now()
);

create index if not exists knowledge_documents_embedding_idx on knowledge_documents
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

create table if not exists outreach_emails (
    id uuid primary key default gen_random_uuid(),
    company_name text,
    email text,
    website text,
    email_content text,
    status text default 'draft',
    created_at timestamp default now()
);

create table if not exists chat_history (
    id uuid primary key default gen_random_uuid(),
    user_message text,
    ai_response text,
    created_at timestamp default now()
);

create or replace function match_documents(
  query_embedding vector(768),
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
  order by knowledge_documents.embedding <-> query_embedding
  limit match_count;
end;
$$;
