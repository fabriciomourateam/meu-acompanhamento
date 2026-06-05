import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { levelsService, type PatientLevel } from '@/lib/levels-service';
import { COLOR_PRESETS } from '@/lib/achievements-service';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

interface FormState {
  level_order: number;
  name: string;
  emoji: string;
  color: string;
  min_points: number;
  description: string;
  active: boolean;
}

const BLANK: FormState = {
  level_order: 1,
  name: '',
  emoji: '⭐',
  color: 'from-blue-500 to-cyan-500',
  min_points: 0,
  description: '',
  active: true,
};

export function LevelsManager() {
  const { toast } = useToast();
  const [levels, setLevels] = useState<PatientLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PatientLevel | null>(null);
  const [form, setForm] = useState<FormState>({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<PatientLevel | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await levelsService.listAll();
      setLevels(data);
    } catch (e: any) {
      toast({ title: 'Erro ao carregar níveis', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    const nextOrder = Math.max(0, ...levels.map((l) => l.level_order)) + 1;
    setEditing(null);
    setForm({ ...BLANK, level_order: nextOrder, min_points: 0 });
    setShowForm(true);
  }

  function openEdit(l: PatientLevel) {
    setEditing(l);
    setForm({
      level_order: l.level_order,
      name: l.name,
      emoji: l.emoji || '⭐',
      color: l.color,
      min_points: l.min_points,
      description: l.description || '',
      active: l.active,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      await levelsService.upsert({
        level_order: form.level_order,
        name: form.name.trim(),
        emoji: form.emoji.trim() || null,
        color: form.color,
        min_points: form.min_points,
        description: form.description.trim() || null,
        active: form.active,
      });
      toast({ title: editing ? 'Nível atualizado' : 'Nível criado' });
      setShowForm(false);
      await load();
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await levelsService.remove(confirmDelete.level_order);
      toast({ title: 'Nível excluído' });
      setConfirmDelete(null);
      await load();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  }

  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Níveis</h3>
            <p className="text-xs text-slate-500">
              Sobem com base no total acumulado (XP). Nunca cai.
            </p>
          </div>
          <Button size="sm" onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-1.5" /> Novo
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-5 w-5 mx-auto animate-spin text-slate-400" />
          </div>
        ) : levels.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">Nenhum nível.</p>
        ) : (
          <div className="space-y-2">
            {levels.map((l, i) => {
              const next = levels[i + 1];
              return (
                <div
                  key={l.level_order}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    l.active ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm shrink-0 bg-gradient-to-br ${l.color}`}
                  >
                    <span className="text-2xl leading-none">{l.emoji || '⭐'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-800">{l.name}</p>
                      <span className="text-xs font-mono text-slate-500">
                        {l.min_points.toLocaleString('pt-BR')}
                        {next ? ` – ${(next.min_points - 1).toLocaleString('pt-BR')}` : '+'} pts
                      </span>
                    </div>
                    {l.description && (
                      <p className="text-xs text-slate-500 italic mt-0.5">{l.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => openEdit(l)}
                    className="p-1.5 text-slate-500 hover:text-blue-600"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(l)}
                    className="p-1.5 text-slate-500 hover:text-red-600"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={showForm} onOpenChange={(o) => !saving && setShowForm(o)}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar nível' : 'Novo nível'}</DialogTitle>
            <DialogDescription className="text-xs">
              Quanto mais alto o número da ordem, mais "premium" o nível.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1">
                <Label className="text-xs">Ordem</Label>
                <Input
                  type="number"
                  min={1}
                  disabled={!!editing}
                  value={form.level_order}
                  onChange={(e) => setForm({ ...form, level_order: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-1">
                <Label className="text-xs">Emoji</Label>
                <Input
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  className="text-center text-2xl"
                  maxLength={4}
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Nome</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Ouro"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Pontos mínimos (XP)</Label>
              <Input
                type="number"
                min={0}
                value={form.min_points}
                onChange={(e) => setForm({ ...form, min_points: Number(e.target.value) })}
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Acima desse total acumulado, o aluno entra neste nível.
              </p>
            </div>

            <div>
              <Label className="text-xs">Cor do gradiente</Label>
              <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${form.color}`} />
                    <SelectValue />
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

            <div>
              <Label className="text-xs">Descrição (opcional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Frase curta motivacional"
                rows={2}
              />
            </div>

            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Nível ativo
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
            <AlertDialogTitle>Excluir nível?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{confirmDelete?.name}</strong> deixará de aparecer pros alunos.
              Quem estava nele será reclassificado pro nível imediatamente abaixo.
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
