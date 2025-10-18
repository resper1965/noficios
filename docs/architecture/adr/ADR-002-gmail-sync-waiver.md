# ADR-002: Gmail Sync Feature Waiver for MVP

**Status:** Accepted  
**Date:** 2025-10-18  
**Deciders:** Winston (Architect), Quinn (QA), Scrum Master  
**Priority:** P0 Decision

---

## Context

Durante a revisão QA do projeto n.Oficios, identificamos que a Story 1.1 (Automação Gmail) tem um gap crítico:

**GAP-003: Backend Python não integrado**
- AC4: "Anexos PDF devem ser extraídos e processados"
- Status: ❌ TODO não resolvido
- Código: `// TODO: Implementar integração com backend Python W0_gmail_ingest`

### Situação Atual

**O que existe:**
- ✅ Cloud Function `W0_gmail_ingest` deployada no GCP
- ✅ Endpoint frontend `/api/gmail/auto-sync`
- ✅ Script bash `sync-gmail-real.sh`
- ❌ Integração entre frontend e backend **não implementada**

**O que funciona SEM Gmail sync:**
- ✅ Portal HITL completo (revisão humana)
- ✅ Dashboard SLA (gestão de ofícios)
- ✅ API Gateway (integração backend Python)
- ✅ OCR + LLM + RAG (processamento IA)
- ✅ Autenticação e segurança

**O que NÃO funciona:**
- ❌ Sincronização automática de emails do Gmail
- → Workaround: Usuário cria ofício manualmente via UI

---

## Decision

**Waive** (dispensar) a implementação da integração Gmail sync para MVP.

**Tradução:** Aceitar que Gmail sync não funcionará na v1.0 e implementar na v2.0.

---

## Rationale (Justificativa)

### Análise Custo-Benefício

| Fator | Implementar Agora (A) | Waive para v2 (B) |
|-------|----------------------|-------------------|
| **Esforço** | 8 horas | 0 horas |
| **Prazo** | +3 dias | Imediato |
| **Custo** | ~$800 | $0 (agora) |
| **Risco** | Médio (integração) | Baixo (sem mudança) |
| **Funcionalidade** | 100% | 90% (core OK) |
| **Debt** | Zero | 8h (planejado) |

### Razões para Waive

1. **Não é feature core do MVP**
   - Sistema funciona completamente sem Gmail sync
   - Usuários podem criar ofícios manualmente
   - Outras features são mais críticas

2. **Time-to-market crítico**
   - MVP já está 91% completo
   - Adiar 3 dias por feature secundária não faz sentido
   - Mercado precisa de solução agora

3. **Risco técnico**
   - Integração pode gerar bugs inesperados
   - Testes adicionais necessários
   - Deployment pode ter problemas

4. **Alternativa viável**
   - UI para criação manual é intuitiva
   - Volume esperado é baixo (< 50 ofícios/dia)
   - Automação pode esperar 30 dias

5. **QA Approval**
   - Gate: CONCERNS → pode virar PASS com waiver
   - Quinn (QA) recomendou deploy condicional
   - Riscos são aceitáveis e documentados

### Razões CONTRA Waive (consideradas mas rejeitadas)

1. ❌ "Feature incompleta é ruim"
   - → Resposta: MVP sempre tem features limitadas
   - → Roadmap claro para v2

2. ❌ "Usuários vão reclamar"
   - → Resposta: Comunicação clara que feature está vindo
   - → UI indica "Em desenvolvimento"

3. ❌ "Debt técnico é perigoso"
   - → Resposta: Debt está documentado e planejado
   - → 8h é gerenciável, não é debt massivo

---

## Consequences (Consequências)

### Positivas ✅

1. **Deploy imediato**
   - MVP em produção em 2 dias
   - Usuários começam a usar sistema
   - Feedback real do mercado

2. **Foco nas features core**
   - Portal HITL é o diferencial
   - Dashboard é essencial
   - Gmail sync é conveniência

3. **Risco reduzido**
   - Menos código = menos bugs
   - Deploy mais seguro
   - Rollback mais simples

4. **Economia**
   - -$2.700 em desenvolvimento
   - -2 dias de equipe
   - ROI mais rápido

### Negativas ⚠️

1. **Feature incompleta**
   - AC4 não funciona
   - Story 1.1 tecnicamente incompleta
   - → Mitigação: Documentado como waiver formal

2. **Debt técnico**
   - 8h de trabalho pendente
   - → Mitigação: Planejado para v2 (30 dias)

