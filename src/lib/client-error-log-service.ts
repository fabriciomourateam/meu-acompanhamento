import { supabase } from '@/integrations/supabase/client';

export interface ClientErrorLog {
  id: string;
  created_at: string;
  message: string | null;
  stack: string | null;
  component_stack: string | null;
  url: string | null;
  user_agent: string | null;
  context: Record<string, unknown> | null;
  resolved: boolean;
}

export const clientErrorLogService = {
  /** Lista os erros de runtime registrados pelo ErrorBoundary (mais recentes primeiro). */
  async list(trainerUserId: string, onlyOpen = true, limit = 100): Promise<ClientErrorLog[]> {
    const { data, error } = await supabase.rpc('admin_list_client_errors' as never, {
      p_trainer_user_id: trainerUserId,
      p_only_open: onlyOpen,
      p_limit: limit,
    } as never);
    if (error) throw error;
    return (data || []) as ClientErrorLog[];
  },

  /** Marca um erro como resolvido (ou reabre, com resolved=false). */
  async setResolved(trainerUserId: string, errorId: string, resolved = true): Promise<void> {
    const { error } = await supabase.rpc('admin_resolve_client_error' as never, {
      p_trainer_user_id: trainerUserId,
      p_error_id: errorId,
      p_resolved: resolved,
    } as never);
    if (error) throw error;
  },
};
