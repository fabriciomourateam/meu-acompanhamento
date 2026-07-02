import { calcularTotaisRefeicao } from '@/utils/diet-calculations';
import { ConfigService } from './config-service';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface DietPlanForPDF {
  name: string;
  diet_meals?: Array<{
    id?: string;
    meal_name: string;
    meal_order: number;
    suggested_time?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    parent_meal_id?: string | null;
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fats?: number | null;
    instructions?: string | null;
    diet_foods?: Array<{
      food_name: string;
      quantity: number;
      unit: string;
      custom_unit_name?: string | null;
      custom_unit_grams?: number | null;
      calories?: number | null;
      protein?: number | null;
      carbs?: number | null;
      fats?: number | null;
      notes?: string | null;
      substitutions?: Array<{
        food_name: string;
        quantity?: number | null;
        unit?: string | null;
        custom_unit_name?: string | null;
        custom_unit_grams?: number | null;
        calories?: number | null;
      }> | null;
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

// Quantidade do alimento incluindo a gramatura da medida caseira (ex.: "2 unidade (220g)").
function fmtQty(food: any): string {
  const base = `${food.quantity} ${food.unit}`;
  const g = Number(food.custom_unit_grams) || 0;
  const isBase = /^(g|gramas?|ml|mililitros?)$/i.test(String(food.unit || '').trim());
  if (g > 0 && !isBase && food.quantity != null) return `${base} (${Math.round(food.quantity * g)}g)`;
  return base;
}

// Extrai as substituições lidando com os 2 formatos do banco:
//  - food.substitutions: jsonb array (formato nativo)
//  - food.notes = '{"substitutions":[...]}' (legado de import WebDiet) — sem
//    tratar, isso vinha como "código" cru no PDF.
// Retorna { subs, notes } com notes só se for texto real (sem o JSON).
function extractSubs(food: any): { subs: any[]; notes: string | null } {
  let subs: any[] = Array.isArray(food.substitutions) ? food.substitutions : [];
  let notes: string | null = (food.notes && String(food.notes).trim()) || null;
  if (notes && notes.startsWith('{') && notes.includes('substitutions')) {
    try {
      const parsed = JSON.parse(notes);
      if (parsed && Array.isArray(parsed.substitutions)) {
        if (subs.length === 0) subs = parsed.substitutions;
        notes = (typeof parsed.notes === 'string' && parsed.notes.trim()) ? parsed.notes.trim() : null;
      }
    } catch { /* não é JSON — mantém como texto */ }
  }
  return { subs, notes };
}

// Linha de substituições (nome + quantidade, sem macros pra ficar limpo).
function subsLineHtml(subs: any[]): string {
  if (!subs || subs.length === 0) return '';
  const items = subs.map((s: any) => {
    const q = s.quantity != null ? `${s.quantity} ${s.unit || ''}`.trim() : '';
    return `${q ? q + ' de ' : ''}${s.food_name}`;
  }).join(' · ');
  return `<div style="margin:6px 0 0 20px;font-size:12px;color:#64748b;line-height:1.5;"><span style="color:#d97706;font-weight:600;">🔁 Pode substituir por:</span> ${items}</div>`;
}

// Card de 1 alimento (tema claro): nome + quantidade (+medida), observação e
// substituições. SEM macros por alimento (a pedido do dono).
function foodCardHtml(food: any): string {
  const { subs, notes } = extractSubs(food);
  return `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:12px;min-width:0;">
        <div style="width:8px;height:8px;border-radius:50%;background:#10b981;flex-shrink:0;"></div>
        <span style="font-size:15px;font-weight:600;color:#1e293b;">${food.food_name}</span>
        <span style="font-size:14px;color:#64748b;">• ${fmtQty(food)}</span>
      </div>
      ${notes ? `<div style="margin:6px 0 0 20px;font-size:12px;color:#64748b;font-style:italic;">📝 ${notes}</div>` : ''}
      ${subsLineHtml(subs)}
    </div>`;
}

// "⏰ 21:00–22:00" (ou só o início). Usa start_time/end_time; fallback suggested_time.
function mealTimeLabel(meal: any): string {
  const start = meal.start_time || meal.suggested_time || null;
  const end = meal.end_time || null;
  if (!start && !end) return '';
  const txt = end && end !== start ? `${start || ''}–${end}` : (start || end);
  return `⏰ ${txt}`;
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
    // Refeições principais (parent_meal_id == null) e opções agrupadas por pai.
    const allMeals = (plan.diet_meals || []).slice().sort((a: any, b: any) => (a.meal_order || 0) - (b.meal_order || 0));
    const mainMeals = allMeals.filter((m: any) => !m.parent_meal_id);
    const optionsByParent = new Map<string, any[]>();
    for (const m of allMeals) {
      if (m.parent_meal_id) {
        const arr = optionsByParent.get(m.parent_meal_id) || [];
        arr.push(m);
        optionsByParent.set(m.parent_meal_id, arr);
      }
    }

    // Totais somam SÓ as principais — a opção é substituta, não dupla-conta.
    const mainTotals = mainMeals.reduce((acc: any, m: any) => {
      if (m.calories || m.protein || m.carbs || m.fats) {
        acc.cal += m.calories || 0; acc.p += m.protein || 0; acc.c += m.carbs || 0; acc.g += m.fats || 0;
      } else {
        (m.diet_foods || []).forEach((f: any) => { acc.cal += f.calories || 0; acc.p += f.protein || 0; acc.c += f.carbs || 0; acc.g += f.fats || 0; });
      }
      return acc;
    }, { cal: 0, p: 0, c: 0, g: 0 });
    const totalCalories = Math.round(mainTotals.cal);
    const totalProtein = Math.round(mainTotals.p * 10) / 10;
    const totalCarbs = Math.round(mainTotals.c * 10) / 10;
    const totalFats = Math.round(mainTotals.g * 10) / 10;
    const totalMacroGrams = totalProtein + totalCarbs + totalFats;
    const proteinPercent = totalMacroGrams > 0 ? Math.round((totalProtein / totalMacroGrams) * 100) : 0;
    const carbsPercent = totalMacroGrams > 0 ? Math.round((totalCarbs / totalMacroGrams) * 100) : 0;
    const fatsPercent = totalMacroGrams > 0 ? Math.round((totalFats / totalMacroGrams) * 100) : 0;

    const renderMeal = (meal: any, isOption: boolean): string => {
      const mealTotals = calcularTotaisRefeicao(meal);
      const emoji = getMealEmoji(meal.meal_name);
      const foodsHtml = meal.diet_foods && meal.diet_foods.length > 0
        ? meal.diet_foods.map((food: any) => foodCardHtml(food)).join('')
        : '<div style="color:#64748b;padding:12px;text-align:center;">Nenhum alimento</div>';
      const instructionsHtml = meal.instructions ? `
        <div style="background:rgba(245,158,11,0.1);border-left:4px solid #f59e0b;padding:14px 16px;margin-top:16px;border-radius:0 10px 10px 0;">
          <div style="font-size:13px;font-weight:700;color:#b45309;margin-bottom:6px;">💡 Instruções</div>
          <div style="font-size:14px;color:#92400e;line-height:1.6;">${meal.instructions}</div>
        </div>` : '';
      const macrosHtml = showMacrosPerMeal ? `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;padding:12px;background:#f8fafc;border-radius:12px;">
          <div style="text-align:center;"><div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:2px;">Calorias</div><div style="font-size:16px;font-weight:700;color:#ef4444;">${mealTotals.calorias}</div></div>
          <div style="text-align:center;"><div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:2px;">Proteínas</div><div style="font-size:16px;font-weight:700;color:#10b981;">${mealTotals.proteinas}g</div></div>
          <div style="text-align:center;"><div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:2px;">Carbos</div><div style="font-size:16px;font-weight:700;color:#3b82f6;">${mealTotals.carboidratos}g</div></div>
          <div style="text-align:center;"><div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:2px;">Gorduras</div><div style="font-size:16px;font-weight:700;color:#f97316;">${mealTotals.gorduras}g</div></div>
        </div>` : '';
      const time = mealTimeLabel(meal);

      // Refeição-OPÇÃO: aninhada, badge e a semântica "ou".
      if (isOption) {
        return `
          <div style="margin-top:12px;border:1px dashed #f59e0b;border-radius:12px;padding:16px;background:rgba(245,158,11,0.07);">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
              <span style="background:rgba(245,158,11,0.18);color:#b45309;padding:3px 10px;border-radius:8px;font-size:11px;font-weight:700;">🔁 OPÇÃO</span>
              <span style="font-size:16px;font-weight:700;color:#b45309;">${meal.meal_name}</span>
              <span style="font-size:11px;color:#64748b;font-style:italic;">— coma a principal OU esta opção</span>
            </div>
            ${macrosHtml}
            <div style="display:flex;flex-direction:column;gap:8px;">${foodsHtml}</div>
            ${instructionsHtml}
          </div>`;
      }

      const options = (meal.id ? optionsByParent.get(meal.id) : null) || [];
      const optionsHtml = options.map((o: any) => renderMeal(o, true)).join('');
      return `
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;page-break-inside:avoid;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #e2e8f0;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:28px;">${emoji}</span>
              <span style="font-size:20px;font-weight:700;color:#0f172a;">${meal.meal_name}</span>
            </div>
            ${time ? `<span style="background:rgba(99,102,241,0.15);color:#4f46e5;padding:6px 12px;border-radius:20px;font-size:13px;font-weight:500;border:1px solid rgba(99,102,241,0.3);">${time}</span>` : ''}
          </div>
          ${macrosHtml}
          <div style="display:flex;flex-direction:column;gap:8px;">${foodsHtml}</div>
          ${instructionsHtml}
          ${optionsHtml}
        </div>`;
    };

    const mealsHtml = mainMeals.length > 0
      ? mainMeals.map((m: any) => renderMeal(m, false)).join('')
      : '<div style="color:#64748b;padding:24px;text-align:center;">Nenhuma refeição cadastrada</div>';

    // Separa SUPLEMENTAÇÃO das demais orientações (por guideline_type).
    const isSupplement = (g: any) => /suplement/i.test(String(g.guideline_type || '') + ' ' + String(g.title || ''));
    const guidelineCard = (g: any) => `
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:12px;">
        <div style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:10px;">${g.title}</div>
        <div style="font-size:14px;color:#64748b;line-height:1.7;">${g.content}</div>
      </div>`;
    const guidelineSection = (titulo: string, icon: string, items: any[]) => items.length === 0 ? '' : `
      <div style="margin:32px 32px 0 32px;padding-top:24px;border-top:2px solid #e2e8f0;">
        <div style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:16px;display:flex;align-items:center;gap:10px;">${icon} ${titulo}</div>
        ${items.map(guidelineCard).join('')}
      </div>`;
    const allGuidelines = plan.diet_guidelines || [];
    const guidelinesHtml =
      guidelineSection('Orientações Nutricionais', '📚', allGuidelines.filter((g: any) => !isSupplement(g)))
      + guidelineSection('Suplementação', '💊', allGuidelines.filter((g: any) => isSupplement(g)));

    const htmlContent = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Inter','Segoe UI','Arial',sans-serif;color:#0f172a;background:#f8fafc;padding:48px 64px;line-height:1.5;overflow-x:hidden;}img,table{max-width:100%;}table{table-layout:fixed;}p,div,span,li,td{overflow-wrap:break-word;word-break:break-word;}</style></head><body>
      <!-- NOVO GERADOR PREMIUM V3.0 - DEZEMBRO 2024 -->
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin-bottom:32px;">
        <div style="display:flex;align-items:center;gap:20px;">
          <div style="width:72px;height:72px;border-radius:50%;background:rgba(16,185,129,0.2);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:bold;color:#10b981;border:3px solid rgba(16,185,129,0.3);">${patient.nome?.charAt(0) || 'P'}</div>
          <div style="flex:1;">
            <div style="font-size:28px;font-weight:700;color:#0f172a;margin-bottom:8px;">🥗 Plano Alimentar</div>
            <div style="display:inline-block;background:rgba(16,185,129,0.15);color:#10b981;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:600;border:1px solid rgba(16,185,129,0.3);">${patient.nome}</div>
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin:0 32px 32px 32px;">
        <div style="border-radius:16px;padding:20px;border:1px solid #e2e8f0;background:rgba(239,68,68,0.15);position:relative;overflow:hidden;border-top:3px solid #ef4444;">
          <div style="font-size:24px;margin-bottom:8px;">🔥</div>
          <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Calorias</div>
          <div style="font-size:32px;font-weight:700;color:#0f172a;">${totalCalories}<span style="font-size:14px;color:#64748b;margin-left:4px;">kcal</span></div>
        </div>
        <div style="border-radius:16px;padding:20px;border:1px solid #e2e8f0;background:rgba(16,185,129,0.15);position:relative;overflow:hidden;border-top:3px solid #10b981;">
          <div style="font-size:24px;margin-bottom:8px;">💪</div>
          <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Proteínas</div>
          <div style="font-size:32px;font-weight:700;color:#0f172a;">${totalProtein}<span style="font-size:14px;color:#64748b;margin-left:4px;">g</span></div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">${proteinPercent}% dos macros</div>
        </div>
        <div style="border-radius:16px;padding:20px;border:1px solid #e2e8f0;background:rgba(59,130,246,0.15);position:relative;overflow:hidden;border-top:3px solid #3b82f6;">
          <div style="font-size:24px;margin-bottom:8px;">⚡</div>
          <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Carboidratos</div>
          <div style="font-size:32px;font-weight:700;color:#0f172a;">${totalCarbs}<span style="font-size:14px;color:#64748b;margin-left:4px;">g</span></div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">${carbsPercent}% dos macros</div>
        </div>
        <div style="border-radius:16px;padding:20px;border:1px solid #e2e8f0;background:rgba(249,115,22,0.15);position:relative;overflow:hidden;border-top:3px solid #f97316;">
          <div style="font-size:24px;margin-bottom:8px;">🥑</div>
          <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Gorduras</div>
          <div style="font-size:32px;font-weight:700;color:#0f172a;">${totalFats}<span style="font-size:14px;color:#64748b;margin-left:4px;">g</span></div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">${fatsPercent}% dos macros</div>
        </div>
      </div>
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;margin:0 32px 32px 32px;">
        <div style="font-size:14px;color:#64748b;margin-bottom:12px;font-weight:600;">📊 Distribuição de Macronutrientes</div>
        <div style="height:24px;border-radius:12px;overflow:hidden;display:flex;background:#f8fafc;">
          <div style="background:#10b981;width:${proteinPercent}%;"></div>
          <div style="background:#3b82f6;width:${carbsPercent}%;"></div>
          <div style="background:#f97316;width:${fatsPercent}%;"></div>
        </div>
        <div style="display:flex;justify-content:center;gap:24px;margin-top:12px;">
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#64748b;"><div style="width:12px;height:12px;border-radius:50%;background:#10b981;"></div>Proteínas ${proteinPercent}%</div>
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#64748b;"><div style="width:12px;height:12px;border-radius:50%;background:#3b82f6;"></div>Carboidratos ${carbsPercent}%</div>
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#64748b;"><div style="width:12px;height:12px;border-radius:50%;background:#f97316;"></div>Gorduras ${fatsPercent}%</div>
        </div>
      </div>
      <div style="margin:0 32px 32px 32px;">
        <div style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:20px;display:flex;align-items:center;gap:10px;">🍽️ Refeições do Dia</div>
        <div style="display:flex;flex-direction:column;gap:20px;">${mealsHtml}</div>
      </div>
      ${guidelinesHtml}
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;">
        <div style="font-size:12px;color:#64748b;">${branding.footer_text || branding.company_name || 'Plano Alimentar Personalizado'}</div>
        <div style="font-size:11px;color:#475569;margin-top:4px;">Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      </div>
    </body></html>`;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.width = '900px';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.overflowX = 'hidden';
    document.body.appendChild(tempDiv);

    try {
      console.log('📸 Iniciando captura com html2canvas...');
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc',
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