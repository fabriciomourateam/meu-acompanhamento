import { calcularTotaisPlano, calcularTotaisRefeicao } from '@/utils/diet-calculations';
import { ConfigService } from './config-service';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface DietPlanForPDF {
  name: string;
  diet_meals?: Array<{
    meal_name: string;
    meal_order: number;
    suggested_time?: string | null;
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fats?: number | null;
    instructions?: string | null;
    diet_foods?: Array<{
      food_name: string;
      quantity: number;
      unit: string;
      calories?: number | null;
      protein?: number | null;
      carbs?: number | null;
      fats?: number | null;
      notes?: string | null;
    }>;
  }>;
  diet_guidelines?: Array<{
    guideline_type: string;
    title: string;
    content: string;
  }>;
  total_calories?: number | null;
  total_protein?: number | null;
  total_carbs?: number | null;
  total_fats?: number | null;
}

export interface PatientForPDF {
  nome: string;
  objetivo?: string;
  [key: string]: any;
}

export type PDFTheme = 'light' | 'dark';

// Premium Diet PDF Generator v3.0 - NOVO GERADOR PREMIUM
function getMealEmoji(mealName: string): string {
  console.log('🍽️ NOVO GERADOR - getMealEmoji chamada para:', mealName);
  const name = mealName.toLowerCase();
  if (name.includes('café') || name.includes('desjejum') || name.includes('manhã')) return '☕';
  if (name.includes('lanche') && name.includes('manhã')) return '🍎';
  if (name.includes('almoço')) return '🍽️';
  if (name.includes('lanche') && name.includes('tarde')) return '🥤';
  if (name.includes('jantar')) return '🌙';
  if (name.includes('ceia')) return '🌜';
  if (name.includes('pré') && name.includes('treino')) return '💪';
  if (name.includes('pós') && name.includes('treino')) return '🏋️';
  if (name.includes('lanche')) return '🍌';
  return '🍴';
}

