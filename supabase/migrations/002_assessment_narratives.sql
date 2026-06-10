CREATE TABLE assessment_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  node_slug TEXT NOT NULL,   -- ex: 'trabalho-invisivel', 'tomada-de-decisao'
  seed_text TEXT NOT NULL,
  variations JSONB,          -- array de strings geradas pelo Claude (cacheadas)
  tags TEXT[]                -- ex: '{trabalho-invisivel,papeis,sobrecarga}'
);

CREATE INDEX idx_assessment_narratives_node_slug ON assessment_narratives(node_slug);

ALTER TABLE assessment_narratives ENABLE ROW LEVEL SECURITY;
