import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Loader2, Send } from 'lucide-react';

interface CheckinAIWidgetProps {
  patientId: string;
  patientName: string;
  trainerUserId: string;
}

interface ScoreItem {
  label: string;
  key: 'humor' | 'energia' | 'sono' | 'adesao';
  emojis: string[];
}

const SCORES: ScoreItem[] = [
  { label: 'Humor', key: 'humor', emojis: ['😞', '😔', '😐', '🙂', '😄'] },
  { label: 'Energia', key: 'energia', emojis: ['😴', '🥱', '😐', '💪', '🔥'] },
  { label: 'Sono', key: 'sono', emojis: ['😩', '😪', '😐', '😌', '🌟'] },
  { label: 'Dieta', key: 'adesao', emojis: ['❌', '😅', '😐', '✅', '🏆'] },
];

function ScoreSelector({
  item,
  value,
  onChange,
}: {
  item: ScoreItem;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-slate-500 font-medium">{item.label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 py-2 rounded-xl text-xl transition-all border ${
              value === n
                ? 'bg-emerald-50 border-emerald-400 scale-105 shadow-sm'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 opacity-50 hover:opacity-80'
            }`}
            title={`${n}/5`}
          >
            {item.emojis[n - 1]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CheckinAIWidget({ patientId, patientName, trainerUserId }: CheckinAIWidgetProps) {
  const [scores, setScores] = useState({ humor: 0, energia: 0, sono: 0, adesao: 0 });
  const [dificuldades, setDificuldades] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  const allScored = Object.values(scores).every(v => v > 0);

  const handleSubmit = async () => {
    if (!allScored) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-feedback', {
        body: {
          humor: scores.humor,
          energia: scores.energia,
          sono: scores.sono,
          adesao: scores.adesao,
          dificuldades: dificuldades || null,
          patientName,
        },
      });

      if (error) throw error;

      setFeedback(data?.feedback || 'Ótimo check-in! Continue com foco nos seus objetivos. 💪');
      setModalOpen(true);
      setAlreadyDone(true);
    } catch (err) {
      console.error('Checkin AI error:', err);
      setFeedback('Check-in registrado! Continue firme na sua jornada. 💪');
      setModalOpen(true);
      setAlreadyDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (alreadyDone) {
    return (
      <Card className="bg-emerald-50 border border-emerald-200 rounded-2xl">
        <CardContent className="p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-sm font-semibold text-emerald-700">Check-in de hoje concluído!</p>
            <button
              onClick={() => setModalOpen(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 underline mt-0.5"
            >
              Ver feedback da IA
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-900 flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            Check-in Diário
          </CardTitle>
          <p className="text-xs text-slate-400">Como você está hoje? Receba um feedback personalizado.</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {SCORES.map(item => (
            <ScoreSelector
              key={item.key}
              item={item}
              value={scores[item.key]}
              onChange={v => setScores(prev => ({ ...prev, [item.key]: v }))}
            />
          ))}

          <div className="space-y-1.5">
            <p className="text-xs text-slate-500 font-medium">💬 Dificuldades ou observações (opcional)</p>
            <Textarea
              value={dificuldades}
              onChange={e => setDificuldades(e.target.value)}
              placeholder="Ex: tive dificuldade de beber água, senti mais fome à noite..."
              className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 resize-none text-sm rounded-xl"
              rows={2}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!allScored || loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando feedback...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar e receber feedback
              </>
            )}
          </Button>

          {!allScored && (
            <p className="text-xs text-slate-400 text-center">
              Selecione uma pontuação em cada categoria para continuar
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Feedback da IA
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <div className="flex gap-2">
              {SCORES.map(s => (
                <div key={s.key} className="flex flex-col items-center gap-0.5 flex-1 bg-slate-50 rounded-xl py-2">
                  <span className="text-xl">{scores[s.key] > 0 ? s.emojis[scores[s.key] - 1] : '—'}</span>
                  <span className="text-xs text-slate-400">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{feedback}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
