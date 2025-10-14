#!/usr/bin/env python3
"""
Script para testes locais do sistema de automação de ofícios.
Permite testar componentes individuais sem deploy.
"""
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Adiciona o diretório raiz ao path
ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))

from utils.api_clients import FirestoreClient, GroqClient
from utils.schema import OficioData, TipoResposta


def test_groq_extraction():
    """Testa extração de dados via Groq LLM"""
    print("=" * 60)
    print("TESTE: Extração de Dados via Groq LLM")
    print("=" * 60)
    
    # Texto de exemplo de um ofício
    texto_oficio = """
    OFÍCIO N° 456/2024
    
    Vara Cível da Comarca de São Paulo
    Processo n° 1234567-89.2024.8.26.0100
    
    Excelentíssimo Senhor,
    
    A autoridade judicial Dra. Maria Silva, Juíza de Direito da 1ª Vara Cível,
    solicita as seguintes informações sobre o cliente João da Silva (CPF 123.456.789-00):
    
    1. Extratos bancários dos últimos 6 meses
    2. Comprovantes de rendimentos
    3. Declaração de imposto de renda
    
    Solicitamos o envio das informações no prazo de 10 dias úteis.
    
    Atenciosamente,
    Dra. Maria Silva
    Juíza de Direito
    """
    
    try:
        # Inicializa cliente Groq
        groq_client = GroqClient()
        
        # Prepara o schema para extração
        class OficioDataTest(OficioData):
            org_id: str = "test_org"
            thread_id: str = "test_thread"
        
        print("\n📄 Texto do ofício:")
        print(texto_oficio)
        
        print("\n🤖 Iniciando extração via LLM...")
        
        # Extrai dados
        resultado = groq_client.extract_structured_data(
            texto_oficio,
            OficioDataTest
        )
        
        print("\n✅ Extração concluída!")
        print("\n📊 Dados extraídos:")
        print(json.dumps(resultado.model_dump(mode='json'), indent=2, ensure_ascii=False))
        
        print(f"\n🎯 Confiança: {resultado.confianca * 100:.1f}%")
        print(f"⏰ Prazo: {resultado.prazo_dias} dias")
        print(f"📝 Tipo de resposta: {resultado.tipo_resposta_provavel}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Erro na extração: {e}")
        return False


def test_cpf_validation():
    """Testa validação de CPF"""
    print("\n" + "=" * 60)
    print("TESTE: Validação de CPF")
    print("=" * 60)
    
    from funcoes.W1_processamento_async.main import validar_cpf
    
    test_cases = [
        ("123.456.789-09", True, "CPF válido formatado"),
        ("12345678909", True, "CPF válido sem formatação"),
        ("111.111.111-11", False, "CPF com dígitos repetidos"),
        ("123.456.789-00", False, "CPF inválido"),
        ("123", False, "CPF com poucos dígitos"),
    ]
    
    success_count = 0
    
    for cpf, expected, descricao in test_cases:
        resultado = validar_cpf(cpf)
        status = "✅" if resultado == expected else "❌"
        print(f"{status} {descricao}: {cpf} -> {resultado}")
        
        if resultado == expected:
            success_count += 1
    
    print(f"\n📊 Resultado: {success_count}/{len(test_cases)} testes passaram")
    
    return success_count == len(test_cases)


def test_cnpj_validation():
    """Testa validação de CNPJ"""
    print("\n" + "=" * 60)
    print("TESTE: Validação de CNPJ")
    print("=" * 60)
    
    from funcoes.W1_processamento_async.main import validar_cnpj
    
    test_cases = [
        ("11.222.333/0001-81", True, "CNPJ válido formatado"),
        ("11222333000181", True, "CNPJ válido sem formatação"),
        ("11.111.111/1111-11", False, "CNPJ com dígitos repetidos"),
        ("11.222.333/0001-00", False, "CNPJ inválido"),
        ("123", False, "CNPJ com poucos dígitos"),
    ]
    
    success_count = 0
    
    for cnpj, expected, descricao in test_cases:
        resultado = validar_cnpj(cnpj)
        status = "✅" if resultado == expected else "❌"
        print(f"{status} {descricao}: {cnpj} -> {resultado}")
        
        if resultado == expected:
            success_count += 1
    
    print(f"\n📊 Resultado: {success_count}/{len(test_cases)} testes passaram")
    
    return success_count == len(test_cases)


def test_prioridade_calculation():
    """Testa cálculo de prioridade"""
    print("\n" + "=" * 60)
    print("TESTE: Cálculo de Prioridade")
    print("=" * 60)
    
    from funcoes.W1_processamento_async.main import calcular_prioridade
    
    test_cases = [
        (3, TipoResposta.dados, "alta", "Dados + prazo curto"),
        (10, TipoResposta.dados, "media", "Dados + prazo médio"),
        (20, TipoResposta.dados, "baixa", "Dados + prazo longo"),
        (2, TipoResposta.positiva, "alta", "Positiva + prazo muito curto"),
        (7, TipoResposta.positiva, "media", "Positiva + prazo médio"),
        (15, TipoResposta.negativa, "baixa", "Negativa + prazo longo"),
    ]
    
    success_count = 0
    
    for prazo, tipo, expected, descricao in test_cases:
        resultado = calcular_prioridade(prazo, tipo)
        status = "✅" if resultado == expected else "❌"
        print(f"{status} {descricao}: {prazo} dias, {tipo} -> {resultado}")
        
        if resultado == expected:
            success_count += 1
    
    print(f"\n📊 Resultado: {success_count}/{len(test_cases)} testes passaram")
    
    return success_count == len(test_cases)


