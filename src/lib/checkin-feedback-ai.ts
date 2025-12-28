import Anthropic from '@anthropic-ai/sdk';

interface CheckinFeedbackData {
  patientName: string;
  checkinData: any;
  evolutionData: any;
  observedImprovements: string;
  dietAdjustments: string;
}

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt_template: string;
  ai_model: string;
  max_tokens: number;
  temperature: number;
}

// Cache para economizar tokens - Versão híbrida (memória + localStorage)
interface CacheEntry {
  hash: string;
  feedback: string;
  timestamp: number;
}

class FeedbackCache {
  // Cache em memória para acesso rápido
  private memoryCache = new Map<string, CacheEntry>();
  
  // Configurações
  private readonly STORAGE_KEY = 'checkin_feedback_cache_v1';
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias
  private readonly MAX_CACHE_SIZE = 100; // Limitar a 100 entradas
  
  // Flag para carregar do localStorage apenas uma vez
  private storageCacheLoaded = false;

  generateHash(data: any): string {
    // Usar hash mais robusto e longo (32 caracteres) para evitar colisões
    const str = JSON.stringify(data);
    
    // Primeira passada (esquerda para direita)
    let hash1 = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash1 = ((hash1 << 5) - hash1) + char;
      hash1 = hash1 & hash1; // Convert to 32bit integer
    }
    
    // Segunda passada (direita para esquerda) para mais robustez
    let hash2 = 0;
    for (let i = str.length - 1; i >= 0; i--) {
      const char = str.charCodeAt(i);
      hash2 = ((hash2 << 5) - hash2) + char;
      hash2 = hash2 & hash2;
    }
    
    // Combinar hashes e retornar 32 caracteres
    const combined = Math.abs(hash1).toString(36) + Math.abs(hash2).toString(36);
    return combined.slice(0, 32).padEnd(32, '0');
  }

  get(hash: string): string | null {
    // 1. Verificar memória primeiro (mais rápido - O(1))
    const memoryEntry = this.memoryCache.get(hash);
    if (memoryEntry) {
      if (Date.now() - memoryEntry.timestamp < this.CACHE_DURATION) {
        return memoryEntry.feedback;
      } else {
        // Entrada expirada - remover
        this.memoryCache.delete(hash);
      }
    }

    // 2. Se não tiver em memória, carregar do localStorage (só uma vez)
    if (!this.storageCacheLoaded) {
      this.loadStorageCacheToMemory();
    }

    // 3. Verificar novamente na memória (agora pode ter sido carregado)
    const loadedEntry = this.memoryCache.get(hash);
    if (loadedEntry) {
      if (Date.now() - loadedEntry.timestamp < this.CACHE_DURATION) {
        return loadedEntry.feedback;
      } else {
        this.memoryCache.delete(hash);
      }
    }

    return null;
  }

  set(hash: string, feedback: string): void {
    const entry: CacheEntry = {
      hash,
      feedback,
      timestamp: Date.now()
    };

    // Salvar em memória imediatamente (rápido, não bloqueia)
    this.memoryCache.set(hash, entry);

    // Salvar no localStorage de forma assíncrona (não bloqueia a thread principal)
    this.saveToStorageAsync(hash, entry);
  }

  // Carregar cache do localStorage para memória (só uma vez)
  private loadStorageCacheToMemory(): void {
    if (this.storageCacheLoaded) return;
    
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        this.storageCacheLoaded = true;
        return; // SSR ou localStorage não disponível
      }

      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        this.storageCacheLoaded = true;
        return;
      }

      const data = JSON.parse(stored);
      const now = Date.now();
      let hasExpiredEntries = false;

      // Carregar entradas válidas para memória
      Object.entries(data).forEach(([hash, entry]: [string, any]) => {
        if (now - entry.timestamp < this.CACHE_DURATION) {
          this.memoryCache.set(hash, entry);
        } else {
          hasExpiredEntries = true;
        }
      });

      // Se limpou entradas expiradas, salvar de volta
      if (hasExpiredEntries) {
        this.saveStorageCacheFromMemory();
      }

      this.storageCacheLoaded = true;
    } catch (error) {
      console.warn('Erro ao carregar cache do localStorage:', error);
      this.storageCacheLoaded = true; // Não tentar de novo
    }
  }

  // Salvar cache no localStorage de forma assíncrona
  private saveToStorageAsync(hash: string, entry: CacheEntry): void {
    // Usar setTimeout para não bloquear a thread principal
    setTimeout(() => {
      try {
        if (typeof window === 'undefined' || !window.localStorage) {
          return; // SSR ou localStorage não disponível
        }

        const stored = localStorage.getItem(this.STORAGE_KEY);
        const data: Record<string, CacheEntry> = stored ? JSON.parse(stored) : {};
        
        // Atualizar entrada
        data[hash] = entry;

        // Limitar tamanho (manter apenas os mais recentes)
        const entries = Object.entries(data)
          .sort((a, b) => b[1].timestamp - a[1].timestamp)
          .slice(0, this.MAX_CACHE_SIZE);

        const limitedData: Record<string, CacheEntry> = {};
        entries.forEach(([h, e]) => {
          limitedData[h] = e;
        });

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedData));
      } catch (error) {
        // Tratar erro de quota excedida
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          this.clearOldStorageEntries();
        } else {
          console.warn('Erro ao salvar cache no localStorage:', error);
        }
      }
    }, 0);
  }

  // Salvar todo o cache da memória para localStorage
  private saveStorageCacheFromMemory(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }

      const data: Record<string, CacheEntry> = {};
      this.memoryCache.forEach((entry, hash) => {
        data[hash] = entry;
      });

      // Limitar tamanho
      const entries = Object.entries(data)
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .slice(0, this.MAX_CACHE_SIZE);

      const limitedData: Record<string, CacheEntry> = {};
      entries.forEach(([hash, entry]) => {
        limitedData[hash] = entry;
      });

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedData));
    } catch (error) {
      console.warn('Erro ao salvar cache completo:', error);
    }
  }

  // Limpar entradas antigas quando localStorage estiver cheio
  private clearOldStorageEntries(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }

      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);
      const entries = Object.entries(data)
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .slice(0, Math.floor(this.MAX_CACHE_SIZE / 2)); // Manter só metade

      const limitedData: Record<string, CacheEntry> = {};
      entries.forEach(([hash, entry]) => {
        limitedData[hash] = entry;
      });

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedData));

      // Atualizar memória também
      this.memoryCache.clear();
      Object.entries(limitedData).forEach(([hash, entry]) => {
        this.memoryCache.set(hash, entry);
      });
    } catch (error) {
      console.error('Erro ao limpar cache antigo:', error);
      // Último recurso: limpar tudo
      try {
        localStorage.removeItem(this.STORAGE_KEY);
        this.memoryCache.clear();
      } catch (e) {
        // Ignorar erro final
      }
    }
  }

  // Métodos úteis para debug/manutenção (opcional)
  clear(): void {
    this.memoryCache.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    this.storageCacheLoaded = false;
  }

  getStats(): { size: number; oldestEntry: number | null; newestEntry: number | null } {
    const timestamps = Array.from(this.memoryCache.values()).map(e => e.timestamp);
    
    return {
      size: this.memoryCache.size,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null
    };
  }
}

