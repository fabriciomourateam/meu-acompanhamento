import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DailyChallengesWidget } from '@/components/diets/DailyChallengesWidget';
import { WeeklyProgressChart } from '@/components/diets/WeeklyProgressChart';
import { WeeklyHabitsGrid } from '@/components/diets/WeeklyHabitsGrid';
import { GamificationWidget } from '@/components/diets/GamificationWidget';
import { PatientEvolutionTab } from '@/components/diets/PatientEvolutionTab';
import { AdherenceCharts } from '@/components/diets/AdherenceCharts';
import { LeaderboardWidget } from '@/components/diets/LeaderboardWidget';
import { CommunityFeed } from '@/components/patient-portal/community/CommunityFeed';
import { MobileBottomNav } from '@/components/patient-portal/MobileBottomNav';
import { WorkoutTab } from '@/components/patient-portal/workout/WorkoutTab';
import { DietTab } from '@/components/patient-portal/diet/DietTab';
import { SupportChat } from '@/components/patient-portal/chat/SupportChat';
import { useDietData } from '@/components/patient-portal/diet/useDietData';
import { portalSettingsService, type PortalConfig } from '@/lib/portal-settings-service';
import { communityService } from '@/lib/community-service';
import { chatService } from '@/lib/chat-service';
import { Utensils } from 'lucide-react';

interface PatientDietPortalProps {
  patientId: string;
  patientName: string;
  checkins?: any[];
  patient?: any;
  bodyCompositions?: any[];
  achievements?: any[];
  refreshTrigger?: number; // Trigger para forçar atualização dos gráficos
  token?: string; // Token do portal — usado pelas RPCs *_by_token (Treino)
}