def test_firestore_connection():
    """Testa conexão com Firestore"""
    print("\n" + "=" * 60)
    print("TESTE: Conexão com Firestore")
    print("=" * 60)
    
    try:
        # Verifica se há emulator configurado
        emulator = os.getenv('FIRESTORE_EMULATOR_HOST')
        if emulator:
            print(f"🔧 Usando emulador: {emulator}")
        else:
            print("☁️  Usando Firestore em produção")
        
        # Inicializa cliente
        client = FirestoreClient()
        
        # Tenta buscar uma organização de teste
        print("\n📋 Testando busca de organização...")
        org = client.get_organization_by_domain("exemplo.com.br")
        
        if org:
            print(f"✅ Organização encontrada: {org.get('name')} (ID: {org.get('org_id')})")
        else:
            print("⚠️  Nenhuma organização encontrada para 'exemplo.com.br'")
            print("   Crie uma organização de teste conforme o SETUP.md")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Erro ao conectar no Firestore: {e}")
        print("\n💡 Dicas:")
        print("   - Verifique se GOOGLE_APPLICATION_CREDENTIALS está configurado")
        print("   - Ou inicie o emulador: gcloud beta emulators firestore start")
        return False


def test_pydantic_schema():
    """Testa validação do schema Pydantic"""
    print("\n" + "=" * 60)
    print("TESTE: Validação de Schema Pydantic")
    print("=" * 60)
    
    try:
        # Testa criação válida
        print("\n✅ Testando dados válidos...")
        oficio_valido = OficioData(
            org_id="org_123",
            thread_id="thread_456",
            autoridade_nome="Vara Criminal de SP",
            processo_numero="1234567-89.2024.8.26.0100",
            solicitacoes=["Extrato bancário", "Comprovante de renda"],
            prazo_dias=10,
            tipo_resposta_provavel=TipoResposta.dados,
            confianca=0.95
        )
        print(f"   Ofício criado: {oficio_valido.autoridade_nome}")
        
        # Testa validação de confiança
        print("\n❌ Testando confiança inválida...")
        try:
            oficio_invalido = OficioData(
                org_id="org_123",
                thread_id="thread_456",
                autoridade_nome="Teste",
                prazo_dias=10,
                tipo_resposta_provavel=TipoResposta.dados,
                confianca=1.5  # Inválido!
            )
            print("   ⚠️  Validação não detectou erro (problema!)")
            return False
        except Exception as e:
            print(f"   ✅ Erro detectado corretamente: {e}")
        
        # Testa validação de prazo
        print("\n❌ Testando prazo inválido...")
        try:
            oficio_invalido = OficioData(
                org_id="org_123",
                thread_id="thread_456",
                autoridade_nome="Teste",
                prazo_dias=-5,  # Inválido!
                tipo_resposta_provavel=TipoResposta.dados,
                confianca=0.9
            )
            print("   ⚠️  Validação não detectou erro (problema!)")
            return False
        except Exception as e:
            print(f"   ✅ Erro detectado corretamente: {e}")
        
        print("\n✅ Todos os testes de schema passaram!")
        return True
        
    except Exception as e:
        print(f"\n❌ Erro inesperado: {e}")
        return False


def main():
    """Executa todos os testes"""
    print("\n" + "=" * 60)
    print("🧪 TESTES LOCAIS - AUTOMAÇÃO DE OFÍCIOS")
    print("=" * 60)
    print(f"Data/Hora: {datetime.now().isoformat()}")
    print(f"Diretório: {ROOT_DIR}")
    
    # Verifica variáveis de ambiente
    print("\n📋 Variáveis de ambiente:")
    print(f"   GCP_PROJECT_ID: {os.getenv('GCP_PROJECT_ID', '❌ não configurado')}")
    print(f"   GROQ_API_KEY: {'✅ configurado' if os.getenv('GROQ_API_KEY') else '❌ não configurado'}")
    print(f"   FIRESTORE_EMULATOR_HOST: {os.getenv('FIRESTORE_EMULATOR_HOST', '(produção)')}")
    
    # Lista de testes
    tests = [
        ("Schema Pydantic", test_pydantic_schema),
        ("Validação CPF", test_cpf_validation),
        ("Validação CNPJ", test_cnpj_validation),
        ("Cálculo de Prioridade", test_prioridade_calculation),
        ("Conexão Firestore", test_firestore_connection),
    ]
    
    # Adiciona teste do Groq apenas se API key configurada
    if os.getenv('GROQ_API_KEY'):
        tests.append(("Extração Groq LLM", test_groq_extraction))
    else:
        print("\n⚠️  Pulando teste Groq (GROQ_API_KEY não configurado)")
    
    # Executa testes
    results = []
    
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ Erro crítico no teste '{name}': {e}")
            results.append((name, False))
    
    # Resumo
    print("\n" + "=" * 60)
    print("📊 RESUMO DOS TESTES")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"{status}: {name}")
    
    print("\n" + "=" * 60)
    print(f"Resultado final: {passed}/{total} testes passaram")
    
    if passed == total:
        print("🎉 Todos os testes passaram!")
        sys.exit(0)
    else:
        print(f"⚠️  {total - passed} teste(s) falharam")
        sys.exit(1)


if __name__ == "__main__":
    main()





