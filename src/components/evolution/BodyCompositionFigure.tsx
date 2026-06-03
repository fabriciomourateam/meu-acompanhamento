// "Mapa de Distribuição de Gordura Corporal" (boneco) — replica o do MyShape, em
// tema claro. Silhueta frente+costas com cada região colorida por faixa e o valor
// escrito dentro. Dados: body_composition.distribuicao_regional (escala 1–10).
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type Scores = Record<string, number>;

// Faixas (mesma escala do MyShape)
function bucket(score: number | null | undefined): { fill: string } {
  if (score == null || Number.isNaN(score)) return { fill: '#e2e8f0' };
  if (score <= 2) return { fill: '#3b82f6' }; // Mínima
  if (score <= 4) return { fill: '#22c55e' }; // Baixa
  if (score <= 6) return { fill: '#eab308' }; // Moderada
  if (score <= 8) return { fill: '#f97316' }; // Alta
  return { fill: '#ef4444' }; // Muito Alta
}

const SCALE = [
  { range: '1–2', label: 'Mínima', color: '#3b82f6' },
  { range: '3–4', label: 'Baixa', color: '#22c55e' },
  { range: '5–6', label: 'Moderada', color: '#eab308' },
  { range: '7–8', label: 'Alta', color: '#f97316' },
  { range: '9–10', label: 'Muito Alta', color: '#ef4444' },
];

interface Region { key: string; x: number; y: number; w: number; h: number }

// Braços + pernas (iguais nas duas vistas)
const LIMBS: Region[] = [
  { key: 'braco_esq', x: 24, y: 44, w: 11, h: 58 },
  { key: 'braco_dir', x: 85, y: 44, w: 11, h: 58 },
  { key: 'coxa_esq', x: 40, y: 118, w: 17, h: 44 },
  { key: 'coxa_dir', x: 63, y: 118, w: 17, h: 44 },
  { key: 'panturrilha', x: 41, y: 168, w: 15, h: 46 },
  { key: 'panturrilha', x: 64, y: 168, w: 15, h: 46 },
];

const FRONT: Region[] = [
  { key: 'peitoral', x: 37, y: 42, w: 46, h: 22 },
  { key: 'flancos', x: 33, y: 66, w: 9, h: 32 },
  { key: 'flancos', x: 78, y: 66, w: 9, h: 32 },
  { key: 'abdomen_superior', x: 43, y: 66, w: 34, h: 15 },
  { key: 'abdomen_inferior', x: 43, y: 82, w: 34, h: 16 },
];

const BACK: Region[] = [
  { key: 'costas_superior', x: 37, y: 42, w: 46, h: 26 },
  { key: 'costas_inferior', x: 40, y: 70, w: 40, h: 22 },
  { key: 'quadril_gluteos', x: 40, y: 94, w: 40, h: 20 },
];

const LABEL: Record<string, string> = {
  peitoral: 'Peitoral', abdomen_superior: 'Abdômen superior', abdomen_inferior: 'Abdômen inferior',
  flancos: 'Flancos', braco_esq: 'Braço esq.', braco_dir: 'Braço dir.', coxa_esq: 'Coxa esq.',
  coxa_dir: 'Coxa dir.', panturrilha: 'Panturrilha', costas_superior: 'Costas superior',
  costas_inferior: 'Costas inferior', quadril_gluteos: 'Quadril/Glúteos',
};

function RegionShape({ r, score }: { r: Region; score?: number | null }) {
  const { fill } = bucket(score);
  return (
    <g>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={Math.min(7, r.w / 2)} fill={fill} stroke="#cbd5e1" strokeWidth={0.6}>
        <title>{LABEL[r.key] ?? r.key}{score != null ? `: ${score}` : ''}</title>
      </rect>
      {score != null && (
        <text x={r.x + r.w / 2} y={r.y + r.h / 2} textAnchor="middle" dominantBaseline="central"
          fontSize={r.w < 12 ? 6 : 7.5} fontWeight="700" fill="#fff">{score}</text>
      )}
    </g>
  );
}

function Figure({ regions, s }: { regions: Region[]; s: Scores }) {
  return (
    <svg viewBox="0 0 120 224" className="h-52 w-auto sm:h-56">
      {/* silhueta-fantasma (cabeça/pescoço/pelve/mãos/pés) */}
      <ellipse cx="60" cy="20" rx="12" ry="14" fill="#e2e8f0" />
      <rect x="54" y="32" width="12" height="9" rx="3" fill="#e2e8f0" />
      <rect x="41" y="100" width="38" height="16" rx="7" fill="#e2e8f0" />
      <circle cx="29" cy="106" r="4.5" fill="#e2e8f0" />
      <circle cx="91" cy="106" r="4.5" fill="#e2e8f0" />
      <rect x="42" y="214" width="14" height="6" rx="3" fill="#e2e8f0" />
      <rect x="64" y="214" width="14" height="6" rx="3" fill="#e2e8f0" />
      {LIMBS.map((r, i) => <RegionShape key={`l${i}`} r={r} score={s[r.key]} />)}
      {regions.map((r, i) => <RegionShape key={`r${i}`} r={r} score={s[r.key]} />)}
    </svg>
  );
}

export function BodyCompositionFigure({ data }: { data: any[] }) {
  const latest = (data || []).find((d) => d?.distribuicao_regional && typeof d.distribuicao_regional === 'object');
  const s: Scores | null = latest?.distribuicao_regional ?? null;
  if (!s || Object.keys(s).length === 0) return null;

  const parts: string[] = [];
  if (latest?.data_avaliacao) parts.push(new Date(latest.data_avaliacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }));
  if (latest?.percentual_gordura != null) parts.push(`${latest.percentual_gordura}% BF`);
  if (latest?.classificacao) parts.push(String(latest.classificacao));

  return (
    <Card className="bg-white border border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          🔥 Mapa de Distribuição de Gordura Corporal
        </CardTitle>
        {parts.length > 0 && <CardDescription className="text-slate-500">{parts.join(' • ')}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-center gap-4 sm:gap-8">
          <div className="text-center">
            <Figure regions={FRONT} s={s} />
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Frente</p>
          </div>
          <div className="text-center">
            <Figure regions={BACK} s={s} />
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Costas</p>
          </div>
        </div>

        {/* Escala de gordura regional */}
        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Escala de gordura regional</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {SCALE.map((b) => (
              <span key={b.range} className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: b.color }} />
                {b.range} — {b.label}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
