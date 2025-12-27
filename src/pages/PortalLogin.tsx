import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Phone } from 'lucide-react';
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

  // Formatar telefone enquanto digita
  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11);
    
    // Formata: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
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
    
    // Remove formatação para buscar no banco
    const cleanPhone = telefone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      toast({
        title: 'Telefone inválido',
        description: 'Digite um número de telefone válido',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🔍 Buscando paciente com telefone:', cleanPhone);

      // Tentar buscar com diferentes formatos
      let patient = null;
      let error = null;

      // Formato 1: Apenas números (11999999999)
      const result1 = await supabase
        .from('patients')
        .select('telefone, nome')
        .eq('telefone', cleanPhone)
        .maybeSingle();

      if (result1.data) {
        patient = result1.data;
        console.log('✅ Encontrado com formato numérico:', cleanPhone);
      }

      // Formato 2: Com formatação (11) 99999-9999
      if (!patient && cleanPhone.length === 11) {
        const formatted = `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
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

      // Formato 3: Busca parcial (LIKE)
      if (!patient) {
        const result3 = await supabase
          .from('patients')
          .select('telefone, nome')
          .ilike('telefone', `%${cleanPhone}%`)
          .limit(1)
          .maybeSingle();

        if (result3.data) {
          patient = result3.data;
          console.log('✅ Encontrado com busca parcial');
        }
      }

      if (!patient) {
        console.log('❌ Paciente não encontrado com telefone:', cleanPhone);
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
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
        style={{
          width: '100%',
          maxWidth: '28rem',
        }}
      >
        <Card 
          className="bg-slate-800/60 backdrop-blur-sm border-slate-700/50 shadow-2xl"
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(51, 65, 85, 0.5)',
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            padding: '0',
            overflow: 'hidden',
          }}
        >
          <CardHeader 
            className="text-center space-y-4"
            style={{
              textAlign: 'center',
              padding: '2rem 2rem 1rem 2rem',
            }}
          >
            <div 
              className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
              style={{
                width: '5rem',
                height: '5rem',
                margin: '0 auto 1rem auto',
                background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)',
              }}
            >
              <User className="w-10 h-10 text-white" style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
            </div>
            <div>
              <CardTitle 
                className="text-3xl font-bold text-white"
                style={{
                  fontSize: '1.875rem',
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: '0.5rem',
                }}
              >
                Portal do Aluno
              </CardTitle>
              <CardDescription 
                className="text-slate-400 mt-2"
                style={{
                  color: '#94a3b8',
                  marginTop: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                Acesse seu portal de evolução
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent style={{ padding: '0 2rem 2rem 2rem' }}>
            <form onSubmit={handleSubmit} className="space-y-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="space-y-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Label 
                  htmlFor="telefone" 
                  className="text-slate-300 flex items-center gap-2"
                  style={{
                    color: '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  <Phone className="w-4 h-4" style={{ width: '1rem', height: '1rem' }} />
                  Número de Telefone
                </Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={handlePhoneChange}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 h-12 text-lg"
                  disabled={loading}
                  autoFocus
                  style={{
                    backgroundColor: 'rgba(51, 65, 85, 0.6)',
                    border: '1px solid rgba(71, 85, 105, 0.8)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    height: '3rem',
                    fontSize: '1.125rem',
                    padding: '0.75rem 1rem',
                    width: '100%',
                  }}
                />
                <p 
                  className="text-xs text-slate-400"
                  style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    marginTop: '0.25rem',
                  }}
                >
                  Digite o telefone cadastrado no sistema
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || telefone.length < 14}
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
                style={{
                  width: '100%',
                  height: '3rem',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  background: 'linear-gradient(to right, #2563eb, #9333ea)',
                  boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: loading || telefone.length < 14 ? 'not-allowed' : 'pointer',
                  opacity: loading || telefone.length < 14 ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', display: 'inline-block' }} />
                    Acessando...
                  </>
                ) : (
                  'Acessar Portal'
                )}
              </Button>
            </form>

            <div 
              className="mt-6 pt-6 border-t border-slate-700/50"
              style={{
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(51, 65, 85, 0.5)',
              }}
            >
              <p 
                className="text-center text-sm text-slate-400"
                style={{
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                }}
              >
                💪 Acompanhe sua evolução e conquistas
              </p>
            </div>
          </CardContent>
        </Card>

        <p 
          className="text-center text-sm text-slate-500 mt-6"
          style={{
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#64748b',
            marginTop: '1.5rem',
          }}
        >
          Problemas para acessar? Entre em contato com seu treinador
        </p>
      </motion.div>
    </div>
  );
}
