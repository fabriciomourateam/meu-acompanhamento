import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PromptTemplate } from '../lib/checkin-feedback-ai';
import { toast } from 'sonner';
import { getCurrentUserId } from '../lib/auth-helpers';

// Cache compartilhado para templates
let templatesCache: PromptTemplate[] | null = null;
let templatesCacheTimestamp: number = 0;
const TEMPLATES_CACHE_TTL = 5 * 60 * 1000; // 5 minutos
let loadingTemplatesPromise: Promise<void> | null = null;

export const useFeedbackTemplates = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<PromptTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar templates (com cache)
  const fetchTemplates = async () => {
    // Verificar cache primeiro
    if (templatesCache && Date.now() - templatesCacheTimestamp < TEMPLATES_CACHE_TTL) {
      setTemplates(templatesCache);
      const active = templatesCache.find(t => t.is_active) || templatesCache.find(t => t.is_default) || templatesCache[0];
      if (active) {
        setActiveTemplate(active);
      }
      setLoading(false);
      return;
    }
    
    // Se já existe uma promise em andamento, aguardar ela
    if (loadingTemplatesPromise) {
      await loadingTemplatesPromise;
      if (templatesCache) {
        setTemplates(templatesCache);
        const active = templatesCache.find(t => t.is_active) || templatesCache.find(t => t.is_default) || templatesCache[0];
        if (active) {
          setActiveTemplate(active);
        }
      }
      setLoading(false);
      return;
    }
    
    loadingTemplatesPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('feedback_prompt_templates')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        templatesCache = data || [];
        templatesCacheTimestamp = Date.now();
        
        setTemplates(templatesCache);
        
        // Definir template ativo (primeiro ativo ou padrão)
        const active = templatesCache.find(t => t.is_active) || templatesCache.find(t => t.is_default) || templatesCache[0];
        if (active) {
          setActiveTemplate(active);
        }
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erro ao carregar templates:', error);
        }
        if (!error?.code || error.code !== 'PGRST116') {
          toast.error('Erro ao carregar templates de prompt');
        }
      } finally {
        setLoading(false);
        loadingTemplatesPromise = null;
      }
    })();
    
    await loadingTemplatesPromise;
  };

  // Salvar template
  const saveTemplate = async (template: Partial<PromptTemplate>): Promise<boolean> => {
    try {
      // Obter user_id do usuário autenticado
      const userId = await getCurrentUserId();
      if (!userId) {
        toast.error('Você precisa estar autenticado para salvar templates');
        return false;
      }

      const { data, error } = await supabase
        .from('feedback_prompt_templates')
        .upsert({
          ...template,
          user_id: userId, // Garantir que user_id está sempre presente
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidar cache
      templatesCache = null;
      templatesCacheTimestamp = 0;

      // Atualizar lista local
      if (template.id) {
        setTemplates(prev => prev.map(t => t.id === template.id ? data : t));
      } else {
        setTemplates(prev => [data, ...prev]);
      }

      // Se for marcado como ativo, desativar outros
      if (data.is_active) {
        await setTemplateActive(data.id);
      }

      toast.success('Template salvo com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
      return false;
    }
  };

  // Definir template ativo
  const setTemplateActive = async (templateId: string) => {
    try {
      // Obter user_id do usuário autenticado
      const userId = await getCurrentUserId();
      if (!userId) {
        toast.error('Você precisa estar autenticado para ativar templates');
        return;
      }

      // Desativar todos os templates do usuário atual (a política RLS já filtra por user_id)
      await supabase
        .from('feedback_prompt_templates')
        .update({ is_active: false })
        .eq('user_id', userId);

      // Ativar o template selecionado
      const { data, error } = await supabase
        .from('feedback_prompt_templates')
        .update({ is_active: true })
        .eq('id', templateId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Invalidar cache
      templatesCache = null;
      templatesCacheTimestamp = 0;

      // Atualizar estado local
      setTemplates(prev => prev.map(t => ({
        ...t,
        is_active: t.id === templateId
      })));
      
      setActiveTemplate(data);
      toast.success('Template ativado!');
    } catch (error) {
      console.error('Erro ao ativar template:', error);
      toast.error('Erro ao ativar template');
    }
  };

  // Deletar template
  const deleteTemplate = async (templateId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('feedback_prompt_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      // Invalidar cache
      templatesCache = null;
      templatesCacheTimestamp = 0;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      // Se era o template ativo, ativar outro
      if (activeTemplate?.id === templateId) {
        const remaining = templates.filter(t => t.id !== templateId);
        if (remaining.length > 0) {
          await setTemplateActive(remaining[0].id);
        } else {
          setActiveTemplate(null);
        }
      }

      toast.success('Template removido!');
      return true;
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      toast.error('Erro ao remover template');
      return false;
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    activeTemplate,
    loading,
    saveTemplate,
    setTemplateActive,
    deleteTemplate,
    refreshTemplates: fetchTemplates
  };
};



