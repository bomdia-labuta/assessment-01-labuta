-- supabase/seeds/003_narratives_complete.sql
-- 70 narrativas restantes do pool (as 2 de trabalho-invisivel já foram inseridas via 001)
-- Nota: #sobrecarga não tem nó correspondente — 9 narrativas não incluídas aqui
-- Nota: comunicacao e mudanca-e-adaptacao sem seeds neste pool

-- conflitos-entre-areas (9 seeds)
INSERT INTO assessment_narratives (node_slug, seed_text, tags) VALUES
('conflitos-entre-areas', 'A gente entregou o projeto no prazo. O problema é que o outro time nem sabia que a gente ia entregar. Ninguém usou.', ARRAY['conflitos_entre_areas', 'papeis_e_responsabilidades']),
('conflitos-entre-areas', 'Toda reunião de alinhamento vira uma negociação de quem faz o quê. Todo mundo sai com a sensação de que perdeu alguma coisa.', ARRAY['conflitos_entre_areas', 'tomada_de_decisao']),
('conflitos-entre-areas', 'Quando o projeto vai mal, cada área aponta pra outra. Quando vai bem, cada área diz que foi ela.', ARRAY['conflitos_entre_areas', 'poder_e_influencia']),
('conflitos-entre-areas', 'A gente não tem problema de comunicação. A gente tem problema de interesse. Mas ninguém fala assim.', ARRAY['conflitos_entre_areas', 'conversas_dificeis']),
('conflitos-entre-areas', 'Duas áreas criaram a mesma ferramenta sem saber uma da outra. Levou seis meses pra alguém perceber.', ARRAY['conflitos_entre_areas', 'papeis_e_responsabilidades']),
('conflitos-entre-areas', 'O cliente reclama pra mim, eu repasso pro outro time, o outro time diz que não é responsabilidade deles. O cliente fica no meio.', ARRAY['conflitos_entre_areas', 'papeis_e_responsabilidades']),
('conflitos-entre-areas', 'Cada área tem o seu OKR. Ninguém tem OKR de colaborar.', ARRAY['conflitos_entre_areas', 'tomada_de_decisao']),
('conflitos-entre-areas', 'A gente divide o mesmo cliente mas cada área tem uma estratégia diferente. O cliente percebe.', ARRAY['conflitos_entre_areas', 'papeis_e_responsabilidades']),
('conflitos-entre-areas', 'Alinhamos nas reuniões. Depois de cada reunião, cada um faz do seu jeito.', ARRAY['conflitos_entre_areas', 'tomada_de_decisao']);

-- tomada-de-decisao (9 seeds)
INSERT INTO assessment_narratives (node_slug, seed_text, tags) VALUES
('tomada-de-decisao', 'A reunião terminou sem decisão. Marcamos outra reunião pra decidir.', ARRAY['tomada_de_decisao', 'ritos_e_reunioes']),
('tomada-de-decisao', 'Todo mundo concordou na sala. Ninguém fez nada depois.', ARRAY['tomada_de_decisao', 'conversas_dificeis']),
('tomada-de-decisao', 'Eu sei o que precisa ser feito. Mas não sei se tenho autoridade pra fazer.', ARRAY['tomada_de_decisao', 'papeis_e_responsabilidades']),
('tomada-de-decisao', 'A gente espera o CEO validar coisas que o CEO não deveria precisar validar.', ARRAY['tomada_de_decisao', 'poder_e_influencia']),
('tomada-de-decisao', 'Ninguém quer assinar embaixo. Então a decisão fica em aberto até virar urgência.', ARRAY['tomada_de_decisao', 'conversas_dificeis']),
('tomada-de-decisao', 'A decisão foi tomada três vezes. Cada vez por uma pessoa diferente.', ARRAY['tomada_de_decisao', 'poder_e_influencia']),
('tomada-de-decisao', 'A última vez que tomei uma decisão sozinha, levei feedback por dois meses.', ARRAY['tomada_de_decisao', 'conversas_dificeis', 'poder_e_influencia']),
('tomada-de-decisao', 'Tudo precisa de aprovação. Mas não está claro de quem.', ARRAY['tomada_de_decisao', 'papeis_e_responsabilidades']),
('tomada-de-decisao', 'A gente cria comitê pra tudo. Comitê decide mais devagar que uma pessoa.', ARRAY['tomada_de_decisao', 'ritos_e_reunioes']);

