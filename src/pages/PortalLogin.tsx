import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Phone, Sparkles, Settings, Calendar, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

type LoginNavState = {
  phone?: string;
  pattern?: string;
  step?: 'phone' | 'dob';
  firstTimeDob?: boolean;
};

export default function PortalLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Slug da rota: /portal-evaner → "evaner". null em / e /portal.
  const pathSlug = location.pathname.startsWith('/portal-')
    ? location.pathname.slice('/portal-'.length)
    : null;

  // Tenant "dono" da página base (/ e /portal): os alunos deste treinador
  // permanecem na URL limpa; alunos de outros treinadores são descobertos
  // automaticamente e redirecionados para /portal-<slug> deles.
  const DEFAULT_TENANT_SLUG = 'fmteam';

  // Rota do dono (/, /portal e /portal-fmteam): exibe a marca FMTeam.
  const isOwnerRoute = !pathSlug || pathSlug === DEFAULT_TENANT_SLUG;

  // Estado inicial vindo do smart routing (location.state) — pula direto pra DOB
  // quando o usuário foi redirecionado de / pra /portal-<slug>.
  const navState = (location.state ?? {}) as LoginNavState;

  const [telefone, setTelefone] = useState(navState.phone ?? '');
  const [loading, setLoading] = useState(false);
  const hasRedirected = useRef(false);
  const [adminUid, setAdminUid] = useState<string | null>(null);
  // Marca personalizada do treinador (tenants que não são o dono FMTeam).
  const [brand, setBrand] = useState<{ logoUrl: string | null; primaryColor: string | null; tagline: string | null } | null>(null);

  // Fluxo: phone → dob
  const [step, setStep] = useState<'phone' | 'dob'>(navState.step ?? 'phone');
  const [birthDate, setBirthDate] = useState('');
  const [firstTimeDob, setFirstTimeDob] = useState(navState.firstTimeDob ?? false);
  const phonePatternRef = useRef<string>(navState.pattern ?? '');

  // Buscar uid + marca do trainer pelo checkin_slug (atalho admin e branding)
  useEffect(() => {
    // Na rota base (/), usa o tenant dono (fmteam) para também mostrar o atalho admin.
    const slug = pathSlug ?? DEFAULT_TENANT_SLUG;
    supabase
      .from('profiles')
      .select('id, brand_logo_url, brand_primary_color, brand_tagline')
      .eq('checkin_slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.id) setAdminUid(data.id);
        // Só aplica marca personalizada fora da rota dona (FMTeam mantém seu visual fixo).
        if (data && !isOwnerRoute) {
          setBrand({
            logoUrl: data.brand_logo_url || null,
            primaryColor: data.brand_primary_color || null,
            tagline: data.brand_tagline || null,
          });
        }
      });
  }, [pathSlug, isOwnerRoute]);

  // Salva rota de login (PWA fixa o portal do trainer; rota genérica só salva
  // se ainda não houver nada salvo)
  useEffect(() => {
    if (pathSlug) {
      localStorage.setItem('portal_login_route', location.pathname);
    } else if (!localStorage.getItem('portal_login_route')) {
      localStorage.setItem('portal_login_route', location.pathname);
    }
  }, [pathSlug, location.pathname]);

  // Redireciona pra portal se já tem token salvo
  useEffect(() => {
    if (hasRedirected.current) return;
    const savedToken = localStorage.getItem('portal_access_token');
    if (savedToken) {
      hasRedirected.current = true;
      navigate(`/portal/${savedToken}`, { replace: true });
    }
  }, [navigate]);

  const normalizePhone = (phone: string): string => phone.replace(/\D/g, '');

  const getNationalNumber = (phone: string): string => {
    const numbersOnly = phone.replace(/\D/g, '');
    if (numbersOnly.startsWith('55') && numbersOnly.length > 11) {
      return numbersOnly.slice(2);
    }
    return numbersOnly;
  };

  // Variantes do telefone pra busca, tolerando diferenças comuns de cadastro:
  // com/sem o DDI 55 e com/sem o "9" do celular (após o DDD). Ex.: digitar
  // 31989062498 deve achar quem está salvo como 553189062498 (sem o 9).
  const phoneSearchVariants = (raw: string): string[] => {
    const all = raw.replace(/\D/g, '');
    let nat = all;
    if (nat.startsWith('55') && nat.length >= 12) nat = nat.slice(2); // tira o DDI -> nacional
    const ordered: string[] = [];
    const push = (v?: string) => { if (v && v.length >= 10 && !ordered.includes(v)) ordered.push(v); };
    push(all);
    push(nat);
    if (nat.length === 10) push(nat.slice(0, 2) + '9' + nat.slice(2)); // adiciona o 9 (DDD + 9 + 8)
    if (nat.length === 11 && nat[2] === '9') push(nat.slice(0, 2) + nat.slice(3)); // remove o 9 (DDD + 8)
    return ordered;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 13);

    if (limited.startsWith('55') && limited.length > 2) {
      const phonePart = limited.slice(2);
      if (phonePart.length <= 2) {
        return `+55 (${phonePart}`;
      } else if (phonePart.length <= 7) {
        return `+55 (${phonePart.slice(0, 2)}) ${phonePart.slice(2)}`;
      } else if (phonePart.length <= 11) {
        return `+55 (${phonePart.slice(0, 2)}) ${phonePart.slice(2, 7)}-${phonePart.slice(7)}`;
      }
    }

    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 7) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    } else if (limited.length <= 11) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    }

    return limited;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatPhone(e.target.value));
  };

  const buildPhonePattern = (digits: string): string =>
    '%' + digits.split('').join('%') + '%';

  const maskBrDate = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const brDateToIso = (br: string): string | null => {
    const match = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, dd, mm, yyyy] = match;
    const day = Number(dd);
    const month = Number(mm);
    const year = Number(yyyy);
    if (year < 1900 || year > new Date().getFullYear()) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
      return null;
    }
    return `${yyyy}-${mm}-${dd}`;
  };

  const finalizeLogin = (patientPhone: string, patientName: string | null) => {
    const token = btoa(`${patientPhone}:${Date.now()}`);
    localStorage.setItem('portal_token', token);
    localStorage.setItem('portal_phone', patientPhone);
    localStorage.setItem('portal_login_route', location.pathname);

    toast({
      title: 'Acesso liberado! 🎉',
      description: patientName ? `Bem-vindo(a), ${patientName}!` : 'Bem-vindo(a)!',
    });

    navigate(`/portal/${token}`);
  };

  // Etapa 1: valida telefone. Se rota tem slug, escopa busca ao tenant.
  // Sem slug, descobre o trainer e redireciona pra /portal-<slug> em step=dob.
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nationalNumber = getNationalNumber(telefone);

    if (nationalNumber.length < 10) {
      toast({
        title: 'Telefone inválido',
        description: 'Digite um número de telefone válido com DDD',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const candidatePatterns: string[] = phoneSearchVariants(telefone).map(buildPhonePattern);

      let foundPattern: string | null = null;
      let requiresDob = false;
      let trainerSlug: string | null = null;

      for (const pattern of candidatePatterns) {
        const { data, error } = await supabase.rpc('check_patient_exists_v2', {
          phone_search: pattern,
          tenant_slug: pathSlug,
        });
        if (error) {
          console.error('Erro RPC check_patient_exists_v2:', error);
          continue;
        }
        const row = Array.isArray(data) ? data[0] : data;
        if (row?.found) {
          foundPattern = pattern;
          requiresDob = !!row.requires_dob;
          trainerSlug = row.trainer_slug ?? null;
          break;
        }
      }

      if (!foundPattern) {
        toast({
          title: 'Paciente não encontrado',
          description: pathSlug
            ? 'Não encontramos cadastro com este telefone neste portal. Confira o link com seu nutricionista.'
            : 'Não encontramos nenhum cadastro com este telefone. Verifique se digitou corretamente.',
          variant: 'destructive',
        });
        return;
      }

      // Smart routing: na página base, alunos do tenant dono (fmteam) ficam na
      // própria / ; alunos de outros treinadores vão pro portal correto deles.
      if (!pathSlug && trainerSlug && trainerSlug !== DEFAULT_TENANT_SLUG) {
        navigate(`/portal-${trainerSlug}`, {
          state: {
            phone: telefone,
            pattern: foundPattern,
            step: 'dob',
            firstTimeDob: !requiresDob,
          } satisfies LoginNavState,
        });
        return;
      }

      phonePatternRef.current = foundPattern;
      setFirstTimeDob(!requiresDob);
      setStep('dob');
    } catch (error) {
      console.error('Erro ao fazer login (etapa 1):', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao acessar o portal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isoDate = brDateToIso(birthDate);
    if (!isoDate || !phonePatternRef.current) {
      toast({
        title: 'Data inválida',
        description: 'Informe sua data de nascimento no formato DD/MM/AAAA.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = firstTimeDob
        ? await supabase.rpc('set_patient_dob_and_login_v2', {
            phone_search: phonePatternRef.current,
            new_dob: isoDate,
            tenant_slug: pathSlug,
          })
        : await supabase.rpc('check_patient_login_with_dob_v2', {
            phone_search: phonePatternRef.current,
            dob_check: isoDate,
            tenant_slug: pathSlug,
          });

      if (error) {
        console.error(
          `Erro RPC ${firstTimeDob ? 'set_patient_dob_and_login_v2' : 'check_patient_login_with_dob_v2'}:`,
          error,
        );
      }

      const row = Array.isArray(data) ? data[0] : data;

      if (!row?.telefone) {
        toast({
          title: firstTimeDob ? 'Não foi possível cadastrar' : 'Data não confere',
          description: firstTimeDob
            ? 'A data informada parece inválida. Confira o ano e tente novamente.'
            : 'A data de nascimento não bate com o cadastro. Verifique com seu nutricionista se necessário.',
          variant: 'destructive',
        });
        return;
      }

      finalizeLogin(row.telefone, row.nome ?? null);
    } catch (error) {
      console.error('Erro ao fazer login (etapa 2):', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao acessar o portal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setBirthDate('');
    phonePatternRef.current = '';
    setFirstTimeDob(false);
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6 animate-gradient"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(-45deg, #000000, #18181b, #000000, #18181b, #000000)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
      }}
    >
      {/* Atalho do painel admin no canto superior direito da página */}
      {adminUid && (
        <button
          onClick={() => navigate(`/admin?uid=${adminUid}`)}
          className="fixed top-4 right-4 z-20 flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors px-3 py-1.5 rounded-lg bg-zinc-900/70 border border-amber-500/20 backdrop-blur-sm hover:bg-zinc-800/80"
        >
          <Settings className="w-3.5 h-3.5" />
          Painel admin
        </button>
      )}

      {/* Orbs decorativos âmbar */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse bg-amber-500/10" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse bg-yellow-500/10"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl animate-pulse bg-orange-500/10"
          style={{ animationDelay: '2s' }}
        />
      </div>

      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <Card
          className="backdrop-blur-xl shadow-2xl relative overflow-hidden bg-zinc-900/70 border-zinc-800/50"
          style={{
            backgroundColor: 'rgba(24, 24, 27, 0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '1rem',
            boxShadow:
              '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(245, 158, 11, 0.1)',
          }}
        >
          <div
            className="absolute inset-0 rounded-lg opacity-50"
            style={{
              background:
                'linear-gradient(45deg, transparent, rgba(245, 158, 11, 0.2), transparent, rgba(234, 179, 8, 0.2), transparent)',
              backgroundSize: '200% 200%',
              animation: 'gradientShift 3s ease infinite',
              zIndex: -1,
            }}
          />

          <CardHeader className="text-center space-y-4 relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-24 h-24 mx-auto relative"
            >
              <div className="w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-500/20 overflow-hidden">
                <img
                  src={isOwnerRoute ? '/fmteam-logo.png' : (brand?.logoUrl || '/fm-logo.png')}
                  alt="Logo"
                  className="w-[85%] h-[85%] object-contain"
                  onError={(e) => {
                    // Se o logo (do dono ou personalizado) falhar, cai no logo padrão.
                    const img = e.currentTarget;
                    if (!img.src.endsWith('/fm-logo.png')) img.src = '/fm-logo.png';
                  }}
                />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400 border-r-amber-600"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-6 h-6 text-amber-300" />
              </motion.div>
            </motion.div>
            <div>
              <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">
                Meu Acompanhamento
              </CardTitle>
              <CardDescription
                className={
                  isOwnerRoute
                    ? 'mt-2 font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600'
                    : 'mt-2 font-semibold tracking-wide text-slate-300'
                }
                style={!isOwnerRoute && brand?.primaryColor ? { color: brand.primaryColor } : undefined}
              >
                {isOwnerRoute ? 'Consultoria Esportiva FMTeam' : (brand?.tagline || 'Construindo Resultados')}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent style={{ padding: '0 2rem 2.5rem 2rem', position: 'relative', zIndex: 10 }}>
            {step === 'phone' ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-slate-300 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Número de Telefone
                  </Label>
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="(00) 00000-0000 ou +55 (00) 00000-0000"
                    value={telefone}
                    onChange={handlePhoneChange}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 h-14 text-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    disabled={loading}
                    autoFocus
                  />
                  <p className="text-xs text-slate-400">
                    Digite o seu telefone (aceita código do país +55)
                  </p>
                </div>

                <motion.div
                  whileHover={{ scale: loading || normalizePhone(telefone).length < 10 ? 1 : 1.02 }}
                  whileTap={{ scale: loading || normalizePhone(telefone).length < 10 ? 1 : 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={loading || normalizePhone(telefone).length < 10}
                    className="w-full h-14 text-lg transition-all relative overflow-hidden bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 text-black font-semibold"
                    style={{
                      opacity: loading || normalizePhone(telefone).length < 10 ? 0.6 : 1,
                      cursor:
                        loading || normalizePhone(telefone).length < 10 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Acessando...
                        </>
                      ) : (
                        <>
                          Continuar
                          <motion.span
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="ml-2"
                          >
                            →
                          </motion.span>
                        </>
                      )}
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    />
                  </Button>
                </motion.div>
              </form>
            ) : (
              <form onSubmit={handleDobSubmit} className="space-y-6">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleBackToPhone}
                    disabled={loading}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Trocar telefone
                  </button>
                  <Label htmlFor="birthDate" className="text-slate-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {firstTimeDob ? 'Cadastre sua Data de Nascimento' : 'Data de Nascimento'}
                  </Label>
                  <Input
                    id="birthDate"
                    type="text"
                    inputMode="numeric"
                    autoComplete="bday"
                    placeholder="DD/MM/AAAA"
                    value={birthDate}
                    onChange={(e) => setBirthDate(maskBrDate(e.target.value))}
                    maxLength={10}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 h-14 text-lg tracking-wider focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    disabled={loading}
                    autoFocus
                  />
                  {firstTimeDob ? (
                    <p className="text-xs text-amber-300/90">
                      Primeiro acesso — esta data será salva e usada nos próximos logins. Digite com
                      cuidado.
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Confirme com a data de nascimento cadastrada no seu acompanhamento.
                    </p>
                  )}
                </div>

                <motion.div
                  whileHover={{ scale: loading || birthDate.length !== 10 ? 1 : 1.02 }}
                  whileTap={{ scale: loading || birthDate.length !== 10 ? 1 : 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={loading || birthDate.length !== 10}
                    className="w-full h-14 text-lg transition-all relative overflow-hidden bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 text-black font-semibold"
                    style={{
                      opacity: loading || birthDate.length !== 10 ? 0.6 : 1,
                      cursor: loading || birthDate.length !== 10 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Acessando...
                        </>
                      ) : (
                        <>
                          {firstTimeDob ? 'Cadastrar e Acessar' : 'Acessar Portal'}
                          <motion.span
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="ml-2"
                          >
                            →
                          </motion.span>
                        </>
                      )}
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    />
                  </Button>
                </motion.div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <p className="text-center text-sm text-slate-400">
                Constância é o segredo dos resultados!
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6 mb-8">
          Problemas para acessar? Entre em contato com seu treinador
        </p>

        <div className="flex justify-center w-full mt-4">
          <img
            src="/fm-myshape-logo.png"
            alt="My Shape"
            className="h-10 sm:h-12 object-contain drop-shadow-2xl opacity-90 hover:opacity-100 transition-opacity"
          />
        </div>
      </motion.div>
    </div>
  );
}
