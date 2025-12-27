import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Phone, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PortalLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  // Verificar se há um token salvo (para PWA instalado)
  useEffect(() => {
    const savedToken = localStorage.getItem('portal_access_token');
    if (savedToken) {
      // Redirecionar automaticamente para o portal com o token salvo
      navigate(`/portal/${savedToken}`, { replace: true });
    } else {
      setCheckingToken(false);
    }
  }, [navigate]);

  // Mostrar loading enquanto verifica token
  if (checkingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  // Normalizar telefone (remove código do país e formatação)
  const normalizePhone = (phone: string): string => {
    // Remove tudo que não é número
    const numbersOnly = phone.replace(/\D/g, '');
    
    // Remove código do país (55) se presente
    let cleanPhone = numbersOnly;
    if (numbersOnly.startsWith('55') && numbersOnly.length > 10) {
      cleanPhone = numbersOnly.substring(2);
    }
    
    // Remove 9 extra se presente (caso tenha digitado 9 antes do DDD)
    if (cleanPhone.length === 11 && cleanPhone.startsWith('9')) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    return cleanPhone;
  };

  // Formatar telefone enquanto digita (aceita código do país)
  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 13 dígitos (55 + 11 dígitos do telefone)
    const limited = numbers.slice(0, 13);
    
    // Se começa com 55 (código do país), formata diferente
    if (limited.startsWith('55') && limited.length > 2) {
      const countryCode = limited.slice(0, 2);
      const phonePart = limited.slice(2);
      
      if (phonePart.length <= 2) {
        return `+${countryCode} (${phonePart}`;
      } else if (phonePart.length <= 7) {
        return `+${countryCode} (${phonePart.slice(0, 2)}) ${phonePart.slice(2)}`;
      } else if (phonePart.length <= 11) {
        return `+${countryCode} (${phonePart.slice(0, 2)}) ${phonePart.slice(2, 7)}-${phonePart.slice(7)}`;
      }
    }
    
    // Formatação normal sem código do país: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Normalizar telefone (remove código do país, formatação, etc)
    const normalizedPhone = normalizePhone(telefone);
    
    if (normalizedPhone.length < 10) {
      toast({
        title: 'Telefone inválido',
        description: 'Digite um número de telefone válido',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      console.log('📱 Telefone original digitado:', telefone);
      console.log('🔍 Telefone normalizado para busca:', normalizedPhone);

      // Tentar buscar com diferentes formatos
      let patient = null;

      // Formato 1: Apenas números normalizados (11999999999 ou 3497226444)
      const result1 = await supabase
        .from('patients')
        .select('telefone, nome')
        .eq('telefone', normalizedPhone)
        .maybeSingle();

      if (result1.data) {
        patient = result1.data;
        console.log('✅ Encontrado com formato numérico normalizado:', normalizedPhone);
      }

      // Formato 2: Com formatação (11) 99999-9999 ou (34) 97226-4444
      if (!patient && normalizedPhone.length >= 10) {
        const formatted = `(${normalizedPhone.slice(0, 2)}) ${normalizedPhone.slice(2, 7)}-${normalizedPhone.slice(7)}`;
        const result2 = await supabase
          .from('patients')
          .select('telefone, nome')
          .eq('telefone', formatted)
          .maybeSingle();

        if (result2.data) {
          patient = result2.data;
          console.log('✅ Encontrado com formato formatado:', formatted);
        }
      }

      // Formato 3: Busca pelos últimos 8 dígitos (mais flexível)
      if (!patient) {
        const last8Digits = normalizedPhone.slice(-8);
        const result3 = await supabase
          .from('patients')
          .select('telefone, nome')
          .ilike('telefone', `%${last8Digits}`)
          .limit(1)
          .maybeSingle();

        if (result3.data) {
          patient = result3.data;
          console.log('✅ Encontrado com busca pelos últimos 8 dígitos');
        }
      }

      // Formato 4: Busca parcial (LIKE) como último recurso
      if (!patient) {
        const result4 = await supabase
          .from('patients')
          .select('telefone, nome')
          .ilike('telefone', `%${normalizedPhone}%`)
          .limit(1)
          .maybeSingle();

        if (result4.data) {
          patient = result4.data;
          console.log('✅ Encontrado com busca parcial');
        }
      }

      if (!patient) {
        console.log('❌ Paciente não encontrado com telefone normalizado:', normalizedPhone);
        toast({
          title: 'Paciente não encontrado',
          description: 'Não encontramos nenhum cadastro com este telefone. Verifique se digitou corretamente.',
          variant: 'destructive'
        });
        return;
      }

      // Usar o telefone exato do banco de dados
      const patientPhone = patient.telefone;
      
      // Gerar token temporário (válido por 24h)
      const token = btoa(`${patientPhone}:${Date.now()}`);
      
      // Salvar token no localStorage para validação
      localStorage.setItem('portal_token', token);
      localStorage.setItem('portal_phone', patientPhone);
      
      console.log('✅ Token gerado para telefone:', patientPhone);
      
      toast({
        title: 'Acesso liberado! 🎉',
        description: `Bem-vindo(a), ${patient.nome}!`
      });

      // Redirecionar para o portal com o token
      navigate(`/portal/${token}`);
      
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao acessar o portal',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 animate-gradient"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e1b4b 75%, #0f172a 100%)',
        backgroundSize: '400% 400%',
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating orbs with gradient */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl"
          animate={{
            x: [0, 120, 0],
            y: [0, -60, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute bottom-40 right-1/3 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 80, 0],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
        />

        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Animated gradient lines */}
        <motion.div
          className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
        />
      </div>


      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
        style={{
          width: '100%',
          maxWidth: '28rem',
        }}
      >
        <Card 
          className="bg-slate-800/70 backdrop-blur-xl border-slate-700/50 shadow-2xl relative overflow-hidden"
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(71, 85, 105, 0.4)',
            borderRadius: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            padding: '0',
            overflow: 'hidden',
          }}
        >
          {/* Shine effect on card */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            style={{
              transform: 'translateX(-100%)',
            }}
            animate={{
              transform: ['translateX(-100%)', 'translateX(100%)'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut",
            }}
          />
          
          {/* Gradient border effect */}
          <div 
            className="absolute inset-0 rounded-[1.5rem]"
            style={{
              padding: '1px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3), rgba(59, 130, 246, 0.3))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />
          <CardHeader 
            className="text-center space-y-4 relative z-10"
            style={{
              textAlign: 'center',
              padding: '2.5rem 2rem 1.5rem 2rem',
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
              className="relative mx-auto mb-4"
            >
              <div 
                className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-full flex items-center justify-center relative"
                style={{
                  width: '6rem',
                  height: '6rem',
                  background: 'linear-gradient(135deg, #3b82f6, #9333ea, #06b6d4)',
                  boxShadow: '0 20px 40px -10px rgba(59, 130, 246, 0.6), 0 0 0 4px rgba(59, 130, 246, 0.1)',
                }}
              >
                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.3), transparent)',
                  }}
                />
                <User className="w-12 h-12 text-white relative z-10" style={{ width: '3rem', height: '3rem', color: 'white' }} />
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </motion.div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <CardTitle 
                className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"
                style={{
                  fontSize: '2rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #22d3ee)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.02em',
                }}
              >
                Meu Acompanhamento
              </CardTitle>
              <CardDescription 
                className="text-slate-300 mt-2"
                style={{
                  color: '#cbd5e1',
                  marginTop: '0.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: '400',
                }}
              >
                Acompanhe sua evolução e conquistas
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent style={{ padding: '0 2rem 2.5rem 2rem', position: 'relative', zIndex: 10 }}>
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              onSubmit={handleSubmit} 
              className="space-y-6" 
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              <div className="space-y-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Label 
                  htmlFor="telefone" 
                  className="text-slate-200 flex items-center gap-2"
                  style={{
                    color: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                  }}
                >
                  <Phone className="w-4 h-4 text-blue-400" style={{ width: '1rem', height: '1rem', color: '#60a5fa' }} />
                  Número de Telefone
                </Label>
                <motion.div
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="(00) 00000-0000 ou +55 (00) 00000-0000"
                    value={telefone}
                    onChange={handlePhoneChange}
                    className="bg-slate-700/60 border-slate-600/80 text-white placeholder:text-slate-400 h-14 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    disabled={loading}
                    autoFocus
                    style={{
                      backgroundColor: 'rgba(51, 65, 85, 0.7)',
                      border: '1.5px solid rgba(71, 85, 105, 0.6)',
                      borderRadius: '0.75rem',
                      color: 'white',
                      height: '3.5rem',
                      fontSize: '1.125rem',
                      padding: '0.875rem 1.25rem',
                      width: '100%',
                      transition: 'all 0.3s ease',
                    }}
                  />
                </motion.div>
                <p 
                  className="text-xs text-slate-400"
                  style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    marginTop: '0.25rem',
                  }}
                >
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
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-500 hover:via-purple-500 hover:to-cyan-500 shadow-xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all relative overflow-hidden group"
                  style={{
                    width: '100%',
                    height: '3.5rem',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #2563eb, #9333ea, #0891b2)',
                    boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.4), 0 10px 10px -5px rgba(59, 130, 246, 0.2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    cursor: loading || normalizePhone(telefone).length < 10 ? 'not-allowed' : 'pointer',
                    opacity: loading || normalizePhone(telefone).length < 10 ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                  }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    style={{
                      transform: 'translateX(-100%)',
                    }}
                    animate={{
                      transform: loading || normalizePhone(telefone).length < 10 ? 'translateX(-100%)' : ['translateX(-100%)', 'translateX(100%)'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: loading || normalizePhone(telefone).length < 10 ? 0 : Infinity,
                      repeatDelay: 1,
                      ease: "easeInOut",
                    }}
                  />
                  <span className="relative z-10 flex items-center justify-center">
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', display: 'inline-block' }} />
                        Acessando...
                      </>
                    ) : (
                      <>
                        Acessar Portal
                        <motion.span
                          className="ml-2"
                          animate={{
                            x: [0, 5, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          →
                        </motion.span>
                      </>
                    )}
                  </span>
                </Button>
              </motion.div>
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-6 pt-6 border-t border-slate-700/50"
              style={{
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(51, 65, 85, 0.5)',
              }}
            >
              <div className="flex items-center justify-center gap-2 text-slate-300">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="text-xl"
                >
                  💪
                </motion.div>
                <p 
                  className="text-center text-sm font-medium"
                  style={{
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    color: '#cbd5e1',
                    fontWeight: '500',
                  }}
                >
                  Constância é o segredo dos resultados!
                </p>
              </div>
            </motion.div>
          </CardContent>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="text-center text-sm text-slate-400 mt-6"
          style={{
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#94a3b8',
            marginTop: '1.5rem',
          }}
        >
          Problemas para acessar? Entre em contato com seu treinador
        </motion.p>
      </motion.div>
    </div>
  );
}
