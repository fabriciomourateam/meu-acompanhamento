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

interface Region { key: string; cx: number; cy: number; rx: number; ry: number }

// Braços + pernas (iguais nas duas vistas)
const LIMBS: Region[] = [
  { key: 'braco_esq', cx: 27, cy: 68, rx: 5, ry: 16 },
  { key: 'braco_dir', cx: 93, cy: 68, rx: 5, ry: 16 },
  { key: 'coxa_esq', cx: 48, cy: 144, rx: 8.5, ry: 21 },
  { key: 'coxa_dir', cx: 72, cy: 144, rx: 8.5, ry: 21 },
  { key: 'panturrilha', cx: 48, cy: 195, rx: 6.5, ry: 18 },
  { key: 'panturrilha', cx: 72, cy: 195, rx: 6.5, ry: 18 },
];

const FRONT: Region[] = [
  { key: 'peitoral', cx: 60, cy: 52, rx: 18, ry: 8.5 },
  { key: 'flancos', cx: 40, cy: 76, rx: 4.5, ry: 10 },
  { key: 'flancos', cx: 80, cy: 76, rx: 4.5, ry: 10 },
  { key: 'abdomen_superior', cx: 60, cy: 71, rx: 12, ry: 6 },
  { key: 'abdomen_inferior', cx: 60, cy: 87, rx: 13, ry: 7 },
];

const BACK: Region[] = [
  { key: 'costas_superior', cx: 60, cy: 54, rx: 18, ry: 10 },
  { key: 'costas_inferior', cx: 60, cy: 80, rx: 15, ry: 8.5 },
  { key: 'quadril_gluteos', cx: 60, cy: 103, rx: 16.5, ry: 9 },
];

const LABEL: Record<string, string> = {
  peitoral: 'Peitoral', abdomen_superior: 'Abdômen superior', abdomen_inferior: 'Abdômen inferior',
  flancos: 'Flancos', braco_esq: 'Braço esq.', braco_dir: 'Braço dir.', coxa_esq: 'Coxa esq.',
  coxa_dir: 'Coxa dir.', panturrilha: 'Panturrilha', costas_superior: 'Costas superior',
  costas_inferior: 'Costas inferior', quadril_gluteos: 'Quadril/Glúteos',
};

// Silhueta-fantasma (corpo cinza por trás das regiões coloridas)
function Silhouette() {
  return (
    <g fill="#e9edf3" stroke="#cbd5e1" strokeWidth={1.1}>
      <ellipse cx="60" cy="20" rx="13" ry="15" />
      <rect x="54" y="33" width="12" height="10" rx="4" />
      <rect x="33" y="42" width="54" height="74" rx="18" />
      <rect x="21" y="45" width="13" height="60" rx="6.5" />
      <rect x="86" y="45" width="13" height="60" rx="6.5" />
      <circle cx="27.5" cy="108" r="5.5" />
      <circle cx="92.5" cy="108" r="5.5" />
      <rect x="35" y="106" width="50" height="22" rx="12" />
      <rect x="37" y="122" width="21" height="52" rx="10.5" />
      <rect x="62" y="122" width="21" height="52" rx="10.5" />
      <rect x="39" y="172" width="17" height="50" rx="8.5" />
      <rect x="64" y="172" width="17" height="50" rx="8.5" />
    </g>
  );
}

function RegionShape({ r, score }: { r: Region; score?: number | null }) {
  const { fill } = bucket(score);
  const fs = r.rx >= 10 ? 8 : r.rx >= 6 ? 7 : 6;
  return (
    <g>
      <ellipse cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry} fill={fill} stroke="#ffffff" strokeWidth={1}>
        <title>{LABEL[r.key] ?? r.key}{score != null ? `: ${score}` : ''}</title>
      </ellipse>
      {score != null && (
        <text x={r.cx} y={r.cy} textAnchor="middle" dominantBaseline="central" fontSize={fs} fontWeight="700" fill="#fff">{score}</text>
      )}
    </g>
  );
}

function Figure({ regions, s }: { regions: Region[]; s: Scores }) {
  return (
    <svg viewBox="0 0 120 230" className="h-52 w-auto sm:h-60">
      <Silhouette />
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