class CheckinFeedbackAI {
  private anthropic: Anthropic;
  private cache = new FeedbackCache();
  
  constructor() {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('VITE_ANTHROPIC_API_KEY não está configurada. Configure a variável de ambiente.');
      throw new Error('Chave da API do Anthropic não configurada. Configure VITE_ANTHROPIC_API_KEY no arquivo .env.local ou nas variáveis de ambiente da Vercel.');
    }
    
    this.anthropic = new Anthropic({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Permitir uso no browser
    });
  }

  // Normalizar nome do modelo para garantir compatibilidade
  private normalizeModel(model: string): string {
    // Mapear modelos Sonnet para o formato mais recente (Claude Sonnet 4.5)
    const modelMap: Record<string, string> = {
      // Modelo mais recente - Claude Sonnet 4.5
      'claude-sonnet-4-5-20250929': 'claude-sonnet-4-5-20250929',
      'claude-sonnet-4.5': 'claude-sonnet-4-5-20250929',
      'claude-sonnet-4-5': 'claude-sonnet-4-5-20250929',
      
      // Modelos anteriores (migrar para Sonnet 4.5)
      'claude-3-7-sonnet-20250219': 'claude-sonnet-4-5-20250929',
      'claude-3-5-sonnet-20241022': 'claude-sonnet-4-5-20250929',
      'claude-3-5-sonnet-20240620': 'claude-sonnet-4-5-20250929',
      'claude-3-5-sonnet': 'claude-sonnet-4-5-20250929',
      'claude-sonnet-4-20250514': 'claude-sonnet-4-5-20250929',
    };
    
    // Se for um modelo Sonnet, usar o formato mais recente
    if (model.includes('sonnet')) {
      return modelMap[model] || 'claude-sonnet-4-5-20250929';
    }
    
    // Manter outros modelos como estão
    return model;
  }

  async generateFeedback(
    data: CheckinFeedbackData, 
    template: PromptTemplate
  ): Promise<string> {
    // Extrair identificadores únicos para garantir hash único por paciente + check-in
    const checkinId = data.checkinData?.id || data.checkinData?.checkin_id || 'no-id';
    const patientName = data.patientName || 'unknown';
    const checkinDate = data.checkinData?.data_checkin || '';
    
    // Criar chave de cache com identificadores explícitos para evitar colisões
    // IMPORTANTE: Incluir o conteúdo do prompt no hash para invalidar cache quando o prompt for editado
    const cacheKey = this.cache.generateHash({ 
      patient: patientName,
      checkinId: checkinId,
      checkinDate: checkinDate,
      checkinData: data.checkinData,
      evolutionData: data.evolutionData,
      observedImprovements: data.observedImprovements || '',
      dietAdjustments: data.dietAdjustments || '',
      templateId: template.id,
      templateContent: template.prompt_template, // ✅ Invalida cache quando prompt for editado
      templateModel: template.ai_model, // ✅ Invalida cache se modelo mudar
      templateMaxTokens: template.max_tokens, // ✅ Invalida cache se configurações mudarem
      templateTemperature: template.temperature // ✅ Invalida cache se temperatura mudar
    });
    
    const cachedResult = this.cache.get(cacheKey);
    
    if (cachedResult) {
      console.log('Usando feedback do cache');
      return cachedResult;
    }

    const prompt = this.buildPromptFromTemplate(data, template);
    
    // Normalizar modelo para garantir que seja válido
    let normalizedModel = this.normalizeModel(template.ai_model);
    const originalModel = template.ai_model;
    const isSonnet = originalModel.includes('sonnet');
    
    try {
      const response = await this.anthropic.messages.create({
        model: normalizedModel,
        max_tokens: template.max_tokens,
        temperature: template.temperature,
        messages: [{
          role: "user",
          content: prompt
        }]
      });

      // Verificar se o primeiro bloco de conteúdo é do tipo texto
      const firstContent = response.content[0];
      if (firstContent.type !== 'text') {
        throw new Error('Resposta da IA não contém texto');
      }
      
      const feedback = firstContent.text;
      
      // Salvar no cache
      this.cache.set(cacheKey, feedback);
      
      return feedback;
    } catch (error: any) {
      console.error('Erro ao gerar feedback:', error);
      throw new Error('Falha ao gerar feedback. Verifique sua chave da API do Anthropic e tente novamente.');
    }
  }

  private buildPromptFromTemplate(data: CheckinFeedbackData, template: PromptTemplate): string {
    let prompt = template.prompt_template;
    
    // Substituir variáveis no template
    prompt = prompt.replace(/{patientName}/g, data.patientName || 'Paciente');
    prompt = prompt.replace(/{checkinData}/g, this.formatCheckinData(data.checkinData));
    prompt = prompt.replace(/{evolutionData}/g, this.formatEvolutionData(data.evolutionData));
    
    // Enfatizar observações e ajustes quando preenchidos para garantir que a IA os use
    const hasObservations = data.observedImprovements && data.observedImprovements.trim().length > 0;
    const hasDietAdjustments = data.dietAdjustments && data.dietAdjustments.trim().length > 0;
    
    if (hasObservations) {
      // Enfatizar observações quando preenchidas
      const emphasizedObservations = `\n⚠️ **ATENÇÃO - OBSERVAÇÕES IMPORTANTES DO NUTRICIONISTA:**\n${data.observedImprovements}\n\n*IMPORTANTE: Estas observações devem ser REFLETIDAS e MENCIONADAS no feedback, especialmente na seção de Progresso e Evolução e Pontos de Melhoria.*\n`;
      prompt = prompt.replace(/{observedImprovements}/g, emphasizedObservations);
    } else {
      prompt = prompt.replace(/{observedImprovements}/g, 'Nenhuma observação específica registrada.');
    }
    
    if (hasDietAdjustments) {
      // Enfatizar ajustes quando preenchidos
      const emphasizedAdjustments = `\n⚠️ **ATENÇÃO - AJUSTES REALIZADOS NA DIETA:**\n${data.dietAdjustments}\n\n*IMPORTANTE: Estes ajustes devem ser DESTACADOS na seção "Ajustes no Planejamento" do feedback, explicando o motivo e em quais refeições foram feitas as modificações.*\n`;
      prompt = prompt.replace(/{dietAdjustments}/g, emphasizedAdjustments);
    } else {
      prompt = prompt.replace(/{dietAdjustments}/g, 'Nenhum ajuste específico realizado.');
    }
    
    // Adicionar instrução final reforçando o uso das observações e ajustes
    if (hasObservations || hasDietAdjustments) {
      const reinforcement = `\n\n*INSTRUÇÃO FINAL CRÍTICA:*\n- Se houver observações de melhoras preenchidas acima, elas DEVEM ser mencionadas e refletidas no feedback.\n- Se houver ajustes na dieta preenchidos acima, eles DEVEM ser destacados na seção de ajustes do feedback.\n- Não ignore ou omita essas informações - elas são essenciais para o feedback completo.\n`;
      prompt += reinforcement;
    }
    
    return prompt;
  }

  private formatCheckinData(data: any): string {
    if (!data) return 'Dados do check-in não disponíveis.';
    
    try {
      const formatted = [];
      
      if (data.peso) {
        const peso = typeof data.peso === 'string' ? data.peso.replace(',', '.') : data.peso;
        formatted.push(`Peso: ${peso}kg`);
      }
      if (data.medida) {
        const medida = typeof data.medida === 'string' ? data.medida.replace(',', '.') : data.medida;
        formatted.push(`Medida: ${medida}cm`);
      }
      if (data.treino) formatted.push(`Treinos realizados: ${data.treino}`);
      if (data.cardio) formatted.push(`Cardio: ${data.cardio}`);
      if (data.agua) formatted.push(`Água: ${data.agua}`);
      if (data.sono) formatted.push(`Sono: ${data.sono}`);
      if (data.ref_livre) formatted.push(`Refeições livres: ${data.ref_livre}`);
      if (data.beliscos) formatted.push(`Beliscos: ${data.beliscos}`);
      if (data.melhora_visual) formatted.push(`Melhora visual: ${data.melhora_visual}`);
      if (data.dificuldades) formatted.push(`Dificuldades: ${data.dificuldades}`);
      if (data.objetivo) formatted.push(`Objetivo: ${data.objetivo}`);
      if (data.stress) formatted.push(`Nível de stress: ${data.stress}`);
      if (data.total_pontuacao) formatted.push(`Pontuação total: ${data.total_pontuacao} pontos`);
      if (data.percentual_aproveitamento) formatted.push(`Aproveitamento: ${data.percentual_aproveitamento}%`);
      
      // Novos campos alimentares
      if (data.oq_comeu_ref_livre) formatted.push(`O que comeu na refeição livre: ${data.oq_comeu_ref_livre}`);
      if (data.oq_beliscou) formatted.push(`O que beliscou: ${data.oq_beliscou}`);
      if (data.comeu_menos_planejado) formatted.push(`Comeu menos que o planejado: ${data.comeu_menos_planejado}`);
      if (data.fome_horario) formatted.push(`Fome em algum horário: ${data.fome_horario}`);
      if (data.alimento_incluir) formatted.push(`Alimento para incluir: ${data.alimento_incluir}`);
      if (data.quais_pontos) formatted.push(`Quais pontos melhoraram: ${data.quais_pontos}`);
      
      return formatted.length > 0 ? formatted.join('\n') : JSON.stringify(data, null, 2);
    } catch (error) {
      return JSON.stringify(data, null, 2);
    }
  }

  private formatEvolutionData(data: any): string {
    if (!data) return 'Dados comparativos não disponíveis.';
    
    try {
      const formatted = [];
      
      if (data.peso_diferenca !== undefined) {
        const sinal = data.peso_diferenca > 0 ? '+' : '';
        formatted.push(`Variação de peso: ${sinal}${data.peso_diferenca}kg`);
      }
      
      if (data.cintura_diferenca !== undefined) {
        const sinal = data.cintura_diferenca > 0 ? '+' : '';
        formatted.push(`Variação medida: ${sinal}${data.cintura_diferenca}cm`);
      }
      
      if (data.aderencia !== undefined) {
        formatted.push(`Aproveitamento geral: ${data.aderencia}%`);
      }
      
      return formatted.length > 0 ? formatted.join('\n') : JSON.stringify(data, null, 2);
    } catch (error) {
      return JSON.stringify(data, null, 2);
    }
  }

  // Método para testar prompt com dados de exemplo
  async testPromptWithSampleData(template: PromptTemplate): Promise<string> {
    const sampleData: CheckinFeedbackData = {
      patientName: 'Maria Silva',
      checkinData: {
        peso: 65.0,
        medida: 68,
        treino: '4/4',
        cardio: '3/3',
        agua: '2.5L',
        sono: '7h',
        ref_livre: '1',
        melhora_visual: 'Sim, principalmente nos braços',
        dificuldades: 'Pouca sede durante o dia',
        total_pontuacao: 85,
        percentual_aproveitamento: 95
      },
      evolutionData: {
        peso_diferenca: -0.4,
        cintura_diferenca: -2,
        aderencia: 95
      },
      observedImprovements: 'Visualmente mais volume e definição no corpo todo, principalmente nos braços e pernas. Postura melhorou significativamente.',
      dietAdjustments: 'Aumentei proteína no café da manhã para melhor saciedade. Ajustei carboidrato do jantar para otimizar recuperação.'
    };

    return this.generateFeedback(sampleData, template);
  }
}

export const checkinFeedbackAI = new CheckinFeedbackAI();
export type { CheckinFeedbackData, PromptTemplate };