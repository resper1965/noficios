# 📖 Manual do Usuário - n.Oficios

**Sistema de Automação de Ofícios Judiciais**  
**Versão:** 1.0.0  
**Data:** Outubro 2025

---

## 🎯 O que é o n.Oficios?

O **n.Oficios** é um sistema inteligente que automatiza o processamento de ofícios judiciais, transformando **3,5 horas** de trabalho manual em apenas **5 minutos** automatizados.

### **Principais Funcionalidades:**

- ✅ Importação automática de ofícios do Gmail
- ✅ Extração inteligente de dados com IA
- ✅ Portal de revisão humana guiada (HITL)
- ✅ Dashboard de acompanhamento SLA
- ✅ Geração automática de respostas
- ✅ **Sistema de ajuda integrado (NOVO!)**

---

## 🚀 Começando a Usar

### **1. Acessar o Sistema**

**URL:** https://oficio.ness.tec.br

**Ambiente de desenvolvimento:** https://oficio-dev.ness.tec.br

### **2. Fazer Login**

1. Na página inicial, clique em **"Entrar com Google"**
2. Escolha sua conta Google
3. Autorize o acesso
4. Você será redirecionado para o Dashboard

---

## 📊 Dashboard Principal

Ao fazer login, você verá:

### **Indicadores SLA (Topo da Página)**

**3 cards com informações importantes:**

1. **📋 Total de Ofícios**
   - Quantidade total de ofícios no sistema
   - Atualizado em tempo real

2. **⚠️ Ofícios em Risco**
   - Ofícios com prazo < 3 dias
   - Cor laranja (atenção!)

3. **🔴 Ofícios Vencidos**
   - Ofícios com prazo expirado
   - Cor vermelha (urgente!)

### **Lista de Ofícios**

**Tabela com todos os ofícios:**

| Número | Processo | Autoridade | Prazo | Status | Ações |
|--------|----------|------------|-------|--------|-------|
| OF-123 | 123456-78... | TJ-SP | 20/10/25 | Aguardando | Revisar |

**Filtros disponíveis:**
- 🔍 Buscar por número de processo ou autoridade
- 👤 "Atribuídos a Mim" - apenas seus ofícios

**Ações:**
- Clique em **"Revisar"** para abrir o Portal HITL

---

## 📧 Importação de Emails do Gmail

### **Opção 1: Automática (Recomendada)**

**Configuração única:**

1. Acesse **Configurações** (ícone ⚙️ no menu superior)
2. Localize a seção **"Integração com Gmail"**
3. Clique no botão **"Conectar Gmail"**
4. Faça login com sua conta Google
5. Autorize o acesso à leitura de emails
6. Aguarde confirmação de conexão bem-sucedida
7. Pronto! O sistema buscará emails automaticamente a cada 15 minutos

**Como funciona:**
- Sistema busca emails com label **INGEST**
- Extrai dados automaticamente
- Cria ofícios no sistema
- Você só revisa e aprova

### **Opção 2: Manual**

**Criar ofício manualmente:**

1. No Dashboard, clique em **"Novo Ofício"**
2. Preencha os dados:
   - Número do ofício
   - Número do processo
   - Autoridade emissora
   - Prazo de resposta
   - Descrição
3. Faça upload do PDF
4. Clique em **"Salvar"**

---

## ✅ Portal HITL (Revisão Humana)

**HITL = Human-in-the-Loop** (Humano no Processo)

Quando um ofício precisa de revisão, ele aparece na seção **"Ofícios Aguardando Revisão"** do Dashboard.

### **Processo de Revisão em 4 Passos:**

#### **📄 Passo 1: Visualizar Documento**

- Visualize o PDF do ofício
- Use os controles para:
  - 🔍 Zoom in/out
  - ⬅️➡️ Navegar páginas
- Leia o conteúdo completo

**Botões:**
- **Próximo** → Ir para Passo 2

---

#### **🤖 Passo 2: Revisar Dados Extraídos pela IA**

