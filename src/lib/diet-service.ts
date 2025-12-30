import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type DietPlan = Database['public']['Tables']['diet_plans']['Row'];
type DietPlanInsert = Database['public']['Tables']['diet_plans']['Insert'];
type DietPlanUpdate = Database['public']['Tables']['diet_plans']['Update'];

export const dietService = {
  // Buscar planos de um paciente
  async getByPatientId(patientId: string) {
    // Tentar primeiro com relacionamentos aninhados do Supabase
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

    if (error) {
      console.error('Erro ao buscar planos com relacionamentos:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Para cada plano, verificar se os dados vieram corretamente
    const plansWithDetails = await Promise.all(
      data.map(async (plan: any) => {
        // Se diet_meals não veio ou está vazio, fazer busca separada
        if (!plan.diet_meals || (Array.isArray(plan.diet_meals) && plan.diet_meals.length === 0)) {
          const { data: meals, error: mealsError } = await supabase
            .from('diet_meals')
            .select('*')
            .eq('diet_plan_id', plan.id)
            .order('meal_order', { ascending: true });

          if (mealsError) {
            console.error(`Erro ao buscar refeições do plano ${plan.id}:`, mealsError);
            plan.diet_meals = [];
          } else if (meals && meals.length > 0) {
            // Para cada refeição, buscar os alimentos
            const mealsWithFoods = await Promise.all(
              meals.map(async (meal: any) => {
                const { data: foods, error: foodsError } = await supabase
                  .from('diet_foods')
                  .select('*')
                  .eq('meal_id', meal.id)
                  .order('food_order', { ascending: true });

                if (foodsError) {
                  console.error(`Erro ao buscar alimentos da refeição ${meal.id}:`, foodsError);
                  return { ...meal, diet_foods: [] };
                }

                return { ...meal, diet_foods: foods || [] };
              })
            );

            plan.diet_meals = mealsWithFoods;
          } else {
            plan.diet_meals = [];
          }
        } else {
          // Se veio com relacionamentos, garantir que cada meal tenha diet_foods
          if (Array.isArray(plan.diet_meals)) {
            plan.diet_meals = plan.diet_meals.map((meal: any) => {
              if (!meal.diet_foods || !Array.isArray(meal.diet_foods)) {
                return { ...meal, diet_foods: [] };
              }
              return meal;
            });
          }
        }

        // Garantir que diet_guidelines seja array
        if (!plan.diet_guidelines) {
          plan.diet_guidelines = [];
        }

        return plan;
      })
    );

    return plansWithDetails;
  },

  // Buscar plano por ID
  async getById(planId: string) {
    // Tentar primeiro com relacionamentos aninhados do Supabase
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

    if (error) {
      console.error('Erro ao buscar plano com relacionamentos:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Plano não encontrado');
    }

    // Debug: verificar o que veio
    console.log('=== DEBUG getById ===');
    console.log('Plan ID:', planId);
    console.log('Plan data:', data);
    console.log('diet_meals:', data.diet_meals);
    console.log('diet_meals é array?', Array.isArray(data.diet_meals));
    console.log('diet_meals length:', Array.isArray(data.diet_meals) ? data.diet_meals.length : 'N/A');
    
    // Se diet_meals não veio ou está vazio, fazer fallback para busca separada
    if (!data.diet_meals || (Array.isArray(data.diet_meals) && data.diet_meals.length === 0)) {
      console.log('diet_meals vazio, fazendo busca separada...');
      
      // Primeiro, vamos verificar se há refeições com uma query mais simples
      // Isso ajuda a diagnosticar se é um problema de RLS
      const { data: allMeals, error: allMealsError } = await supabase
        .from('diet_meals')
        .select('id, diet_plan_id, meal_name')
        .limit(10);
      
      console.log('Todas as refeições (primeiras 10):', allMeals);
      console.log('Error todas refeições:', allMealsError);
      
      // Se houver erro de permissão, é problema de RLS
      if (allMealsError && (allMealsError.code === '42501' || allMealsError.message?.includes('permission'))) {
        console.error('❌ ERRO DE PERMISSÃO RLS! As políticas RLS estão bloqueando o acesso à tabela diet_meals');
        console.error('É necessário configurar políticas RLS no Supabase para permitir leitura anônima ou autenticada');
      }
      
      // Agora buscar as refeições deste plano específico
      const { data: meals, error: mealsError } = await supabase
        .from('diet_meals')
        .select('*')
        .eq('diet_plan_id', planId)
        .order('meal_order', { ascending: true });

      console.log('Meals buscados separadamente para planId:', planId);
      console.log('Meals:', meals);
      console.log('Meals error:', mealsError);
      console.log('Meals count:', meals?.length || 0);

      if (mealsError) {
        console.error('Erro ao buscar refeições:', mealsError);
        console.error('Detalhes do erro:', JSON.stringify(mealsError, null, 2));
        data.diet_meals = [];
      } else if (meals && meals.length > 0) {
        console.log(`Encontradas ${meals.length} refeições`);
        // Para cada refeição, buscar os alimentos
        const mealsWithFoods = await Promise.all(
          meals.map(async (meal: any) => {
            const { data: foods, error: foodsError } = await supabase
              .from('diet_foods')
              .select('*')
              .eq('meal_id', meal.id)
              .order('food_order', { ascending: true });

            console.log(`Foods para meal ${meal.id} (${meal.meal_name}):`, foods);
            console.log(`Foods error para meal ${meal.id}:`, foodsError);

            if (foodsError) {
              console.error(`Erro ao buscar alimentos da refeição ${meal.id}:`, foodsError);
              return { ...meal, diet_foods: [] };
            }

            return { ...meal, diet_foods: foods || [] };
          })
        );

        data.diet_meals = mealsWithFoods;
        console.log('Meals com foods:', mealsWithFoods);
      } else {
        console.log('Nenhuma refeição encontrada para este plano');
        data.diet_meals = [];
      }
    } else {
      // Se veio com relacionamentos, garantir que cada meal tenha diet_foods
      if (Array.isArray(data.diet_meals)) {
        data.diet_meals = data.diet_meals.map((meal: any) => {
          if (!meal.diet_foods || !Array.isArray(meal.diet_foods)) {
            return { ...meal, diet_foods: [] };
          }
          return meal;
        });
      }
    }

    // Garantir que diet_guidelines seja array
    if (!data.diet_guidelines) {
      data.diet_guidelines = [];
    }

    console.log('Resultado final:', data);
    console.log('==================');

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