-- conversas-dificeis (9 seeds)
INSERT INTO assessment_narratives (node_slug, seed_text, tags) VALUES
('conversas-dificeis', 'Todo mundo sabe que aquilo não tá funcionando. Ninguém fala.', ARRAY['conversas_dificeis']),
('conversas-dificeis', 'A conversa aconteceu no corredor depois da reunião. Nunca na reunião.', ARRAY['conversas_dificeis', 'ritos_e_reunioes']),
('conversas-dificeis', 'Dei esse feedback três vezes internamente. Nada mudou. Parei de dar.', ARRAY['conversas_dificeis', 'poder_e_influencia']),
('conversas-dificeis', 'A gente tem uma cultura muito legal de feedback. Só que os feedbacks reais nunca chegam pra quem precisa.', ARRAY['conversas_dificeis', 'poder_e_influencia']),
('conversas-dificeis', 'Quando o projeto travou, todo mundo sabia o motivo. Ninguém falou em voz alta.', ARRAY['conversas_dificeis', 'tomada_de_decisao']),
('conversas-dificeis', 'Tem uma tensão entre as duas lideranças que todo mundo sente mas ninguém nomeia.', ARRAY['conversas_dificeis', 'poder_e_influencia', 'conflitos_entre_areas']),
('conversas-dificeis', 'Quando alguém finalmente falou o que estava acontecendo, o gestor disse que era percepção.', ARRAY['conversas_dificeis', 'poder_e_influencia']),
('conversas-dificeis', 'O problema foi resolvido na superfície. A causa ficou.', ARRAY['conversas_dificeis']),
('conversas-dificeis', 'Aprendi a ler o que não é dito. É onde está o que importa.', ARRAY['conversas_dificeis', 'poder_e_influencia']);

-- papeis-e-responsabilidades (9 seeds)
INSERT INTO assessment_narratives (node_slug, seed_text, tags) VALUES
('papeis-e-responsabilidades', 'Meu cargo diz uma coisa. O que eu faço todo dia diz outra.', ARRAY['papeis_e_responsabilidades']),
('papeis-e-responsabilidades', 'Demorei uma semana pra entender que aquele problema era meu. Porque não estava escrito em lugar nenhum que era.', ARRAY['papeis_e_responsabilidades', 'tomada_de_decisao']),
('papeis-e-responsabilidades', 'Tem três pessoas responsáveis por aquilo. Na prática, ninguém é.', ARRAY['papeis_e_responsabilidades', 'conflitos_entre_areas']),
('papeis-e-responsabilidades', 'Entrei pra fazer produto. Virei gestor de crise.', ARRAY['papeis_e_responsabilidades']),
('papeis-e-responsabilidades', 'Quando a empresa cresceu, os papéis não foram redesenhados. A gente foi se virando.', ARRAY['papeis_e_responsabilidades', 'trabalho_invisivel']),
('papeis-e-responsabilidades', 'Duas pessoas acham que são donas do mesmo projeto. Nenhuma das duas sabe que a outra acha isso.', ARRAY['papeis_e_responsabilidades', 'conflitos_entre_areas', 'tomada_de_decisao']),
('papeis-e-responsabilidades', 'Toda vez que aparece um problema novo, aparece uma função informal nova. A gente só acumula.', ARRAY['papeis_e_responsabilidades']),
('papeis-e-responsabilidades', 'Fui promovido mas ninguém me disse o que mudou nas minhas responsabilidades.', ARRAY['papeis_e_responsabilidades']),
('papeis-e-responsabilidades', 'A descrição do cargo foi escrita quando a empresa tinha metade do tamanho.', ARRAY['papeis_e_responsabilidades']);

-- trabalho-invisivel (8 seeds — as 2 iniciais já foram inseridas via 001)
INSERT INTO assessment_narratives (node_slug, seed_text, tags) VALUES
('trabalho-invisivel', 'Passo metade do dia garantindo que as coisas não travem. Isso não aparece em lugar nenhum.', ARRAY['trabalho_invisivel']),
('trabalho-invisivel', 'Quando eu estava, tudo funcionava. Quando saí, todo mundo entendeu o que eu fazia.', ARRAY['trabalho_invisivel', 'papeis_e_responsabilidades']),
('trabalho-invisivel', 'O projeto foi reconhecido. As pessoas que fizeram acontecer nem foram mencionadas.', ARRAY['trabalho_invisivel', 'poder_e_influencia']),
('trabalho-invisivel', 'Tem alguém nessa equipe que resolve os conflitos antes de virarem problema. Ninguém sabe quem é.', ARRAY['trabalho_invisivel', 'conflitos_entre_areas']),
('trabalho-invisivel', 'A gente mede entrega. Não mede o trabalho de manter o time coeso pra entregar.', ARRAY['trabalho_invisivel', 'ritos_e_reunioes']),
('trabalho-invisivel', 'Cuido de coisas que ninguém pediu e ninguém vê. Mas se eu parar, trava.', ARRAY['trabalho_invisivel', 'papeis_e_responsabilidades']),
('trabalho-invisivel', 'Ninguém me pediu pra receber os novos. Eu faço porque se não fizer, eles ficam à deriva.', ARRAY['trabalho_invisivel']),
('trabalho-invisivel', 'Quando a pessoa que segurava tudo pediu demissão, a empresa percebeu que não sabia nem o que ela fazia.', ARRAY['trabalho_invisivel', 'poder_e_influencia']);