A IA já extraiu automaticamente:

- **Número do Ofício:** Ex: 12345
- **Número do Processo:** Ex: 1234567-89.2024.1.00.0000
- **Autoridade Emissora:** Ex: Tribunal de Justiça de São Paulo
- **Prazo de Resposta:** Ex: 25/10/2025
- **Descrição:** Resumo do conteúdo

**Nível de Confiança:**
- 🟢 Verde (≥88%): Alta confiança
- 🟡 Amarelo (70-87%): Média confiança
- 🔴 Vermelho (<70%): Baixa confiança - revisar com atenção!

**Botões:**
- **Anterior** → Voltar para Passo 1
- **Próximo** → Ir para Passo 3

---

#### **✏️ Passo 3: Corrigir e Adicionar Contexto**

**Aqui você pode:**

1. **Corrigir dados** que a IA errou:
   - Edite qualquer campo
   - Corrija números, datas, nomes

2. **Adicionar contexto jurídico:**
   - Campo: "Contexto Jurídico Adicional"
   - Exemplo: "Processo relacionado a ação de despejo. Cliente é o autor. Prazo improrrogável por decisão liminar."
   - Este contexto será usado pela IA para gerar uma resposta mais precisa

**Dica:** Quanto mais contexto você adicionar, melhor será a resposta gerada!

**Botões:**
- **Anterior** → Voltar para Passo 2
- **Próximo** → Ir para Passo 4

---

#### **✅ Passo 4: Aprovar ou Rejeitar**

**Revisão final:**
- Confirme que todos os dados estão corretos
- Verifique o contexto adicionado

**Ações disponíveis:**

1. **🟢 Aprovar**
   - Os dados estão corretos
   - Sistema vai gerar resposta automaticamente
   - Você receberá notificação quando estiver pronta

2. **🔴 Rejeitar**
   - Dados muito incorretos
   - Ofício volta para revisão
   - Você pode editá-lo depois

**Após aprovação:**
- Sistema marca como "APROVADO_COMPLIANCE"
- IA gera rascunho de resposta (usando contexto)
- Você recebe notificação para revisar resposta
- Após revisar resposta, pode enviar

---

## 🔔 Notificações

**Você recebe notificações quando:**

- 📥 Novo ofício importado do Gmail
- ⚠️ Ofício entrando em risco (< 3 dias)
- 🔴 Ofício vencido
- ✅ Resposta gerada e pronta para revisão
- 📤 Resposta enviada

**Onde ver:**
- Ícone 🔔 no canto superior direito
- Badge vermelho com número de notificações não lidas

---

## 🔍 Buscar Ofícios

### **Busca Rápida:**

Na lista de ofícios, use o campo de busca:

```
🔍 Buscar por processo ou autoridade...
```

**Exemplos de busca:**
- Digite: `12345` → Busca por número de processo
- Digite: `Tribunal` → Busca por autoridade
- Digite: `OF-123` → Busca por número de ofício

### **Filtros:**

**☑️ Atribuídos a Mim**
- Marque para ver apenas ofícios atribuídos a você
- Útil em equipes com múltiplos usuários

---

## 📝 Fluxo Completo de Trabalho

### **Cenário: Recebeu um ofício por email**

**1. Preparar Email (no Gmail)**
   - Abra o email com o ofício
   - Adicione a label **INGEST**
   - Aguarde até 15 minutos

**2. Sistema Processa Automaticamente**
   - Sistema detecta email com label INGEST
   - Baixa anexo PDF
   - Extrai dados com IA (OCR + LLM)
   - Cria ofício no sistema

**3. Revisar no Portal HITL**
   - Acesse Dashboard
   - Veja ofício em "Aguardando Revisão"
   - Clique em **"Revisar"**
   - Siga os 4 passos
   - Adicione contexto jurídico
   - Aprove

**4. IA Gera Resposta**
   - Sistema usa contexto que você adicionou
   - Busca em base de conhecimento
   - Gera rascunho de resposta

