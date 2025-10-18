# 🎨 Portal HITL - Design UX Guiado

## 🎯 PRINCÍPIO CENTRAL: Wizard Experience

**Objetivo:** Usuário entende exatamente o que fazer em cada etapa, sem confusão.

---

## 🧭 FLUXO DO USUÁRIO (Step-by-Step)

### **ETAPA 1: Inbox de Revisões**
**URL:** `/dashboard`

```
┌─────────────────────────────────────────────────────────────┐
│ 🔔 Você tem 3 ofícios aguardando revisão                     │
│                                           [Ver Todos →]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📋 Ofício #12345 - TRF 1ª Região                            │
│ ⚠️  Confiança da IA: 72% (Requer revisão humana)            │
│ 📅 Prazo: 25/10/2024 (5 dias)                               │
│                                          [REVISAR AGORA →]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Mensagem clara:**
- Badge laranja: "Aguardando Sua Revisão"
- Contador: "3 ofícios precisam de você"
- CTA forte: "REVISAR AGORA"

---

### **ETAPA 2: Portal HITL - Wizard Guiado**
**URL:** `/revisao/[id]`

#### **Header com Progresso**
```
┌─────────────────────────────────────────────────────────────┐
│ n.Oficios                                   👤 resper@bekaa │
├─────────────────────────────────────────────────────────────┤
│ 📋 Revisão de Ofício #12345                                 │
│                                                             │
│ [1●─────2○─────3○─────4○] Progresso da Revisão            │
│  Ver    Revisar  Contexto Aprovar                          │
└─────────────────────────────────────────────────────────────┘
```

---

#### **PASSO 1: VER DOCUMENTO** (Auto-expandido)
```
┌─────────────────────────────────────────────────────────────┐
│ 📄 PASSO 1: Visualizar Documento Original                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │          [PREVIEW PDF EMBUTIDO]                         │ │
│ │          Ofício do TRF 1ª Região                        │ │
│ │          Processo: 1234567-89.2024...                   │ │
│ │                                                         │ │
│ │          [Scroll vertical do PDF]                       │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 💡 Dica: Leia o documento para verificar se a IA extraiu   │
│          corretamente as informações.                       │
│                                                             │
│                          [CONTINUAR PARA PASSO 2 →]        │
└─────────────────────────────────────────────────────────────┘
```

**UX:**
- PDF grande e legível
- Botão "Continuar" óbvio
- Dica contextual
- Possibilidade de download

---

#### **PASSO 2: REVISAR DADOS EXTRAÍDOS**
```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 PASSO 2: Revisar o que a IA extraiu                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ A Inteligência Artificial analisou o documento e extraiu:   │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Número do Ofício          Confiança                     │ │
│ │ 12345                     ████████░░ 82% ✅              │ │
│ │                                                         │ │
│ │ Número do Processo        Confiança                     │ │
│ │ 1234567-89.2024.1.00.0000 ███████░░░ 75% ⚠️             │ │
│ │                                                         │ │
│ │ Autoridade Emissora       Confiança                     │ │
│ │ TRF 1ª Região             ██████░░░░ 68% ⚠️             │ │
│ │                                                         │ │
│ │ Prazo de Resposta         Confiança                     │ │
│ │ 25/10/2024                ████████░░ 85% ✅              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ⚠️  ATENÇÃO: 2 campos com confiança baixa (<80%)           │
│     Revise com cuidado no próximo passo!                   │
│                                                             │
│ [← VOLTAR]              [CORRIGIR DADOS NO PASSO 3 →]      │
└─────────────────────────────────────────────────────────────┘
```

**UX:**
- Visual de confiança (barra de progresso)
- Cores: Verde (>80%), Amarelo (70-80%), Vermelho (<70%)
- Alerta claro sobre campos problemáticos
- Não permite edição aqui (só visualização)

---

#### **PASSO 3: CORRIGIR E ENRIQUECER**
```
┌─────────────────────────────────────────────────────────────┐
│ ✏️  PASSO 3: Corrigir dados e adicionar contexto            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 💡 Revise e corrija os campos conforme necessário           │
│                                                             │
│ ┌─ DADOS PRINCIPAIS ────────────────────────────────────┐   │
│ │ Número do Ofício *                                    │   │
│ │ [12345________________] ✅ Validado                    │   │
│ │                                                       │   │
│ │ Número do Processo *                   ⚠️  Atenção!   │   │
│ │ [1234567-89.2024.1.00.0000__________]                │   │
│ │ └→ A IA teve 75% de confiança. Confira o PDF!        │   │
│ │                                                       │   │
│ │ Autoridade Emissora *                  ⚠️  Atenção!   │   │
│ │ [Tribunal Regional Federal 1ª Região_] ▼             │   │
│ │ └→ A IA teve 68% de confiança. Confira o nome!       │   │
│ │                                                       │   │
│ │ Prazo de Resposta *                                   │   │
│ │ [📅 25/10/2024_________] ✅ Validado                  │   │
│ │                                                       │   │
│ │ Descrição Resumida                                    │   │
│ │ [Requisição de informações processuais______________] │   │
│ │ [_________________________________________________] │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ CONTEXTO JURÍDICO (OPCIONAL) ───────────────────────┐   │
│ │                                                       │   │
│ │ 📚 Adicione contexto que ajudará a IA a gerar a      │   │
│ │    resposta (políticas internas, decisões prévias):  │   │
│ │                                                       │   │
│ │ [________________________________________________]    │   │
│ │ [________________________________________________]    │   │
│ │ [________________________________________________]    │   │
│ │                                                       │   │
│ │ 🔗 Referências Legais:                               │   │
│ │ • Art. 5º da Lei 105/2001             [x Remover]    │   │
│ │ [+ Adicionar referência]                             │   │
│ │                                                       │   │
│ │ 👤 Atribuir Responsável:                              │   │
│ │ [Selecione um usuário ▼]                             │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ [← VOLTAR]              [CONTINUAR PARA APROVAÇÃO →]       │
└─────────────────────────────────────────────────────────────┘
```

**UX:**
- Campos com alerta individual (confiança baixa)
- Validação inline
- Tooltip explicativo em cada campo
- Seção opcional clara (pode pular)
- Botão "Continuar" desabilitado se campos inválidos

---

#### **PASSO 4: APROVAR OU REJEITAR**
```
┌─────────────────────────────────────────────────────────────┐
│ ✅ PASSO 4: Decisão Final                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📊 RESUMO DA REVISÃO:                                        │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Ofício:      #12345                                     │ │
│ │ Processo:    1234567-89.2024.1.00.0000                  │ │
│ │ Autoridade:  TRF 1ª Região                              │ │
│ │ Prazo:       25/10/2024 (5 dias restantes)              │ │
│ │                                                         │ │
│ │ Contexto adicionado:  ✅ Sim (120 caracteres)           │ │
│ │ Referências legais:   ✅ 1 referência                   │ │
│ │ Responsável:          João Silva                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 💡 Ao aprovar, a IA gerará automaticamente uma resposta     │
│    fundamentada usando a base de conhecimento jurídico.     │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ APROVAR E GERAR RESPOSTA                             │ │
│ │    A IA criará um rascunho de resposta para revisão     │ │
│ │                                          [APROVAR →]    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ❌ REJEITAR OFÍCIO                                      │ │
│ │    Dados insuficientes ou ofício inválido               │ │
│ │                                                         │ │
│ │    Motivo da rejeição:                                  │ │
│ │    [_____________________________________________]      │ │
│ │                                          [REJEITAR]     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [← VOLTAR PARA EDITAR]                                      │
└─────────────────────────────────────────────────────────────┘
```

**UX:**
- Resumo visual claro
- Duas opções bem separadas (aprovar em verde, rejeitar em vermelho)
- Explicação do que acontece ao aprovar
- Campo obrigatório para motivo de rejeição
- Confirmação antes de ação final

---

## 🎨 DESIGN SYSTEM - Visual Guide

### **Cores por Confiança:**
```css
Confiança Alta (>88%):     bg-green-500/20 border-green-500
Confiança Média (70-88%):  bg-yellow-500/20 border-yellow-500  
Confiança Baixa (<70%):    bg-red-500/20 border-red-500
```

### **Ícones Guia:**
```
📄 = Documento original
🤖 = Dados extraídos pela IA
✏️  = Edição humana
✅ = Aprovação
❌ = Rejeição
📚 = Conhecimento jurídico
👤 = Atribuição
💡 = Dica/Ajuda
⚠️  = Atenção necessária
```

### **Wizard Steps:**
```
Estado Atual:     ●───────○───────○───────○
Estado Completo:  ●───────●───────●───────●
Estado Ativo:     ●───────⦿───────○───────○  (pulsando)
```

---

## 📱 RESPONSIVIDADE

### **Desktop (>1024px):**
- Split 3 colunas no Passo 2
- Wizard horizontal no header

### **Tablet (768-1024px):**
- Split 2 colunas (PDF + Edição)
- IA extraído em cards acima

### **Mobile (<768px):**
- Accordion steps (um de cada vez)
- Swipe entre passos
- Bottom navigation

---

## ♿ ACESSIBILIDADE

- ✅ ARIA labels em todos os passos
- ✅ Keyboard navigation (Tab, Enter)
- ✅ Screen reader friendly
- ✅ Alto contraste
- ✅ Focus indicators claros

---

## 🎯 MENSAGENS CONTEXTUAIS

### **Se confiança < 70%:**
```
⚠️  ATENÇÃO: A IA teve dificuldade em ler este documento.
    Revise com atenção TODOS os campos antes de aprovar.
    
    Campos problemáticos:
    • Autoridade Emissora (68% de confiança)
    • Número do Processo (72% de confiança)