-- ritos-e-reunioes (10 seeds)
INSERT INTO assessment_narratives (node_slug, seed_text, tags) VALUES
('ritos-e-reunioes', 'A gente tem uma reunião toda semana pra alinhar o que aconteceu na reunião da semana passada.', ARRAY['ritos_e_reunioes']),
('ritos-e-reunioes', 'Saí de quatro horas de reunião sem saber o que preciso fazer amanhã.', ARRAY['ritos_e_reunioes', 'tomada_de_decisao']),
('ritos-e-reunioes', 'A reunião virou o lugar onde as decisões são apresentadas, não onde elas são tomadas.', ARRAY['ritos_e_reunioes', 'tomada_de_decisao', 'poder_e_influencia']),
('ritos-e-reunioes', 'Quando a reunião acaba, começa o aplicativo de mensagens. É lá que o papo real acontece.', ARRAY['ritos_e_reunioes', 'conversas_dificeis']),
('ritos-e-reunioes', 'Todo mundo sai da reunião geral motivado. Na segunda-feira, nada mudou.', ARRAY['ritos_e_reunioes', 'conversas_dificeis']),
('ritos-e-reunioes', 'Tem rituais que a gente mantém porque sempre fez assim. Ninguém lembra por quê.', ARRAY['ritos_e_reunioes']),
('ritos-e-reunioes', 'A retro levanta os mesmos problemas há seis meses. Nada sai de lá.', ARRAY['ritos_e_reunioes', 'conversas_dificeis', 'tomada_de_decisao']),
('ritos-e-reunioes', 'Minha agenda virou um Tetris de reuniões. Trabalho de verdade faço fora do horário.', ARRAY['ritos_e_reunioes']),
('ritos-e-reunioes', 'Entro em reunião sem saber por que fui convidado. Saio sem saber o que muda.', ARRAY['ritos_e_reunioes', 'tomada_de_decisao']),
('ritos-e-reunioes', 'Cancelo uma reunião e todo mundo agradece. Isso me diz tudo.', ARRAY['ritos_e_reunioes']);

-- poder-e-influencia (9 seeds)
INSERT INTO assessment_narratives (node_slug, seed_text, tags) VALUES
('poder-e-influencia', 'O organograma diz que somos horizontais. Na prática, todo mundo sabe quem manda.', ARRAY['poder_e_influencia']),
('poder-e-influencia', 'A decisão já estava tomada antes da reunião. A reunião era pra parecer que a gente participou.', ARRAY['poder_e_influencia', 'tomada_de_decisao', 'ritos_e_reunioes']),
('poder-e-influencia', 'Tem uma pessoa sem cargo de liderança que ninguém faz nada sem consultar.', ARRAY['poder_e_influencia', 'papeis_e_responsabilidades']),
('poder-e-influencia', 'Quando o CEO concorda com uma ideia, ela vira projeto. Quando não concorda, some.', ARRAY['poder_e_influencia', 'tomada_de_decisao']),
('poder-e-influencia', 'A minha área tem menos influência porque o nosso diretor não joga bem o jogo político.', ARRAY['poder_e_influencia', 'conflitos_entre_areas']),
('poder-e-influencia', 'Aprendi que as mudanças que importam não passam pelo processo formal. Passam pelos almoços.', ARRAY['poder_e_influencia', 'conversas_dificeis']),
('poder-e-influencia', 'Tem projetos que avançam porque a pessoa certa se importa. Não porque o sistema incentiva.', ARRAY['poder_e_influencia', 'trabalho_invisivel']),
('poder-e-influencia', 'Sei que minha ideia vai emplacar se eu convencer a pessoa certa antes da reunião.', ARRAY['poder_e_influencia', 'tomada_de_decisao', 'ritos_e_reunioes']),
('poder-e-influencia', 'Fui excluído de uma conversa que definia o meu trabalho. Fiquei sabendo depois.', ARRAY['poder_e_influencia', 'papeis_e_responsabilidades']);
