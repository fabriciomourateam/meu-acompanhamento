import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  weeklyChallengeService, currentWeekKey, type WeeklyChallenge,
} from '@/lib/weekly-challenge-service';
import { COLOR_PRESETS } from '@/lib/achievements-service';
import { Plus, Pencil, Trash2, Loader2, CalendarDays } from 'lucide-react';

interface FormState {
  id?: string;
  week_key: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  points: number;
  rule_type: string;
  threshold: number;
  active: boolean;
}

const BLANK: FormState = {
  week_key: currentWeekKey(),
  title: '',
  description: '',
  emoji: '🎯',
  color: 'from-amber-500 to-orange-500',
  points: 50,
  rule_type: 'workouts_total',
  threshold: 3,
  active: true,
};

const WEEKLY_RULES = [
  { value: 'workouts_total', label: 'Treinos na semana', param_label: 'Nº de treinos' },
  { value: 'cardios_total', label: 'Cardios na semana', param_label: 'Nº de cardios' },
  { value: 'checkins_total', label: 'Check-ins na semana', param_label: 'Nº de check-ins' },
  { value: 'community_post_count', label: 'Posts na comunidade', param_label: 'Nº de posts' },
];

function nextWeeks(n = 4): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + 7 * i);
    out.push(currentWeekKey(d));
  }
  return out;
}

function formatWeek(weekKey: string): string {
  const [y, w] = weekKey.split('-W');
  return `Semana ${w}/${y}`;
}

export function WeeklyChallengeManager({ trainerUserId }: { trainerUserId: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<WeeklyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WeeklyChallenge | null>(null);
  const [form, setForm] = useState<FormState>({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<WeeklyChallenge | null>(null);

  useEffect(() => { load(); }, [trainerUserId]);

  async function load() {
    try {
      setLoading(true);
      const data = await weeklyChallengeService.listForTrainer(trainerUserId);
      setItems(data);
    } catch (e: any) {
      toast({ title: 'Erro ao carregar', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm({ ...BLANK });
    setShowForm(true);
  }

  function openEdit(c: WeeklyChallenge) {
    setEditing(c);
    setForm({
      id: c.id,
      week_key: c.week_key,
      title: c.title,
      description: c.description || '',
      emoji: c.emoji || '🎯',
      color: c.color,
      points: c.points,
      rule_type: c.rule_type,
      threshold: (c.rule_params?.threshold as number) ?? 1,
      active: c.active,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast({ title: 'Título é obrigatório', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      await weeklyChallengeService.upsert({
        ...(form.id ? { id: form.id } : {}),
        trainer_user_id: trainerUserId,
        week_key: form.week_key,
        title: form.title.trim(),
        description: form.description.trim() || null,
        emoji: form.emoji.trim() || null,
        color: form.color,
        points: form.points,
        rule_type: form.rule_type,
        rule_params: { threshold: Number(form.threshold) || 1 },
        active: form.active,
      });
      toast({ title: editing ? 'Desafio atualizado' : 'Desafio criado' });
      setShowForm(false);
      await load();
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete?.id) return;
    try {
      await weeklyChallengeService.remove(confirmDelete.id);
      toast({ title: 'Desafio excluído' });
      setConfirmDelete(null);
      await load();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  }

  const thisWeek = currentWeekKey();
  const current = items.find((i) => i.week_key === thisWeek && i.active);

  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Desafio da Semana</h3>
            <p className="text-xs text-slate-500">
              Missão extra com bônus de pontos. Auto-conclui quando o aluno bate.
            </p>
          </div>
          <Button size="sm" onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-1.5" /> Novo
          </Button>
        </div>

        {/* Destaque: desafio atual */}
        {current ? (
          <div className={`rounded-xl p-4 text-white bg-gradient-to-br ${current.color} shadow-md`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{current.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider text-white/80">
                  Ativo agora · {formatWeek(current.week_key)}
                </p>
                <p className="font-bold text-lg leading-tight">{current.title}</p>
                {current.description && (
                  <p className="text-xs text-white/80 mt-0.5">{current.description}</p>
                )}
              </div>
              <Badge className="bg-white/20 border-white/30 text-white">+{current.points} pts</Badge>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
            Sem desafio definido pra esta semana ({formatWeek(thisWeek)}).
          </div>
        )}

        {loading ? (
          <div className="text-center py-6">
            <Loader2 className="h-5 w-5 mx-auto animate-spin text-slate-400" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-4">Nenhum desafio criado ainda.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
              Histórico
            </p>
            {items.map((c) => {
              const isCurrent = c.week_key === thisWeek;
              const isPast = c.week_key < thisWeek;
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    c.active ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'
                  } ${isCurrent ? 'ring-1 ring-amber-300' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br ${c.color}`}>
                    <span className="text-xl">{c.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800 text-sm">{c.title}</p>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <CalendarDays className="h-2.5 w-2.5" /> {formatWeek(c.week_key)}
                      </Badge>
                      {isCurrent && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-[10px]">
                          atual
                        </Badge>
                      )}
                      {isPast && (
                        <Badge variant="outline" className="text-[10px]">passado</Badge>
                      )}
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                        +{c.points} pts
                      </Badge>
                    </div>
                    {c.description && (
                      <p className="text-xs text-slate-500 truncate">{c.description}</p>
                    )}
                  </div>
                  <button onClick={() => openEdit(c)} className="p-1.5 text-slate-500 hover:text-blue-600">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setConfirmDelete(c)} className="p-1.5 text-slate-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={showForm} onOpenChange={(o) => !saving && setShowForm(o)}>
        <DialogContent className="bg-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar desafio' : 'Novo desafio'}</DialogTitle>
            <DialogDescription className="text-xs">
              Defina a meta da semana. Quando o aluno bater, ele ganha o bônus automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Semana</Label>
              <Select
                value={form.week_key}
                onValueChange={(v) => setForm({ ...form, week_key: v })}
                disabled={!!editing}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {nextWeeks(8).map((wk) => (
                    <SelectItem key={wk} value={wk}>
                      {formatWeek(wk)} {wk === currentWeekKey() && '(atual)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1">
                <Label className="text-xs">Emoji</Label>
                <Input
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  className="text-center text-2xl"
                  maxLength={4}
                />
              </div>
              <div className="col-span-3">
                <Label className="text-xs">Título</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Foco em treino"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Descrição (opcional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Bata 3 treinos essa semana"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Regra</Label>
                <Select value={form.rule_type} onValueChange={(v) => setForm({ ...form, rule_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WEEKLY_RULES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">
                  {WEEKLY_RULES.find((r) => r.value === form.rule_type)?.param_label || 'Meta'}
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={form.threshold}
                  onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Pontos bônus</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-xs">Cor</Label>
                <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${form.color}`} />
                      <span className="text-xs">cor</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_PRESETS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${c.value}`} />
                          {c.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Ativo
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir desafio?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{confirmDelete?.title}</strong> e as conclusões dele serão removidos.
              Alunos que já tinham concluído ficarão com os pontos já creditados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
