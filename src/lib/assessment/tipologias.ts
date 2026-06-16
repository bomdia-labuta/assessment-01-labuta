// Dados curados das 9 tipologias de intervenção (3 grupos: Vetoriais / Sinalização / Comunicação).
// Fonte fixa dos cards do relatório — efeitos, feedback loop e variáveis vêm daqui (não da IA).
// A IA apenas escolhe 1 tipologia (por id) e gera o "porquê" + experimentos endereçando artefatos.

export type TipologiaCategoria = 'vetorial' | 'sinalizacao' | 'comunicacao'
export type VariavelDirecao = 'up' | 'down' | 'neutral'

export interface TipologiaIntervencao {
  id: string
  name: string
  category: TipologiaCategoria
  categoryLabel: string
  icon: string
  shortDescription: string
  effects: string[]
  feedbackLoop: { positive: string; risk: string; observe: string }
  variables: { name: string; direction: VariavelDirecao }[]
  experiments: { title: string; description: string }[]
}

export const TIPOLOGIAS: Record<string, TipologiaIntervencao> = {
  movimentar: {
    id: 'movimentar',
    name: 'Movimentar',
    category: 'vetorial',
    categoryLabel: 'Vetorial',
    icon: '🧭',
    shortDescription: 'Altera os custos de energia e tempo ao redor de um item — não o item em si.',
    effects: [
      'Muda o espaço de ação sem forçar mudança direta',
      'Pode tornar um comportamento mais ou menos custoso',
      'Influencia o sistema de forma indireta e menos resistida',
      'Efeito se distribui pelo sistema ao longo do tempo',
    ],
    feedbackLoop: {
      positive: 'Menor resistência → mais ação espontânea → sistema se move sem empurrar',
      risk: 'Pode deslocar o problema para outro ponto do sistema',
      observe: 'Comportamentos que mudam sem intervenção direta',
    },
    variables: [
      { name: 'Autonomia operacional', direction: 'up' },
      { name: 'Resistência a mudança', direction: 'down' },
      { name: 'Custo de coordenação', direction: 'neutral' },
    ],
    experiments: [
      {
        title: 'Remover um bloqueio invisível',
        description: 'Identifique algo que torna um comportamento desejado mais difícil do que precisa ser. Remova ou reduza esse bloqueio por 30 dias e observe se o comportamento aumenta.',
      },
      {
        title: 'Tornar o caminho certo mais fácil',
        description: 'Escolha uma prática que quer encorajar e reduza a fricção para fazê-la. Templates, rituais leves, lembretes — qualquer coisa que baixe o custo de entrada.',
      },
      {
        title: 'Aumentar o custo de uma prática indesejada',
        description: 'Sem proibir, torne levemente mais custoso algo que quer desencorajar — mais etapas, visibilidade, aprovação. Observe a mudança de frequência.',
      },
    ],
  },

  destruir: {
    id: 'destruir',
    name: 'Destruir',
    category: 'vetorial',
    categoryLabel: 'Vetorial',
    icon: '🔥',
    shortDescription: 'Elimina um item ou sua influência no sistema.',
    effects: [
      'Libera energia antes presa em algo que não serve mais',
      'Pode criar um vácuo que outro item (melhor) preenche',
      'Reduz complexidade local imediatamente',
      'Exige atenção às dependências ocultas',
    ],
    feedbackLoop: {
      positive: 'Menos ruído → mais clareza → melhor uso de atenção',
      risk: 'Pode criar instabilidade temporária ou revelar dependências não mapeadas',
      observe: 'O que surge naturalmente no lugar do que foi removido',
    },
    variables: [
      { name: 'Complexidade sistêmica', direction: 'down' },
      { name: 'Clareza operacional', direction: 'up' },
      { name: 'Dependências ocultas', direction: 'neutral' },
    ],
    experiments: [
      {
        title: 'Cancelar uma reunião recorrente por 30 dias',
        description: 'Escolha uma reunião cuja utilidade é questionável. Cancele por um mês. Observe o que era realmente necessário e o que era hábito.',
      },
      {
        title: 'Eliminar um processo que ninguém questiona',
        description: 'Mapeie um processo que "sempre foi assim". Remova ou simplifique radicalmente. Meça o que muda — positivo e negativo.',
      },
      {
        title: 'Remover um papel que perdeu função',
        description: 'Identifique uma responsabilidade formal que na prática ninguém exerce ou que se tornou redundante. Torne explícita a remoção.',
      },
    ],
  },

  estabilizar: {
    id: 'estabilizar',
    name: 'Estabilizar',
    category: 'vetorial',
    categoryLabel: 'Vetorial',
    icon: '⚖️',
    shortDescription: 'Mantém um actante onde está — nem mais nem menos energia.',
    effects: [
      'Preserva o que está funcionando durante períodos de mudança',
      'Reduz risco de intervenção desnecessária em algo saudável',
      'Libera atenção para áreas que realmente precisam de energia',
      'Sinaliza intencionalidade — não é omissão, é escolha',
    ],
    feedbackLoop: {
      positive: 'Estabilidade deliberada → confiança do time → mais capacidade para mudança em outras áreas',
      risk: 'Usado em excesso, pode criar inércia e resistência a mudanças necessárias',
      observe: 'Se a estabilidade é ativa (intencional) ou passiva (evitação)',
    },
    variables: [
      { name: 'Previsibilidade', direction: 'up' },
      { name: 'Confiança no sistema', direction: 'up' },
      { name: 'Capacidade de absorver mudança', direction: 'neutral' },
    ],
    experiments: [
      {
        title: 'Documentar explicitamente o que não vai mudar',
        description: 'Liste 3-5 elementos do sistema que serão preservados durante o próximo ciclo de mudança. Comunique ativamente. Observe como o time reage.',
      },
      {
        title: 'Criar um ritual de confirmação periódica',
        description: 'Trimestralmente, revise o que está sendo estabilizado e confirme se ainda é a escolha certa. Torne a decisão consciente, não automática.',
      },
    ],
  },

  condicionar: {
    id: 'condicionar',
    name: 'Condicionar',
    category: 'sinalizacao',
    categoryLabel: 'Sinalização',
    icon: '🔗',
    shortDescription: 'Mapeia ligações entre itens — o que possibilita o quê.',
    effects: [
      'Torna interdependências visíveis antes de agir',
      'Revela bloqueios que impedem outras ações',
      'Permite sequenciar intervenções com mais precisão',
      'Cria um mapa de causalidade do sistema',
    ],
    feedbackLoop: {
      positive: 'Visibilidade de ligações → melhores decisões de sequência → menos retrabalho',
      risk: 'Pode paralisar por excesso de análise — mapa não é o território',
      observe: 'Quais conexões mudam de natureza após intervenções pontuais',
    },
    variables: [
      { name: 'Clareza causal', direction: 'up' },
      { name: 'Surpresas sistêmicas', direction: 'down' },
      { name: 'Velocidade de análise', direction: 'neutral' },
    ],
    experiments: [
      {
        title: 'Mapear o que precisa acontecer antes de X',
        description: 'Escolha uma iniciativa travada. Mapeie todas as condições que precisam ser verdadeiras para ela avançar. Identifique o menor passo que desbloqueia mais.',
      },
      {
        title: 'Identificar o gargalo que libera tudo',
        description: 'Faça a pergunta: "Se resolvêssemos apenas uma coisa, o que liberaria mais energia no sistema?" Mapeie as dependências desse item.',
      },
    ],
  },

  monitorar: {
    id: 'monitorar',
    name: 'Monitorar',
    category: 'sinalizacao',
    categoryLabel: 'Sinalização',
    icon: '👁️',
    shortDescription: 'Observação focada em linhas de fronteira e mudanças importantes.',
    effects: [
      'Captura sinais antes que se tornem problemas',
      'Cria base de dados real para decisões futuras',
      'Aumenta a sensibilidade do sistema a mudanças',
      'Pode revelar padrões invisíveis para quem está dentro',
    ],
    feedbackLoop: {
      positive: 'Observação sistemática → antecipação → intervenções menores e mais precisas',
      risk: 'Monitorar sem contexto pode gerar ansiedade ou paralisia por excesso de dados',
      observe: 'O que os dados revelam que as conversas não revelaram',
    },
    variables: [
      { name: 'Capacidade de antecipação', direction: 'up' },
      { name: 'Qualidade de decisão', direction: 'up' },
      { name: 'Surpresas operacionais', direction: 'down' },
    ],
    experiments: [
      {
        title: 'Criar um indicador simples para uma tensão específica',
        description: 'Escolha uma variável que você suspeita ser importante mas nunca mediu. Crie uma forma simples de acompanhá-la semanalmente por 6 semanas.',
      },
      {
        title: 'Pedir feedback estruturado por 30 dias',
        description: 'Escolha um processo ou interação. Peça feedback estruturado (3 perguntas fixas) de quem participa, durante 30 dias. Analise os padrões.',
      },
    ],
  },

  acionar: {
    id: 'acionar',
    name: 'Acionar',
    category: 'sinalizacao',
    categoryLabel: 'Sinalização',
    icon: '👆',
    shortDescription: 'As condições estão presentes — agora podemos e devemos agir.',
    effects: [
      'Gera movimento direto e visível no sistema',
      'Mais imediato que outras intervenções — efeito rápido',
      'Exige clareza sobre o que está sendo mudado e por quê',
      'Pode gerar resistência se o sistema não estava preparado',
    ],
    feedbackLoop: {
      positive: 'Ação → aprendizado rápido → próxima ação mais informada',
      risk: 'Ação prematura pode gerar reação que trava o sistema',
      observe: 'Se a ação cria o efeito desejado ou um efeito diferente (e o que isso revela)',
    },
    variables: [
      { name: 'Velocidade de mudança', direction: 'up' },
      { name: 'Aprendizado organizacional', direction: 'up' },
      { name: 'Resistência do sistema', direction: 'neutral' },
    ],
    experiments: [
      {
        title: 'Implementar uma mudança pequena com data de revisão',
        description: 'Escolha algo que está sendo adiado. Implemente a menor versão possível. Marque uma data de revisão em 3 semanas. Observe o que acontece.',
      },
      {
        title: 'Tomar uma decisão que estava travada',
        description: 'Identifique uma decisão que o sistema está evitando. Tome-a — mesmo que imperfeita. Documente o raciocínio. Observe como o sistema se ajusta.',
      },
    ],
  },

  pesquisar: {
    id: 'pesquisar',
    name: 'Pesquisar',
    category: 'comunicacao',
    categoryLabel: 'Comunicação',
    icon: '🔍',
    shortDescription: 'Investigar, dar sentido, ampliar opções antes de agir.',
    effects: [
      'Aumenta a qualidade das opções disponíveis para decisão',
      'Reduz tomada de decisão baseada em intuição não verificada',
      'Cria linguagem compartilhada sobre o problema',
      'Pode revelar que o problema real é diferente do que parece',
    ],
    feedbackLoop: {
      positive: 'Mais dados → melhores escolhas → menos retrabalho por decisões mal informadas',
      risk: 'Pesquisa infinita pode se tornar desculpa para não agir',
      observe: 'Quando a pesquisa começa a confirmar o que já se sabe vs. revelar algo novo',
    },
    variables: [
      { name: 'Qualidade de decisão', direction: 'up' },
      { name: 'Opções disponíveis', direction: 'up' },
      { name: 'Velocidade de ação', direction: 'neutral' },
    ],
    experiments: [
      {
        title: 'Três entrevistas com pessoas diretamente afetadas',
        description: 'Escolha 3 pessoas que vivem o problema no dia a dia. Faça entrevistas de 30 minutos com perguntas abertas. Compile os padrões — não as soluções.',
      },
      {
        title: 'Sessão de sensemaking com o time',
        description: 'Reúna o time por 90 minutos. Apresente os dados que vocês têm. Pergunte: o que isso revela? O que ainda não sabemos? Mapeie as lacunas.',
      },
    ],
  },

  solicitar: {
    id: 'solicitar',
    name: 'Solicitar',
    category: 'comunicacao',
    categoryLabel: 'Comunicação',
    icon: '🤝',
    shortDescription: 'Engajar colaboração ou permissão — "chamar a cavalaria".',
    effects: [
      'Expande a capacidade de ação além dos recursos disponíveis',
      'Cria alianças que legitimam a intervenção',
      'Pode revelar resistências latentes antes da implementação',
      'Distribui a responsabilidade de forma mais ampla',
    ],
    feedbackLoop: {
      positive: 'Colaboração → mais recursos e perspectivas → intervenções mais robustas',
      risk: 'Muitas pessoas envolvidas pode diluir responsabilidade e desacelerar',
      observe: 'Quem se engaja espontaneamente e quem resiste — e o que isso revela',
    },
    variables: [
      { name: 'Capacidade de ação', direction: 'up' },
      { name: 'Legitimidade da intervenção', direction: 'up' },
      { name: 'Autonomia individual', direction: 'neutral' },
    ],
    experiments: [
      {
        title: 'Pedir apoio de alguém com influência no sistema',
        description: 'Identifique uma pessoa cuja adesão mudaria a dinâmica. Faça uma conversa direta e honesta sobre o que você está tentando fazer e o que precisa dela.',
      },
      {
        title: 'Co-desenhar a solução com um grupo pequeno',
        description: 'Em vez de apresentar uma solução pronta, convoque 3-4 pessoas para co-criá-la. O processo de criação já cria comprometimento.',
      },
    ],
  },

  transparecer: {
    id: 'transparecer',
    name: 'Transparecer',
    category: 'comunicacao',
    categoryLabel: 'Comunicação',
    icon: '💡',
    shortDescription: 'Tornar visível o que opera no implícito para estimular interações.',
    effects: [
      'Reduz ambiguidade e repetição de conversas sobre o que já deveria ser claro',
      'Cria superfície de contestação — o visível pode ser questionado e melhorado',
      'Sinaliza intenção de clareza e abertura ao time',
      'Pode revelar acordos implícitos que ninguém sabia que existiam',
    ],
    feedbackLoop: {
      positive: 'Visibilidade → mais interações reais → mais dados sobre como o sistema funciona de fato',
      risk: 'Visibilidade sem contexto pode gerar ansiedade ou leituras equivocadas',
      observe: 'Se as conversas mudam de natureza (mais substância, menos política) após a transparência',
    },
    variables: [
      { name: 'Clareza de autoridade', direction: 'up' },
      { name: 'Velocidade de decisão', direction: 'up' },
      { name: 'Ambiguidade de papéis', direction: 'down' },
      { name: 'Tensão de poder (pode subir antes de cair)', direction: 'neutral' },
    ],
    experiments: [
      {
        title: 'Mapa de decisão público',
        description: 'Crie uma página simples (Notion, Miro) que deixa explícito quem tem autoridade em quais tipos de decisão. Não é organograma — é accountability map. Revise mensalmente.',
      },
      {
        title: 'Decision log compartilhado',
        description: 'Para as próximas 10 decisões importantes, registre: quem decidiu, com que informação, qual foi a lógica. Torne acessível ao time. Observe como isso muda futuras decisões.',
      },
      {
        title: 'Sessão de leitura coletiva',
        description: 'Traga o mapa de decisão (ou qualquer artefato que explicita o sistema) para uma conversa de time. Pergunte: o que está visível aqui? O que deveria estar mas não está?',
      },
    ],
  },
}

export function getTipologia(id: string): TipologiaIntervencao | undefined {
  return TIPOLOGIAS[id]
}
