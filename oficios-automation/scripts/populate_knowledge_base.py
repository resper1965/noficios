#!/usr/bin/env python3
"""
Script para popular a base de conhecimento vetorial.
Permite importar documentos de legislação, políticas e jurisprudência.
"""
import os
import sys
from pathlib import Path

# Adiciona o diretório raiz ao path
ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))

from utils.rag_client import RAGClient


# Exemplos de documentos para base de conhecimento
DOCUMENTOS_EXEMPLO = [
    {
        'titulo': 'Lei 105/2001 - Sigilo Bancário - Art. 5º',
        'conteudo': """Art. 5º O Poder Judiciário, o Ministério Público e as Comissões Parlamentares de Inquérito poderão requisitar informações e documentos, inclusive aqueles protegidos por sigilo bancário.

§ 1º As requisições de que trata este artigo deverão conter os seguintes elementos:
I - o número do processo;
II - a autoridade judiciária;
III - a especificação das informações ou documentos solicitados;
IV - a especificação do período abrangido pelas informações ou documentos requisitados.""",
        'tipo': 'legislacao',
        'metadata': {'lei': '105/2001', 'artigo': '5'}
    },
    {
        'titulo': 'Código de Processo Civil - Art. 219 - Prazos',
        'conteudo': """Art. 219. Na contagem de prazo em dias, estabelecido por lei ou pelo juiz, computar-se-ão somente os dias úteis.

Parágrafo único. O prazo estabelecido por lei ou pelo juiz é contínuo, não se interrompendo nos feriados.""",
        'tipo': 'legislacao',
        'metadata': {'lei': 'CPC', 'artigo': '219'}
    },
    {
        'titulo': 'LGPD - Art. 7º - Bases Legais',
        'conteudo': """Art. 7º O tratamento de dados pessoais somente poderá ser realizado nas seguintes hipóteses:

VI - para a tutela da saúde, exclusivamente, em procedimento realizado por profissionais de saúde, serviços de saúde ou autoridade sanitária;

VII - quando necessário para atender aos interesses legítimos do controlador ou de terceiro, exceto no caso de prevalecerem direitos e liberdades fundamentais do titular que exijam a proteção dos dados pessoais;

VIII - para a proteção do crédito, inclusive quanto ao disposto na legislação pertinente.""",
        'tipo': 'legislacao',
        'metadata': {'lei': 'LGPD', 'artigo': '7'}
    },
    {
        'titulo': 'Política Interna - Atendimento a Ofícios Judiciais',
        'conteudo': """POLÍTICA DE ATENDIMENTO A OFÍCIOS JUDICIAIS

1. RECEBIMENTO
Todos os ofícios judiciais devem ser registrados no sistema no prazo máximo de 24 horas após o recebimento.

2. ANÁLISE DE COMPLIANCE
O setor de compliance deve analisar:
- Legitimidade da autoridade solicitante
- Adequação do pedido à legislação vigente
- Completude das informações para atendimento

3. PRAZO DE RESPOSTA
- Ofícios com prazo < 5 dias: Prioridade ALTA
- Ofícios com prazo 5-15 dias: Prioridade MÉDIA
- Ofícios com prazo > 15 dias: Prioridade BAIXA

4. FUNDAMENTAÇÃO
Toda resposta deve citar:
- Base legal aplicável (Lei 105/2001, LGPD, etc)
- Número do processo
- Protocolo interno de atendimento""",
        'tipo': 'politica_interna',
        'metadata': {'departamento': 'compliance', 'versao': '2.0'}
    },
    {
        'titulo': 'Template de Resposta - Bloqueio Judicial',
        'conteudo': """MINUTA DE RESPOSTA - BLOQUEIO JUDICIAL DE VALORES

Excelentíssimo(a) Senhor(a) Dr(a). [AUTORIDADE],
[CARGO] da [VARA/TRIBUNAL]

Ref.: Processo nº [NÚMERO DO PROCESSO]

Em atenção ao Ofício nº [NÚMERO], recebido em [DATA], vimos respeitosamente informar:

1. CUMPRIMENTO DA ORDEM
Conforme determinado por Vossa Excelência, procedemos ao bloqueio dos valores disponíveis na(s) conta(s) de titularidade de [NOME DO EXECUTADO], CPF/CNPJ nº [NÚMERO].

2. VALORES BLOQUEADOS
[Descrição dos valores bloqueados]

3. FUNDAMENTAÇÃO LEGAL
O presente atendimento está fundamentado no Art. 5º da Lei nº 105/2001 e no cumprimento da ordem judicial expedida nos autos do processo em referência.

4. PRAZO
Informamos que o presente ofício foi atendido dentro do prazo legal estabelecido.

Permanecemos à disposição para eventuais esclarecimentos.

Atenciosamente,
[NOME DO RESPONSÁVEL]
[CARGO] - Departamento Jurídico""",
        'tipo': 'template',
        'metadata': {'categoria': 'bloqueio_judicial'}
    },
    {
        'titulo': 'Jurisprudência STJ - Sigilo Bancário',
        'conteudo': """SUPERIOR TRIBUNAL DE JUSTIÇA
REsp 1234567/SP

EMENTA: SIGILO BANCÁRIO. QUEBRA. ORDEM JUDICIAL. NECESSIDADE DE FUNDAMENTAÇÃO.

A quebra do sigilo bancário, ainda que por determinação judicial, deve ser devidamente fundamentada, indicando-se a necessidade da medida e sua adequação ao caso concreto. A mera alegação genérica de necessidade de investigação não autoriza o deferimento da medida.

Precedentes: REsp 123456/RJ, REsp 789012/MG

Relator: Min. [NOME]
Data de Julgamento: [DATA]""",
        'tipo': 'jurisprudencia',
        'metadata': {'tribunal': 'STJ', 'ano': '2023'}
    }
]


