-- Update match_documents to take user_id as parameter
create or replace function match_documents(
  query_embedding vector(3072),
  match_count int default 5,
  p_user_id uuid default null
) returns table (
  content text
)
language plpgsql
as $$
begin
  return query
  select knowledge_documents.content
  from knowledge_documents
  where (p_user_id is null or knowledge_documents.user_id = p_user_id)
  order by knowledge_documents.embedding <-> query_embedding
  limit match_count;
end;
$$;