```

### **Se confiança > 88%:**
```
✅ A IA teve alta confiança na extração.
   Apenas confirme rapidamente os dados e aprove!
   
   Tempo estimado: 30 segundos
```

### **Se prazo < 3 dias:**
```
🚨 URGENTE: Este ofício vence em 2 dias!
    Priorize a revisão para não perder o prazo.
```

---

## 🔄 FEEDBACK VISUAL IMEDIATO

### **Ao digitar/editar:**
```
✅ Campo válido        (borda verde)
⚠️  Campo incompleto   (borda amarela)
❌ Campo inválido      (borda vermelha + mensagem)
```

### **Ao salvar:**
```
Loading: [Spinner] Salvando suas alterações...
Success: ✅ Alterações salvas! Você pode fechar esta aba.
Error:   ❌ Erro ao salvar. Tente novamente.
```

---

## 🎬 ANIMAÇÕES SUTIS

- Wizard steps: Fade in/out suave
- Success: Check animado
- Error: Shake leve
- Loading: Spinner + progress bar
- Page transition: Slide left/right

---

## 📊 ESTADOS E FEEDBACK

| Estado | Mensagem | Ação Habilitada |
|--------|----------|-----------------|
| **Carregando** | "Buscando ofício..." | Nenhuma |
| **Visualizando** | "Revise o documento" | Continuar |
| **Editando** | "X campos precisam de atenção" | Salvar Rascunho |
| **Aprovando** | "Gerando resposta IA..." | Nenhuma |
| **Sucesso** | "✅ Ofício aprovado!" | Ir para Dashboard |
| **Erro** | "❌ Erro: [mensagem]" | Tentar Novamente |

---

## 💬 COPY (Textos)

### **Títulos Claros:**
- ❌ "Dados Extraídos" → ✅ "O que a IA encontrou no documento"
- ❌ "Compliance" → ✅ "Adicionar contexto jurídico"
- ❌ "Assign" → ✅ "Atribuir responsável"

### **Botões Action-Oriented:**
- ❌ "Submit" → ✅ "APROVAR E GERAR RESPOSTA"
- ❌ "Cancel" → ✅ "Voltar para editar"
- ❌ "Delete" → ✅ "Rejeitar ofício"

### **Tooltips Educativos:**
- 💡 "Por que revisar? A IA pode errar na leitura de PDFs digitalizados"
- 💡 "Contexto jurídico ajuda a IA a gerar respostas mais precisas"
- 💡 "Ao aprovar, a IA terá ~5 minutos para gerar a resposta"

---

## 🎯 PRINCÍPIOS UX APLICADOS

1. **Progressive Disclosure** - Mostra info quando necessária
2. **Clear Hierarchy** - Usuário sabe onde está sempre
3. **Immediate Feedback** - Toda ação tem resposta visual
4. **Forgiving** - Permite voltar/editar/salvar rascunho
5. **Guiding** - Dicas e mensagens contextuais
6. **Error Prevention** - Validação antes de erros
7. **Consistency** - Padrões visuais consistentes

---

**Próximo passo:** Implementar esta UX em código React! 🚀

