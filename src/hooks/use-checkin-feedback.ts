import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { checkinFeedbackAI, CheckinFeedbackData, PromptTemplate } from '../lib/checkin-feedback-ai';
import { extractMeasurements } from '../lib/measurement-utils';
import { toast } from 'sonner';

interface FeedbackAnalysis {
  id?: string;
  patient_id: string;
  checkin_id?: string;
  checkin_date: string;
  checkin_data: any;
  evolution_data: any;
  observed_improvements: string;
  diet_adjustments: string;
  generated_feedback: string;
  feedback_status: 'draft' | 'approved' | 'sent';
  prompt_template_id: string;
  sent_at?: string;
  sent_via?: string;
}

// Cache compartilhado para patient IDs
const patientIdCache = new Map<string, { id: string; timestamp: number }>();
const PATIENT_ID_CACHE_TTL = 10 * 60 * 1000; // 10 minutos

export const useCheckinFeedback = (telefone: string) => {
  const [latestCheckin, setLatestCheckin] = useState<any>(null);
  const [evolutionData, setEvolutionData] = useState<any>(null);
  const [feedbackAnalysis, setFeedbackAnalysis] = useState<FeedbackAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);

  // Buscar ID do paciente pelo telefone (com cache compartilhado)
  const fetchPatientId = async () => {
    // Verificar cache primeiro
    const cached = patientIdCache.get(telefone);
    if (cached && Date.now() - cached.timestamp < PATIENT_ID_CACHE_TTL) {
      setPatientId(cached.id);
      return cached.id;
    }
    
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id')
        .eq('telefone', telefone)
        .single();

      if (error) throw error;
      
      // Armazenar no cache
      patientIdCache.set(telefone, { id: data.id, timestamp: Date.now() });
      
      setPatientId(data.id);
      return data.id;
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao buscar ID do paciente:', error);
      }
      return null;
    }
  };

  // Buscar último check-in do paciente
  const fetchLatestCheckin = async () => {
    try {
      const { data, error } = await supabase
        .from('checkin')
        .select('*')
        .eq('telefone', telefone)
        .order('data_checkin', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erro ao buscar check-in:', error);
        }
        return null;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 Check-in mais recente encontrado:', data);
      }
      setLatestCheckin(data);
      return data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao buscar check-in:', error);
      }
      return null;
    }
  };

  // Calcular dados de evolução comparativa
  const calculateEvolutionData = async (currentCheckin: any) => {
    if (!currentCheckin) return null;

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Buscando check-in anterior para:', currentCheckin.data_checkin);
      }
      
      // Buscar check-in anterior
      const { data: previousCheckins, error } = await supabase
        .from('checkin')
        .select('*')
        .eq('telefone', telefone)
        .lt('data_checkin', currentCheckin.data_checkin)
        .order('data_checkin', { ascending: false })
        .limit(1);

      if (error && process.env.NODE_ENV === 'development') {
        console.error('Erro ao buscar check-in anterior:', error);
      }

      const previousCheckin = previousCheckins && previousCheckins.length > 0 ? previousCheckins[0] : null;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Check-in anterior encontrado:', previousCheckin);
      }

      // Converter strings para números, tratando vírgulas e formatos diferentes
      const cleanNumber = (value: any): number => {
        if (!value) return 0;
        const str = value.toString().replace(/[^\d.,]/g, ''); // Remove tudo exceto dígitos, vírgulas e pontos
        const normalized = str.replace(',', '.'); // Converte vírgula para ponto
        const num = parseFloat(normalized);
        return isNaN(num) ? 0 : num;
      };

      // Se não há check-in anterior, buscar dados iniciais do paciente
      if (!previousCheckin) {
        // Buscar dados do paciente
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('peso_inicial, medida_cintura_inicial, medida_quadril_inicial, altura_inicial')
          .eq('telefone', telefone)
          .single();

        if (patientError && process.env.NODE_ENV === 'development') {
          console.error('Erro ao buscar dados iniciais do paciente:', patientError);
        }

        const medidasAtuais = extractMeasurements(currentCheckin.medida);
        
        // Usar dados iniciais do paciente se disponíveis, senão usar null/0
        const pesoAnterior = patientData?.peso_inicial ? cleanNumber(patientData.peso_inicial) : null;
        const cinturaAnterior = patientData?.medida_cintura_inicial ? cleanNumber(patientData.medida_cintura_inicial) : null;
        const quadrilAnterior = patientData?.medida_quadril_inicial ? cleanNumber(patientData.medida_quadril_inicial) : null;
        
        const pesoAtual = cleanNumber(currentCheckin.peso);
        const cinturaAtual = medidasAtuais.cintura;
        const quadrilAtual = medidasAtuais.quadril;

        // Calcular diferenças apenas se ambos os valores existirem
        const pesoDiferenca = pesoAnterior !== null && pesoAtual ? Number((pesoAtual - pesoAnterior).toFixed(1)) : null;
        const cinturaDiferenca = cinturaAnterior !== null && cinturaAtual !== null ? Number((cinturaAtual - cinturaAnterior).toFixed(1)) : null;
        const quadrilDiferenca = quadrilAnterior !== null && quadrilAtual !== null ? Number((quadrilAtual - quadrilAnterior).toFixed(1)) : null;

        // Função para extrair número de tempo (minutos) de texto livre
        const extractTimeMinutes = (text: string | null | undefined): number | null => {
          if (!text) return null;
          const str = text.toString().trim();
          
          // Padrões comuns: "1h15", "1:10", "2 horas", "60 a 70 min", "30 a 45"
          const hourMinMatch = str.match(/(\d+)[h:]\s*(\d+)/i);
          if (hourMinMatch) {
            const hours = parseInt(hourMinMatch[1]) || 0;
            const minutes = parseInt(hourMinMatch[2]) || 0;
            return hours * 60 + minutes;
          }
          
          const rangeMatch = str.match(/(\d+)\s*(?:a|até|-)\s*\d+/i);
          if (rangeMatch) {
            return parseInt(rangeMatch[1]);
          }
          
          const numMatch = str.match(/(\d+)/);
          if (numMatch) {
            return parseInt(numMatch[1]);
          }
          
          return null;
        };

        // Função para extrair segundos de descanso de texto livre
        const extractRestSeconds = (text: string | null | undefined): number | null => {
          if (!text) return null;
          const str = text.toString().toLowerCase().trim();
          
          if (str.includes('mais de um minuto') || str.includes('mais de 1 minuto')) {
            return 60;
          }
          
          const minMatch = str.match(/(\d+)\s*min/i);
          if (minMatch) {
            return parseInt(minMatch[1]) * 60;
          }
          
          const numMatch = str.match(/(\d+)/);
          if (numMatch) {
            return parseInt(numMatch[1]);
          }
          
          return null;
        };

        const tempoTreinoAtualText = currentCheckin.tempo || null;
        const tempoCardioAtualText = currentCheckin.tempo_cardio || null;
        const descansoAtualText = currentCheckin.descanso || null;

        const evolution = {
          peso_anterior: pesoAnterior,
          cintura_anterior: cinturaAnterior,
          quadril_anterior: quadrilAnterior,
          treino_anterior: null, // Sem dados iniciais
          cardio_anterior: null, // Sem dados iniciais
          agua_anterior: null, // Sem dados iniciais
          sono_anterior: null, // Sem dados iniciais
          ref_livre_anterior: null, // Sem dados iniciais
          beliscos_anterior: null, // Sem dados iniciais
          tempo_treino_anterior: null, // Sem dados iniciais
          tempo_treino_anterior_text: null,
          tempo_cardio_anterior: null, // Sem dados iniciais
          tempo_cardio_anterior_text: null,
          descanso_anterior: null, // Sem dados iniciais
          descanso_anterior_text: null,
          aderencia_anterior: null, // Sem dados iniciais
          peso_atual: pesoAtual,
          cintura_atual: cinturaAtual,
          quadril_atual: quadrilAtual,
          treino_atual: cleanNumber(currentCheckin.treino),
          cardio_atual: cleanNumber(currentCheckin.cardio),
          agua_atual: cleanNumber(currentCheckin.agua),
          sono_atual: cleanNumber(currentCheckin.sono),
          ref_livre_atual: cleanNumber(currentCheckin.ref_livre),
          beliscos_atual: cleanNumber(currentCheckin.beliscos),
          tempo_treino_atual: extractTimeMinutes(tempoTreinoAtualText),
          tempo_treino_atual_text: tempoTreinoAtualText,
          tempo_cardio_atual: extractTimeMinutes(tempoCardioAtualText),
          tempo_cardio_atual_text: tempoCardioAtualText,
          descanso_atual: extractRestSeconds(descansoAtualText),
          descanso_atual_text: descansoAtualText,
          aderencia_atual: Number(currentCheckin.percentual_aproveitamento) || 0,
          peso_diferenca: pesoDiferenca,
          cintura_diferenca: cinturaDiferenca,
          quadril_diferenca: quadrilDiferenca,
          treino_diferenca: null, // Sem dados iniciais
          cardio_diferenca: null, // Sem dados iniciais
          agua_diferenca: null, // Sem dados iniciais
          sono_diferenca: null, // Sem dados iniciais
          ref_livre_diferenca: null, // Sem dados iniciais
          beliscos_diferenca: null, // Sem dados iniciais
          tempo_treino_diferenca: null, // Sem dados iniciais
          tempo_cardio_diferenca: null, // Sem dados iniciais
          descanso_diferenca: null, // Sem dados iniciais
          aderencia: Number(currentCheckin.percentual_aproveitamento) || 0,
          aderencia_diferenca: null, // Sem dados iniciais
          tem_checkin_anterior: false,
          usando_dados_iniciais: true // Flag para indicar que está usando dados iniciais
        };
        if (process.env.NODE_ENV === 'development') {
          console.log('📈 Evolução (primeiro check-in com dados iniciais):', evolution);
        }
        setEvolutionData(evolution);
        return evolution;
      }

      // Extrair pesos
      const pesoAtual = cleanNumber(currentCheckin.peso);
      const pesoAnterior = cleanNumber(previousCheckin.peso);

      // Função inteligente para extrair medidas (usando utilitário)
      const medidasAtuais = extractMeasurements(currentCheckin.medida);
      const medidasAnteriores = extractMeasurements(previousCheckin.medida);

      // Função para extrair número de tempo (minutos) de texto livre
      const extractTimeMinutes = (text: string | null | undefined): number | null => {
        if (!text) return null;
        const str = text.toString().trim();
        
        // Padrões comuns: "1h15", "1:10", "2 horas", "60 a 70 min", "30 a 45"
        // Extrair horas e minutos de formato "1h15" ou "1:10"
        const hourMinMatch = str.match(/(\d+)[h:]\s*(\d+)/i);
        if (hourMinMatch) {
          const hours = parseInt(hourMinMatch[1]) || 0;
          const minutes = parseInt(hourMinMatch[2]) || 0;
          return hours * 60 + minutes;
        }
        
        // Extrair primeiro número de range "60 a 70" -> usa o primeiro
        const rangeMatch = str.match(/(\d+)\s*(?:a|até|-)\s*\d+/i);
        if (rangeMatch) {
          return parseInt(rangeMatch[1]);
        }
        
        // Extrair qualquer número do texto
        const numMatch = str.match(/(\d+)/);
        if (numMatch) {
          return parseInt(numMatch[1]);
        }
        
        return null;
      };

      // Função para extrair segundos de descanso de texto livre
      const extractRestSeconds = (text: string | null | undefined): number | null => {
        if (!text) return null;
        const str = text.toString().toLowerCase().trim();
        
        // "Mais de um minuto" -> 60 segundos
        if (str.includes('mais de um minuto') || str.includes('mais de 1 minuto')) {
          return 60;
        }
        
        // Extrair minutos e converter para segundos
        const minMatch = str.match(/(\d+)\s*min/i);
        if (minMatch) {
          return parseInt(minMatch[1]) * 60;
        }
        
        // Extrair qualquer número (assume segundos)
        const numMatch = str.match(/(\d+)/);
        if (numMatch) {
          return parseInt(numMatch[1]);
        }
        
        return null;
      };

      // Calcular valores atuais e anteriores
      const treinoAtual = cleanNumber(currentCheckin.treino);
      const treinoAnterior = cleanNumber(previousCheckin.treino);
      const cardioAtual = cleanNumber(currentCheckin.cardio);
      const cardioAnterior = cleanNumber(previousCheckin.cardio);
      const aguaAtual = cleanNumber(currentCheckin.agua);
      const aguaAnterior = cleanNumber(previousCheckin.agua);
      const sonoAtual = cleanNumber(currentCheckin.sono);
      const sonoAnterior = cleanNumber(previousCheckin.sono);
      const refLivreAtual = cleanNumber(currentCheckin.ref_livre);
      const refLivreAnterior = cleanNumber(previousCheckin.ref_livre);
      const beliscosAtual = cleanNumber(currentCheckin.beliscos);
      const beliscosAnterior = cleanNumber(previousCheckin.beliscos);
      
      // Para tempo de treino, cardio e descanso, manter texto original e extrair número para cálculo
      const tempoTreinoAtualText = currentCheckin.tempo || null;
      const tempoTreinoAnteriorText = previousCheckin.tempo || null;
      const tempoTreinoAtual = extractTimeMinutes(tempoTreinoAtualText);
      const tempoTreinoAnterior = extractTimeMinutes(tempoTreinoAnteriorText);
      
      const tempoCardioAtualText = currentCheckin.tempo_cardio || null;
      const tempoCardioAnteriorText = previousCheckin.tempo_cardio || null;
      const tempoCardioAtual = extractTimeMinutes(tempoCardioAtualText);
      const tempoCardioAnterior = extractTimeMinutes(tempoCardioAnteriorText);
      
      const descansoAtualText = currentCheckin.descanso || null;
      const descansoAnteriorText = previousCheckin.descanso || null;
      const descansoAtual = extractRestSeconds(descansoAtualText);
      const descansoAnterior = extractRestSeconds(descansoAnteriorText);
      
      const aproveitamentoAtual = Number(currentCheckin.percentual_aproveitamento) || 0;
      const aproveitamentoAnterior = Number(previousCheckin.percentual_aproveitamento) || 0;

      if (process.env.NODE_ENV === 'development') {
        console.log('⚖️ Pesos:', { atual: pesoAtual, anterior: pesoAnterior });
        console.log('📏 Medidas atuais:', medidasAtuais);
        console.log('📏 Medidas anteriores:', medidasAnteriores);
      }

      const evolution = {
        // Valores anteriores
        peso_anterior: pesoAnterior,
        cintura_anterior: medidasAnteriores.cintura,
        quadril_anterior: medidasAnteriores.quadril,
        treino_anterior: treinoAnterior,
        cardio_anterior: cardioAnterior,
        agua_anterior: aguaAnterior,
        sono_anterior: sonoAnterior,
        ref_livre_anterior: refLivreAnterior,
        beliscos_anterior: beliscosAnterior,
        tempo_treino_anterior: tempoTreinoAnterior,
        tempo_treino_anterior_text: tempoTreinoAnteriorText,
        tempo_cardio_anterior: tempoCardioAnterior,
        tempo_cardio_anterior_text: tempoCardioAnteriorText,
        descanso_anterior: descansoAnterior,
        descanso_anterior_text: descansoAnteriorText,
        aderencia_anterior: aproveitamentoAnterior,
        // Valores atuais
        peso_atual: pesoAtual,
        cintura_atual: medidasAtuais.cintura,
        quadril_atual: medidasAtuais.quadril,
        treino_atual: treinoAtual,
        cardio_atual: cardioAtual,
        agua_atual: aguaAtual,
        sono_atual: sonoAtual,
        ref_livre_atual: refLivreAtual,
        beliscos_atual: beliscosAtual,
        tempo_treino_atual: tempoTreinoAtual,
        tempo_treino_atual_text: tempoTreinoAtualText,
        tempo_cardio_atual: tempoCardioAtual,
        tempo_cardio_atual_text: tempoCardioAtualText,
        descanso_atual: descansoAtual,
        descanso_atual_text: descansoAtualText,
        aderencia_atual: aproveitamentoAtual,
        // Diferenças
        peso_diferenca: pesoAtual && pesoAnterior ? 
          Number((pesoAtual - pesoAnterior).toFixed(1)) : 0,
        cintura_diferenca: medidasAtuais.cintura && medidasAnteriores.cintura ? 
          Number((medidasAtuais.cintura - medidasAnteriores.cintura).toFixed(1)) : 0,
        quadril_diferenca: medidasAtuais.quadril && medidasAnteriores.quadril ? 
          Number((medidasAtuais.quadril - medidasAnteriores.quadril).toFixed(1)) : 0,
        treino_diferenca: treinoAtual && treinoAnterior ? Number((treinoAtual - treinoAnterior).toFixed(1)) : 0,
        cardio_diferenca: cardioAtual && cardioAnterior ? Number((cardioAtual - cardioAnterior).toFixed(1)) : 0,
        agua_diferenca: aguaAtual && aguaAnterior ? Number((aguaAtual - aguaAnterior).toFixed(1)) : 0,
        sono_diferenca: sonoAtual && sonoAnterior ? Number((sonoAtual - sonoAnterior).toFixed(1)) : 0,
        ref_livre_diferenca: refLivreAtual && refLivreAnterior ? Number((refLivreAtual - refLivreAnterior).toFixed(1)) : 0,
        beliscos_diferenca: beliscosAtual && beliscosAnterior ? Number((beliscosAtual - beliscosAnterior).toFixed(1)) : 0,
        tempo_treino_diferenca: tempoTreinoAtual !== null && tempoTreinoAnterior !== null ? Number((tempoTreinoAtual - tempoTreinoAnterior).toFixed(1)) : null,
        tempo_cardio_diferenca: tempoCardioAtual !== null && tempoCardioAnterior !== null ? Number((tempoCardioAtual - tempoCardioAnterior).toFixed(1)) : null,
        descanso_diferenca: descansoAtual !== null && descansoAnterior !== null ? Number((descansoAtual - descansoAnterior).toFixed(1)) : null,
        aderencia: aproveitamentoAtual,
        aderencia_diferenca: aproveitamentoAtual && aproveitamentoAnterior ? 
          Number((aproveitamentoAtual - aproveitamentoAnterior).toFixed(1)) : 0,
        tem_checkin_anterior: true,
        checkin_anterior_data: previousCheckin.data_checkin,
        checkin_anterior_id: previousCheckin.id,
        medidas_atuais: medidasAtuais,
        medidas_anteriores: medidasAnteriores
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('📈 Evolução calculada:', evolution);
      }
      setEvolutionData(evolution);
      return evolution;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao calcular evolução:', error);
      }
      return null;
    }
  };

  // Buscar análise existente (também tenta buscar por checkin_id se disponível)
  const fetchExistingAnalysis = async (checkinDate: string, patientIdToUse: string, checkinId?: string) => {
    try {
      // Se tiver checkin_id, buscar por ele (mais preciso)
      if (checkinId) {
        const { data, error } = await supabase
          .from('checkin_feedback_analysis' as any)
          .select('*')
          .eq('checkin_id', checkinId)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116' && (error as any).status !== 406 && (error as any).code !== 'PGRST200') {
          if (process.env.NODE_ENV === 'development') {
            console.error('Erro ao buscar análise por checkin_id:', error);
          }
        }
        
        if (data) {
          setFeedbackAnalysis(data as any);
          return data;
        }
      }
      
      // Fallback: buscar por patient_id e checkin_date
      const { data, error } = await supabase
        .from('checkin_feedback_analysis' as any)
        .select('*')
        .eq('patient_id', patientIdToUse)
        .eq('checkin_date', checkinDate)
        .maybeSingle();

      // Tratar erros 406 (Not Acceptable) silenciosamente - podem ser devido a RLS ou tabela não acessível
      if (error) {
        // Ignorar erros 406 e PGRST116 (not found) - são esperados
        if (error.code === 'PGRST116' || (error as any).status === 406 || (error as any).code === 'PGRST200') {
          return null;
        }
        // Outros erros só logar em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.error('Erro ao buscar análise:', error);
        }
        return null;
      }
      
      if (data) {
        setFeedbackAnalysis(data as any);
      }
      return data;
    } catch (error: any) {
      // Tratar erros 406 silenciosamente
      if (error?.status === 406 || error?.code === 'PGRST200') {
        return null;
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao buscar análise:', error);
      }
      return null;
    }
  };

  // Gerar feedback com IA
  const generateFeedback = async (
    patientName: string,
    observedImprovements: string,
    dietAdjustments: string,
    template: PromptTemplate
  ): Promise<string | null> => {
    if (!latestCheckin || !evolutionData) {
      toast.error('Dados do check-in não disponíveis');
      return null;
    }

    setIsGenerating(true);
    
    try {
      const feedbackData: CheckinFeedbackData = {
        patientName,
        checkinData: latestCheckin,
        evolutionData,
        observedImprovements,
        dietAdjustments
      };

      const feedback = await checkinFeedbackAI.generateFeedback(feedbackData, template);
      
      // Salvar análise no banco
      const analysis: Partial<FeedbackAnalysis> = {
        patient_id: patientId!,
        checkin_id: latestCheckin.id,
        checkin_date: latestCheckin.data_checkin?.split('T')[0] || new Date().toISOString().split('T')[0],
        checkin_data: latestCheckin,
        evolution_data: evolutionData,
        observed_improvements: observedImprovements,
        diet_adjustments: dietAdjustments,
        generated_feedback: feedback,
        feedback_status: 'draft',
        prompt_template_id: template.id
      };

      await saveFeedbackAnalysis(analysis);
      
      toast.success('Feedback gerado com sucesso!');
      return feedback;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao gerar feedback:', error);
      }
      toast.error('Erro ao gerar feedback. Verifique sua configuração da API.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // Salvar análise de feedback
  const saveFeedbackAnalysis = async (analysis: Partial<FeedbackAnalysis>) => {
    try {
      // Obter user_id para RLS
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar autenticado para salvar');
        return null;
      }

      // Se tiver ID, fazer update direto
      if (analysis.id) {
        const { data, error } = await supabase
          .from('checkin_feedback_analysis' as any)
          .update({
            ...analysis,
            user_id: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', analysis.id)
          .select()
          .single();

        if (error) throw error;
        
        setFeedbackAnalysis(data as any);
        return data;
      }

      // Se não tiver ID mas tiver checkin_id, buscar se já existe
      // Buscar por checkin_id sem filtrar por user_id para permitir que owner e membros vejam o mesmo feedback
      if (analysis.checkin_id) {
        const { data: existing } = await supabase
          .from('checkin_feedback_analysis' as any)
          .select('*')
          .eq('checkin_id', analysis.checkin_id)
          .maybeSingle();

        if (existing) {
          // Atualizar registro existente
          const { data, error } = await supabase
            .from('checkin_feedback_analysis' as any)
            .update({
              ...analysis,
              user_id: user.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;
          
          setFeedbackAnalysis(data as any);
          return data;
        }
      }

      // Se não encontrou, criar novo registro
      const { data, error } = await supabase
        .from('checkin_feedback_analysis' as any)
        .insert({
          ...analysis,
          user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      setFeedbackAnalysis(data as any);
      return data;
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao salvar análise:', error);
      }
      // Não mostrar toast aqui, deixar o componente chamador decidir quando mostrar
      throw error;
    }
  };

  // Marcar feedback como enviado
  const markFeedbackAsSent = async (sentVia: string) => {
    if (!feedbackAnalysis) return;

    try {
      const { data, error } = await supabase
        .from('checkin_feedback_analysis' as any)
        .update({
          feedback_status: 'sent',
          sent_at: new Date().toISOString(),
          sent_via: sentVia
        } as any)
        .eq('id', feedbackAnalysis.id)
        .select()
        .single();

      if (error) throw error;
      
      setFeedbackAnalysis(data as any);
      toast.success('Feedback marcado como enviado!');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao marcar como enviado:', error);
      }
      toast.error('Erro ao atualizar status');
    }
  };

  // Inicializar dados
  const initializeData = async () => {
    setLoading(true);
    
    // Primeiro buscar o ID do paciente
    const patientIdToUse = await fetchPatientId();
    if (!patientIdToUse) {
      setLoading(false);
      return;
    }
    
    const checkin = await fetchLatestCheckin();
    if (checkin) {
      await calculateEvolutionData(checkin);
      await fetchExistingAnalysis(
        checkin.data_checkin?.split('T')[0] || new Date().toISOString().split('T')[0], 
        patientIdToUse,
        checkin.id
      );
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (telefone) {
      initializeData();
    }
  }, [telefone]);

  return {
    latestCheckin,
    evolutionData,
    feedbackAnalysis,
    isGenerating,
    loading,
    patientId,
    generateFeedback,
    saveFeedbackAnalysis,
    markFeedbackAsSent,
    refreshData: initializeData
  };
};

