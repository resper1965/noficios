'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuthSupabase';
import { useOficios } from './useOficios';

export interface Notificacao {
  id: string;
  tipo: 'urgente' | 'aviso' | 'vencido';
  titulo: string;
  mensagem: string;
  oficioId: number | string;
  lida: boolean;
  createdAt: Date;
}

export function useNotificacoes() {
  const { user } = useAuth();
  const { oficios } = useOficios();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    if (!oficios.length) return;

    const now = new Date();
    const newNotificacoes: Notificacao[] = [];

    oficios.forEach(oficio => {
      if (oficio.status !== 'ativo') return;

      const prazo = new Date(oficio.prazo);
      const diffMs = prazo.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Ofício vencido
      if (diffDays < 0) {
        newNotificacoes.push({
          id: `${oficio.id}-vencido`,
          tipo: 'vencido',
          titulo: 'Ofício Vencido',
          mensagem: `Ofício #${oficio.numero} venceu há ${Math.abs(diffDays)} dia(s)`,
          oficioId: oficio.id,
          lida: false,
          createdAt: prazo,
        });
      }
      // Vence hoje ou amanhã (urgente)
      else if (diffDays <= 1) {
        newNotificacoes.push({
          id: `${oficio.id}-urgente`,
          tipo: 'urgente',
          titulo: 'Prazo Urgente!',
          mensagem: `Ofício #${oficio.numero} vence ${diffDays === 0 ? 'hoje' : 'amanhã'}`,
          oficioId: oficio.id,
          lida: false,
          createdAt: now,
        });
      }
      // Vence em 2-3 dias (aviso)
      else if (diffDays <= 3) {
        newNotificacoes.push({
          id: `${oficio.id}-aviso`,
          tipo: 'aviso',
          titulo: 'Prazo Próximo',
          mensagem: `Ofício #${oficio.numero} vence em ${diffDays} dias`,
          oficioId: oficio.id,
          lida: false,
          createdAt: now,
        });
      }
    });

    // Ordenar por prioridade (vencido > urgente > aviso) e data
    newNotificacoes.sort((a, b) => {
      const prioridade = { vencido: 0, urgente: 1, aviso: 2 };
      const prioridadeDiff = prioridade[a.tipo] - prioridade[b.tipo];
      if (prioridadeDiff !== 0) return prioridadeDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    setNotificacoes(newNotificacoes);
    setNaoLidas(newNotificacoes.filter(n => !n.lida).length);
  }, [oficios]);

  const marcarComoLida = (id: string) => {
    setNotificacoes(prev =>
      prev.map(n => (n.id === id ? { ...n, lida: true } : n))
    );
    setNaoLidas(prev => Math.max(0, prev - 1));
  };

  const marcarTodasComoLidas = () => {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    setNaoLidas(0);
  };

  const limparLidas = () => {
    setNotificacoes(prev => prev.filter(n => !n.lida));
  };

  return {
    notificacoes,
    naoLidas,
    marcarComoLida,
    marcarTodasComoLidas,
    limparLidas,
  };
}

