'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { createApiClient } from '@/lib/api';

interface Policy {
  document_id: string;
  org_id: string;
  type: string;
  version: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

interface PolicyAcceptanceStatus {
  needsAcceptance: boolean;
  policies: Policy[];
  loading: boolean;
}

export function usePolicyAcceptance(): PolicyAcceptanceStatus {
  const { user, userData, getToken } = useAuth();
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !userData?.org_id) {
      setLoading(false);
      return;
    }

    checkPolicyAcceptance();
  }, [user, userData]);

  const checkPolicyAcceptance = async () => {
    if (!userData?.org_id) return;

    try {
      const apiClient = createApiClient(getToken);

      // Busca políticas ativas da organização
      // (Assumindo endpoint GET /api/policies?org_id=X&type=TERMOS_DE_USO)
      const termos = await apiClient.get<any>(
        `get_latest_policy?org_id=${userData.org_id}&type=TERMOS_DE_USO`
      ).catch(() => null);

      const privacidade = await apiClient.get<any>(
        `get_latest_policy?org_id=${userData.org_id}&type=POLITICA_PRIVACIDADE`
      ).catch(() => null);

      const policiesToAccept: Policy[] = [];

      // Verifica aceite de termos
      if (termos && termos.policy) {
        const accepted = checkLocalAcceptance(
          'TERMOS_DE_USO',
          termos.policy.version
        );

        if (!accepted) {
          policiesToAccept.push(termos.policy);
        }
      }

      // Verifica aceite de privacidade
      if (privacidade && privacidade.policy) {
        const accepted = checkLocalAcceptance(
          'POLITICA_PRIVACIDADE',
          privacidade.policy.version
        );

        if (!accepted) {
          policiesToAccept.push(privacidade.policy);
        }
      }

      setPolicies(policiesToAccept);
      setNeedsAcceptance(policiesToAccept.length > 0);

    } catch (error) {
      console.error('Erro ao verificar políticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLocalAcceptance = (type: string, version: string): boolean => {
    const key = `policy_acceptance_${type}_${version}`;
    return localStorage.getItem(key) === 'true';
  };

  return {
    needsAcceptance,
    policies,
    loading,
  };
}

/**
 * Registra aceite de política (local + backend).
 */
export async function acceptPolicy(
  getToken: () => Promise<string | null>,
  policyType: string,
  policyVersion: string,
  orgId: string
): Promise<void> {
  try {
    const apiClient = createApiClient(getToken);

    // Registra no backend
    await apiClient.post('register_policy_acceptance', {
      org_id: orgId,
      policy_type: policyType,
      policy_version: policyVersion,
      ip_address: window.location.hostname, // Simplificado
      user_agent: navigator.userAgent,
    });

    // Registra localmente
    const key = `policy_acceptance_${policyType}_${policyVersion}`;
    localStorage.setItem(key, 'true');

  } catch (error) {
    console.error('Erro ao registrar aceite:', error);
    throw error;
  }
}