export function PatientDietPortal({
  patientId,
  patientName,
  checkins,
  patient,
  bodyCompositions,
  achievements,
  refreshTrigger,
  token
}: PatientDietPortalProps) {
  // Toda a lógica/estado da Dieta vive no hook; o pai só orquestra abas.
  const diet = useDietData(patientId);
  const [portalConfig, setPortalConfig] = useState<PortalConfig | null>(null);
  // Persistir a aba ativa por paciente: ao recarregar a página, o aluno
  // continua na aba em que estava (Treino, Ranking, etc.) em vez de cair na Dieta.
  const activeTabStorageKey = `portal_active_tab_${patientId}`;
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === 'undefined') return 'diet';
    const stored = localStorage.getItem(activeTabStorageKey) || 'diet';
    // As abas antigas "Metas" e "Ranking" foram fundidas em "Progresso".
    if (stored === 'challenges' || stored === 'ranking') return 'progress';
    return stored;
  });
  // Sub-aba ativa dentro de "Progresso": Metas / Ranking / Conquistas.
  const [progressSubtab, setProgressSubtab] = useState<string>('metas');
  // Visibilidade configurável pelo treinador no /admin (default: tudo visível).
  const showDiet = portalConfig?.visibility?.tab_diet !== false;
  const showWorkout = portalConfig?.visibility?.tab_workout !== false && !!token;
  const showChallenges = portalConfig?.challenges?.show_tab !== false;
  const showRanking = portalConfig?.visibility?.tab_ranking !== false;
  const showGamification = !portalConfig || portalConfig.ranking.show_gamification;
  // Sub-aba "Conquistas": gamificação e/ou gráficos extras de progresso/aderência.
  const showConquistas =
    showRanking &&
    (showGamification ||
      !!portalConfig?.ranking?.show_weekly_progress ||
      !!portalConfig?.ranking?.show_adherence);
  // "Progresso" funde Metas + Ranking + Conquistas numa aba só (alívio na barra inferior).
  const showProgress = showChallenges || showRanking;
  const showCommunity = portalConfig?.community?.show_tab !== false;
  const showResults = portalConfig?.visibility?.tab_results !== false;
  // Aba Suporte: OFF por padrão (rollout gradual). Liberada para todos
  // (support.show_tab) ou só para pacientes de teste (support.test_patient_ids).
  const showSupport =
    portalConfig?.support?.show_tab === true ||
    (!!patientId && (portalConfig?.support?.test_patient_ids ?? []).includes(patientId));
  // Subabas da Dieta
  const showMeals = portalConfig?.visibility?.diet_meals !== false;
  const showSupplements = portalConfig?.visibility?.diet_supplements !== false;
  const showSubstitutions = portalConfig?.visibility?.diet_substitutions !== false;

  const mainTabVisible: Record<string, boolean> = {
    diet: showDiet,
    workout: showWorkout,
    progress: showProgress,
    community: showCommunity,
    results: showResults,
    support: showSupport,
  };
  const ALL_MAIN_TABS = ['diet', 'workout', 'progress', 'community', 'results', 'support'] as const;
  const TAB_ORDER = ALL_MAIN_TABS.filter((t) => mainTabVisible[t]);
  const hiddenNavTabs = ALL_MAIN_TABS.filter((t) => !mainTabVisible[t]);
  // Primeira subaba visível da Dieta (para o defaultValue do Tabs aninhado)
  const firstDietSubtab = showMeals
    ? 'meals'
    : showSupplements
      ? 'supplements'
      : showSubstitutions
        ? 'substitutions'
        : '__none__';
  const visibleDietSubtabs = [showMeals, showSupplements, showSubstitutions].filter(Boolean).length;
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const goToTab = (tab: string) => {
    setActiveTab(tab);
    try {
      localStorage.setItem(activeTabStorageKey, tab);
    } catch {
      /* localStorage indisponível (ex.: modo privado) — ignora */
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwipe = (deltaX: number, deltaY: number) => {
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;
    const idx = (TAB_ORDER as readonly string[]).indexOf(activeTab);
    // deltaX > 0 → dedo arrastou para esquerda → próxima aba (à direita)
    // deltaX < 0 → dedo arrastou para direita → aba anterior (à esquerda)
    if (deltaX > 0 && idx < TAB_ORDER.length - 1) goToTab(TAB_ORDER[idx + 1]);
    if (deltaX < 0 && idx > 0) goToTab(TAB_ORDER[idx - 1]);
  };

  const trainerUserId = patient?.user_id || '';

  useEffect(() => {
    if (trainerUserId) {
      portalSettingsService.getConfig(trainerUserId).then(setPortalConfig);
    }
  }, [trainerUserId]);

  // Se a aba ativa foi ocultada pelo treinador, cair na primeira aba visível.
  useEffect(() => {
    if (TAB_ORDER.length > 0 && !TAB_ORDER.includes(activeTab as any)) {
      setActiveTab(TAB_ORDER[0]);
    }
  }, [portalConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sub-abas visíveis de "Progresso" (na ordem). Se a sub-aba atual sumir
  // (config do treinador), cai na primeira visível.
  const progressSubtabs = [
    showChallenges && 'metas',
    showRanking && 'ranking',
    showConquistas && 'conquistas',
  ].filter(Boolean) as string[];
  useEffect(() => {
    if (progressSubtabs.length > 0 && !progressSubtabs.includes(progressSubtab)) {
      setProgressSubtab(progressSubtabs[0]);
    }
  }, [portalConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  // Selo de "novos" da Comunidade: posts novos desde a última visita (mesma
  // chave de localStorage usada pelo feed). Aparece no menu/aba mesmo fora dela.
  const [communityUnread, setCommunityUnread] = useState(0);
  useEffect(() => {
    if (!patientId) return;
    const lastSeen = localStorage.getItem(`community_last_seen_${patientId}`);
    if (!lastSeen) return; // primeira visita: sem selo
    communityService
      .getUnreadByCategory(patientId, lastSeen)
      .then((m) => setCommunityUnread(Object.values(m).reduce((a, b) => a + b, 0)))
      .catch(() => {});
  }, [patientId]);

  // Ao abrir a Comunidade, zera o selo (o próprio feed atualiza a "última visita").
  useEffect(() => {
    if (activeTab === 'community') setCommunityUnread(0);
  }, [activeTab]);

  // Selo de não-lidas do Suporte (mensagens novas da equipe).
  const [supportUnread, setSupportUnread] = useState(0);
  useEffect(() => {
    if (!patientId || !showSupport) return;
    chatService.getUnreadCount(patientId).then(setSupportUnread).catch(() => {});
  }, [patientId, showSupport]);
  // Ao abrir o Suporte, zera o selo (o SupportChat marca como lido no banco).
  useEffect(() => {
    if (activeTab === 'support') setSupportUnread(0);
  }, [activeTab]);

  if (diet.loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Notificações: sino único no cabeçalho do portal (PatientNotifications).
          As de periodização/PR são espelhadas pra tabela `notifications` por
          trigger no banco, então caem nesse mesmo sino — não há mais sino aqui. */}

      {/* Seletor de Planos (quando houver múltiplos planos liberados) */}
      {diet.releasedPlans.length > 1 && (
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 mb-0.5">Suas dietas</p>
                <p className="text-xs text-slate-500">Você tem {diet.releasedPlans.length} dietas ativas — escolha qual seguir hoje</p>
              </div>
              <Select value={diet.activePlan?.id} onValueChange={diet.handleChangePlan}>
                <SelectTrigger className="w-full sm:w-[280px] bg-white border-slate-300 text-slate-700 min-h-[44px]">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-700">
                  {diet.releasedPlans.map((plan: any) => (
                    <SelectItem key={plan.id} value={plan.id} className="py-3 hover:bg-slate-100 focus:bg-slate-100 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="truncate">{plan.name}</span>
                        {(plan.status === 'active' || plan.active) && (
                          <Badge className="ml-2 bg-emerald-50 text-emerald-700 border-emerald-200 flex-shrink-0">
                            Ativo
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom nav mobile — fora do Tabs mas controla o value */}
      <MobileBottomNav
        value={activeTab as any}
        onChange={(v) => goToTab(v)}
        hidden={hiddenNavTabs as any}
        badges={{ community: communityUnread, support: supportUnread }}
      />

      {/* Abas: Plano Alimentar, Metas, Resultados e Ranking */}
      <Tabs
        value={activeTab}
        onValueChange={goToTab}
        className="w-full"
      >
        {/* Desktop: abas em linha */}
        <TabsList className="sticky top-0 z-50 hidden sm:flex items-center w-full bg-slate-200/95 backdrop-blur-md p-1 shadow-md rounded-t-lg min-h-[48px]">
          {showDiet && (
            <TabsTrigger value="diet" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 hover:text-slate-800 text-sm py-2 rounded-md transition-all h-full flex items-center justify-center">
              Dieta
            </TabsTrigger>
          )}
          {showWorkout && (
            <TabsTrigger value="workout" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 hover:text-slate-800 text-sm py-2 rounded-md transition-all h-full flex items-center justify-center">
              Treino
            </TabsTrigger>
          )}
          {showProgress && (
            <TabsTrigger value="progress" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 hover:text-slate-800 text-sm py-2 rounded-md transition-all h-full flex items-center justify-center">
              Progresso
            </TabsTrigger>
          )}
          {showCommunity && (
            <TabsTrigger value="community" className="relative flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 hover:text-slate-800 text-sm py-2 rounded-md transition-all h-full flex items-center justify-center gap-1.5">
              Comunidade
              {communityUnread > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
                  {communityUnread > 9 ? '9+' : communityUnread}
                </span>
              )}
            </TabsTrigger>
          )}
          {showResults && (
            <TabsTrigger value="results" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 hover:text-slate-800 text-sm py-2 rounded-md transition-all h-full flex items-center justify-center">
              Evolução
            </TabsTrigger>
          )}
          {showSupport && (
            <TabsTrigger value="support" className="relative flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 hover:text-slate-800 text-sm py-2 rounded-md transition-all h-full flex items-center justify-center gap-1.5">
              Suporte
              {supportUnread > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
                  {supportUnread > 9 ? '9+' : supportUnread}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Mobile: navegação via MobileBottomNav (fora deste bloco) */}

        {/* Aba: Dieta — sub-tabs Plano Alimentar + Suplementos + Substituições */}
        <TabsContent value="diet" className="mt-6 space-y-4">
          <DietTab
            diet={diet}
            patientId={patientId}
            patient={patient}
            refreshTrigger={refreshTrigger}
            showMeals={showMeals}
            showSupplements={showSupplements}
            showSubstitutions={showSubstitutions}
            firstDietSubtab={firstDietSubtab}
            visibleDietSubtabs={visibleDietSubtabs}
          />
        </TabsContent>

        {/* Aba: Treino — sessão do dia + logging de séries (RPCs *_by_token) */}
        {showWorkout && token && (
          <TabsContent value="workout" className="mt-6 space-y-4">
            <WorkoutTab token={token} active={activeTab === 'workout'} patientName={patientName} patientId={patientId} />
          </TabsContent>
        )}

        {/* Aba: Progresso — funde Metas + Ranking + Conquistas (sub-abas internas) */}
        {showProgress && (
          <TabsContent value="progress" className="mt-6">
            <Tabs value={progressSubtab} onValueChange={setProgressSubtab} className="w-full">
              {progressSubtabs.length > 1 && (
                <TabsList className="flex w-full gap-1 bg-slate-100 p-1 rounded-xl mb-5">
                  {showChallenges && (
                    <TabsTrigger value="metas" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 hover:text-slate-800 text-sm py-2 rounded-lg transition-all">
                      Metas
                    </TabsTrigger>
                  )}
                  {showRanking && (
                    <TabsTrigger value="ranking" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 hover:text-slate-800 text-sm py-2 rounded-lg transition-all">
                      Ranking
                    </TabsTrigger>
                  )}
                  {showConquistas && (
                    <TabsTrigger value="conquistas" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm text-slate-600 hover:text-slate-800 text-sm py-2 rounded-lg transition-all">
                      Conquistas
                    </TabsTrigger>
                  )}
                </TabsList>
              )}

              {showChallenges && (
                <TabsContent value="metas" className="mt-0 space-y-6">
                  <DailyChallengesWidget patientId={patientId} />
                  <WeeklyHabitsGrid patientId={patientId} />
                </TabsContent>
              )}

              {showRanking && (
                <TabsContent value="ranking" className="mt-0 space-y-6">
                  {trainerUserId && (
                    <LeaderboardWidget
                      patientId={patientId}
                      trainerUserId={trainerUserId}
                      periods={portalConfig?.ranking?.periods ?? ['monthly', 'all_time']}
                    />
                  )}
                </TabsContent>
              )}

              {showConquistas && (
                <TabsContent value="conquistas" className="mt-0 space-y-6">
                  {showGamification && (
                    <GamificationWidget
                      patientId={patientId}
                      token={token}
                      onGoToMetas={showChallenges ? () => setProgressSubtab('metas') : undefined}
                    />
                  )}

                  {portalConfig?.ranking?.show_weekly_progress && (
                    <WeeklyProgressChart patientId={patientId} />
                  )}

                  {portalConfig?.ranking?.show_adherence && (
                    <AdherenceCharts patientId={patientId} lowAdherenceThreshold={70} />
                  )}
                </TabsContent>
              )}
            </Tabs>
          </TabsContent>
        )}

        {/* Aba: Resultados (Fusão de Progresso e Evolução) */}
        <TabsContent value="results" className="mt-6 space-y-8">
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">⚖️</span> Evolução Corporal
            </h3>
            <PatientEvolutionTab
              patientId={patientId}
              checkins={checkins}
              patient={patient}
              bodyCompositions={bodyCompositions}
              achievements={achievements}
              refreshTrigger={refreshTrigger}
              isPatientView={true}
            />
          </section>
        </TabsContent>

        {showCommunity && (
          <TabsContent value="community" className="mt-6">
            {trainerUserId ? (
              <CommunityFeed
                patientId={patientId}
                trainerUserId={trainerUserId}
                trainerInstagram={portalConfig?.branding?.instagram || ''}
                shareCaption={portalConfig?.branding?.share_caption || ''}
                announcement={portalConfig?.community?.announcement || ''}
                announcementEmoji={portalConfig?.community?.announcement_emoji || '📌'}
                announcementEnabled={portalConfig?.community?.announcement_enabled || false}
                themeRotationEnabled={portalConfig?.community?.theme_rotation_enabled || false}
                themeStartDate={portalConfig?.community?.theme_start_date || ''}
                themeSchedule={portalConfig?.community?.theme_schedule || []}
              />
            ) : (
              <p className="py-12 text-center text-sm text-slate-400">
                Comunidade indisponível no momento.
              </p>
            )}
          </TabsContent>
        )}

        {showSupport && (
          <TabsContent value="support" className="mt-6">
            <SupportChat patientId={patientId} active={activeTab === 'support'} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