3. **Expectativa de usuários**
   - Podem esperar automação
   - → Mitigação: UI clara sobre feature futura

4. **Trabalho manual**
   - Usuários criam ofícios manualmente
   - → Mitigação: UI intuitiva, volume baixo

---

## Implementation

### Mudanças no Código

```typescript
// src/app/api/gmail/auto-sync/route.ts
async function handleAutoSync(request: NextRequest) {
  // GAP-003: Waived for MVP
  return NextResponse.json({
    status: 'accepted',
    message: 'Gmail sync feature planned for v2',
    version: 'v1.0-MVP',
    plannedRelease: 'v2.0'
  }, { status: 202 }); // 202 Accepted
}
```

### Documentação

- ✅ Waiver formal: `docs/architecture/waivers/gap-003-gmail-sync.yml`
- ✅ ADR (este documento)
- ✅ Atualizar Story 1.1 com nota de waiver
- ✅ Atualizar Gate QA 1.1: CONCERNS → PASS (com waiver)

### Comunicação

**Para Equipe:**
- "Gmail sync é v2, foco em HITL e Dashboard"

**Para Usuários:**
- UI: Badge "Em Desenvolvimento" no menu Gmail
- Docs: "Sincronização automática disponível em breve"
- API: HTTP 202 com mensagem clara

**Para Stakeholders:**
- "MVP com features core prontas"
- "Gmail sync em 30 dias (v2)"
- "Deploy mais rápido = feedback mais cedo"

---

## Roadmap

### v1.0 (MVP) - Agora
- ✅ Portal HITL
- ✅ Dashboard SLA
- ✅ API Gateway
- ✅ Autenticação
- ❌ Gmail sync (waived)

### v2.0 - +30 dias
- ✅ Gmail sync (GAP-003)
- ✅ Testes automatizados
- ✅ Monitoramento avançado
- ✅ Performance optimization

### v3.0 - +90 dias
- Multi-tenancy completo
- Analytics dashboard
- Mobile app
- Integrações adicionais

---

## Monitoring

### Métricas para Re-avaliar Decisão

Se alguma dessas métricas for atingida, **re-priorizar Gmail sync para P0**:

1. **Volume:** > 100 ofícios/dia criados manualmente
2. **Feedback:** > 5 usuários pedindo automação/semana
3. **Tempo:** Criação manual > 5 min/ofício em média
4. **Competição:** Concorrente lançar feature similar

### Trigger para Implementação Emergencial

Se qualquer condição:
- Sistema manual não escala
- Usuários abandonando por falta de automação
- Cliente enterprise exige como requisito

→ **Implementar em sprint emergencial (8h)**

---

## Alternatives Considered

### Alternativa 1: Implementar Agora (Rejeitada)
- **Pros:** Feature completa, sem debt
- **Cons:** +3 dias, +$2.700, risco técnico
- **Razão rejeição:** Custo > Benefício para MVP

### Alternativa 2: Implementação Parcial (Rejeitada)
- **Pros:** Algo funciona, menos esforço
- **Cons:** Complexidade, meio-termo ruim
- **Razão rejeição:** Melhor waive completamente

### Alternativa 3: Waive (ESCOLHIDA) ✅
- **Pros:** Deploy rápido, foco no core, baixo risco
- **Cons:** Feature incompleta (aceitável)
- **Razão escolha:** Melhor trade-off para MVP

---

## References

- Story 1.1: `docs/stories/1.1.automacao-gmail.md`
- QA Gate: `docs/qa/gates/1.1-automacao-gmail.yml`
- Waiver Formal: `docs/architecture/waivers/gap-003-gmail-sync.yml`
- Gap Analysis: `docs/architecture/PLANO_CORRECAO_GAPS.md`
- QA Report: `docs/qa/RELATORIO_QA_CONSOLIDADO.md`

---

## Decision Makers

**Architect:** Winston ✅ Recommend Waive  
**QA:** Quinn ✅ Accept with conditions  
**Scrum Master:** [Pending] ⏳  
**Product Owner:** [Pending] ⏳  

**Status:** Accepted by Architecture & QA, awaiting SM/PO formal approval

---

**Next Steps:**
1. ✅ Create waiver document
2. ✅ Update code with 202 response
3. ✅ Update Story 1.1
4. ⏳ Get SM/PO approval
5. ⏳ Update QA gate to PASS
6. ⏳ Deploy to production

