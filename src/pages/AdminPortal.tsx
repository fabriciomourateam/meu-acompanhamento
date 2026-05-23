import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { portalSettingsService, PortalConfig, RankingPeriod } from '@/lib/portal-settings-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Lock, Plus, Trash2, Pencil, Check, X, ToggleLeft, ToggleRight, Save } from 'lucide-react';

const TRAINER_UID = 'a9798432-60bd-4ac8-a035-d139a47ad59b';

interface Challenge {
  id: string;
  challenge_key: string;
  challenge_name: string;
  challenge_description: string;
  emoji: string;
  points_earned: number;
  is_active: boolean;
  display_order: number;
}

const BLANK_FORM = {
  emoji: '🎯',
  challenge_name: '',
  challenge_description: '',
  points_earned: 10,
  display_order: 0,
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function ChallengesManager({ trainerUserId }: { trainerUserId: string }) {
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Challenge>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({ ...BLANK_FORM });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('daily_challenges')
      .select('*')
      .order('display_order', { ascending: true });
    setChallenges((data as Challenge[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggleActive(c: Challenge) {
    await supabase.from('daily_challenges').update({ is_active: !c.is_active }).eq('id', c.id);
    setChallenges(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x));
  }

  async function handleDelete(c: Challenge) {
    if (!confirm(`Excluir "${c.challenge_name}"?`)) return;
    await supabase.from('daily_challenges').delete().eq('id', c.id);
    setChallenges(prev => prev.filter(x => x.id !== c.id));
    toast({ title: 'Desafio excluído' });
  }

  async function handleSaveEdit(c: Challenge) {
    setSaving(true);
    const { error } = await supabase.from('daily_challenges').update({
      emoji: editForm.emoji ?? c.emoji,
      challenge_name: editForm.challenge_name ?? c.challenge_name,
      challenge_description: editForm.challenge_description ?? c.challenge_description,
      points_earned: editForm.points_earned ?? c.points_earned,
      display_order: editForm.display_order ?? c.display_order,
    }).eq('id', c.id);
    setSaving(false);
    if (error) { toast({ title: 'Erro ao salvar', variant: 'destructive' }); return; }
    setEditingId(null);
    toast({ title: 'Salvo!' });
    load();
  }

  async function handleCreate() {
    if (!newForm.challenge_name.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' }); return;
    }
    setSaving(true);
    const { error } = await supabase.from('daily_challenges').insert({
      challenge_key: slugify(newForm.challenge_name),
      challenge_name: newForm.challenge_name,
      challenge_description: newForm.challenge_description,
      emoji: newForm.emoji,
      points_earned: newForm.points_earned,
      display_order: newForm.display_order,
      is_active: true,
    });
    setSaving(false);
    if (error) { toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' }); return; }
    setShowNewForm(false);
    setNewForm({ ...BLANK_FORM });
    toast({ title: 'Desafio criado!' });
    load();
  }

  if (loading) return <div className="py-8 text-center text-slate-400">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowNewForm(v => !v)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
          <Plus className="w-4 h-4" /> Novo Desafio
        </Button>
      </div>

      {showNewForm && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 space-y-3">
            <p className="font-semibold text-slate-700 text-sm">Novo desafio</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500">Emoji</Label>
                <Input value={newForm.emoji} onChange={e => setNewForm(f => ({ ...f, emoji: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Pontos</Label>
                <Input type="number" value={newForm.points_earned} onChange={e => setNewForm(f => ({ ...f, points_earned: Number(e.target.value) }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Nome</Label>
              <Input value={newForm.challenge_name} onChange={e => setNewForm(f => ({ ...f, challenge_name: e.target.value }))} className="mt-1" placeholder="Ex: Beber 2L de água" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Descrição</Label>
              <Input value={newForm.challenge_description} onChange={e => setNewForm(f => ({ ...f, challenge_description: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Ordem de exibição</Label>
              <Input type="number" value={newForm.display_order} onChange={e => setNewForm(f => ({ ...f, display_order: Number(e.target.value) }))} className="mt-1" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleCreate} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Check className="w-4 h-4 mr-1" /> Criar
              </Button>
              <Button onClick={() => setShowNewForm(false)} size="sm" variant="outline">
                <X className="w-4 h-4 mr-1" /> Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {challenges.map(c => (
        <Card key={c.id} className={`border transition-all ${c.is_active ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
          <CardContent className="p-4">
            {editingId === c.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-500">Emoji</Label>
                    <Input value={editForm.emoji ?? c.emoji} onChange={e => setEditForm(f => ({ ...f, emoji: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Pontos</Label>
                    <Input type="number" value={editForm.points_earned ?? c.points_earned} onChange={e => setEditForm(f => ({ ...f, points_earned: Number(e.target.value) }))} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Nome</Label>
                  <Input value={editForm.challenge_name ?? c.challenge_name} onChange={e => setEditForm(f => ({ ...f, challenge_name: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Descrição</Label>
                  <Input value={editForm.challenge_description ?? c.challenge_description} onChange={e => setEditForm(f => ({ ...f, challenge_description: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Ordem</Label>
                  <Input type="number" value={editForm.display_order ?? c.display_order} onChange={e => setEditForm(f => ({ ...f, display_order: Number(e.target.value) }))} className="mt-1" />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button onClick={() => handleSaveEdit(c)} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Check className="w-4 h-4 mr-1" /> Salvar
                  </Button>
                  <Button onClick={() => setEditingId(null)} size="sm" variant="outline">
                    <X className="w-4 h-4 mr-1" /> Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-2xl shrink-0">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{c.challenge_name}</p>
                  {c.challenge_description && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{c.challenge_description}</p>
                  )}
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0">
                  {c.points_earned} pts
                </Badge>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleToggleActive(c)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title={c.is_active ? 'Desativar' : 'Ativar'}>
                    {c.is_active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  </button>
                  <button onClick={() => { setEditingId(c.id); setEditForm({}); }} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <Pencil className="w-4 h-4 text-slate-500" />
                  </button>
                  <button onClick={() => handleDelete(c)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const PERIOD_LABELS: Record<RankingPeriod, string> = {
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
  all_time: 'Todos os tempos',
};

function RankingSettings({ config, onChange }: { config: PortalConfig; onChange: (c: PortalConfig) => void }) {
  const periods: RankingPeriod[] = ['weekly', 'monthly', 'yearly', 'all_time'];

  function togglePeriod(p: RankingPeriod) {
    const current = config.ranking.periods;
    const next = current.includes(p) ? current.filter(x => x !== p) : [...current, p];
    onChange({ ...config, ranking: { ...config.ranking, periods: next } });
  }

  function toggleFlag(key: keyof typeof config.ranking) {
    onChange({ ...config, ranking: { ...config.ranking, [key]: !config.ranking[key] } });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-semibold text-slate-700 mb-3">Períodos ativos no ranking</p>
        <div className="grid grid-cols-2 gap-2">
          {periods.map(p => {
            const active = config.ranking.periods.includes(p);
            return (
              <button
                key={p}
                onClick={() => togglePeriod(p)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  active ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {active ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded border border-slate-300" />}
                {PERIOD_LABELS[p]}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-2">O ranking de cada período é calculado automaticamente a partir das datas — nenhum dado é apagado.</p>
      </div>

      <div className="space-y-3">
        <p className="font-semibold text-slate-700">Visibilidade no ranking</p>
        {[
          { key: 'show_leaderboard' as const, label: 'Mostrar leaderboard (placar com todos os alunos)' },
          { key: 'show_gamification' as const, label: 'Mostrar nível, pontos e conquistas' },
          { key: 'show_adherence' as const, label: 'Mostrar gráfico de Adesão à Dieta' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggleFlag(key)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${
              config.ranking[key] ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            {config.ranking[key] ? <ToggleRight className="w-5 h-5 shrink-0" /> : <ToggleLeft className="w-5 h-5 shrink-0 text-slate-400" />}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function VisibilitySettings({ config, onChange }: { config: PortalConfig; onChange: (c: PortalConfig) => void }) {
  return (
    <div className="space-y-3">
      <p className="font-semibold text-slate-700">Abas e seções visíveis no portal</p>
      <button
        onClick={() => onChange({ ...config, challenges: { show_tab: !config.challenges.show_tab } })}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${
          config.challenges.show_tab ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}
      >
        {config.challenges.show_tab ? <ToggleRight className="w-5 h-5 shrink-0" /> : <ToggleLeft className="w-5 h-5 shrink-0 text-slate-400" />}
        Mostrar aba de Metas Diárias
      </button>
    </div>
  );
}

export default function AdminPortal() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const trainerUserId = searchParams.get('uid') || '';
  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (trainerUserId === TRAINER_UID) {
      portalSettingsService.getConfig(trainerUserId).then(setConfig);
    }
  }, [trainerUserId]);

  if (trainerUserId !== TRAINER_UID) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-sm w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Acesso restrito</h1>
            <p className="text-slate-500 text-sm">Esta página é exclusiva para o administrador.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    try {
      await portalSettingsService.saveConfig(trainerUserId, config);
      toast({ title: 'Configurações salvas!' });
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Painel Admin</h1>
            <p className="text-sm text-slate-500 mt-0.5">Configure o portal dos seus alunos</p>
          </div>
          <Button onClick={handleSave} disabled={saving || !config} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        <Tabs defaultValue="challenges">
          <TabsList className="w-full bg-white border border-slate-200 rounded-xl p-1 h-auto">
            <TabsTrigger value="challenges" className="flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-700 text-slate-500 rounded-lg py-2 text-sm">
              Metas
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-700 text-slate-500 rounded-lg py-2 text-sm">
              Ranking
            </TabsTrigger>
            <TabsTrigger value="visibility" className="flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-700 text-slate-500 rounded-lg py-2 text-sm">
              Visibilidade
            </TabsTrigger>
          </TabsList>

          <TabsContent value="challenges" className="mt-4">
            <ChallengesManager trainerUserId={trainerUserId} />
          </TabsContent>

          <TabsContent value="ranking" className="mt-4">
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-6">
                {config ? (
                  <RankingSettings config={config} onChange={setConfig} />
                ) : (
                  <div className="py-8 text-center text-slate-400">Carregando...</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visibility" className="mt-4">
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-6">
                {config ? (
                  <VisibilitySettings config={config} onChange={setConfig} />
                ) : (
                  <div className="py-8 text-center text-slate-400">Carregando...</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
