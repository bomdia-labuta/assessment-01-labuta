CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  -- preenchidos no gate (nullable até lá)
  name TEXT,
  email TEXT,
  marketing_consent BOOLEAN DEFAULT false,
  -- respostas coletadas durante o assessment
  node_scores JSONB,           -- { node_slug: score } ex: { "comunicacao": 0.83 }
  node_tags JSONB,             -- { node_slug: [tags] }
  selected_narratives JSONB,   -- { node_slug: [narrative_ids] }
  free_inputs JSONB,           -- { node_slug: "texto livre do usuário" }
  -- resultado gerado
  tipologia_id UUID REFERENCES assessment_typologies(id),
  leitura_sistemica TEXT,
  graph_image_url TEXT,
  -- controle de envio
  result_shared BOOLEAN DEFAULT false,
  result_email_sent BOOLEAN DEFAULT false
);

CREATE INDEX idx_assessment_responses_email ON assessment_responses(email);

ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