**5. Revisar e Enviar Resposta**
   - Recebe notificação
   - Revisa rascunho
   - Edita se necessário
   - Envia resposta

**⏱️ Tempo Total:** ~5 minutos (vs 3,5 horas manual!)

---

## 🎨 Interface e Navegação

### **Menu Principal (Topo):**

- 🏠 **Dashboard** - Página inicial
- 📋 **Ofícios** - Lista completa
- ➕ **Novo Ofício** - Criar manualmente
- ⚙️ **Configurações** - Conectar Gmail, preferências
- 🔔 **Notificações** - Ver avisos
- 👤 **Perfil** - Seus dados, sair

### **Cores e Significados:**

**Status dos Ofícios:**
- 🔵 Azul: Novo/Aguardando
- 🟡 Amarelo: Em risco (< 3 dias)
- 🔴 Vermelho: Vencido
- 🟢 Verde: Respondido

**Confiança da IA:**
- 🟢 Verde: ≥88% (confiável)
- 🟡 Amarelo: 70-87% (revisar)
- 🔴 Vermelho: <70% (revisar com atenção!)

---

## ❓ Perguntas Frequentes

### **1. Não recebi o ofício automaticamente, por quê?**

**Verifique:**
- ✅ Email tem label **INGEST** no Gmail?
- ✅ Email tem anexo PDF?
- ✅ Gmail está conectado nas Configurações?
- ✅ Aguardou 15 minutos? (intervalo de sincronização)

**Solução:** Crie ofício manualmente enquanto investiga

---

### **2. A IA errou dados do ofício, o que fazer?**

**No Portal HITL:**
- Passo 3: Corrija os dados
- Adicione contexto explicando o erro
- Aprove normalmente
- Sistema vai aprender com correções

---

### **3. Como funciona a label INGEST no Gmail?**

**INGEST** = Ingestão (entrada de dados)

**Como aplicar a label:**

1. No Gmail, abra o email com o ofício
2. Clique no ícone de rótulos (🏷️) ou em mais opções (⋮)
3. Selecione **"Aplicar rótulo"** (ou **"Label"** em inglês)
4. Escolha **INGEST** da lista
5. Confirme

**Criar label (primeira vez):**
- Se INGEST não existir, clique em **"Criar novo"**
- Digite: `INGEST`
- Escolha cor (sugestão: azul)
- Salvar

**💡 Dica Pro:** Configure regra automática no Gmail para aplicar INGEST automaticamente em emails de tribunais. Veja o Tutorial 3 abaixo para instruções detalhadas.

---

### **4. Posso ter múltiplos revisores?**

**Sim!** Sistema suporta equipes:

- Cada ofício pode ser atribuído a uma pessoa
- Use filtro "Atribuídos a Mim"
- Admin pode reatribuir ofícios

---

### **5. Como sei que a resposta está pronta?**

**Notificação:**
- 🔔 Ícone de notificações acende
- Mensagem: "Resposta do ofício OF-123 pronta para revisão"
- Clique para ver rascunho

---

### **6. Posso editar a resposta gerada pela IA?**

**Sim!** Sempre revise antes de enviar:
- IA gera rascunho
- Você revisa e edita
- Você decide quando enviar
- Controle total sempre com você

---

### **7. O que é "contexto jurídico"?**

**É o conhecimento extra que você adiciona para a IA:**

**Exemplos:**
- "Cliente é o réu neste processo"
- "Já enviamos documentos em 10/10/2025"
- "Processo tem liminar favorável"
- "Jurisprudência aplicável: STJ REsp 123456"

**Por que importante:**
- IA usa para gerar resposta mais precisa
- Evita respostas genéricas
- Considera particularidades do caso

---

### **8. Como funciona a automação completa?**

