'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUserData } from '@/hooks/useAuth';
import { createApiClient, type OficioData, type Metrics } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
// Ícones removidos conforme diretriz de UI
import PageHeader from '@/components/PageHeader';

interface SlaIndicators {
  total_ativos: number;
  em_risco: number;
  vencidos: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, getToken } = useAuth();
  const userData = useUserData();
  
  const [slaIndicators, setSlaIndicators] = useState<SlaIndicators | null>(null);
  const [oficios, setOficios] = useState<OficioData[]>([]);
  const [filteredOficios, setFilteredOficios] = useState<OficioData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const apiBase = (typeof window !== 'undefined' ? (window as any).__ENV?.NEXT_PUBLIC_API_BASE_URL : process.env.NEXT_PUBLIC_API_BASE_URL) || '';
  const isApiConfigured = !!apiBase && !apiBase.includes('PROJECT');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (userData?.org_id && isApiConfigured) {
      loadDashboardData();
    } else {
      setLoadingData(false);
    }
  }, [userData, isApiConfigured]);

  useEffect(() => {
    // Filtra ofícios baseado na busca e filtro "meus ofícios"
    let filtered = oficios;

    if (showOnlyMine && userData?.uid) {
      filtered = filtered.filter(o => o.assigned_user_id === userData.uid);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o => 
        o.dados_extraidos?.processo_numero?.toLowerCase().includes(term) ||
        o.dados_extraidos?.autoridade_nome?.toLowerCase().includes(term)
      );
    }

    setFilteredOficios(filtered);
  }, [oficios, searchTerm, showOnlyMine, userData]);

  const loadDashboardData = async () => {
    if (!userData?.org_id) return;

    setLoadingData(true);

    try {
      const apiClient = createApiClient(getToken);

      // Busca métricas
      const metricsData = await apiClient.get<any>(
        `get_metrics?org_id=${userData.org_id}&period=30d`
      );

      // Calcula indicadores SLA
      const metrics = metricsData.metrics as Metrics;
      const porStatus = metrics.por_status;
      
      const totalAtivos = Object.entries(porStatus)
        .filter(([status]) => status !== 'RESPONDIDO')
        .reduce((sum, [, count]) => sum + count, 0);

      // Mock dos indicadores (ajustar conforme API real)
      setSlaIndicators({
        total_ativos: totalAtivos,
        em_risco: Math.floor(totalAtivos * 0.15), // ~15% em risco
        vencidos: Math.floor(totalAtivos * 0.05)  // ~5% vencidos
      });

      // Busca ofícios (mock - substituir por endpoint real)
      // const oficiosData = await apiClient.get<any>(`list_oficios?org_id=${userData.org_id}`);
      // setOficios(oficiosData.oficios);
      
      // Mock temporário
      setOficios([]);

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const calcularHorasRestantes = (dataLimite?: string): number => {
    if (!dataLimite) return 999;
    
    const limite = new Date(dataLimite);
    const agora = new Date();
    const diff = limite.getTime() - agora.getTime();
    
    return diff / (1000 * 60 * 60); // Horas
  };

  const getUrgenciaColor = (horas: number, prioridade?: string) => {
    if (horas < 0) return 'text-red-600 bg-red-50';
    if (horas < 24) return 'text-orange-600 bg-orange-50';
    if (horas < 48 && prioridade === 'ALTA') return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600';
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 font-sans">
      {!isApiConfigured && (
        <div className="mb-6 rounded-md border border-yellow-500/30 bg-yellow-500/10 text-yellow-100 p-3 text-sm">
          Backend não configurado: defina NEXT_PUBLIC_API_BASE_URL para o projeto em produção.
        </div>
      )}
      <PageHeader
        title="Dashboard"
        subtitle="Monitoramento de ofícios e prazos em tempo real"
      />

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-6 auto-rows-fr gap-6 mb-8">
        {/* Total Ativos */}
        <Card className="bg-[#111317] text-[#EEF1F6] border-[#2a2f3a] md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium tracking-tight text-muted-foreground">Ofícios Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold">{loadingData ? '...' : slaIndicators?.total_ativos || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Status não respondido</p>
          </CardContent>
        </Card>

        {/* Em Risco (<24h) */}
        <Card className="bg-[#111317] text-[#EEF1F6] border-[#2a2f3a] md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium tracking-tight" style={{color:'#FFA94D'}}>Em Risco</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold" style={{color:'#FFA94D'}}>{loadingData ? '...' : slaIndicators?.em_risco || 0}</div>
            <p className="text-xs mt-1" style={{color:'#FFA94D'}}>Prazo &lt; 24 horas</p>
          </CardContent>
        </Card>

        {/* Vencidos */}
        <Card className="bg-[#111317] text-[#EEF1F6] border-[#2a2f3a] md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium tracking-tight" style={{color:'#FF6B6B'}}>Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold" style={{color:'#FF6B6B'}}>{loadingData ? '...' : slaIndicators?.vencidos || 0}</div>
            <p className="text-xs mt-1" style={{color:'#FF6B6B'}}>Prazo ultrapassado</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Ofícios */}
      <Card className="bg-[#111317] text-[#EEF1F6] border-[#2a2f3a]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-semibold tracking-tight">Ofícios Ativos</CardTitle>
            <Button variant="outline" size="sm">Exportar</Button>
          </div>

          {/* Filtros */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por processo ou autoridade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className=""
              />
            </div>

            <Button variant={showOnlyMine ? 'default' : 'outline'} onClick={() => setShowOnlyMine(!showOnlyMine)}>
              Atribuídos a Mim
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando ofícios...</p>
            </div>
          ) : filteredOficios.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm || showOnlyMine
                  ? 'Nenhum ofício encontrado com os filtros aplicados'
                  : 'Nenhum ofício ativo no momento'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Processo</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Autoridade</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Prazo</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Atribuído</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOficios.map((oficio) => {
                    const horasRestantes = calcularHorasRestantes(oficio.data_limite);
                    const urgenciaClass = getUrgenciaColor(horasRestantes, oficio.prioridade);

                    return (
                      <tr key={oficio.oficio_id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 text-sm font-mono">
                          {oficio.oficio_id.slice(0, 8)}...
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {oficio.dados_extraidos?.processo_numero || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {oficio.dados_extraidos?.autoridade_nome || 'N/A'}
                        </td>
                        <td className={`py-3 px-4 text-sm ${urgenciaClass}`}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {horasRestantes < 0 
                              ? `Vencido há ${Math.abs(horasRestantes).toFixed(0)}h`
                              : `${horasRestantes.toFixed(0)}h restantes`
                            }
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {oficio.assigned_user_id || 
                            <span className="text-muted-foreground italic">Não atribuído</span>
                          }
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className="px-2 py-1 rounded-full text-xs bg-muted">
                            {oficio.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/revisao/${oficio.oficio_id}`)}
                          >
                            Revisar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



