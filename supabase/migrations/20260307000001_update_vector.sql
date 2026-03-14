drop index if exists knowledge_documents_embedding_idx;

alter table knowledge_documents alter column embedding type vector(3072);

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
  order by knowledge_documents.embedding <-> query_embedding
  limit match_count;
end;
$$;
