import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type DietPlan = Database['public']['Tables']['diet_plans']['Row'];
type DietPlanInsert = Database['public']['Tables']['diet_plans']['Insert'];
type DietPlanUpdate = Database['public']['Tables']['diet_plans']['Update'];

export const dietService = {
  // Buscar planos de um paciente
  async getByPatientId(patientId: string) {
    const { data, error } = await supabase
      .from('diet_plans')
      .select(`
        *,
        diet_meals (
          *,
          diet_foods (*)
        ),
        diet_guidelines (*)
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Buscar plano por ID
  async getById(planId: string) {
    const { data, error } = await supabase
      .from('diet_plans')
      .select(`
        *,
        diet_meals (
          *,
          diet_foods (*)
        ),
        diet_guidelines (*)
      `)
      .eq('id', planId)
      .single();

    if (error) throw error;
    return data;
  },

  // Criar novo plano
  async create(planData: DietPlanInsert) {
    const { data, error } = await supabase
      .from('diet_plans')
      .insert(planData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar plano
  async update(planId: string, updates: DietPlanUpdate) {
    const { data, error } = await supabase
      .from('diet_plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Liberar plano para paciente
  async release(planId: string) {
    const { data, error } = await supabase
      .from('diet_plans')
      .update({ 
        status: 'active',
        is_released: true,
        released_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar banco de alimentos
  async getFoodDatabase() {
    const { data, error } = await supabase
      .from('food_database')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Criar refeição
  async createMeal(mealData: Database['public']['Tables']['diet_meals']['Insert']) {
    const { data, error } = await supabase
      .from('diet_meals')
      .insert(mealData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Criar alimento
  async createFood(foodData: Database['public']['Tables']['diet_foods']['Insert']) {
    const { data, error } = await supabase
      .from('diet_foods')
      .insert(foodData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Criar orientação
  async createGuideline(guidelineData: Database['public']['Tables']['diet_guidelines']['Insert']) {
    const { data, error } = await supabase
      .from('diet_guidelines')
      .insert(guidelineData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar plano (deleta em cascata refeições, alimentos e orientações)
  async delete(planId: string) {
    const { error } = await supabase
      .from('diet_plans')
      .delete()
      .eq('id', planId);

    if (error) throw error;
    return true;
  }
};

