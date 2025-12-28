import { supabase } from '@/integrations/supabase/client';

export interface DashboardSyncConfig {
  apiKey: string;
  databaseId: string;
  savedAt: string;
  userId?: string;
}

export interface PDFBrandingConfig {
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  company_name: string;
  footer_text: string;
  show_logo: boolean;
  show_company_name: boolean;
}

export class ConfigService {
  // Salvar configurações no Supabase
  static async saveDashboardConfig(config: Omit<DashboardSyncConfig, 'savedAt' | 'userId'>) {
    try {
      const configData = {
        ...config,
        savedAt: new Date().toISOString(),
        userId: 'default' // Pode ser expandido para multi-usuário
      };

      const { data, error } = await supabase
        .from('system_config')
        .upsert({
          key: 'dashboard_sync_config',
          value: configData,
          description: 'Configurações de sincronização do dashboard com Notion'
        }, {
          onConflict: 'key'
        });

      if (error) {
        throw error;
      }

      return { success: true, data: configData };
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      return { success: false, error: error.message };
    }
  }

  // Carregar configurações do Supabase
  static async loadDashboardConfig(): Promise<DashboardSyncConfig | null> {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'dashboard_sync_config')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Não encontrado, retornar null
          return null;
        }
        throw error;
      }

      return data?.value as DashboardSyncConfig || null;
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      return null;
    }
  }

  // Remover configurações do Supabase
  static async clearDashboardConfig() {
    try {
      const { error } = await supabase
        .from('system_config')
        .delete()
        .eq('key', 'dashboard_sync_config');

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao remover configurações:', error);
      return { success: false, error: error.message };
    }
  }

  // Fallback para localStorage se Supabase falhar
  static saveToLocalStorage(config: Omit<DashboardSyncConfig, 'savedAt' | 'userId'>) {
    try {
      const configData = {
        ...config,
        savedAt: new Date().toISOString()
      };

      localStorage.setItem('dashboard-sync-config', JSON.stringify(configData));
      return { success: true, data: configData };
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      return { success: false, error: error.message };
    }
  }

  static loadFromLocalStorage(): DashboardSyncConfig | null {
    try {
      const saved = localStorage.getItem('dashboard-sync-config');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
      return null;
    }
  }

  static clearLocalStorage() {
    try {
      localStorage.removeItem('dashboard-sync-config');
      return { success: true };
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
      return { success: false, error: error.message };
    }
  }

  // ========== BRANDING CONFIG (PDF) ==========

  static async getPDFBrandingConfig(): Promise<PDFBrandingConfig> {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'pdf_branding')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.value) {
        return data.value as PDFBrandingConfig;
      }

      // Retornar valores padrão
      return {
        logo_url: null,
        primary_color: '#00C98A',
        secondary_color: '#222222',
        company_name: 'Grow Nutri',
        footer_text: 'Sistema de Controle de Pacientes',
        show_logo: true,
        show_company_name: true,
      };
    } catch (error) {
      console.error('Erro ao carregar configurações de branding:', error);
      // Retornar valores padrão em caso de erro
      return {
        logo_url: null,
        primary_color: '#00C98A',
        secondary_color: '#222222',
        company_name: 'Grow Nutri',
        footer_text: 'Sistema de Controle de Pacientes',
        show_logo: true,
        show_company_name: true,
      };
    }
  }

  static async savePDFBrandingConfig(config: Partial<PDFBrandingConfig>) {
    try {
      const current = await this.getPDFBrandingConfig();
      const updated = { ...current, ...config };

      const { error } = await supabase
        .from('system_config')
        .upsert({
          key: 'pdf_branding',
          value: updated,
          description: 'Configurações de marca para geração de PDFs'
        }, {
          onConflict: 'key'
        });

      if (error) throw error;
      return { success: true, data: updated };
    } catch (error) {
      console.error('Erro ao salvar configurações de branding:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }
}
