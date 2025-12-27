/**
 * Helpers para autenticação e multi-tenancy
 * Funções utilitárias para trabalhar com usuários autenticados
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Obtém o ID do usuário autenticado atual
 * @returns UUID do usuário ou null se não estiver autenticado
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Erro ao obter usuário:', error);
      return null;
    }
    
    return user?.id || null;
  } catch (error) {
    console.error('Erro ao obter ID do usuário:', error);
    return null;
  }
}

/**
 * Obtém o usuário autenticado atual completo
 * @returns User object ou null se não estiver autenticado
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Erro ao obter usuário:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    return null;
  }
}

/**
 * Verifica se o usuário está autenticado
 * @returns true se estiver autenticado, false caso contrário
 */
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getCurrentUserId();
  return userId !== null;
}

/**
 * Garante que o user_id seja incluído em um objeto de insert/update
 * Se user_id não estiver definido, adiciona o ID do usuário atual
 * @param data Objeto de dados para insert/update
 * @returns Objeto com user_id garantido
 */
export async function ensureUserId<T extends { user_id?: string | null }>(
  data: T
): Promise<T & { user_id: string }> {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    throw new Error('Usuário não autenticado. Faça login para continuar.');
  }
  
  return {
    ...data,
    user_id: data.user_id || userId,
  };
}

/**
 * Obtém o owner_id para contabilização de equipe
 * Se for membro da equipe, retorna o owner_id do team_members
 * Se for owner, retorna o próprio user_id
 * Isso permite que contatos de toda a equipe sejam contabilizados juntos
 */
export async function getTeamOwnerId(): Promise<string | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    // Verificar se é membro de alguma equipe (user_id = meu id)
    const { data: memberData } = await (supabase as any)
      .from('team_members')
      .select('owner_id')
      .eq('user_id', userId)
      .maybeSingle();

    // Se for membro, retorna o owner_id
    if (memberData?.owner_id) {
      return memberData.owner_id;
    }

    // Se não for membro, é owner - retorna o próprio user_id
    return userId;
  } catch (error) {
    console.error('Erro ao obter owner_id da equipe:', error);
    return await getCurrentUserId();
  }
}

/**
 * Obtém todos os user_ids da equipe (owner + membros ativos)
 * Útil para queries que precisam incluir dados de toda a equipe
 */
export async function getTeamUserIds(): Promise<string[]> {
  try {
    const ownerId = await getTeamOwnerId();
    if (!ownerId) return [];

    // Buscar todos os membros da equipe (com user_id preenchido)
    const { data: members } = await (supabase as any)
      .from('team_members')
      .select('user_id')
      .eq('owner_id', ownerId)
      .not('user_id', 'is', null);

    const memberIds = members?.map((m: any) => m.user_id).filter(Boolean) || [];
    
    // Incluir o owner também
    return [ownerId, ...memberIds];
  } catch (error) {
    console.error('Erro ao obter user_ids da equipe:', error);
    const userId = await getCurrentUserId();
    return userId ? [userId] : [];
  }
}

/**
 * Hook para obter o ID do usuário atual de forma reativa
 * Use este hook em componentes React
 */
export function useCurrentUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserId() {
      const id = await getCurrentUserId();
      setUserId(id);
      setLoading(false);
    }

    fetchUserId();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const id = await getCurrentUserId();
          setUserId(id);
        } else if (event === 'SIGNED_OUT') {
          setUserId(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { userId, loading };
}

