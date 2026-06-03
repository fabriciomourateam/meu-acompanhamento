// "Boneco" de bioimpedância: silhueta frente + costas, com cada região colorida
// pela intensidade de acúmulo (distribuicao_regional). Verde = menos, vermelho = mais.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PersonStanding } from 'lucide-react';

type Scores = Record<string, number>;

const REGION_LABEL: Record<string, string> = {
  peitoral: 'Peitoral',
  abdomen_superior: 'Abdômen superior',
  abdomen_inferior: 'Abdômen inferior',
  flancos: 'Flancos',
  braco_esq: 'Braço esq.',
  braco_dir: 'Braço dir.',
  coxa_esq: 'Coxa esq.',
  coxa_dir: 'Coxa dir.',
  panturrilha: 'Panturrilha',
  costas_superior: 'Costas superior',
  costas_inferior: 'Costas inferior',
  quadril_gluteos: 'Quadril/Glúteos',
};

const NEUTRAL = '#e2e8f0';

function colorFor(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return NEUTRAL;
  const r = Math.max(0, Math.min(1, score / 10)); // escala 0–10
  const hue = 140 - 140 * r; // 140 verde → 0 vermelho
  return `hsl(${hue}, 72%, 48%)`;
}

function Part({ region, score, children }: { region: string; score?: number | null; children: (fill: string, title: string) => React.ReactNode }) {
  const fill = colorFor(score);
  const title = `${REGION_LABEL[region] ?? region}${score != null ? `: ${score}` : ''}`;
  return <>{children(fill, title)}</>;
}

// Braços + pernas (iguais nas duas vistas), coloridos por braco/coxa/panturrilha.
function Limbs({ s }: { s: Scores }) {
  return (
    <>
      <Part region="braco_esq" score={s.braco_esq}>{(f, t) => <rect x="24" y="44" width="10" height="58" rx="5" fill={f}><title>{t}</title></rect>}</Part>
      <Part region="braco_dir" score={s.braco_dir}>{(f, t) => <rect x="86" y="44" width="10" height="58" rx="5" fill={f}><title>{t}</title></rect>}</Part>
      <Part region="coxa_esq" score={s.coxa_esq}>{(f, t) => <rect x="40" y="118" width="17" height="44" rx="8" fill={f}><title>{t}</title></rect>}</Part>
      <Part region="coxa_dir" score={s.coxa_dir}>{(f, t) => <rect x="63" y="118" width="17" height="44" rx="8" fill={f}><title>{t}</title></rect>}</Part>
      <Part region="panturrilha" score={s.panturrilha}>{(f, t) => <rect x="42" y="168" width="14" height="46" rx="7" fill={f}><title>{t}</title></rect>}</Part>
      <Part region="panturrilha" score={s.panturrilha}>{(f, t) => <rect x="64" y="168" width="14" height="46" rx="7" fill={f}><title>{t}</title></rect>}</Part>
    </>
  );
}

function FrontFigure({ s }: { s: Scores }) {
  return (
    <svg viewBox="0 0 120 224" className="h-56 w-auto">
      {/* cabeça / pescoço neutros */}
      <ellipse cx="60" cy="20" rx="12" ry="14" fill={NEUTRAL} />
      <rect x="54" y="32" width="12" height="8" fill={NEUTRAL} />
      <Limbs s={s} />
      {/* tronco frente */}
      <Part region="peitoral" score={s.peitoral}>{(f, t) => <rect x="37" y="42" width="46" height="22" rx="6" fill={f}><title>{t}</title></rect>}</Part>
      <Part region="flancos" score={s.flancos}>{(f, t) => <rect x="33" y="66" width="9" height="30" rx="4" fill={f}><title>{t}</title></rect>}</Part>
      <Part region="flancos" score={s.flancos}>{(f, t) => <rect x="78" y="66" width="9" height="30" rx="4" fill={f}><title>{t}</title></rect>}</Part>
      <Part region="abdomen_superior" score={s.abdomen_superior}>{(f, t) => <rect x="43" y="66" width="34" height="15" rx="4" fill={f}><title>{t}</title></rect>}</Part>
      <Part region="abdomen_inferior" score={s.abdomen_inferior}>{(f, t) => <rect x="43" y="82" width="34" height="16" rx="4" fill={f}><title>{t}</title></rect>}</Part>
      {/* pelve neutra */}
      <rect x="41" y="100" width="38" height="16" rx="7" fill={NEUTRAL} />
    </svg>
  );
}

function BackFigure({ s }: { s: Scores }) {
  return (
    <svg viewBox="0 0 120 224" className="h-56 w-auto">
      <ellipse cx="60" cy="20" rx="12" ry="14" fill={NEUTRAL} />
      <rect x="54" y="32" width="12" height="8" fill={NEUTRAL} />
      <Limbs s={s} />
      {/* tronco costas */}
      <Part region="costas_superior" score={s.costas_superior}>{(f, t) => <rect x="37" y="42" width="46" height="26" rx="6" fill={f}><title>{t}</title></rect>}</Part>
      <Part region="costas_inferior" score={s.costas_inferior}>{(f, t) => <rect x="40" y="70" width="40" height="22" rx="5" fill={f}><title>{t}</title></rect>}</Part>
      <Part region="quadril_gluteos" score={s.quadril_gluteos}>{(f, t) => <rect x="40" y="94" width="40" height="20" rx="8" fill={f}><title>{t}</title></rect>}</Part>
    </svg>
  );
}

export function BodyCompositionFigure({ data }: { data: any[] }) {
  // pega a avaliação mais recente que tenha distribuição regional
  const latest = (data || []).find((d) => d?.distribuicao_regional && typeof d.distribuicao_regional === 'object');
  const s: Scores | null = latest?.distribuicao_regional ?? null;
  if (!s || Object.keys(s).length === 0) return null;

  const dataLabel = latest?.data_avaliacao
    ? new Date(latest.data_avaliacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  return (
    <Card className="bg-white border border-slate-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
          <PersonStanding className="h-5 w-5 text-emerald-500" /> Mapa corporal (bioimpedância)
        </CardTitle>
        {dataLabel && <p className="text-xs text-slate-400">Avaliação de {dataLabel}</p>}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-center gap-6 sm:gap-10">
          <div className="text-center">
            <FrontFigure s={s} />
            <p className="mt-1 text-xs font-medium text-slate-500">Frente</p>
          </div>
          <div className="text-center">
            <BackFigure s={s} />
            <p className="mt-1 text-xs font-medium text-slate-500">Costas</p>
          </div>
        </div>

        {/* Legenda de intensidade */}
        <div className="mx-auto mt-4 max-w-xs">
          <div className="h-2 w-full rounded-full" style={{ background: 'linear-gradient(to right, hsl(140,72%,48%), hsl(70,72%,48%), hsl(0,72%,48%))' }} />
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            <span>menor acúmulo</span>
            <span>maior acúmulo</span>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">Toque/passe o mouse numa região pra ver o valor.</p>
      </CardContent>
    </Card>
  );
}
