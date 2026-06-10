-- supabase/seeds/001_narratives.sql
-- Seeds iniciais para o nó Trabalho Invisível
INSERT INTO assessment_narratives (node_slug, seed_text, tags) VALUES
('trabalho-invisivel', 'Se a gente não aciona, não acontece. Fomos virando a ponte entre áreas que deveriam se conversar sozinhas.', ARRAY['trabalho_invisivel', 'papeis_e_responsabilidades']),
('trabalho-invisivel', 'Quando falta peça na estrutura, quem está mais perto do buraco vai tapando. Fico tão dentro do operacional que perco a visão do sistema de fora — que era exatamente o meu papel.', ARRAY['papeis_e_responsabilidades', 'trabalho_invisivel', 'tomada_de_decisao']);

-- Adicione seeds para os outros nós conforme forem escritas
