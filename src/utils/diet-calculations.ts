/**
 * Calcula os totais de macros de um plano alimentar baseado nas refeições e alimentos
 */
export function calcularTotaisPlano(plan: any): {
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
} {
  if (!plan || !plan.diet_meals) {
    return { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 };
  }

  const totais = plan.diet_meals.reduce(
    (acc: any, meal: any) => {
      // Se a refeição tiver macros calculados, usar eles
      if (meal.calories || meal.protein || meal.carbs || meal.fats) {
        acc.calorias += meal.calories || 0;
        acc.proteinas += meal.protein || 0;
        acc.carboidratos += meal.carbs || 0;
        acc.gorduras += meal.fats || 0;
      } else if (meal.diet_foods && meal.diet_foods.length > 0) {
        // Caso contrário, calcular baseado nos alimentos
        meal.diet_foods.forEach((food: any) => {
          acc.calorias += food.calories || 0;
          acc.proteinas += food.protein || 0;
          acc.carboidratos += food.carbs || 0;
          acc.gorduras += food.fats || 0;
        });
      }
      return acc;
    },
    { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
  );

  return {
    calorias: Math.round(totais.calorias),
    proteinas: Math.round(totais.proteinas * 10) / 10,
    carboidratos: Math.round(totais.carboidratos * 10) / 10,
    gorduras: Math.round(totais.gorduras * 10) / 10,
  };
}

/**
 * Calcula os totais de uma refeição baseado nos alimentos
 */
export function calcularTotaisRefeicao(meal: any): {
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
} {
  if (!meal || !meal.diet_foods || meal.diet_foods.length === 0) {
    return { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 };
  }

  const totais = meal.diet_foods.reduce(
    (acc: any, food: any) => ({
      calorias: acc.calorias + (food.calories || 0),
      proteinas: acc.proteinas + (food.protein || 0),
      carboidratos: acc.carboidratos + (food.carbs || 0),
      gorduras: acc.gorduras + (food.fats || 0),
    }),
    { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
  );

  return {
    calorias: Math.round(totais.calorias),
    proteinas: Math.round(totais.proteinas * 10) / 10,
    carboidratos: Math.round(totais.carboidratos * 10) / 10,
    gorduras: Math.round(totais.gorduras * 10) / 10,
  };
}


