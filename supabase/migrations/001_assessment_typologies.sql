CREATE TABLE assessment_typologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  nome TEXT NOT NULL,
  descricao TEXT,
  assinatura_nos TEXT[],   -- slugs dos top 3 nós (ex: ['tomada-de-decisao', 'poder', 'conflitos'])
  pontos_atencao TEXT[],   -- 3 pontos de atenção exibidos no resultado
  cta TEXT
);

ALTER TABLE assessment_typologies ENABLE ROW LEVEL SECURITY;
