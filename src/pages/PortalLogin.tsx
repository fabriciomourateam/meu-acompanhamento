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
    let cleaned = numbersOnly;
    if (cleaned.startsWith('55') && cleaned.length > 11) {
      cleaned = cleaned.slice(2);
    }
    
    // Remove o 9 extra se houver (formato antigo)
    if (cleaned.length === 11 && cleaned[2] === '9') {
      // Mantém o formato com 9
    }
    
    return cleaned;
  };

  // Formatar telefone enquanto digita
  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aceita até 13 dígitos (55 + 11 dígitos)
    const limited = numbers.slice(0, 13);
    
    // Se começar com 55, formata com código do país
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
    
    // Formatação normal sem código do país
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
      console.log('🔍 Buscando paciente com telefone normalizado:', normalizedPhone);

      // Tentar buscar com diferentes formatos
      let patient = null;
      let error = null;

      // Formato 1: Apenas números (11999999999)
      const result1 = await supabase
        .from('patients')
        .select('telefone, nome')
        .eq('telefone', normalizedPhone)
        .maybeSingle();

      if (result1.data) {
        patient = result1.data;
        console.log('✅ Encontrado com formato numérico:', normalizedPhone);
      }

      // Formato 2: Com formatação (11) 99999-9999
      if (!patient && normalizedPhone.length === 11) {
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

      // Formato 3: Busca pelos últimos 8 dígitos
      if (!patient && normalizedPhone.length >= 8) {
        const last8 = normalizedPhone.slice(-8);
        const result3 = await supabase
          .from('patients')
          .select('telefone, nome')
          .ilike('telefone', `%${last8}`)
          .limit(1)
          .maybeSingle();

        if (result3.data) {
          patient = result3.data;
          console.log('✅ Encontrado com últimos 8 dígitos');
        }
      }

      // Formato 4: Busca parcial (LIKE)
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
        background: 'linear-gradient(-45deg, #0f172a, #1e293b, #0f172a, #1e293b, #0f172a)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
      }}
    >
      {/* Orbs decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid pattern sutil */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card 
          className="bg-slate-800/70 backdrop-blur-xl border-slate-700/50 shadow-2xl relative overflow-hidden"
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(51, 65, 85, 0.5)',
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Borda gradiente animada */}
          <div className="absolute inset-0 rounded-lg opacity-50" style={{
            background: 'linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.3), transparent, rgba(147, 51, 234, 0.3), transparent)',
            backgroundSize: '200% 200%',
            animation: 'gradientShift 3s ease infinite',
            zIndex: -1
          }} />

          <CardHeader className="text-center space-y-4 relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-24 h-24 mx-auto relative"
            >
              <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
                <User className="w-12 h-12 text-white" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400 border-r-purple-400"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </motion.div>
            </motion.div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Meu Acompanhamento
              </CardTitle>
              <CardDescription className="text-slate-400 mt-2">
                Acesse seu portal de evolução
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent style={{ padding: '0 2rem 2.5rem 2rem', position: 'relative', zIndex: 10 }}>
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              onSubmit={handleSubmit} 
              className="space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="space-y-2"
              >
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
              </motion.div>

              <motion.div
                whileHover={{ scale: loading || normalizePhone(telefone).length < 10 ? 1 : 1.02 }}
                whileTap={{ scale: loading || normalizePhone(telefone).length < 10 ? 1 : 0.98 }}
              >
                <Button
                  type="submit"
                  disabled={loading || normalizePhone(telefone).length < 10}
                  className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all relative overflow-hidden"
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
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-6 pt-6 border-t border-slate-700/50"
            >
              <p className="text-center text-sm text-slate-400">
                Constância é o segredo dos resultados!
              </p>
            </motion.div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          Problemas para acessar? Entre em contato com seu treinador
        </p>
      </motion.div>
    </div>
  );
}
