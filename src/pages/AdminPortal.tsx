import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { portalSettingsService, PortalConfig, RankingPeriod } from '@/lib/portal-settings-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Lock, Plus, Trash2, Pencil, Check, X, ToggleLeft, ToggleRight, Save, LogOut, RotateCcw, AlertTriangle, History, Trophy, Users, Flag, Eye, EyeOff, Instagram, Loader2 } from 'lucide-react';
import { communityModerationService, type CommunityReport } from '@/lib/community-service';


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
      .eq('user_id', trainerUserId)
      .order('display_order', { ascending: true });
    setChallenges((data as Challenge[]) || []);
    setLoading(false);
  }, [trainerUserId]);

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
      user_id: trainerUserId,
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
                <Input value={newForm.emoji} onChange={e => setNewForm(f => ({ ...f, emoji: e.target.value }))} className="mt-1 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-200 focus-visible:ring-1 focus-visible:ring-amber-300/40 focus-visible:ring-offset-0" />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Pontos</Label>
                <Input type="number" value={newForm.points_earned} onChange={e => setNewForm(f => ({ ...f, points_earned: Number(e.target.value) }))} className="mt-1 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-200 focus-visible:ring-1 focus-visible:ring-amber-300/40 focus-visible:ring-offset-0" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Nome</Label>
              <Input value={newForm.challenge_name} onChange={e => setNewForm(f => ({ ...f, challenge_name: e.target.value }))} className="mt-1" placeholder="Ex: Beber 2L de água" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Descrição</Label>
              <Input value={newForm.challenge_description} onChange={e => setNewForm(f => ({ ...f, challenge_description: e.target.value }))} className="mt-1 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-200 focus-visible:ring-1 focus-visible:ring-amber-300/40 focus-visible:ring-offset-0" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Ordem de exibição</Label>
              <Input type="number" value={newForm.display_order} onChange={e => setNewForm(f => ({ ...f, display_order: Number(e.target.value) }))} className="mt-1 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-200 focus-visible:ring-1 focus-visible:ring-amber-300/40 focus-visible:ring-offset-0" />
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
                    <Input value={editForm.emoji ?? c.emoji} onChange={e => setEditForm(f => ({ ...f, emoji: e.target.value }))} className="mt-1 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-200 focus-visible:ring-1 focus-visible:ring-amber-300/40 focus-visible:ring-offset-0" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Pontos</Label>
                    <Input type="number" value={editForm.points_earned ?? c.points_earned} onChange={e => setEditForm(f => ({ ...f, points_earned: Number(e.target.value) }))} className="mt-1 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-200 focus-visible:ring-1 focus-visible:ring-amber-300/40 focus-visible:ring-offset-0" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Nome</Label>
                  <Input value={editForm.challenge_name ?? c.challenge_name} onChange={e => setEditForm(f => ({ ...f, challenge_name: e.target.value }))} className="mt-1 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-200 focus-visible:ring-1 focus-visible:ring-amber-300/40 focus-visible:ring-offset-0" />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Descrição</Label>
                  <Input value={editForm.challenge_description ?? c.challenge_description} onChange={e => setEditForm(f => ({ ...f, challenge_description: e.target.value }))} className="mt-1 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-200 focus-visible:ring-1 focus-visible:ring-amber-300/40 focus-visible:ring-offset-0" />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Ordem</Label>
                  <Input type="number" value={editForm.display_order ?? c.display_order} onChange={e => setEditForm(f => ({ ...f, display_order: Number(e.target.value) }))} className="mt-1 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-200 focus-visible:ring-1 focus-visible:ring-amber-300/40 focus-visible:ring-offset-0" />
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
                {active ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded border border-slate-200" />}
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
          { key: 'show_weekly_progress' as const, label: 'Mostrar Progresso Semanal' },
          { key: 'show_adherence' as const, label: 'Mostrar Adesão ao Plano Alimentar' },
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

function CommunitySettings({
  trainerUserId,
  config,
  onChange,
}: {
  trainerUserId: string;
  config: PortalConfig;
  onChange: (c: PortalConfig) => void;
}) {
  const { toast } = useToast();
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await communityModerationService.listReports(trainerUserId, true);
      setReports(data);
    } catch {
      // silencioso — area de moderacao e secundaria
    } finally {
      setLoading(false);
    }
  }, [trainerUserId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const normalizeHandle = (raw: string) => raw.trim().replace(/^@+/, '');

  const setHidden = async (r: CommunityReport, hidden: boolean) => {
    setBusyId(r.report_id);
    try {
      await communityModerationService.setHidden(trainerUserId, r.target_type, r.target_id, hidden);
      toast({ title: hidden ? 'Conteúdo ocultado' : 'Conteúdo reexibido' });
      await loadReports();
    } catch {
      toast({ title: 'Erro ao moderar', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const resolve = async (r: CommunityReport) => {
    setBusyId(r.report_id);
    try {
      await communityModerationService.resolveReport(trainerUserId, r.report_id);
      setReports((prev) => prev.filter((x) => x.report_id !== r.report_id));
    } catch {
      toast({ title: 'Erro ao resolver', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visibilidade da aba */}
      <div className="space-y-3">
        <p className="font-semibold text-slate-700">Aba Comunidade</p>
        <button
          onClick={() => onChange({ ...config, community: { show_tab: !config.community.show_tab } })}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${
            config.community.show_tab ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}
        >
          {config.community.show_tab ? <ToggleRight className="w-5 h-5 shrink-0" /> : <ToggleLeft className="w-5 h-5 shrink-0 text-slate-400" />}
          Mostrar aba Comunidade no portal dos alunos
        </button>
      </div>

      {/* Instagram do treinador */}
      <div className="space-y-2">
        <Label className="font-semibold text-slate-700">Seu Instagram</Label>
        <p className="text-xs text-slate-400">
          Aparecerá nos cards que os alunos compartilharem. Salve para ativar — enquanto vazio, nada é exibido.
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
          <Instagram className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-400">@</span>
          <Input
            value={config.branding.instagram}
            onChange={(e) =>
              onChange({ ...config, branding: { instagram: normalizeHandle(e.target.value) } })
            }
            placeholder="seuusuario"
            className="border-0 px-1 focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Moderacao */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Flag className="w-4 h-4" /> Denúncias em aberto
          </p>
          <Button variant="ghost" size="sm" onClick={loadReports} className="text-slate-500">
            Atualizar
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : reports.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Nenhuma denúncia em aberto. 🎉</p>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.report_id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {r.target_type === 'post' ? 'Publicação' : 'Comentário'}
                    {r.target_is_hidden ? ' · oculto' : ''}
                  </Badge>
                  <span className="text-[11px] text-slate-400">por {r.reporter_name}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700 line-clamp-3">
                  <span className="font-medium text-slate-500">{r.target_author_name}: </span>
                  {r.target_content || <em className="text-slate-400">(conteúdo removido)</em>}
                </p>
                {r.reason && <p className="mt-1 text-xs text-rose-500">Motivo: {r.reason}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.target_is_hidden ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === r.report_id}
                      onClick={() => setHidden(r, false)}
                      className="gap-1.5 text-emerald-600 border-emerald-200"
                    >
                      <Eye className="w-3.5 h-3.5" /> Reexibir
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === r.report_id}
                      onClick={() => setHidden(r, true)}
                      className="gap-1.5 text-rose-600 border-rose-200"
                    >
                      <EyeOff className="w-3.5 h-3.5" /> Ocultar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === r.report_id}
                    onClick={() => resolve(r)}
                    className="gap-1.5 text-slate-500"
                  >
                    <Check className="w-3.5 h-3.5" /> Marcar como resolvida
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

type Top3Entry = { nome: string; points: number };
type ResetEntry = {
  id: number;
  reset_at: string;
  patients_affected: number;
  top3: Top3Entry[];
  level_reset: boolean;
};

const MEDAL_STYLES = [
  { emoji: '🥇', label: '1º', wrap: 'bg-amber-50 border-amber-200 text-amber-800' },
  { emoji: '🥈', label: '2º', wrap: 'bg-slate-50 border-slate-200 text-slate-700' },
  { emoji: '🥉', label: '3º', wrap: 'bg-orange-50 border-orange-200 text-orange-800' },
];

function formatResetDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function PointsManager({ trainerUserId }: { trainerUserId: string }) {
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [alsoResetLevel, setAlsoResetLevel] = useState(false);
  const [history, setHistory] = useState<ResetEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [totalPatients, setTotalPatients] = useState<number | null>(null);
  const [patientsWithPoints, setPatientsWithPoints] = useState<number | null>(null);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('points_reset_audit')
      .select('id, reset_at, patients_affected, top3, level_reset')
      .eq('trainer_user_id', trainerUserId)
      .order('reset_at', { ascending: false })
      .limit(5);
    if (!error && data) setHistory(data as ResetEntry[]);
    setLoadingHistory(false);
  }, [trainerUserId]);

  const loadCounts = useCallback(async () => {
    const [totalRes, withPointsRes] = await Promise.all([
      supabase.from('patients').select('id', { count: 'exact', head: true })
        .eq('user_id', trainerUserId),
      supabase.from('patient_points').select('patient_id, patients!inner(user_id)', { count: 'exact', head: true })
        .gt('total_points', 0)
        .eq('patients.user_id', trainerUserId),
    ]);
    setTotalPatients(totalRes.count ?? 0);
    setPatientsWithPoints(withPointsRes.count ?? 0);
  }, [trainerUserId]);

  useEffect(() => { loadHistory(); loadCounts(); }, [loadHistory, loadCounts]);

  async function handleReset() {
    setResetting(true);
    try {
      const { error } = await supabase.rpc('reset_trainer_patient_points', {
        trainer_uid: trainerUserId,
        also_reset_level: alsoResetLevel,
      });
      if (error) throw error;
      toast({
        title: 'Pontos zerados!',
        description: alsoResetLevel
          ? 'Pontos, histórico e níveis dos seus alunos foram resetados.'
          : 'Pontos e histórico dos seus alunos foram resetados.',
      });
      setConfirming(false);
      setAlsoResetLevel(false);
      await Promise.all([loadHistory(), loadCounts()]);
    } catch {
      toast({ title: 'Erro ao zerar pontos', variant: 'destructive' });
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-6 space-y-6">
          <div>
            <p className="font-semibold text-slate-700 mb-1">Zerar pontos dos seus alunos</p>
            <p className="text-sm text-slate-500">
              Reseta o total de pontos e o histórico de pontuação <strong>apenas dos seus alunos</strong> (do trainer logado). O pódio atual (1º, 2º e 3º) é guardado antes do reset. Opcionalmente, é possível zerar também o nível atual.
            </p>
          </div>

          {totalPatients !== null && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <Users className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                Você tem <strong className="text-slate-800">{totalPatients}</strong> {totalPatients === 1 ? 'aluno cadastrado' : 'alunos cadastrados'}
                {patientsWithPoints !== null && totalPatients > 0 && (
                  <> — <strong className="text-emerald-700">{patientsWithPoints}</strong> com pontuação ativa</>
                )}
                .
              </span>
            </div>
          )}

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors w-full"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              Zerar pontos dos seus alunos
            </button>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700 text-sm">Tem certeza?</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Esta ação é irreversível e afeta <strong>somente os seus alunos</strong>. Pontos e histórico de pontuação serão apagados permanentemente.
                  </p>
                  {patientsWithPoints !== null && totalPatients !== null && (
                    <p className="text-xs text-red-700 mt-2 font-medium">
                      {patientsWithPoints === 0
                        ? `Nenhum dos seus ${totalPatients} ${totalPatients === 1 ? 'aluno tem' : 'alunos têm'} pontuação no momento.`
                        : <>Vão ser zerados os pontos de <strong>{patientsWithPoints}</strong> {patientsWithPoints === 1 ? 'aluno' : 'alunos'} (de {totalPatients} no total).</>}
                    </p>
                  )}
                </div>
              </div>

              <label className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white/70 border border-red-100 cursor-pointer hover:bg-white transition-colors">
                <input
                  type="checkbox"
                  checked={alsoResetLevel}
                  onChange={e => setAlsoResetLevel(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-300"
                />
                <span className="text-xs text-slate-700">
                  Também zerar o <strong>nível</strong> dos alunos (todos voltam para o nível 1)
                </span>
              </label>

              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {resetting ? 'Zerando...' : alsoResetLevel ? 'Sim, zerar pontos e nível' : 'Sim, zerar pontos'}
                </button>
                <button
                  onClick={() => { setConfirming(false); setAlsoResetLevel(false); }}
                  className="flex-1 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <p className="font-semibold text-slate-700">Últimos resets</p>
          </div>

          {loadingHistory ? (
            <p className="text-sm text-slate-400">Carregando...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhum reset registrado ainda.</p>
          ) : (
            <ul className="space-y-3">
              {history.map(entry => (
                <li key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="shrink-0">{formatResetDate(entry.reset_at)}</span>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {entry.level_reset && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-medium">
                          Nível zerado também
                        </span>
                      )}
                      <span>{entry.patients_affected} {entry.patients_affected === 1 ? 'aluno' : 'alunos'} zerados</span>
                    </div>
                  </div>

                  {entry.top3.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                      <Trophy className="w-3.5 h-3.5" />
                      Nenhum aluno com pontuação no momento do reset.
                    </div>
                  ) : (
                    <ol className="space-y-1.5">
                      {entry.top3.map((p, i) => {
                        const style = MEDAL_STYLES[i] ?? MEDAL_STYLES[2];
                        return (
                          <li
                            key={i}
                            className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border text-sm ${style.wrap}`}
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0" aria-hidden>{style.emoji}</span>
                              <span className="font-medium truncate">{p.nome}</span>
                            </span>
                            <span className="text-xs font-semibold tabular-nums shrink-0">
                              {p.points} pts
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const SESSION_KEY = 'admin_session';

function getSessionUid(): string | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { uid, expires } = JSON.parse(raw);
    if (Date.now() > expires) { sessionStorage.removeItem(SESSION_KEY); return null; }
    return uid;
  } catch { return null; }
}

function setSessionUid(uid: string) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ uid, expires: Date.now() + 8 * 60 * 60 * 1000 }));
}

export default function AdminPortal() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trainerUserId = searchParams.get('uid') || '';

  const [authenticated, setAuthenticated] = useState(() => getSessionUid() === trainerUserId && !!trainerUserId);
  const [pinLoading, setPinLoading] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [pinChecked, setPinChecked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!trainerUserId) { setPinChecked(true); return; }
    supabase.from('portal_settings')
      .select('setting_value')
      .eq('user_id', trainerUserId)
      .eq('setting_key', 'admin_pin')
      .maybeSingle()
      .then(({ data }) => {
        setStoredPin((data?.setting_value as any)?.pin || null);
        setPinChecked(true);
      });
  }, [trainerUserId]);

  useEffect(() => {
    if (authenticated && trainerUserId) {
      portalSettingsService.getConfig(trainerUserId).then(setConfig);
    }
  }, [authenticated, trainerUserId]);

  if (!trainerUserId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-sm w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Lock className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-slate-500 text-sm">Link de acesso inválido.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pinChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Carregando...</div>
      </div>
    );
  }

  async function handleSetPin() {
    if (newPin.length < 4) { toast({ title: 'PIN deve ter ao menos 4 dígitos', variant: 'destructive' }); return; }
    if (newPin !== confirmPin) { toast({ title: 'PINs não coincidem', variant: 'destructive' }); return; }
    setPinLoading(true);
    await supabase.from('portal_settings').upsert(
      { user_id: trainerUserId, setting_key: 'admin_pin', setting_value: { pin: newPin } },
      { onConflict: 'user_id,setting_key' }
    );
    setStoredPin(newPin);
    setSessionUid(trainerUserId);
    setAuthenticated(true);
    setPinLoading(false);
    toast({ title: 'PIN configurado! Bem-vindo ao admin.' });
  }

  async function handleVerifyPin() {
    if (pinInput === storedPin) {
      setSessionUid(trainerUserId);
      setAuthenticated(true);
    } else {
      toast({ title: 'PIN incorreto', variant: 'destructive' });
      setPinInput('');
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <Card className="max-w-sm w-full shadow-lg border border-slate-200 bg-white">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-3">
              <Lock className="w-7 h-7 text-emerald-600" />
            </div>
            <CardTitle className="text-slate-800">
              {storedPin ? 'Acesso Admin' : 'Configurar PIN de Acesso'}
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              {storedPin ? 'Digite seu PIN para continuar' : 'Crie um PIN para proteger o painel admin'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {storedPin ? (
              <>
                <div>
                  <Label className="text-sm text-slate-600">PIN</Label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleVerifyPin()}
                    placeholder="Digite seu PIN"
                    className="mt-1 text-center text-lg tracking-widest bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-200 focus-visible:ring-1 focus-visible:ring-amber-300/40 focus-visible:ring-offset-0"
                    autoFocus
                  />
                </div>
                <Button onClick={handleVerifyPin} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  Entrar
                </Button>
              </>
            ) : (
              <>
                <div>
                  <Label className="text-sm text-slate-600">Novo PIN (mín. 4 dígitos)</Label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    value={newPin}
                    onChange={e => setNewPin(e.target.value)}
                    placeholder="Digite um PIN"
                    className="mt-1 text-center text-lg tracking-widest bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-200 focus-visible:ring-1 focus-visible:ring-amber-300/40 focus-visible:ring-offset-0"
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Confirmar PIN</Label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSetPin()}
                    placeholder="Repita o PIN"
                    className="mt-1 text-center text-lg tracking-widest bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-200 focus-visible:ring-1 focus-visible:ring-amber-300/40 focus-visible:ring-offset-0"
                  />
                </div>
                <Button onClick={handleSetPin} disabled={pinLoading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  Criar PIN e Entrar
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    // Voltar para a rota de login salva ou para /portal
    const loginRoute = localStorage.getItem('portal_login_route') || '/portal';
    navigate(loginRoute);
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
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={saving || !config} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button onClick={handleLogout} variant="outline" className="border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100 gap-1.5">
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
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
            <TabsTrigger value="community" className="flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-700 text-slate-500 rounded-lg py-2 text-sm">
              Comunidade
            </TabsTrigger>
            <TabsTrigger value="points" className="flex-1 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-700 text-slate-500 rounded-lg py-2 text-sm">
              Pontos
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

          <TabsContent value="community" className="mt-4">
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-6">
                {config ? (
                  <CommunitySettings trainerUserId={trainerUserId} config={config} onChange={setConfig} />
                ) : (
                  <div className="py-8 text-center text-slate-400">Carregando...</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="points" className="mt-4">
            <PointsManager trainerUserId={trainerUserId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