export class DietPremiumPDFGenerator {
  static async generatePremiumPDF(
    plan: DietPlanForPDF,
    patient: PatientForPDF,
    options: { theme?: PDFTheme; showMacrosPerMeal?: boolean; } = {}
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log('🚀🚀🚀 NOVO GERADOR PREMIUM V3.0 - DEZEMBRO 2024 🚀🚀🚀', { plan, patient, timestamp });
    console.log('✨ ESTE É O NOVO GERADOR PREMIUM - SEM CACHE!');
    console.log('🎯 Timestamp:', timestamp);
    
    const { showMacrosPerMeal = true } = options;
    const branding = await ConfigService.getPDFBrandingConfig();
    const totais = calcularTotaisPlano(plan as any);
    const totalCalories = plan.total_calories || totais.calorias;
    const totalProtein = plan.total_protein || totais.proteinas;
    const totalCarbs = plan.total_carbs || totais.carboidratos;
    const totalFats = plan.total_fats || totais.gorduras;
    const totalMacroGrams = totalProtein + totalCarbs + totalFats;
    const proteinPercent = totalMacroGrams > 0 ? Math.round((totalProtein / totalMacroGrams) * 100) : 0;
    const carbsPercent = totalMacroGrams > 0 ? Math.round((totalCarbs / totalMacroGrams) * 100) : 0;
    const fatsPercent = totalMacroGrams > 0 ? Math.round((totalFats / totalMacroGrams) * 100) : 0;

    const mealsHtml = plan.diet_meals && plan.diet_meals.length > 0 
      ? plan.diet_meals.sort((a, b) => (a.meal_order || 0) - (b.meal_order || 0)).map((meal: any) => {
          const mealTotals = calcularTotaisRefeicao(meal);
          const emoji = getMealEmoji(meal.meal_name);
          const foodsHtml = meal.diet_foods && meal.diet_foods.length > 0 
            ? meal.diet_foods.map((food: any) => `
              <div style="background:rgba(15,23,42,0.5);border:1px solid rgba(71,85,105,0.3);border-radius:10px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:12px;">
                  <div style="width:8px;height:8px;border-radius:50%;background:#10b981;"></div>
                  <span style="font-size:15px;font-weight:600;color:#e2e8f0;">${food.food_name}</span>
                  <span style="font-size:14px;color:#64748b;">• ${food.quantity} ${food.unit}</span>
                </div>
                ${food.calories ? `<span style="background:rgba(71,85,105,0.3);color:#94a3b8;padding:4px 8px;border-radius:12px;font-size:12px;font-weight:600;border:1px solid rgba(71,85,105,0.4);">${food.calories} kcal</span>` : ''}
              </div>
            `).join('') 
            : '<div style="color:#64748b;padding:12px;text-align:center;">Nenhum alimento</div>';
          
          const instructionsHtml = meal.instructions ? `
            <div style="background:rgba(245,158,11,0.1);border-left:4px solid #f59e0b;padding:14px 16px;margin-top:16px;border-radius:0 10px 10px 0;">
              <div style="font-size:13px;font-weight:700;color:#fbbf24;margin-bottom:6px;">💡 Instruções</div>
              <div style="font-size:14px;color:#fcd34d;line-height:1.6;">${meal.instructions}</div>
            </div>
          ` : '';

          const macrosHtml = showMacrosPerMeal ? `
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;padding:12px;background:rgba(15,23,42,0.5);border-radius:12px;">
              <div style="text-align:center;"><div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:2px;">Calorias</div><div style="font-size:16px;font-weight:700;color:#ef4444;">${mealTotals.calorias}</div></div>
              <div style="text-align:center;"><div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:2px;">Proteínas</div><div style="font-size:16px;font-weight:700;color:#10b981;">${mealTotals.proteinas}g</div></div>
              <div style="text-align:center;"><div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:2px;">Carbos</div><div style="font-size:16px;font-weight:700;color:#3b82f6;">${mealTotals.carboidratos}g</div></div>
              <div style="text-align:center;"><div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:2px;">Gorduras</div><div style="font-size:16px;font-weight:700;color:#f97316;">${mealTotals.gorduras}g</div></div>
            </div>
          ` : '';

          return `
            <div style="background:rgba(30,41,59,0.6);border:1px solid rgba(71,85,105,0.5);border-radius:16px;padding:24px;page-break-inside:avoid;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(71,85,105,0.5);">
                <div style="display:flex;align-items:center;gap:12px;">
                  <span style="font-size:28px;">${emoji}</span>
                  <span style="font-size:20px;font-weight:700;color:#ffffff;">${meal.meal_name}</span>
                </div>
                ${meal.suggested_time ? `<span style="background:rgba(99,102,241,0.15);color:#a5b4fc;padding:6px 12px;border-radius:20px;font-size:13px;font-weight:500;border:1px solid rgba(99,102,241,0.3);">⏰ ${meal.suggested_time}</span>` : ''}
              </div>
              ${macrosHtml}
              <div style="display:flex;flex-direction:column;gap:8px;">${foodsHtml}</div>
              ${instructionsHtml}
            </div>
          `;
        }).join('') 
      : '<div style="color:#64748b;padding:24px;text-align:center;">Nenhuma refeição cadastrada</div>';

    const guidelinesHtml = plan.diet_guidelines && plan.diet_guidelines.length > 0 ? `
      <div style="margin:32px 32px 0 32px;padding-top:24px;border-top:2px solid rgba(71,85,105,0.5);">
        <div style="font-size:20px;font-weight:700;color:#ffffff;margin-bottom:16px;display:flex;align-items:center;gap:10px;">📚 Orientações Nutricionais</div>
        ${plan.diet_guidelines.map((g: any) => `
          <div style="background:rgba(30,41,59,0.6);border:1px solid rgba(71,85,105,0.5);border-radius:12px;padding:20px;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
              <span style="background:rgba(16,185,129,0.15);color:#10b981;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;text-transform:uppercase;">${g.guideline_type}</span>
              <span style="font-size:16px;font-weight:700;color:#ffffff;">${g.title}</span>
            </div>
            <div style="font-size:14px;color:#94a3b8;line-height:1.7;">${g.content}</div>
          </div>
        `).join('')}
      </div>
    ` : '';

    const htmlContent = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Inter','Segoe UI','Arial',sans-serif;color:#f1f5f9;background:#0f172a;padding:48px 64px;line-height:1.5;}</style></head><body>
      <!-- NOVO GERADOR PREMIUM V3.0 - DEZEMBRO 2024 -->
      <div style="background:rgba(30,41,59,0.8);border:1px solid rgba(71,85,105,0.5);border-radius:16px;padding:24px;margin-bottom:32px;">
        <div style="display:flex;align-items:center;gap:20px;">
          <div style="width:72px;height:72px;border-radius:50%;background:rgba(16,185,129,0.2);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:bold;color:#10b981;border:3px solid rgba(16,185,129,0.3);">${patient.nome?.charAt(0) || 'P'}</div>
          <div style="flex:1;">
            <div style="font-size:28px;font-weight:700;color:#ffffff;margin-bottom:8px;">🥗 Plano Alimentar</div>
            <div style="display:inline-block;background:rgba(16,185,129,0.15);color:#10b981;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:600;border:1px solid rgba(16,185,129,0.3);">${patient.nome}</div>
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin:0 32px 32px 32px;">
        <div style="border-radius:16px;padding:20px;border:1px solid rgba(71,85,105,0.5);background:rgba(239,68,68,0.15);position:relative;overflow:hidden;border-top:3px solid #ef4444;">
          <div style="font-size:24px;margin-bottom:8px;">🔥</div>
          <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Calorias</div>
          <div style="font-size:32px;font-weight:700;color:#ffffff;">${totalCalories}<span style="font-size:14px;color:#94a3b8;margin-left:4px;">kcal</span></div>
        </div>
        <div style="border-radius:16px;padding:20px;border:1px solid rgba(71,85,105,0.5);background:rgba(16,185,129,0.15);position:relative;overflow:hidden;border-top:3px solid #10b981;">
          <div style="font-size:24px;margin-bottom:8px;">💪</div>
          <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Proteínas</div>
          <div style="font-size:32px;font-weight:700;color:#ffffff;">${totalProtein}<span style="font-size:14px;color:#94a3b8;margin-left:4px;">g</span></div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">${proteinPercent}% dos macros</div>
        </div>
        <div style="border-radius:16px;padding:20px;border:1px solid rgba(71,85,105,0.5);background:rgba(59,130,246,0.15);position:relative;overflow:hidden;border-top:3px solid #3b82f6;">
          <div style="font-size:24px;margin-bottom:8px;">⚡</div>
          <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Carboidratos</div>
          <div style="font-size:32px;font-weight:700;color:#ffffff;">${totalCarbs}<span style="font-size:14px;color:#94a3b8;margin-left:4px;">g</span></div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">${carbsPercent}% dos macros</div>
        </div>
        <div style="border-radius:16px;padding:20px;border:1px solid rgba(71,85,105,0.5);background:rgba(249,115,22,0.15);position:relative;overflow:hidden;border-top:3px solid #f97316;">
          <div style="font-size:24px;margin-bottom:8px;">🥑</div>
          <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Gorduras</div>
          <div style="font-size:32px;font-weight:700;color:#ffffff;">${totalFats}<span style="font-size:14px;color:#94a3b8;margin-left:4px;">g</span></div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">${fatsPercent}% dos macros</div>
        </div>
      </div>
      <div style="background:rgba(30,41,59,0.6);border:1px solid rgba(71,85,105,0.5);border-radius:16px;padding:20px;margin:0 32px 32px 32px;">
        <div style="font-size:14px;color:#94a3b8;margin-bottom:12px;font-weight:600;">📊 Distribuição de Macronutrientes</div>
        <div style="height:24px;border-radius:12px;overflow:hidden;display:flex;background:rgba(15,23,42,0.5);">
          <div style="background:#10b981;width:${proteinPercent}%;"></div>
          <div style="background:#3b82f6;width:${carbsPercent}%;"></div>
          <div style="background:#f97316;width:${fatsPercent}%;"></div>
        </div>
        <div style="display:flex;justify-content:center;gap:24px;margin-top:12px;">
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#94a3b8;"><div style="width:12px;height:12px;border-radius:50%;background:#10b981;"></div>Proteínas ${proteinPercent}%</div>
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#94a3b8;"><div style="width:12px;height:12px;border-radius:50%;background:#3b82f6;"></div>Carboidratos ${carbsPercent}%</div>
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#94a3b8;"><div style="width:12px;height:12px;border-radius:50%;background:#f97316;"></div>Gorduras ${fatsPercent}%</div>
        </div>
      </div>
      <div style="margin:0 32px 32px 32px;">
        <div style="font-size:20px;font-weight:700;color:#ffffff;margin-bottom:20px;display:flex;align-items:center;gap:10px;">🍽️ Refeições do Dia</div>
        <div style="display:flex;flex-direction:column;gap:20px;">${mealsHtml}</div>
      </div>
      ${guidelinesHtml}
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid rgba(71,85,105,0.5);text-align:center;">
        <div style="font-size:12px;color:#64748b;">${branding.footer_text || branding.company_name || 'Plano Alimentar Personalizado'}</div>
        <div style="font-size:11px;color:#475569;margin-top:4px;">Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      </div>
    </body></html>`;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.width = '900px';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    try {
      console.log('📸 Iniciando captura com html2canvas...');
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0f172a',
        windowWidth: 900,
        windowHeight: tempDiv.scrollHeight,
      });
      
      console.log('✅ Canvas gerado com sucesso!');
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdfWidth = 210;
      const imgHeightMM = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, imgHeightMM] });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMM, undefined, 'FAST');
      
      const fileName = `plano-premium-${patient.nome.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('💾 Salvando PDF:', fileName);
      pdf.save(fileName);
      
      console.log('🎉 PDF Premium gerado com sucesso!');
    } finally {
      document.body.removeChild(tempDiv);
    }
  }
}