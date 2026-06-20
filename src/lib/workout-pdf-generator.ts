import { ConfigService } from './config-service';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Gerador de PDF do TREINO — espelha o visual do PDF de dieta (premium, tema
// claro). Sem RPE (a pedido do dono). Notas INTERNAS nunca entram aqui: a RPC
// get_workout_hub_by_token só expõe session.notes (as "Observações deste treino"
// que o aluno vê), não o internal_notes.

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export interface WorkoutExerciseForPDF {
  exercise_name: string;
  sets?: number | null;
  reps?: string | null;
  rest_seconds?: number | null;
  rest_seconds_max?: number | null;
  load_kg?: number | null;
  load_kg_per_set?: string | null;
  tempo?: string | null;
  superset_group?: string | null;
  notes?: string | null;
  warmup_sets?: number | null;
  warmup_reps?: string | null;
  muscle_group?: string | null;
  techniques?: Array<{ name?: string; emoji?: string | null; applies_to?: string | null }> | null;
}
export interface WorkoutSessionForPDF {
  id?: string;
  name: string;
  session_order?: number | null;
  day_of_week?: number | null;
  focus?: string | null;
  notes?: string | null;
  session_type?: string | null;
  exercises?: WorkoutExerciseForPDF[];
}
export interface WorkoutPlanForPDF {
  name?: string | null;
  goal?: string | null;
  frequency_per_week?: number | null;
  current_phase_label?: string | null;
  notes?: string | null;
}
export interface PrescribedCardioForPDF {
  modalidade?: string | null;
  intensidade?: string | null;
  dias_semana?: number[] | null;
  vezes_semana?: number | null;
  vezes_semana_max?: number | null;
  unidade?: string | null;
  tempo_padrao?: number | null;
  tempo_padrao_max?: number | null;
  observacoes?: string | null;
  opcoes?: Array<{ label?: string; descricao?: string }> | null;
}
export interface PatientForPDF { nome: string; [key: string]: any; }

function sessionEmoji(type?: string | null): string {
  if (type === 'cardio') return '🫀';
  if (type === 'mobility') return '🧘';
  if (type === 'guidelines') return '📌';
  return '🏋️';
}

// "4 × 12/10/10/8" (séries × reps). Tolera só séries ou só reps.
function setsReps(ex: WorkoutExerciseForPDF): string {
  const s = ex.sets != null && ex.sets > 0 ? String(ex.sets) : '';
  const r = ex.reps ? String(ex.reps) : '';
  if (s && r) return `${s} × ${r}`;
  return s ? `${s} série(s)` : (r || '—');
}
// "90–120s" ou "90s".
function rest(ex: WorkoutExerciseForPDF): string {
  const a = ex.rest_seconds;
  const b = ex.rest_seconds_max;
  if (a == null && b == null) return '';
  if (b != null && b !== a) return `${a ?? ''}–${b}s`;
  return `${a ?? b}s`;
}
// Carga: piramidal (load_kg_per_set) ou número único.
function load(ex: WorkoutExerciseForPDF): string {
  if (ex.load_kg_per_set) return `${ex.load_kg_per_set} kg`;
  if (ex.load_kg != null) return `${ex.load_kg} kg`;
  return '';
}
function techBadges(ex: WorkoutExerciseForPDF): string {
  const techs = Array.isArray(ex.techniques) ? ex.techniques : [];
  if (techs.length === 0) return '';
  return techs.map((t) => `<span style="background:rgba(139,92,246,0.12);color:#7c3aed;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:600;margin-left:6px;">${t.emoji ? t.emoji + ' ' : ''}${t.name ?? ''}</span>`).join('');
}

function exerciseCardHtml(ex: WorkoutExerciseForPDF, idx: number): string {
  const detalhe = [
    setsReps(ex) !== '—' ? `<b>Séries × Reps:</b> ${setsReps(ex)}` : '',
    rest(ex) ? `<b>Descanso:</b> ${rest(ex)}` : '',
    load(ex) ? `<b>Carga:</b> ${load(ex)}` : '',
    ex.tempo ? `<b>Tempo:</b> ${ex.tempo}` : '',
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');
  const warmup = (ex.warmup_sets && ex.warmup_sets > 0)
    ? `<div style="margin:4px 0 0 28px;font-size:11px;color:#d97706;">🔥 Aquecimento: ${ex.warmup_sets}×${ex.warmup_reps || '20-30'}</div>` : '';
  return `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span style="display:flex;height:22px;min-width:22px;align-items:center;justify-content:center;border-radius:6px;background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:700;">${idx}</span>
        <span style="font-size:15px;font-weight:600;color:#1e293b;">${ex.exercise_name}</span>
        ${ex.muscle_group ? `<span style="font-size:11px;color:#94a3b8;text-transform:uppercase;">${ex.muscle_group}</span>` : ''}
        ${ex.superset_group ? `<span style="background:rgba(14,165,233,0.12);color:#0284c7;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700;">Bi-set ${ex.superset_group}</span>` : ''}
        ${techBadges(ex)}
      </div>
      ${detalhe ? `<div style="margin:6px 0 0 28px;font-size:13px;color:#475569;">${detalhe}</div>` : ''}
      ${warmup}
      ${ex.notes ? `<div style="margin:4px 0 0 28px;font-size:12px;color:#64748b;font-style:italic;">📝 ${ex.notes}</div>` : ''}
    </div>`;
}

function sessionCardHtml(s: WorkoutSessionForPDF): string {
  const emoji = sessionEmoji(s.session_type);
  const dia = s.day_of_week != null && DAYS[s.day_of_week] ? DAYS[s.day_of_week] : null;
  const exs = s.exercises || [];
  const exercisesHtml = exs.length > 0
    ? exs.map((ex, i) => exerciseCardHtml(ex, i + 1)).join('')
    : '<div style="color:#64748b;padding:12px;text-align:center;">Nenhum exercício</div>';
  return `
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:28px;">${emoji}</span>
          <span style="font-size:20px;font-weight:700;color:#0f172a;">${s.name}</span>
          ${s.focus && s.focus.trim().toLowerCase() !== (s.name || '').trim().toLowerCase() ? `<span style="font-size:13px;color:#64748b;font-style:italic;">${s.focus}</span>` : ''}
        </div>
        ${dia ? `<span style="background:rgba(99,102,241,0.15);color:#4f46e5;padding:6px 12px;border-radius:20px;font-size:13px;font-weight:500;border:1px solid rgba(99,102,241,0.3);">📅 ${dia}</span>` : ''}
      </div>
      ${s.notes ? `<div style="background:rgba(245,158,11,0.1);border-left:4px solid #f59e0b;padding:14px 16px;margin-bottom:16px;border-radius:0 10px 10px 0;"><div style="font-size:13px;font-weight:700;color:#b45309;margin-bottom:6px;">📋 Observações deste treino</div><div style="font-size:14px;color:#92400e;line-height:1.6;">${s.notes}</div></div>` : ''}
      <div style="display:flex;flex-direction:column;gap:8px;">${exercisesHtml}</div>
    </div>`;
}

function cardioHtml(c: PrescribedCardioForPDF | null | undefined): string {
  if (!c) return '';
  const freq = c.dias_semana && c.dias_semana.length > 0
    ? c.dias_semana.map((d) => DAYS[d]?.slice(0, 3)).filter(Boolean).join(', ')
    : (c.vezes_semana ? `${c.vezes_semana}${c.vezes_semana_max ? '–' + c.vezes_semana_max : ''}x/semana` : '');
  const dur = c.tempo_padrao ? `${c.tempo_padrao}${c.tempo_padrao_max ? '–' + c.tempo_padrao_max : ''} ${c.unidade || 'min'}` : '';
  const linha = [c.modalidade, c.intensidade, freq, dur].filter(Boolean).join(' · ');
  const opcoes = (c.opcoes && c.opcoes.length > 0)
    ? `<div style="margin-top:8px;">${c.opcoes.map((o) => `<div style="font-size:13px;color:#475569;">• <b>${o.label || 'Opção'}:</b> ${o.descricao || ''}</div>`).join('')}</div>` : '';
  const obs = c.observacoes ? `<div style="margin-top:10px;font-size:13px;color:#475569;line-height:1.6;">${c.observacoes}</div>` : '';
  return `
    <div style="margin:32px 32px 0 32px;padding-top:24px;border-top:2px solid #e2e8f0;">
      <div style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:16px;display:flex;align-items:center;gap:10px;">🫀 Cardio Prescrito</div>
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
        ${linha ? `<div style="font-size:15px;font-weight:600;color:#0f172a;">${linha}</div>` : ''}
        ${opcoes}
        ${obs}
      </div>
    </div>`;
}

export class WorkoutPDFGenerator {
  static async generatePDF(
    data: { plan: WorkoutPlanForPDF; sessions: WorkoutSessionForPDF[]; cardio?: PrescribedCardioForPDF | null },
    patient: PatientForPDF,
  ): Promise<void> {
    const { plan, sessions, cardio } = data;
    const branding = await ConfigService.getPDFBrandingConfig();
    const totalExercises = sessions.reduce((acc, s) => acc + (s.exercises?.length || 0), 0);

    const sessionsHtml = sessions.length > 0
      ? sessions.map((s) => sessionCardHtml(s)).join('')
      : '<div style="color:#64748b;padding:24px;text-align:center;">Nenhum treino cadastrado</div>';

    const planNotesHtml = plan.notes ? `
      <div style="margin:32px 32px 0 32px;padding-top:24px;border-top:2px solid #e2e8f0;">
        <div style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:16px;display:flex;align-items:center;gap:10px;">📚 Orientações</div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;font-size:14px;color:#475569;line-height:1.7;">${plan.notes}</div>
      </div>` : '';

    const card = (icon: string, label: string, value: string, color: string) => `
      <div style="border-radius:16px;padding:20px;border:1px solid #e2e8f0;background:${color};border-top:3px solid ${color.replace('0.15', '1')};">
        <div style="font-size:24px;margin-bottom:8px;">${icon}</div>
        <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${label}</div>
        <div style="font-size:26px;font-weight:700;color:#0f172a;">${value}</div>
      </div>`;

    const htmlContent = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Inter','Segoe UI','Arial',sans-serif;color:#0f172a;background:#f8fafc;padding:48px 64px;line-height:1.5;}</style></head><body>
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin-bottom:32px;">
        <div style="display:flex;align-items:center;gap:20px;">
          <div style="width:72px;height:72px;border-radius:50%;background:rgba(59,130,246,0.18);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:bold;color:#2563eb;border:3px solid rgba(59,130,246,0.3);">${patient.nome?.charAt(0) || 'P'}</div>
          <div style="flex:1;">
            <div style="font-size:28px;font-weight:700;color:#0f172a;margin-bottom:8px;">🏋️ Plano de Treino</div>
            <div style="display:inline-block;background:rgba(59,130,246,0.12);color:#2563eb;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:600;border:1px solid rgba(59,130,246,0.3);">${patient.nome}</div>
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin:0 32px 32px 32px;">
        ${card('🎯', 'Objetivo', plan.goal || '—', 'rgba(16,185,129,0.15)')}
        ${card('📅', 'Frequência', plan.frequency_per_week ? `${plan.frequency_per_week}x<span style="font-size:13px;color:#64748b;">/sem</span>` : '—', 'rgba(99,102,241,0.15)')}
        ${card('💪', 'Treinos', String(sessions.length), 'rgba(59,130,246,0.15)')}
        ${card('🔁', 'Exercícios', String(totalExercises), 'rgba(249,115,22,0.15)')}
      </div>
      ${plan.current_phase_label ? `<div style="margin:0 32px 24px 32px;font-size:13px;color:#64748b;">Fase atual: <b style="color:#0f172a;">${plan.current_phase_label}</b></div>` : ''}
      <div style="margin:0 32px 32px 32px;">
        <div style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:20px;display:flex;align-items:center;gap:10px;">🗓️ Seus Treinos</div>
        <div style="display:flex;flex-direction:column;gap:20px;">${sessionsHtml}</div>
      </div>
      ${cardioHtml(cardio)}
      ${planNotesHtml}
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;">
        <div style="font-size:12px;color:#64748b;">${branding.footer_text || branding.company_name || 'Plano de Treino Personalizado'}</div>
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
      const canvas = await html2canvas(tempDiv, {
        scale: 2, useCORS: true, logging: false, backgroundColor: '#f8fafc',
        windowWidth: 900, windowHeight: tempDiv.scrollHeight,
      });
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdfWidth = 210;
      const imgHeightMM = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, imgHeightMM] });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMM, undefined, 'FAST');
      pdf.save(`plano-treino-${patient.nome.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      document.body.removeChild(tempDiv);
    }
  }
}
