import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { Phone, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = usePatientAuth();
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+55');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 11);
    
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 7) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    } else if (limited.length <= 11) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    }
    
    return limited;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      alert('Digite um número de telefone válido');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${countryCode}${cleanPhone}`;
      
      // Verificar se paciente existe
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id, nome, telefone, user_id')
        .or(`telefone.eq.${cleanPhone},telefone.eq.${fullPhone},telefone.ilike.%${cleanPhone}%`)
        .maybeSingle();

      if (patientError || !patientData) {
        throw new Error('Paciente não encontrado');
      }

      // Enviar OTP
      const { error: authError } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
        options: {
          shouldCreateUser: !patientData.user_id, // Criar usuário se não tiver vinculado
        }
      });

      if (authError) {
        throw authError;
      }

      setOtpSent(true);
      alert('Código enviado! Verifique seu WhatsApp/SMS');
    } catch (error: any) {
      alert(error.message || 'Não foi possível enviar o código');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const fullPhone = `${countryCode}${cleanPhone}`;
      
      // Verificar OTP
      const { data: authData, error: authError } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: 'sms',
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Vincular paciente ao usuário se necessário
        const { data: patientData } = await supabase
          .from('patients')
          .select('id, user_id')
          .or(`telefone.eq.${cleanPhone},telefone.eq.${fullPhone}`)
          .maybeSingle();

        if (patientData && !patientData.user_id) {
          await supabase
            .from('patients')
            .update({ user_id: authData.user.id })
            .eq('id', patientData.id);
        }

        // Redirecionar para o portal
        navigate('/me');
      }
    } catch (error: any) {
      alert(error.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  if (otpSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="bg-slate-800/60 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Verificação</CardTitle>
              <CardDescription className="text-slate-400">
                Digite o código enviado para seu telefone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="otp" className="text-slate-300">Código de Verificação</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest bg-slate-700/50 border-slate-600 text-white"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-slate-800/60 backdrop-blur-sm border-slate-700/50 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Phone className="w-10 h-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-white">
                Portal do Aluno
              </CardTitle>
              <CardDescription className="text-slate-400 mt-2">
                Acesse seu portal de evolução
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="countryCode" className="text-slate-300">Código do País</Label>
                <Input
                  id="countryCode"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  placeholder="+55"
                  className="bg-slate-700/50 border-slate-600 text-white mb-2"
                />
                <Label htmlFor="phone" className="text-slate-300 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Número de Telefone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 h-12 text-lg"
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-slate-400">
                  Digite o telefone cadastrado no sistema
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || phone.length < 14}
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Código'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <p className="text-center text-sm text-slate-400">
                💪 Acompanhe sua evolução e conquistas
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          Problemas para acessar? Entre em contato com seu treinador
        </p>
      </motion.div>
    </div>
  );
}

