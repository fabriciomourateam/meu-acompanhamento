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
  achievementsService, RULE_TYPES, CATEGORIES, COLOR_PRESETS,
  type AchievementTemplate,
} from '@/lib/achievements-service';
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight, EyeOff, Loader2,
} from 'lucide-react';

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

interface FormState {
  achievement_type: string;
  achievement_name: string;
  achievement_description: string;
  emoji: string;
  category: string;
  points_earned: number;
  rule_type: string;
  threshold: number;
  color: string;
  is_secret: boolean;
  active: boolean;
  display_order: number;
}

const BLANK: FormState = {
  achievement_type: '',
  achievement_name: '',
  achievement_description: '',
  emoji: '🏆',
  category: 'treino',
  points_earned: 25,
  rule_type: 'workouts_total',
  threshold: 10,
  color: 'from-blue-500 to-cyan-500',
  is_secret: false,
  active: true,
  display_order: 100,
};

export function AchievementsManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<AchievementTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AchievementTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AchievementTemplate | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await achievementsService.listAllForAdmin();
      setItems(data);
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro ao carregar conquistas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm({ ...BLANK });
    setShowForm(true);
  }

  function openEdit(t: AchievementTemplate) {
    setEditing(t);
    setForm({
      achievement_type: t.achievement_type,
      achievement_name: t.achievement_name,
      achievement_description: t.achievement_description || '',
      emoji: t.emoji || '🏆',
      category: t.category || 'milestone',
      points_earned: t.points_earned ?? 0,
      rule_type: t.rule_type || '',
      threshold: (t.rule_params?.threshold as number) ?? 1,
      color: t.color || 'from-amber-500 to-yellow-500',
      is_secret: !!t.is_secret,
      active: t.active !== false,
      display_order: t.display_order ?? 100,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.achievement_name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    const achievement_type = editing
      ? editing.achievement_type
      : (form.achievement_type.trim() || slugify(form.achievement_name));
    if (!achievement_type) {
      toast({ title: 'Identificador inválido', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      await achievementsService.upsertTemplate({
        achievement_type,
        achievement_name: form.achievement_name.trim(),
        achievement_description: form.achievement_description.trim() || null,
        emoji: form.emoji.trim() || null,
        category: form.category,
        points_earned: Number(form.points_earned) || 0,
        rule_type: form.rule_type || null,
        rule_params: form.rule_type ? { threshold: Number(form.threshold) || 1 } : {},
        color: form.color,
        is_secret: form.is_secret,
        active: form.active,
        display_order: Number(form.display_order) || 100,
      });
      toast({ title: editing ? 'Conquista atualizada' : 'Conquista criada' });
      setShowForm(false);
      await load();
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(t: AchievementTemplate) {
    try {
      await achievementsService.toggleActive(t.achievement_type, !t.active);
      await load();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await achievementsService.deleteTemplate(confirmDelete.achievement_type);
      toast({ title: 'Conquista excluída' });
      setConfirmDelete(null);
      await load();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  }

  const filtered = filter === 'all' ? items : items.filter((t) => t.category === filter);
  const categoriesPresent = Array.from(new Set(items.map((i) => i.category).filter(Boolean) as string[]));

  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Conquistas</h3>
            <p className="text-xs text-slate-500">
              {items.length} conquista{items.length !== 1 ? 's' : ''} · ativas:{' '}
              {items.filter((i) => i.active).length}
            </p>
          </div>
          <Button size="sm" onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-1.5" /> Nova
          </Button>
        </div>

        {/* Filtro */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`text-xs rounded-full px-2.5 py-1 font-medium ${
              filter === 'all' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Todas ({items.length})
          </button>
          {categoriesPresent.map((c) => {
            const meta = CATEGORIES.find((x) => x.value === c);
            const count = items.filter((i) => i.category === c).length;
            return (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`text-xs rounded-full px-2.5 py-1 font-medium ${
                  filter === c ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {meta?.emoji} {meta?.label || c} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">
            <Loader2 className="h-5 w-5 mx-auto animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">Nenhuma conquista.</p>
        ) : (
          <div className="grid gap-2">
            {filtered.map((t) => (
              <div
                key={t.achievement_type}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  t.active ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-70'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 bg-gradient-to-br ${t.color || 'from-amber-500 to-yellow-500'}`}
                >
                  <span className="text-xl leading-none">{t.emoji || '🏆'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 text-sm">{t.achievement_name}</p>
                    {t.is_secret && (
                      <Badge variant="outline" className="text-[10px] gap-1 border-slate-300 bg-slate-50 text-slate-700">
                        <EyeOff className="h-2.5 w-2.5" /> Secreta
                      </Badge>
                    )}
                    {!t.rule_type && (
                      <Badge variant="outline" className="text-[10px] border-amber-300 bg-amber-50 text-amber-700">Legado</Badge>
                    )}
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                      +{t.points_earned} pts
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {t.achievement_description || <span className="italic">sem descrição</span>}
                  </p>
                  {t.rule_type && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {RULE_TYPES.find((r) => r.value === t.rule_type)?.label || t.rule_type}
                      {(t.rule_params?.threshold as number) != null &&
                        ` ≥ ${t.rule_params!.threshold}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleToggleActive(t)}
                  className="p-1.5 text-slate-500 hover:text-emerald-600"
                  title={t.active ? 'Desativar' : 'Ativar'}
                >
                  {t.active ? <ToggleRight className="h-5 w-5 text-emerald-600" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => openEdit(t)}
                  className="p-1.5 text-slate-500 hover:text-blue-600"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setConfirmDelete(t)}
                  className="p-1.5 text-slate-500 hover:text-red-600"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Form criar/editar */}
      <Dialog open={showForm} onOpenChange={(o) => !saving && setShowForm(o)}>
        <DialogContent className="bg-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar conquista' : 'Nova conquista'}</DialogTitle>
            <DialogDescription className="text-xs">
              Conquistas com <strong>tipo de regra</strong> são desbloqueadas automaticamente
              quando o aluno atinge o limite. Sem regra, o desbloqueio é manual via código.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
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
                  value={form.achievement_name}
                  onChange={(e) => setForm({ ...form, achievement_name: e.target.value })}
                  placeholder="Ex: 100 Treinos"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Descrição (opcional)</Label>
              <Textarea
                value={form.achievement_description}
                onChange={(e) => setForm({ ...form, achievement_description: e.target.value })}
                placeholder="Frase curta que aparece no card"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.emoji} {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Pontos ao desbloquear</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.points_earned}
                  onChange={(e) => setForm({ ...form, points_earned: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Regra de desbloqueio</Label>
                <Select value={form.rule_type || 'none'} onValueChange={(v) =>
                  setForm({ ...form, rule_type: v === 'none' ? '' : v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Manual (sem regra)</SelectItem>
                    {RULE_TYPES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">
                  {RULE_TYPES.find((r) => r.value === form.rule_type)?.param_label || 'Limite'}
                </Label>
                <Input
                  type="number"
                  min={1}
                  disabled={!form.rule_type}
                  value={form.threshold}
                  onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })}
                />
              </div>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Ordem</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-end gap-3 pb-1.5">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  Ativa
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_secret}
                    onChange={(e) => setForm({ ...form, is_secret: e.target.checked })}
                  />
                  Secreta
                </label>
              </div>
            </div>

            {!editing && (
              <div>
                <Label className="text-xs">Identificador único (auto)</Label>
                <Input
                  value={form.achievement_type || slugify(form.achievement_name)}
                  onChange={(e) => setForm({ ...form, achievement_type: slugify(e.target.value) })}
                  placeholder="auto-gerado do nome"
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Usado pra evitar duplicação. Não dá pra mudar depois.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conquista?</AlertDialogTitle>
            <AlertDialogDescription>
              Os alunos que já desbloquearam <strong>{confirmDelete?.achievement_name}</strong>{' '}
              vão manter a conquista no histórico, mas ela não aparece mais pra ninguém.
              Considere apenas <em>desativar</em> em vez de excluir.
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
