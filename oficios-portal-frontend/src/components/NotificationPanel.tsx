'use client';

import { useNotificacoes } from '@/hooks/useNotificacoes';
import { useRouter } from 'next/navigation';
import { Bell, X, CheckCheck, Trash2, AlertTriangle, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export function NotificationPanel() {
  const { notificacoes, naoLidas, marcarComoLida, marcarTodasComoLidas, limparLidas } = useNotificacoes();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (tipo: 'urgente' | 'aviso' | 'vencido') => {
    switch (tipo) {
      case 'vencido':
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
      case 'urgente':
        return <AlertCircle className="h-5 w-5 text-orange-400" />;
      case 'aviso':
        return <Clock className="h-5 w-5 text-yellow-400" />;
    }
  };

  const getBgColor = (tipo: 'urgente' | 'aviso' | 'vencido', lida: boolean) => {
    if (lida) return 'bg-gray-800/50';
    
    switch (tipo) {
      case 'vencido':
        return 'bg-red-900/20 border-l-4 border-red-500';
      case 'urgente':
        return 'bg-orange-900/20 border-l-4 border-orange-500';
      case 'aviso':
        return 'bg-yellow-900/20 border-l-4 border-yellow-500';
    }
  };

  const handleNotificationClick = (oficioId: number | string, notifId: string) => {
    marcarComoLida(notifId);
    setIsOpen(false);
    router.push(`/oficios/${oficioId}`);
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {naoLidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-white">
                  Notificações {naoLidas > 0 && `(${naoLidas})`}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                {notificacoes.length > 0 && (
                  <>
                    <button
                      onClick={marcarTodasComoLidas}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      title="Marcar todas como lidas"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                    <button
                      onClick={limparLidas}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      title="Limpar lidas"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[500px] overflow-y-auto">
              {notificacoes.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {notificacoes.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.oficioId, notif.id)}
                      className={`p-4 cursor-pointer hover:bg-gray-700/30 transition-colors ${getBgColor(notif.tipo, notif.lida)}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notif.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm font-medium ${notif.lida ? 'text-gray-400' : 'text-white'}`}>
                              {notif.titulo}
                            </p>
                            {!notif.lida && (
                              <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className={`text-sm ${notif.lida ? 'text-gray-500' : 'text-gray-300'}`}>
                            {notif.mensagem}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notificacoes.length > 0 && (
              <div className="p-3 border-t border-gray-700 bg-gray-800/50 text-center">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/oficios');
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Ver todos os ofícios
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

