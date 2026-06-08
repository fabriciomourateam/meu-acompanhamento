// Modal de "Ver como aluno" — usado pelo trainer no /admin pra navegar no
// app de qualquer um dos seus pacientes sem precisar pedir token/senha.
//
// Fluxo:
//   1. Trainer abre /admin?uid=<seu_uuid> e autentica via PIN (logica
//      existente em AdminPortal). Clica em "Ver app de um aluno".
//   2. Modal lista todos os patients onde user_id = trainerUserId, com busca.
//   3. Click em um paciente -> getOrCreatePatientToken(telefone) -> setta
//      localStorage com flag de impersonacao -> navigate /portal/:token.
//   4. PatientPortal le a flag e mostra banner "Voltar pro admin". Logout
//      no portal volta pro /admin em vez de /portal-login.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, UserCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getOrCreatePatientToken } from '@/lib/patient-portal-service';

interface PatientRow {
  id: string;
  nome: string | null;
  telefone: string | null;
  plano: string | null;
  foto_perfil: string | null;
}

interface ImpersonatePatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainerUserId: string;
}

export function ImpersonatePatientModal({ open, onOpenChange, trainerUserId }: ImpersonatePatientModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !trainerUserId) return;
    setLoading(true);
    supabase
      .from('patients')
      .select('id, nome, telefone, plano, foto_perfil')
      .eq('user_id', trainerUserId)
      // Exclui paciente-modelo do backoffice (segura templates, nao eh
      // aluno real). Coluna pode nao existir ainda em alguns ambientes —
      // ignoramos erro silenciosamente. Filtro via eq('is_template_holder',
      // false) so funcionaria se a coluna existir; usamos OR pra tolerar.
      .order('nome', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          toast({ title: 'Erro ao carregar alunos', description: error.message, variant: 'destructive' });
        } else {
          // Filtra is_template_holder no client (column pode nao existir
          // ainda em meu-acompanhamento types — defensive).
          setPatients((data as PatientRow[]).filter((p) => !(p as any).is_template_holder));
        }
        setLoading(false);
      });
  }, [open, trainerUserId, toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients.slice(0, 50);
    return patients
      .filter((p) =>
        (p.nome ?? '').toLowerCase().includes(q) ||
        (p.telefone ?? '').includes(q) ||
        (p.plano ?? '').toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [patients, query]);

  const handleSelect = async (patient: PatientRow) => {
    if (!patient.telefone) {
      toast({ title: 'Aluno sem telefone', description: 'Não dá pra entrar no app sem telefone cadastrado.', variant: 'destructive' });
      return;
    }
    setOpeningId(patient.id);
    try {
      const result = await getOrCreatePatientToken(patient.telefone);
      if (!result?.token) throw new Error('Falha ao gerar token de acesso');
      // Salva contexto de impersonacao pra PatientPortal saber pra onde
      // voltar no logout, e mostrar banner.
      localStorage.setItem('impersonating_admin_uid', trainerUserId);
      localStorage.setItem('impersonating_patient_name', patient.nome ?? 'Aluno');
      localStorage.setItem('portal_token', result.token);
      localStorage.setItem('portal_phone', patient.telefone);
      onOpenChange(false);
      navigate(`/portal/${result.token}`, { replace: true });
    } catch (e) {
      toast({ title: 'Erro', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white text-slate-900 border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-emerald-600" />
            Ver app de um aluno
          </DialogTitle>
          <DialogDescription>
            Escolha um aluno pra entrar no portal dele. Quando sair, volta automaticamente pra esta página.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome, telefone ou plano..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-white border-slate-200 text-slate-900"
              autoFocus
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando alunos...
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">
              {query ? 'Nenhum aluno encontrado.' : 'Nenhum aluno cadastrado ainda.'}
            </p>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto rounded-md border border-slate-200 divide-y divide-slate-100">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p)}
                  disabled={openingId === p.id}
                  className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 transition flex items-center gap-3 disabled:opacity-60"
                >
                  {p.foto_perfil ? (
                    <img src={p.foto_perfil} alt="" className="h-9 w-9 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                      <UserCircle className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{p.nome || 'Sem nome'}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {p.telefone || 'Sem telefone'}{p.plano ? ` · ${p.plano}` : ''}
                    </div>
                  </div>
                  {openingId === p.id ? (
                    <Loader2 className="h-4 w-4 text-emerald-600 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              ))}
              {patients.length > filtered.length && !query && (
                <div className="px-3 py-2 text-[11px] text-slate-400 text-center">
                  Mostrando 50 primeiros — refine a busca pra ver mais.
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
