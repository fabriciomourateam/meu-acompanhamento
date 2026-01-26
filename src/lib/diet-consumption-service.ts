import { supabase } from '@/integrations/supabase/client';
import { calcularTotaisPlano } from '@/utils/diet-calculations';

export interface DailyConsumption {
  id?: string;
  patient_id: string;
  diet_plan_id?: string;
  consumption_date: string;
  total_calories_consumed: number;
  total_protein_consumed: number;
  total_carbs_consumed: number;
  total_fats_consumed: number;
  target_calories?: number;
  target_protein?: number;
  target_carbs?: number;
  target_fats?: number;
  completion_percentage: number;
  consumed_meals: string[];
}

export interface PatientPoints {
  id?: string;
  patient_id: string;
  total_points: number;
  points_diet: number;
  points_consistency: number;
  points_achievements: number;
  current_level: number;
  total_days_tracked: number;
  current_streak: number;
  longest_streak: number;
}

export interface Achievement {
  id?: string;
  patient_id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description?: string;
  points_earned: number;
  unlocked_at: string;
}

export const dietConsumptionService = {
  /**
   * Salvar ou atualizar consumo diário
   */
  async saveDailyConsumption(
    patientId: string,
    planId: string,
    consumedMealIds: string[],
    planDetails: any
  ): Promise<DailyConsumption> {
    const today = new Date().toISOString().split('T')[0];

    // Calcular totais consumidos
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    if (planDetails.diet_meals) {
      planDetails.diet_meals.forEach((meal: any) => {
        if (consumedMealIds.includes(meal.id)) {
          const mealTotals = calcularTotaisPlano({ diet_meals: [meal] });
          totalCalories += mealTotals.calorias;
          totalProtein += mealTotals.proteinas;
          totalCarbs += mealTotals.carboidratos;
          totalFats += mealTotals.gorduras;
        }
      });
    }

    // Calcular metas (totais do plano)
    const planTotals = calcularTotaisPlano(planDetails);
    const targetCalories = planTotals.calorias;
    const targetProtein = planTotals.proteinas;
    const targetCarbs = planTotals.carboidratos;
    const targetFats = planTotals.gorduras;

    // Calcular percentual de conclusão
    const completionPercentage = targetCalories > 0
      ? Math.min(100, (totalCalories / targetCalories) * 100)
      : 0;

    // Verificar se já existe registro para hoje
    const { data: existing } = await supabase
      .from('diet_daily_consumption')
      .select('*')
      .eq('patient_id', patientId)
      .eq('consumption_date', today)
      .maybeSingle();

    const consumptionData = {
      patient_id: patientId,
      diet_plan_id: planId,
      consumption_date: today,
      total_calories_consumed: totalCalories,
      total_protein_consumed: totalProtein,
      total_carbs_consumed: totalCarbs,
      total_fats_consumed: totalFats,
      target_calories: targetCalories,
      target_protein: targetProtein,
      target_carbs: targetCarbs,
      target_fats: targetFats,
      completion_percentage: completionPercentage,
      consumed_meals: consumedMealIds,
    };

    if (existing) {
      // Atualizar
      const { data, error } = await supabase
        .from('diet_daily_consumption')
        .update(consumptionData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Criar novo
      const { data, error } = await supabase
        .from('diet_daily_consumption')
        .insert(consumptionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  /**
   * Buscar consumo de um período
   */
  async getConsumptionHistory(
    patientId: string,
    startDate: string,
    endDate: string
  ): Promise<DailyConsumption[]> {
    const { data, error } = await supabase
      .from('diet_daily_consumption')
      .select('*')
      .eq('patient_id', patientId)
      .gte('consumption_date', startDate)
      .lte('consumption_date', endDate)
      .order('consumption_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Buscar consumo semanal (últimos 7 dias)
   */
  async getWeeklyConsumption(patientId: string): Promise<DailyConsumption[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // Últimos 7 dias

    return this.getConsumptionHistory(
      patientId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  },

  /**
   * Buscar consumo mensal (últimos 30 dias)
   */
  async getMonthlyConsumption(patientId: string): Promise<DailyConsumption[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 29); // Últimos 30 dias

    return this.getConsumptionHistory(
      patientId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  },

  /**
   * Adicionar pontos ao paciente
   */
  async addPoints(
    patientId: string,
    points: number,
    actionType: string,
    actionDescription?: string
  ): Promise<PatientPoints> {
    // Buscar ou criar registro de pontos
    let { data: pointsData } = await supabase
      .from('patient_points')
      .select('*')
      .eq('patient_id', patientId)
      .maybeSingle();

    if (!pointsData) {
      // Criar novo registro
      const { data: newPoints, error: createError } = await supabase
        .from('patient_points')
        .insert({
          patient_id: patientId,
          total_points: points,
          points_diet: actionType === 'meal_consumed' || actionType === 'daily_complete' ? points : 0,
          points_consistency: actionType === 'streak' ? points : 0,
          points_achievements: actionType === 'achievement' ? points : 0,
          current_level: this.calculateLevel(points),
        })
        .select()
        .single();

      if (createError) throw createError;
      pointsData = newPoints;
    } else {
      // Atualizar pontos
      const newTotalPoints = pointsData.total_points + points;
      const updateData: any = {
        total_points: newTotalPoints,
        current_level: this.calculateLevel(newTotalPoints),
      };

      // Atualizar categoria específica
      if (actionType === 'meal_consumed' || actionType === 'daily_complete') {
        updateData.points_diet = pointsData.points_diet + points;
      } else if (actionType === 'streak') {
        updateData.points_consistency = pointsData.points_consistency + points;
      } else if (actionType === 'achievement') {
        updateData.points_achievements = pointsData.points_achievements + points;
      }

      const { data: updated, error: updateError } = await supabase
        .from('patient_points')
        .update(updateData)
        .eq('id', pointsData.id)
        .select()
        .single();

      if (updateError) throw updateError;
      pointsData = updated;
    }

    // Registrar no histórico
    await supabase
      .from('patient_points_history')
      .insert({
        patient_id: patientId,
        points_id: pointsData.id,
        points_earned: points,
        action_type: actionType,
        action_description: actionDescription,
        action_date: new Date().toISOString().split('T')[0],
      });

    return pointsData;
  },

  /**
   * Calcular nível baseado em pontos
   */
  calculateLevel(points: number): number {
    // Nível 1: 0-100 pontos
    // Nível 2: 101-300 pontos
    // Nível 3: 301-600 pontos
    // Nível 4: 601-1000 pontos
    // Nível 5: 1001-1500 pontos
    // E assim por diante...
    if (points < 100) return 1;
    if (points < 300) return 2;
    if (points < 600) return 3;
    if (points < 1000) return 4;
    if (points < 1500) return 5;
    return Math.floor((points - 1500) / 500) + 6;
  },

  /**
   * Verificar e desbloquear conquistas
   */
  async checkAndUnlockAchievements(patientId: string): Promise<Achievement[]> {
    console.log('🔍 Iniciando verificação de conquistas para:', patientId);
    const unlocked: Achievement[] = [];

    // Buscar consumo do paciente
    const todayDate = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 30); // Buscar últimos 30 dias para streaks

    const { data: consumption, error: consumptionError } = await supabase
      .from('diet_daily_consumption')
      .select('*')
      .eq('patient_id', patientId)
      .gte('consumption_date', weekAgo.toISOString().split('T')[0])
      .order('consumption_date', { ascending: true });

    if (consumptionError) {
      console.error('❌ Erro ao buscar consumo:', consumptionError);
    }

    if (!consumption || consumption.length === 0) {
      console.log('⚠️ Nenhum consumo encontrado para verificar conquistas');
      return unlocked;
    }

    // Buscar conquistas já desbloqueadas
    const { data: existingAchievements, error: achievementsError } = await supabase
      .from('patient_achievements')
      .select('achievement_type')
      .eq('patient_id', patientId);

    if (achievementsError) {
      console.error('❌ Erro ao buscar conquistas existentes:', achievementsError);
    }

    const unlockedTypes = new Set(existingAchievements?.map(a => a.achievement_type) || []);
    console.log('🏆 Conquistas já desbloqueadas:', unlockedTypes.size);

    // Buscar templates de conquistas
    const { data: templates, error: templatesError } = await supabase
      .from('achievement_templates')
      .select('*');

    if (templatesError) {
      console.error('❌ Erro ao buscar templates:', templatesError);
    }

    if (!templates || templates.length === 0) {
      console.warn('⚠️ Nenhum template de conquista encontrado no sistema!');
      return unlocked;
    }

    console.log('📋 Templates disponíveis:', templates.length);

    // Verificar cada template
    for (const template of templates) {
      if (unlockedTypes.has(template.achievement_type)) continue;

      let shouldUnlock = false;

      switch (template.achievement_type) {
        case 'first_meal':
          // Verificar se tem pelo menos uma refeição consumida
          shouldUnlock = consumption.some(c => (c.consumed_meals as string[]).length > 0);
          break;

        case 'day_complete':
          // Verificar se completou 100% hoje
          const todayConsumption = consumption.find(c => c.consumption_date === todayDate);
          shouldUnlock = todayConsumption?.completion_percentage === 100;
          break;

        case 'week_complete':
          // Verificar se completou todos os 7 dias da última semana
          const last7Days = consumption.filter(c => {
            const date = new Date(c.consumption_date);
            const today = new Date();
            const diffTime = today.getTime() - date.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 7;
          });
          shouldUnlock = last7Days.length >= 7 &&
            last7Days.every(c => c.completion_percentage === 100);
          break;

        case 'streak_3':
        case 'streak_7':
        case 'streak_30':
          // Verificar sequência de dias completos
          const streakDays = parseInt(template.achievement_type.split('_')[1]);
          shouldUnlock = this.checkStreak(consumption, streakDays);
          break;

        case 'perfect_day':
          // Verificar se atingiu 100% de calorias e macros hoje
          const todayPerfect = consumption.find(c => c.consumption_date === todayDate);
          shouldUnlock = todayPerfect?.completion_percentage === 100 &&
            (todayPerfect.total_protein_consumed || 0) >= ((todayPerfect.target_protein || 0) * 0.95) &&
            (todayPerfect.total_carbs_consumed || 0) >= ((todayPerfect.target_carbs || 0) * 0.95) &&
            (todayPerfect.total_fats_consumed || 0) >= ((todayPerfect.target_fats || 0) * 0.95);
          break;
      }

      if (shouldUnlock) {
        console.log('🔓 Desbloqueando conquista:', template.achievement_name);
        // Desbloquear conquista
        const { data: achievement, error } = await supabase
          .from('patient_achievements')
          .insert({
            patient_id: patientId,
            achievement_type: template.achievement_type,
            achievement_name: template.achievement_name,
            achievement_description: template.achievement_description,
            points_earned: template.points_earned,
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Erro ao salvar desbloqueio:', error);
        } else if (achievement) {
          unlocked.push(achievement);
          // Adicionar pontos
          await this.addPoints(
            patientId,
            template.points_earned,
            'achievement',
            `Conquista: ${template.achievement_name}`
          );
        }
      }
    }

    return unlocked;
  },

  /**
   * Verificar sequência de dias completos
   */
  checkStreak(consumption: DailyConsumption[], requiredDays: number): boolean {
    if (consumption.length < requiredDays) return false;

    // Ordenar por data (mais recente primeiro)
    const sorted = [...consumption].sort((a, b) =>
      new Date(b.consumption_date).getTime() - new Date(a.consumption_date).getTime()
    );

    // Verificar se os últimos N dias estão completos
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verificar dia atual ou anterior (para não quebrar streak se hoje ainda não acabou)
    let lastDate = new Date(sorted[0].consumption_date);
    lastDate.setHours(0, 0, 0, 0);

    // Se o último registro for muito antigo, streak quebrou
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) return false;

    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      if (item.completion_percentage === 100) {
        streak++;

        // Verificar continuidade das datas
        if (i < sorted.length - 1) {
          const currentDate = new Date(item.consumption_date);
          const nextDate = new Date(sorted[i + 1].consumption_date);
          const dayDiff = Math.abs(currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24);

          if (dayDiff > 1.1) break; // Gap maior que 1 dia
        }
      } else {
        break;
      }
    }

    return streak >= requiredDays;
  },

  /**
   * Buscar pontos do paciente
   */
  async getPatientPoints(patientId: string): Promise<PatientPoints | null> {
    try {
      // Usar maybeSingle() em vez de single() para evitar erro 406 quando não há dados
      // maybeSingle() retorna null se não houver registro, sem gerar erro
      const { data, error } = await supabase
        .from('patient_points')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro real ao buscar pontos:', error);
        return null;
      }
      return data || null;
    } catch (error: any) {
      console.error('❌ Exceção ao buscar pontos:', error);
      return null;
    }
  },

  /**
   * Buscar conquistas do paciente
   */
  async getPatientAchievements(patientId: string): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('patient_achievements')
        .select('*')
        .eq('patient_id', patientId)
        .order('unlocked_at', { ascending: false });

      if (error) {
        console.error('❌ Erro real ao buscar conquistas:', error);
        return [];
      }
      return data || [];
    } catch (error: any) {
      console.error('❌ Exceção ao buscar conquistas:', error);
      return [];
    }
  },
};

