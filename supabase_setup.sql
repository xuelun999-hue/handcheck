-- Supabase手相知识库设置脚本
-- 在Supabase SQL Editor中执行以下命令

-- 1. 启用pgvector扩展
create extension if not exists vector;

-- 2. 创建手相知识库表
create table palm_knowledge (
  id bigserial primary key,
  title text not null,                    -- 知识点标题
  content text not null,                  -- 文档内容
  category text not null,                 -- 分类：palm_lines|mounts|signs|health|career|love
  subcategory text,                       -- 子分类：life_line|heart_line|etc
  keywords text[],                        -- 关键词数组
  embedding vector(1536),                 -- 向量嵌入（OpenAI ada-002维度）
  metadata jsonb,                         -- 额外元数据
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 创建向量相似度搜索索引
create index on palm_knowledge using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- 4. 创建全文搜索索引（使用默认配置）
create index palm_knowledge_content_fts on palm_knowledge 
using gin(to_tsvector('simple', content));

-- 5. 创建分类索引
create index palm_knowledge_category_idx on palm_knowledge(category);
create index palm_knowledge_subcategory_idx on palm_knowledge(subcategory);

-- 6. 启用行级安全（RLS）
alter table palm_knowledge enable row level security;

-- 7. 创建公开读取策略
create policy "Allow public read access" on palm_knowledge
for select using (true);

-- 8. 创建相似度搜索函数
create or replace function search_palm_knowledge(
  query_embedding vector(1536),
  match_threshold float default 0.78,
  match_count int default 5,
  filter_category text default null
)
returns table (
  id bigint,
  title text,
  content text,
  category text,
  subcategory text,
  keywords text[],
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    pk.id,
    pk.title,
    pk.content,
    pk.category,
    pk.subcategory,
    pk.keywords,
    1 - (pk.embedding <=> query_embedding) as similarity
  from palm_knowledge pk
  where 
    (filter_category is null or pk.category = filter_category)
    and (1 - (pk.embedding <=> query_embedding)) > match_threshold
  order by pk.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 9. 创建混合搜索函数（向量+关键词，使用简单配置）
create or replace function hybrid_search_palm_knowledge(
  query_text text,
  query_embedding vector(1536),
  match_threshold float default 0.75,
  match_count int default 5,
  filter_category text default null
)
returns table (
  id bigint,
  title text,
  content text,
  category text,
  subcategory text,
  keywords text[],
  similarity float,
  rank float
)
language plpgsql
as $$
begin
  return query
  select
    pk.id,
    pk.title,
    pk.content,
    pk.category,
    pk.subcategory,
    pk.keywords,
    1 - (pk.embedding <=> query_embedding) as similarity,
    ts_rank_cd(to_tsvector('simple', pk.content), plainto_tsquery('simple', query_text)) as rank
  from palm_knowledge pk
  where 
    (filter_category is null or pk.category = filter_category)
    and (
      (1 - (pk.embedding <=> query_embedding)) > match_threshold
      or to_tsvector('simple', pk.content) @@ plainto_tsquery('simple', query_text)
      or pk.content ilike '%' || query_text || '%'
    )
  order by 
    (1 - (pk.embedding <=> query_embedding)) * 0.8 + 
    ts_rank_cd(to_tsvector('simple', pk.content), plainto_tsquery('simple', query_text)) * 0.2 desc
  limit match_count;
end;
$$;