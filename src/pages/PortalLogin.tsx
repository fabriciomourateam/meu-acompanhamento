import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Phone, Sparkles, Settings, Calendar, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PortalLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { toast } = useToast();

  const refParam = (searchParams.get('n') || searchParams.get('ref') || '').toLowerCase();
  const isFmTeamRoute = location.pathname === '/portal-fmteam';
  const isFabricio = isFmTeamRoute || ['fm', 'fabricio', 'fabriciomoura'].includes(refParam);
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const hasRedirected = useRef(false);
  const [adminUid, setAdminUid] = useState<string | null>(null);

  // Fluxo de login em 2 etapas:
  //  phone → confirma telefone e descobre se exige data de nascimento
  //  dob   → pede e valida data de nascimento (segundo fator)
  const [step, setStep] = useState<'phone' | 'dob'>('phone');
  const [birthDate, setBirthDate] = useState(''); // YYYY-MM-DD
  // Pattern do telefone validado pra reusar no submit da etapa 2 sem reformatar
  const phonePatternRef = useRef<string>('');

  // Extrair slug da rota atual: /portal-evaner → "evaner"
  const pathSlug = location.pathname.startsWith('/portal-')
    ? location.pathname.slice('/portal-'.length)
    : null;

  // Buscar uid do trainer pelo checkin_slug na tabela profiles
  useEffect(() => {
    if (!pathSlug) return;
    supabase
      .from('profiles')
      .select('id')
      .eq('checkin_slug', pathSlug)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.id) setAdminUid(data.id);
      });
  }, [pathSlug]);

  // Salvar rota de login ao visitar a página
  // Se é uma rota de portal de trainer (/portal-xxx), sempre salvar
  // Se é rota genérica (/portal ou /), só salvar se não houver rota já salva
  useEffect(() => {
    if (pathSlug) {
      localStorage.setItem('portal_login_route', location.pathname);
    } else if (!localStorage.getItem('portal_login_route')) {
      localStorage.setItem('portal_login_route', location.pathname);
    }
  }, [pathSlug, location.pathname]);

  // Verificar se há um token salvo (para PWA instalado)
  useEffect(() => {
    if (hasRedirected.current) return;
    const savedToken = localStorage.getItem('portal_access_token');
    if (savedToken) {
      hasRedirected.current = true;
      navigate(`/portal/${savedToken}`, { replace: true });
    }
  }, [navigate]);

  // Normalizar telefone (preparar para busca)
  const normalizePhone = (phone: string): string => {
    // Remove tudo que não é número
    const numbersOnly = phone.replace(/\D/g, '');
    return numbersOnly;
  };

  // Obter apenas o número sem código do país (para formatação visual e busca flexível)
  const getNationalNumber = (phone: string): string => {
    const numbersOnly = phone.replace(/\D/g, '');

    // Remove código do país (55) se presente no início e tiver tamanho suficiente
    if (numbersOnly.startsWith('55') && numbersOnly.length > 11) {
      return numbersOnly.slice(2);
    }
    return numbersOnly;
  };

  // Formatar telefone enquanto digita
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
    const formatted = formatPhone(e.target.value);
    setTelefone(formatted);
  };

  // Gera o pattern wildcard usado pela RPC pra encontrar o telefone independente
  // de espaços, parênteses ou traços que possam estar no banco.
  const buildPhonePattern = (digits: string): string =>
    '%' + digits.split('').join('%') + '%';

  // Aplica máscara DD/MM/YYYY enquanto o usuário digita
  const maskBrDate = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  // Converte DD/MM/YYYY (BR) → YYYY-MM-DD (ISO) validando ano/mês/dia.
  // Retorna null se a data for inválida ou impossível (ex.: 31/02).
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
    // Valida que o Date construído tem os mesmos campos (rejeita 31/02 etc.)
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
      return null;
    }
    return `${yyyy}-${mm}-${dd}`;
  };

  // Finaliza o login: gera token, salva no localStorage e redireciona.
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

  // Etapa 1: validar telefone. Se o paciente tem data cadastrada, avança pra
  // etapa 2; senão, loga direto (legacy graceful pros 97 pacientes que ainda
  // não têm data_nascimento na base).
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedPhone = normalizePhone(telefone);
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
      // Tenta com o número completo (com 55 se digitado) e, se não achar,
      // tenta sem o código do país.
      const candidatePatterns: string[] = [buildPhonePattern(normalizedPhone)];
      if (normalizedPhone.length > 10 && normalizedPhone.startsWith('55')) {
        candidatePatterns.push(buildPhonePattern(normalizedPhone.slice(2)));
      }

      let foundPattern: string | null = null;
      let requiresDob = false;

      for (const pattern of candidatePatterns) {
        const { data, error } = await supabase.rpc('check_patient_exists', {
          phone_search: pattern,
        });
        if (error) {
          console.error('Erro RPC check_patient_exists:', error);
          continue;
        }
        const row = Array.isArray(data) ? data[0] : data;
        if (row?.found) {
          foundPattern = pattern;
          requiresDob = !!row.requires_dob;
          break;
        }
      }

      if (!foundPattern) {
        toast({
          title: 'Paciente não encontrado',
          description:
            'Não encontramos nenhum cadastro com este telefone. Verifique se digitou corretamente.',
          variant: 'destructive',
        });
        return;
      }

      phonePatternRef.current = foundPattern;

      // Paciente sem data_nascimento no banco: libera direto (compatibilidade)
      if (!requiresDob) {
        const { data: loginData } = await supabase.rpc('check_patient_login_with_dob', {
          phone_search: foundPattern,
          dob_check: null,
        });
        const loginRow = Array.isArray(loginData) ? loginData[0] : loginData;
        if (loginRow?.telefone) {
          finalizeLogin(loginRow.telefone, loginRow.nome ?? null);
        } else {
          toast({
            title: 'Erro inesperado',
            description: 'Não foi possível liberar o acesso. Fale com seu treinador.',
            variant: 'destructive',
          });
        }
        return;
      }

      // Tem data cadastrada — avança pra etapa de confirmação
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

  // Etapa 2: validar data de nascimento contra o telefone já confirmado
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
      const { data, error } = await supabase.rpc('check_patient_login_with_dob', {
        phone_search: phonePatternRef.current,
        dob_check: isoDate,
      });

      if (error) {
        console.error('Erro RPC check_patient_login_with_dob:', error);
      }

      const row = Array.isArray(data) ? data[0] : data;

      if (!row?.telefone) {
        toast({
          title: 'Data não confere',
          description:
            'A data de nascimento não bate com o cadastro. Verifique com seu nutricionista se necessário.',
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
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6 animate-gradient"
      style={{
        minHeight: '100vh',
        background: isFabricio
          ? 'linear-gradient(-45deg, #000000, #18181b, #000000, #18181b, #000000)'
          : 'linear-gradient(-45deg, #0f172a, #1e293b, #0f172a, #1e293b, #0f172a)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
      }}
    >
      {/* Orbs decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse ${isFabricio ? 'bg-amber-500/10' : 'bg-blue-500/10'}`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse ${isFabricio ? 'bg-yellow-500/10' : 'bg-purple-500/10'}`} style={{ animationDelay: '1s' }} />
        <div className={`absolute top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl animate-pulse ${isFabricio ? 'bg-orange-500/10' : 'bg-cyan-500/10'}`} style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid pattern sutil */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <Card
          className={`backdrop-blur-xl shadow-2xl relative overflow-hidden ${isFabricio ? 'bg-zinc-900/70 border-zinc-800/50' : 'bg-slate-800/70 border-slate-700/50'}`}
          style={{
            backgroundColor: isFabricio ? 'rgba(24, 24, 27, 0.7)' : 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: isFabricio ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(51, 65, 85, 0.5)',
            borderRadius: '1rem',
            boxShadow: isFabricio ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(245, 158, 11, 0.1)' : '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Borda gradiente animada */}
          <div className="absolute inset-0 rounded-lg opacity-50" style={{
            background: isFabricio
              ? 'linear-gradient(45deg, transparent, rgba(245, 158, 11, 0.2), transparent, rgba(234, 179, 8, 0.2), transparent)'
              : 'linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.3), transparent, rgba(147, 51, 234, 0.3), transparent)',
            backgroundSize: '200% 200%',
            animation: 'gradientShift 3s ease infinite',
            zIndex: -1
          }} />

          <CardHeader className="text-center space-y-4 relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-24 h-24 mx-auto relative"
            >
              {isFabricio ? (
                // Estilo exlusivo Fabricio Moura Team (Preto, Dourado/Amarelo)
                <div className="w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-500/20 overflow-hidden">
                  <img src="/fm-logo.png" alt="FMTeam Logo" className="w-[85%] h-[85%] object-contain" />
                </div>
              ) : (
                // Estilo Padrão (Azul/Roxo)
                <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className={`absolute inset-0 rounded-full border-2 border-transparent ${isFabricio ? 'border-t-amber-400 border-r-amber-600' : 'border-t-blue-400 border-r-purple-400'
                  }`}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className={`w-6 h-6 ${isFabricio ? 'text-amber-300' : 'text-yellow-400'}`} />
              </motion.div>
            </motion.div>
            <div>
              <CardTitle className={`text-3xl font-bold bg-clip-text text-transparent ${isFabricio
                ? 'bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600'
                : 'bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400'
                }`}>
                {isFabricio ? 'Consultoria Esportiva FMTeam' : 'Meu Acompanhamento'}
              </CardTitle>
              <CardDescription className="text-slate-400 mt-2">
                {isFabricio ? 'Construindo Resultados' : 'Acesse seu portal de evolução'}
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
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 h-14 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                    className={`w-full h-14 text-lg transition-all relative overflow-hidden ${isFabricio
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 text-black font-semibold'
                      : 'bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 text-white'
                      }`}
                    style={{
                      opacity: loading || normalizePhone(telefone).length < 10 ? 0.6 : 1,
                      cursor: loading || normalizePhone(telefone).length < 10 ? 'not-allowed' : 'pointer',
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
                    Data de Nascimento
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
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 h-14 text-lg tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    disabled={loading}
                    autoFocus
                  />
                  <p className="text-xs text-slate-400">
                    Confirme com a data de nascimento cadastrada no seu acompanhamento.
                  </p>
                </div>

                <motion.div
                  whileHover={{ scale: loading || birthDate.length !== 10 ? 1 : 1.02 }}
                  whileTap={{ scale: loading || birthDate.length !== 10 ? 1 : 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={loading || birthDate.length !== 10}
                    className={`w-full h-14 text-lg transition-all relative overflow-hidden ${isFabricio
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 text-black font-semibold'
                      : 'bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 text-white'
                      }`}
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
                          Acessar Portal
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

            {adminUid && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => navigate(`/admin?uid=${adminUid}`)}
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-700/30"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Painel admin
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6 mb-8">
          Problemas para acessar? Entre em contato com seu treinador
        </p>

        {isFabricio && (
          <div className="flex justify-center w-full mt-4">
            <img src="/fm-myshape-logo.png" alt="My Shape" className="h-10 sm:h-12 object-contain drop-shadow-2xl opacity-90 hover:opacity-100 transition-opacity" />
          </div>
        )}
      </motion.div>
    </div>
  );
}
