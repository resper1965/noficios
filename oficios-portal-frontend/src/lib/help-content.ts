// Sistema de Help Contextual - n.Oficios
// Conteúdo de ajuda para cada seção do sistema

export interface HelpTopic {
  title: string;
  content: string;
  examples?: string[];
  tips?: string[];
  shortcuts?: string[];
  video?: string;
  relatedTopics?: string[];
}

export const helpContent: Record<string, HelpTopic> = {
  // ==================== DASHBOARD ====================
  'dashboard.overview': {
    title: 'Dashboard - Visão Geral',
    content: 'O Dashboard é sua central de comando. Aqui você monitora todos os ofícios, prazos e ações pendentes em tempo real.',
    tips: [
      'Cards coloridos indicam urgência (verde=ok, amarelo=atenção, vermelho=urgente)',
      'Clique nos cards para filtrar por status',
      'Atualizações acontecem automaticamente a cada minuto',
    ],
    shortcuts: ['Ctrl+K para buscar', 'F5 para atualizar'],
  },

  'dashboard.slaCards': {
    title: 'Cards de SLA',
    content: 'Os cards mostram o status dos prazos de resposta. SLA (Service Level Agreement) é o prazo máximo para responder cada ofício.',
    examples: [
      'Verde: Mais de 3 dias restantes',
      'Amarelo: Entre 1 e 3 dias (atenção!)',
      'Vermelho: Menos de 1 dia ou vencido (urgente!)',
    ],
    tips: [
      'Priorize ofícios em vermelho primeiro',
      'Configure alertas por email nas Configurações',
      'Use filtros para ver apenas ofícios em risco',
    ],
  },

  'dashboard.filters': {
    title: 'Filtros e Busca',
    content: 'Encontre rapidamente qualquer ofício usando filtros inteligentes e busca por texto.',
    examples: [
      'Buscar por número de processo: 1234567-89.2024',
      'Buscar por autoridade: TJ-SP',
      'Buscar por número do ofício: OF-123',
    ],
    tips: [
      'Use aspas para busca exata: "TJ-SP"',
      'Combine filtros para maior precisão',
      'Salve filtros usados frequentemente',
    ],
    shortcuts: ['Ctrl+K abre busca rápida', 'Esc fecha filtros'],
  },

  'dashboard.notifications': {
    title: 'Notificações',
    content: 'Receba alertas em tempo real sobre novos ofícios, prazos próximos e ações necessárias.',
    tips: [
      'Ícone vermelho indica notificações não lidas',
      'Clique para ver detalhes e tomar ação',
      'Configure preferências em Configurações',
    ],
  },

  // ==================== HITL PORTAL ====================
  'hitl.overview': {
    title: 'Portal HITL - Revisão Guiada',
    content: 'HITL (Human-in-the-Loop) é o processo de revisão humana dos dados extraídos pela IA. Você valida e complementa as informações em 4 passos simples.',
    tips: [
      'Leva em média 3-5 minutos por ofício',
      'Você pode voltar a passos anteriores',
      'Rascunhos são salvos automaticamente',
    ],
  },

  'hitl.step1': {
    title: 'Passo 1: Visualizar Documento',
    content: 'Revise o PDF do ofício original. Use os controles de zoom e navegação para ler todo o conteúdo antes de prosseguir.',
    tips: [
      'Use zoom para ver detalhes pequenos',
      'Anote mentalmente informações importantes',
      'Verifique se todas páginas carregaram',
    ],
    shortcuts: ['+ para zoom in', '- para zoom out', 'Setas para navegar'],
  },

  'hitl.step2': {
    title: 'Passo 2: Revisar Dados Extraídos',
    content: 'A IA já extraiu automaticamente dados importantes do PDF. Confira cada campo e corrija se necessário.',
    examples: [
      'Número do Ofício: 12345/2024',
      'Processo: 1234567-89.2024.1.00.0000',
      'Autoridade: Tribunal de Justiça de São Paulo',
      'Prazo: 25/10/2025',
    ],
    tips: [
      'Verde (≥88%): Alta confiança - provavelmente correto',
      'Amarelo (70-87%): Média confiança - revise com atenção',
      'Vermelho (<70%): Baixa confiança - confira tudo!',
      'Campos em vermelho provavelmente têm erro',
    ],
  },

  'hitl.step2.confidence': {
    title: 'Confiança da IA',
    content: 'A porcentagem de confiança indica quão certa a IA está sobre os dados extraídos. Quanto maior, mais provável que esteja correto.',
    examples: [
      '95% = Muito confiável (quase certeza)',
      '75% = Confiável (revisar)',
      '50% = Pouco confiável (verificar tudo)',
    ],
    tips: [
      'Mesmo com 99%, sempre revise os dados',
      'Baixa confiança geralmente indica PDF de má qualidade',
      'Se muitos campos estão errados, considere reenviar PDF',
    ],
  },

  'hitl.step3': {
    title: 'Passo 3: Adicionar Contexto Jurídico',
    content: 'Adicione informações extras que ajudarão a IA a gerar uma resposta mais precisa e adequada ao caso.',
    examples: [
      '"Cliente é o réu. Prazo improrrogável por decisão liminar."',
      '"Processo relacionado a ação de despejo. Documentos já enviados em 10/10/2025."',
      '"Jurisprudência aplicável: STJ REsp 123456. Cliente tem liminar favorável."',
      '"Ação trabalhista. Cliente é reclamante. Audiência marcada para 30/10/2025."',
    ],
    tips: [
      'Quanto mais contexto, melhor a resposta gerada',
      'Mencione particularidades do caso',
      'Cite documentos já enviados',
      'Indique jurisprudência relevante',
      'Informe sobre liminares ou decisões importantes',
    ],
  },

  'hitl.step4': {
    title: 'Passo 4: Aprovar ou Rejeitar',
    content: 'Faça a revisão final de todos os dados. Ao aprovar, a IA gerará automaticamente um rascunho de resposta usando o contexto fornecido.',
    tips: [
      'Revise todos os campos antes de aprovar',
      'Verifique se o contexto está completo',
      'Você terá 5 minutos para desfazer após aprovar',
      'A resposta gerada ainda pode ser editada',
    ],
  },

  'hitl.autosave': {
    title: 'Salvamento Automático',
    content: 'Seu progresso é salvo automaticamente a cada 30 segundos. Você pode sair e voltar depois sem perder nada.',
    tips: [
      'Veja "Salvo há X segundos" no rodapé',
      'Não precisa clicar em "Salvar"',
      'Funciona mesmo se fechar o navegador',
    ],
  },

  // ==================== GMAIL ====================
  'gmail.integration': {
    title: 'Integração com Gmail',
    content: 'Conecte sua conta Gmail para importar ofícios automaticamente. O sistema busca emails com a label INGEST a cada 15 minutos.',
    tips: [
      'Conexão segura via OAuth 2.0',
      'Sistema tem acesso apenas de leitura',
      'Não deletamos nem modificamos seus emails',
    ],
  },

  'gmail.labelIngest': {
    title: 'Label INGEST',
    content: 'INGEST (ingestão = entrada de dados) é a etiqueta que identifica emails para importação automática.',
    examples: [
      '1. No Gmail, abra o email do ofício',
      '2. Clique no ícone de rótulos (🏷️)',
      '3. Selecione "INGEST"',
      '4. Aguarde até 15 minutos',
      '5. Ofício aparecerá no Dashboard',
    ],
    tips: [
      'Crie a label se não existir (Configurações > Labels)',
      'Escolha cor azul para fácil identificação',
      'Aplique apenas em emails com anexo PDF',
    ],
  },

  'gmail.autoRule': {
    title: 'Regra Automática no Gmail',
    content: 'Configure uma regra para aplicar a label INGEST automaticamente em emails de tribunais.',
    examples: [
      '1. Gmail > Configurações > Filtros',
      '2. Criar novo filtro',
      '3. De: *@tjsp.jus.br (exemplo)',
      '4. Tem anexo: ✓',
      '5. Ação: Aplicar rótulo INGEST',
      '6. Salvar',
    ],
    tips: [
      'Use * para aceitar qualquer email do domínio',
      'Adicione múltiplos domínios (TJ-SP, TJ-RJ, etc)',
      'Teste enviando email para você mesmo',
    ],
  },

  'gmail.troubleshooting': {
    title: 'Problemas com Gmail',
    content: 'Se ofícios não estão sendo importados, verifique estes pontos comuns:',
    examples: [
      '❌ Email não tem label INGEST',
      '❌ Email não tem anexo PDF',
      '❌ PDF está corrompido ou protegido',
      '❌ Gmail não está conectado (Configurações)',
      '❌ Aguarde até 15 minutos (intervalo de sync)',
    ],
    tips: [
      'Veja status da conexão em Configurações',
      'Última sincronização deve ser < 15 min',
      'Teste com email simples primeiro',
    ],
  },

  // ==================== UPLOAD ====================
  'upload.manual': {
    title: 'Upload Manual de Ofício',
    content: 'Se preferir, você pode criar ofícios manualmente fazendo upload direto do PDF.',
    tips: [
      'Tamanho máximo: 10 MB',
      'Formato: PDF apenas',
      'PDF deve ser legível (não escaneado com má qualidade)',
      'Preencha dados básicos manualmente',
    ],
  },

  'upload.requirements': {
    title: 'Requisitos do PDF',
    content: 'Para melhor extração de dados, o PDF deve atender alguns requisitos:',
    examples: [
      '✅ Formato: PDF (não imagem)',
      '✅ Tamanho: Até 10 MB',
      '✅ Qualidade: Texto selecionável',
      '✅ Páginas: Todas visíveis',
      '❌ Evitar: PDFs protegidos ou corrompidos',
    ],
    tips: [
      'Se PDF for escaneado, use OCR primeiro',
      'Teste abrindo o PDF - se texto pode ser selecionado, está OK',
      'Reduza tamanho usando compressores online se > 10MB',
    ],
  },

  // ==================== CONFIGURAÇÕES ====================
  'settings.overview': {
    title: 'Configurações',
    content: 'Personalize o sistema de acordo com suas preferências e conecte serviços externos.',
    tips: [
      'Alterações são salvas automaticamente',
      'Configurações sincronizam entre dispositivos',
    ],
  },

  'settings.notifications': {
    title: 'Notificações',
    content: 'Configure quando e como receber alertas sobre ofícios e prazos.',
    examples: [
      'Email diário com resumo',
      'Alerta imediato para ofícios vencidos',
      'Notificação 24h antes do prazo',
    ],
  },

  // ==================== ATALHOS ====================
  'shortcuts.global': {
    title: 'Atalhos de Teclado',
    content: 'Use atalhos para trabalhar mais rápido:',
    shortcuts: [
      'Ctrl+K - Busca rápida',
      'Ctrl+N - Novo ofício',
      'Esc - Fechar modal/drawer',
      'F5 - Atualizar página',
      '→ - Próximo passo (HITL)',
      '← - Passo anterior (HITL)',
    ],
    tips: [
      'Pressione ? em qualquer tela para ver atalhos disponíveis',
    ],
  },

  // ==================== GERAL ====================
  'general.firstSteps': {
    title: 'Primeiros Passos',
    content: 'Novo no sistema? Comece por aqui:',
    examples: [
      '1. Conectar Gmail (Configurações)',
      '2. Aplicar label INGEST em um email de teste',
      '3. Aguardar 15 minutos',
      '4. Revisar ofício no Portal HITL',
      '5. Aprovar e gerar resposta',
    ],
    tips: [
      'Assista o tutorial interativo (aparece no primeiro login)',
      'Leia o manual completo: MANUAL_DO_USUARIO.md',
      'Entre em contato se precisar: suporte@ness.com.br',
    ],
  },

  'general.support': {
    title: 'Suporte',
    content: 'Precisa de ajuda? Estamos aqui!',
    examples: [
      '📧 Email: suporte@ness.com.br',
      '📖 Manual: /docs/MANUAL_DO_USUARIO.md',
      '💡 Tutorial: Configurações > Ver Tutorial',
    ],
    tips: [
      'Ao reportar problemas, inclua prints de tela',
      'Mencione número do ofício se aplicável',
      'Resposta em até 24h úteis',
    ],
  },
};

// Helper para buscar tópico
export function getHelpTopic(key: string): HelpTopic | null {
  return helpContent[key] || null;
}

// Helper para buscar por palavra-chave
export function searchHelp(query: string): Array<{ key: string; topic: HelpTopic }> {
  const results: Array<{ key: string; topic: HelpTopic }> = [];
  const lowerQuery = query.toLowerCase();

  Object.entries(helpContent).forEach(([key, topic]) => {
    const searchText = `${topic.title} ${topic.content}`.toLowerCase();
    if (searchText.includes(lowerQuery)) {
      results.push({ key, topic });
    }
  });

  return results;
}

// Categorias para organização
export const helpCategories = {
  dashboard: 'Dashboard',
  hitl: 'Revisão HITL',
  gmail: 'Gmail',
  upload: 'Upload',
  settings: 'Configurações',
  shortcuts: 'Atalhos',
  general: 'Geral',
};

