-- Crear índice para optimizar búsquedas en cv_data
CREATE INDEX IF NOT EXISTS idx_cv_data_embedding 
ON cv_data USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Función para búsqueda semántica en cv_data
CREATE OR REPLACE FUNCTION search_cv_data(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  section text,
  title text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cv.id,
    cv.section,
    cv.title,
    cv.content,
    1 - (cv.embedding <=> query_embedding) AS similarity
  FROM cv_data cv
  WHERE cv.embedding IS NOT NULL
    AND 1 - (cv.embedding <=> query_embedding) >= match_threshold
  ORDER BY cv.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