def main():
    """Popula a base de conhecimento com documentos de exemplo"""
    print("=" * 60)
    print("POPULAÇÃO DA BASE DE CONHECIMENTO VETORIAL")
    print("=" * 60)
    
    # Solicita org_id
    org_id = input("\nInforme o org_id da organização: ").strip()
    
    if not org_id:
        print("❌ org_id é obrigatório")
        sys.exit(1)
    
    print(f"\n📊 Organização: {org_id}")
    print(f"📚 Documentos a importar: {len(DOCUMENTOS_EXEMPLO)}")
    
    # Confirmação
    confirm = input("\nDeseja continuar? (s/n): ").strip().lower()
    if confirm != 's':
        print("Operação cancelada")
        sys.exit(0)
    
    # Inicializa RAG client
    print("\n🔧 Inicializando RAG Client...")
    rag_client = RAGClient()
    
    # Importa documentos
    print("\n📥 Importando documentos...")
    doc_ids = []
    
    for idx, doc in enumerate(DOCUMENTOS_EXEMPLO, 1):
        print(f"\n[{idx}/{len(DOCUMENTOS_EXEMPLO)}] Processando: {doc['titulo']}")
        print(f"   Tipo: {doc['tipo']}")
        print(f"   Tamanho: {len(doc['conteudo'])} caracteres")
        
        try:
            # Gera embedding e salva
            doc_id = rag_client.add_document(
                org_id=org_id,
                titulo=doc['titulo'],
                conteudo=doc['conteudo'],
                tipo=doc['tipo'],
                metadata=doc.get('metadata')
            )
            
            doc_ids.append(doc_id)
            print(f"   ✅ Documento salvo: {doc_id}")
            
        except Exception as e:
            print(f"   ❌ Erro ao processar documento: {e}")
    
    # Resumo
    print("\n" + "=" * 60)
    print("📊 RESUMO DA IMPORTAÇÃO")
    print("=" * 60)
    print(f"Total de documentos importados: {len(doc_ids)}")
    print(f"Organização: {org_id}")
    print("\nIDs dos documentos:")
    for doc_id in doc_ids:
        print(f"  - {doc_id}")
    
    # Teste de busca
    print("\n" + "=" * 60)
    print("🔍 TESTE DE BUSCA")
    print("=" * 60)
    
    query = input("\nInforme uma query de teste (ou Enter para pular): ").strip()
    
    if query:
        print(f"\nBuscando por: '{query}'")
        results = rag_client.search_and_retrieve(
            query_text=query,
            org_id=org_id,
            top_k=3
        )
        
        print(f"\n📚 Encontrados {results['num_results']} resultados relevantes:")
        
        for idx, result in enumerate(results['results'], 1):
            similarity_pct = result['similarity'] * 100
            print(f"\n{idx}. {result['titulo']}")
            print(f"   Relevância: {similarity_pct:.1f}%")
            print(f"   Tipo: {result['tipo']}")
            print(f"   Preview: {result['conteudo'][:150]}...")
    
    print("\n✅ Processo concluído!")


if __name__ == "__main__":
    main()





