// Evolução das medidas (cintura/quadril) — extraídas das respostas do check-in,
// que são semi-estruturadas (chaves variam: "Cintura ", "medida": "Cintura: 55 ...").
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ruler } from 'lucide-react';
import { parseLocalISODate } from '@/lib/utils';

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function toNumber(v: unknown): number | null {
  if (v == null) return null;
  const m = String(v).replace(',', '.').match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  // descarta valores absurdos pra não poluir o gráfico (cm plausíveis)
  return n >= 20 && n <= 250 ? n : null;
}

function fromText(text: string, name: string): number | null {
  const re = new RegExp(name + '[^0-9]{0,10}(\\d+(?:[.,]\\d+)?)', 'i');
  const m = norm(text).match(re);
  return m ? toNumber(m[1]) : null;
}

// Extrai uma medida (ex.: "cintura") de um check-in, tolerando vários formatos.
function extractMeasure(checkin: any, name: string): number | null {
  const rj = checkin?.respostas_json;
  if (rj && typeof rj === 'object') {
    // chave estruturada (ex.: "Cintura ", "cintura")
    for (const [k, v] of Object.entries(rj)) {
      if (norm(String(k)) === name) {
        const n = toNumber(v);
        if (n != null) return n;
      }
    }
    // texto livre dentro de respostas_json.medida
    if (typeof rj.medida === 'string') {
      const n = fromText(rj.medida, name);
      if (n != null) return n;
    }
  }
  // texto livre na coluna medida
  if (typeof checkin?.medida === 'string') {
    const n = fromText(checkin.medida, name);
    if (n != null) return n;
  }
  return null;
}

export function MeasurementsChart({ checkins }: { checkins: any[] }) {
  // Do mais antigo pro mais novo (checkins vêm desc por data)
  const data = (checkins || [])
    .slice()
    .reverse()
    .map((c) => ({
      date: c?.data_checkin ? parseLocalISODate(c.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '',
      cintura: extractMeasure(c, 'cintura'),
      quadril: extractMeasure(c, 'quadril'),
    }))
    .filter((d) => d.cintura != null || d.quadril != null);

  if (data.length < 2) return null; // precisa de pelo menos 2 pontos pra uma linha

  const first = data[0];
  const last = data[data.length - 1];
  const delta = (a: number | null, b: number | null) => (a != null && b != null ? +(b - a).toFixed(1) : null);
  const dCintura = delta(first.cintura, last.cintura);
  const dQuadril = delta(first.quadril, last.quadril);

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Ruler className="h-5 w-5 text-sky-500" /> Evolução das medidas (cm)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex flex-wrap gap-3 text-xs">
          {dCintura != null && (
            <span className="rounded-full bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 font-semibold text-sky-700 dark:text-sky-300">
              Cintura: {dCintura > 0 ? '+' : ''}{dCintura} cm
            </span>
          )}
          {dQuadril != null && (
            <span className="rounded-full bg-violet-50 dark:bg-violet-950/40 px-2.5 py-1 font-semibold text-violet-700 dark:text-violet-300">
              Quadril: {dQuadril > 0 ? '+' : ''}{dQuadril} cm
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={['dataMin - 3', 'dataMax + 3']} width={36} />
            <Tooltip formatter={(v: number, n: string) => [`${v} cm`, n === 'cintura' ? 'Cintura' : 'Quadril']} />
            <Legend formatter={(v) => (v === 'cintura' ? 'Cintura' : 'Quadril')} />
            <Line type="monotone" dataKey="cintura" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="quadril" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
