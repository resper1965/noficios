# Manual do Usuário — n.Oficios (Produção)

Este guia explica como acessar e operar a plataforma n.Oficios em produção (oficio.ness.tec.br), cobrindo login, dashboard, ingestão, revisão (HITL), notificações, governança, políticas LGPD e resolução de problemas.

## 1. Acesso e Autenticação

- URL de produção: https://oficio.ness.tec.br
- Requisitos: navegador atualizado e conta Google corporativa (SSO via Firebase Auth).
- Login:
  1. Clique em “Entrar com Google”.
  2. Você será redirecionado para a tela do Google e retornará autenticado.
- Primeiro acesso: será exibido um modal de aceite de políticas (Termos, Privacidade e Cookies). Leia e aceite para continuar.

### 1.1 Problemas comuns de login (como resolver)

- Popup bloqueado: usamos redirect por padrão; caso veja bloqueio, habilite popups temporariamente.
- 403 “Unable to verify that the app domain is authorized”: aguarde 5–10 minutos (propagação) e faça “Hard refresh” (Ctrl+Shift+R). Se persistir, tente janela anônima.
- Limpeza de cache/SW: DevTools → Application → Clear storage → Clear site data; Service Workers → Unregister; depois hard refresh.

## 2. Visão Geral da Interface

- Tema dark‑first (alto contraste), tipografia Montserrat e navegação lateral/superior.
- Rodapé: links para Termos, Privacidade, Cookies, Segurança/Privacidade e Preferências de Cookies.
- Preferências de cookies: link no rodapé (“Preferências de Cookies”) para alterar a qualquer momento.

## 3. Dashboard de SLA (Operação)

Abra “Dashboard” para visão operacional:

- Indicadores:
  - Ofícios Ativos (não respondidos)
  - Em Risco (< 24h)
  - Vencidos
- Tabela de Ofícios:
  - Colunas: ID, Processo, Autoridade, Prazo (sinalização de risco), Atribuído, Status
  - Filtros: busca por processo/autoridade, alternância “Atribuídos a mim”
  - Ações: “Exportar” (CSV)

## 4. Ingestão de Ofícios (Entrada)

### 4.1 E‑mail/Uploads (produção)

- Bucket de ingestão: `gs://officio-474711-emails`
- Estrutura recomendada: `emails/<dominio>/<thread>/<arquivo>` (a função W1 detecta novos objetos finalizados)

### 4.2 Teste/Simulações

- Função de simulação (se habilitada): `W6_simulador_reextracao` — endpoints HTTP autenticados para inserir eventos de teste.

### 4.3 Formatos suportados

- PDF, DOCX, TXT, imagens (OCR quando aplicável). Arquivos grandes podem ser processados de forma assíncrona.

## 5. Revisão HITL (Human‑in‑the‑Loop)

- Acesse um ofício a partir do Dashboard.
- Conteúdo estruturado: dados extraídos (processo, autoridade, prazos, solicitações).
- Conteúdo bruto (LGPD):
  - O texto bruto é guardado em bucket restrito.
  - O acesso é feito via URL assinada temporária (gerada por endpoint autenticado).
- Ações do revisor: atribuição, edição de campos, classificação/estado, envio para composição de resposta.

## 6. Notificações (Web Push)

- Ao logar, autorize “Notificações” quando solicitado.
- Recebimento em primeiro/segundo plano (Service Worker). Para reconfigurar:
  - DevTools → Application → Service Workers → Unregister → hard refresh

## 7. Governança (Platform Admin)

- Menu “Administração de Plataforma” (visível apenas para `platform_admin`).
- Cadastro de Tenants (organizações):
  - Campos: Nome da organização, Domínios, E‑mail de ingestão primário, Configuração de LLM padrão.
  - Somente administradores de plataforma podem criar/atualizar organizações.

## 8. Políticas e Conformidade LGPD

- Termos de Uso, Política de Privacidade e Política de Cookies: disponíveis no rodapé.
- Aceite de Políticas: registrado por usuário/organização.
- Pseudonimização/minimização:
  - `raw_text` vai para bucket restrito (`officio-474711-raw-oficios-restricted`).
  - No banco, apenas preview (500 caracteres) e hash (SHA‑256) para integridade.
- Auditoria (Art. 37 LGPD):
  - Acesso a dados sensíveis é registrado com usuário, IP, agente e motivo.

## 9. Segurança e Privacidade (Resumo Técnico)

- HTTPS obrigatório (LB + Serverless NEG, certificados gerenciados).
- RBAC: `platform_admin`, `org_admin`, `user`.
- Multi‑tenancy: isolamento por `org_id`.
- Buckets com acesso público bloqueado (PAP) e acesso a nível de bucket (UBA) habilitados.
- CORS estrito em funções HTTP que expõem endpoints para frontend.

## 10. Solução de Problemas (FAQ)

### 10.1 Login

- 403 “Unable to verify that the app domain is authorized”: aguarde 5–10 min; hard refresh; tente janela anônima. Se persistir, informe horário do erro ao suporte.

### 10.2 Página “sem estilo”

- Extensões podem injetar classes e causar “hydration mismatch”. Faça hard refresh e teste sem extensões (modo anônimo). Se necessário, Clear storage + Unregister SW.

### 10.3 Notificações não aparecem

- Verifique permissões do site → Notifications; re‑registre o Service Worker (Application → Unregister) e atualize.

### 10.4 Ingestão não dispara

- Confirme upload no bucket `officio-474711-emails` e logs da função `ingest_oficio` (Cloud Functions Gen2). Verifique se o arquivo foi finalizado (não multi‑part em andamento).

## 11. Suporte e Contatos

- Suporte técnico: contate o time de plataforma (ness.) com evidências (prints, horário e navegdor).
- Logs de produção:
  - Frontend: Cloud Run → service `oficios-portal-frontend` → Logs
  - Backend: Cloud Functions → função específica (W1/W8/W9/…)

---

Última atualização: 2025‑10‑13