```
📧 Email chega no Gmail
    ↓ (automático)
🏷️ Você aplica label INGEST
    ↓ (aguarda máx 15min)
🤖 Sistema detecta e processa
    ↓ (automático)
📊 Ofício aparece no Dashboard
    ↓ (você age)
✅ Você revisa no Portal HITL
    ↓ (automático)
🧠 IA gera resposta
    ↓ (você age)
📝 Você revisa e envia
    ↓ (concluído)
✨ Processo finalizado!
```

**Tempo total:** ~5 minutos do seu tempo

---

## 🎓 Tutoriais Passo-a-Passo

### **Tutorial 1: Processar Primeiro Ofício**

**Tempo:** 10 minutos

**Passos:**

1. **Receber Email**
   - Ofício chegou no email resper@ness.com.br
   - Tem anexo PDF

2. **Marcar no Gmail**
   - Abrir Gmail
   - Encontrar email do ofício
   - Aplicar label **INGEST**

3. **Aguardar Processamento**
   - Aguardar até 15 minutos
   - Sistema processa automaticamente

4. **Acessar Dashboard**
   - Acesse: https://oficio.ness.tec.br
   - Veja ofício em "Aguardando Revisão"

5. **Revisar no HITL**
   - Clicar em **"Revisar"**
   - Passo 1: Ver PDF
   - Passo 2: Conferir dados da IA
   - Passo 3: Adicionar contexto jurídico
   - Passo 4: **Aprovar**

6. **Aguardar Resposta**
   - IA gera rascunho (2-3 minutos)
   - Notificação aparece

7. **Revisar e Enviar**
   - Abrir rascunho
   - Revisar texto
   - Editar se necessário
   - **Enviar**

**Pronto!** Primeiro ofício processado! 🎉

---

### **Tutorial 2: Criar Ofício Manualmente**

**Quando usar:** Email não foi importado automaticamente

**Passos:**

1. No Dashboard, clique em **"Novo Ofício"**

2. Preencha o formulário:
   - **Número:** Ex: 12345
   - **Processo:** Ex: 1234567-89.2024.1.00.0000
   - **Autoridade:** Ex: Tribunal de Justiça
   - **Prazo:** Selecione a data
   - **Descrição:** Resumo do ofício

3. **Upload do PDF:**
   - Clique em "Escolher arquivo"
   - Selecione o PDF do ofício
   - Aguarde upload

4. Clique em **"Salvar"**

5. Ofício criado! Agora você pode:
   - Revisar no HITL
   - Adicionar contexto
   - Aprovar para gerar resposta

---

### **Tutorial 3: Configurar Regra Automática no Gmail**

**Para automatizar 100%:**

1. **No Gmail, clique em ⚙️ > Ver todas as configurações**

2. **Aba "Filtros e endereços bloqueados"**

3. **"Criar novo filtro"**

4. **Critérios:**
   - De: `*@tjsp.jus.br` (exemplo: emails do TJ-SP)
   - Ou: Assunto contém: `ofício`
   - Tem anexo: ✅

5. **Ações:**
   - ✅ Aplicar rótulo: **INGEST**
   - ✅ Marcar como importante
   - ✅ Nunca enviar para spam

6. **Salvar filtro**

**Resultado:** Todos emails de tribunais vão automaticamente para INGEST! 🎯

---

## 📊 Entendendo os Status

### **Status dos Ofícios:**

| Status | Significado | Ação Necessária |
|--------|-------------|-----------------|
| **NOVO** | Importado, aguardando análise | Sistema vai processar |
| **AGUARDANDO_COMPLIANCE** | Precisa de revisão humana | Revisar no HITL |
| **APROVADO_COMPLIANCE** | Você aprovou, IA processando | Aguardar resposta |
| **AGUARDANDO_RESPOSTA** | Rascunho pronto | Revisar resposta |
| **RESPONDIDO** | Processo concluído | Arquivado |

---

## 💡 Dicas e Boas Práticas

### **✅ Faça:**

1. **Revise sempre o contexto jurídico**
   - Adicione informações relevantes
   - Mencione particularidades do caso
   - IA vai gerar resposta mais precisa

2. **Use a busca**
   - Encontre ofícios rapidamente
   - Filtre por autoridade ou processo

3. **Configure Gmail**
   - Crie regra automática
   - 100% mãos-livres

4. **Monitore SLA**
   - Fique de olho nos cards de risco
   - Priorize ofícios em laranja/vermelho

5. **Confira dados da IA**
   - Mesmo com alta confiança (verde)
   - Revisão humana é importante

### **❌ Evite:**

1. **Aprovar sem revisar**
   - Sempre confira dados
   - IA pode errar

2. **Esquecer de adicionar contexto**
   - Contexto melhora muito a resposta
   - Vale os 30 segundos extras

3. **Ignorar ofícios em risco**
   - Prazo é crítico
   - Priorize por urgência

---

## 🆘 Sistema de Ajuda Integrado

### **Ajuda Sempre Disponível**

O n.Oficios tem **help automático** integrado em todas as telas:

**1. Ícone de Ajuda (?)**
- Ao lado de cada campo/funcionalidade
- **Hover:** mostra tooltip explicativo
- **Click:** abre modal com detalhes completos

**2. Botão Flutuante de Ajuda**
- Canto inferior direito (azul)
- Abre painel lateral com:
  - Busca inteligente
  - Ajuda contextual da página atual
  - Links rápidos (manual, guia, suporte)
  - Categorias organizadas

**3. Central de Busca**
- Digite sua dúvida
- Resultados instantâneos
- Exemplos práticos
- Dicas e atalhos

**Como usar:**
```
Exemplo 1: Dúvida em campo
  → Clique no ícone (?) ao lado
  → Veja explicação + exemplos

Exemplo 2: Dúvida geral
  → Clique botão azul flutuante
  → Digite sua dúvida
  → Veja todos resultados relacionados
```

---

## 🆘 Solução de Problemas

### **"Não consigo fazer login"**

**Soluções:**
1. Verifique sua conexão com internet
2. Tente outro navegador
3. Limpe cache do navegador
4. Clique no botão de ajuda (?) para mais detalhes
5. Entre em contato com suporte

---

### **"Ofício não apareceu no Dashboard"**

**Verifique:**
1. Email tem label INGEST? ✅
2. Email tem anexo PDF? ✅
3. Aguardou 15 minutos? ✅
4. Gmail está conectado? (Configurações)

**Solução temporária:** Crie ofício manualmente

---

### **"IA extraiu dados errados"**

**Isso é normal!** Por isso existe o Portal HITL:
1. Revise no Passo 3
2. Corrija os dados
3. Aprove
4. Sistema aprende com correções

---

### **"Resposta gerada não ficou boa"**

**Você tem controle total:**
1. Edite o rascunho
2. Reescreva se necessário
3. Só envie quando estiver satisfeito

**Dica:** Adicione mais contexto na próxima vez

---

### **"Sistema está lento"**

**Verifique:**
1. Sua conexão com internet
2. Status do sistema: `/api/health`
3. Entre em contato com suporte se persistir

---

## 📞 Suporte

### **Contatos:**

**Suporte Técnico:**
- Email: suporte@ness.com.br
- Telefone: (XX) XXXX-XXXX

**Documentação:**
- Manual do Usuário: Este documento
- Guias técnicos: `docs/`
- FAQ: Seção acima

### **Logs e Diagnóstico:**

**Para reportar problemas, inclua:**
- Número do ofício (se aplicável)
- Horário do problema
- Mensagem de erro (se houver)
- Navegador usado
- Prints de tela (se possível)

---

## 🎯 Shortcuts (Atalhos)

### **Teclado:**

- `Ctrl + K` → Buscar ofícios
- `Ctrl + N` → Novo ofício
- `Esc` → Fechar modal
- `→` → Próximo passo (HITL)
- `←` → Passo anterior (HITL)

### **URLs Diretas:**

- `/dashboard` → Dashboard
- `/oficios` → Lista de ofícios
- `/oficios/novo` → Novo ofício
- `/configuracoes` → Configurações
- `/revisao/[id]` → Revisar ofício específico

---

## 📈 Métricas e Relatórios

### **Indicadores Disponíveis:**

**Dashboard mostra:**
- Total de ofícios
- Taxa de processamento
- Ofícios em risco
- Ofícios vencidos
- Tempo médio de resposta

**Em breve:**
- Relatórios mensais
- Gráficos de desempenho
- Exportação para Excel
- Análise de tendências

---

## 🔐 Segurança e Privacidade

### **Seus Dados:**

- ✅ Criptografados em trânsito (HTTPS)
- ✅ Armazenados em servidor seguro
- ✅ Backup automático
- ✅ LGPD compliant

### **Acesso:**

- ✅ Login seguro (Google OAuth)
- ✅ Sessão expira após inatividade
- ✅ Logs de auditoria
- ✅ Controle de permissões

### **Gmail:**

- ✅ Acesso apenas leitura (readonly)
- ✅ Não deletamos emails
- ✅ Não enviamos emails
- ✅ Apenas lemos com label INGEST

---

## 💡 Recursos de Ajuda

### **Help Automático:**

**22 tópicos de ajuda disponíveis:**
- Dashboard e Cards SLA
- Wizard HITL (4 passos)
- Gmail (integração, labels, troubleshooting)
- Upload de PDFs
- Configurações
- Atalhos de teclado

**Como acessar:**
1. **Ícone (?)** ao lado de cada elemento
2. **Botão azul flutuante** (canto inferior direito)
3. **Busca inteligente** por palavra-chave
4. **Atalho:** Pressione `?` em qualquer tela

**Cada tópico inclui:**
- Explicação clara
- Exemplos práticos
- Dicas úteis
- Atalhos de teclado
- Links relacionados

---

## 📱 Compatibilidade

### **Navegadores Suportados:**

- ✅ Google Chrome (recomendado)
- ✅ Mozilla Firefox
- ✅ Microsoft Edge
- ✅ Safari (Mac)

**Versões:** Últimas 2 versões

### **Dispositivos:**

- ✅ Desktop (recomendado)
- ✅ Tablet
- ⚠️ Mobile (funciona, mas melhor no desktop)

---

## 🎓 Glossário

**Termos Importantes:**

- **HITL:** Human-in-the-Loop (Humano no Processo)
- **SLA:** Service Level Agreement (Prazo de Atendimento)
- **IA:** Inteligência Artificial
- **OCR:** Reconhecimento de Texto em PDF
- **LLM:** Modelo de Linguagem (IA que entende texto)
- **RAG:** Busca em Base de Conhecimento
- **Label/Rótulo:** Etiqueta no Gmail
- **INGEST:** Label usada para importação automática

---

## 📝 Changelog

**Versão 1.0.0 (Outubro 2025):**
- ✅ Lançamento inicial
- ✅ Portal HITL completo
- ✅ Dashboard SLA
- ✅ Integração Gmail
- ✅ IA para extração de dados
- ✅ Geração automática de respostas

**Próximas Versões:**
- v1.1: Testes E2E, melhorias
- v1.5: Relatórios e analytics
- v2.0: Mobile app

---

## ✨ Conclusão

O sistema **n.Oficios** foi desenvolvido para **simplificar sua vida**:

- ⏱️ Economize 98% do tempo
- 🎯 Foque no que importa (análise jurídica)
- 🤖 Deixe IA cuidar do trabalho repetitivo
- ✅ Tenha controle total do processo

**Transformamos 3,5 horas de trabalho manual em 5 minutos de revisão inteligente!**

---

**Desenvolvido com ❤️ pela ness.**  
**Suporte: suporte@ness.com.br**

---

**Versão do Manual:** 1.0.0  
**Última Atualização:** 18 de Outubro de 2025

