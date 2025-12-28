import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Patient {
  id: string;
  nome: string;
  telefone: string;
  user_id: string | null;
}

interface PatientAuthContextType {
  user: User | null;
  patient: Patient | null;
  loading: boolean;
  signIn: (phone: string, countryCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
  linkPatientToUser: () => Promise<boolean>;
}

const PatientAuthContext = createContext<PatientAuthContextType | undefined>(undefined);

export function PatientAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadPatient(session.user);
      } else {
        setLoading(false);
      }
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadPatient(session.user);
      } else {
        setPatient(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadPatient = async (authUser: User) => {
    try {
      // Buscar paciente vinculado ao user_id
      const { data: patientData, error } = await supabase
        .from('patients')
        .select('id, nome, telefone, user_id')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar paciente:', error);
        setLoading(false);
        return;
      }

      if (patientData) {
        setPatient(patientData);
      } else {
        // Paciente não vinculado ainda - precisa fazer link
        console.log('Paciente não vinculado ao user');
      }
    } catch (error) {
      console.error('Erro ao carregar paciente:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (phone: string, countryCode: string = '+55') => {
    try {
      setLoading(true);
      const cleanPhone = phone.replace(/\D/g, '');
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

      // Se já tem user_id vinculado, fazer login
      if (patientData.user_id) {
        // Tentar login com magic link ou OTP
        const { error: authError } = await supabase.auth.signInWithOtp({
          phone: fullPhone,
          options: {
            shouldCreateUser: false,
          }
        });

        if (authError) {
          throw authError;
        }
      } else {
        // Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
          phone: fullPhone,
          options: {
            shouldCreateUser: true,
          }
        });

        if (authError) {
          throw authError;
        }

        // Aguardar confirmação do OTP e depois vincular
        // O link será feito após confirmação do OTP
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const linkPatientToUser = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Buscar paciente pelo telefone do usuário autenticado
      const phone = user.phone;
      if (!phone) return false;

      const cleanPhone = phone.replace(/\D/g, '');
      
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id, user_id')
        .or(`telefone.ilike.%${cleanPhone}%`)
        .maybeSingle();

      if (patientError || !patientData) {
        return false;
      }

      // Vincular via API server-side (usa service role)
      // Por enquanto, vamos fazer direto (será ajustado depois com endpoint)
      const { error: updateError } = await supabase
        .from('patients')
        .update({ user_id: user.id })
        .eq('id', patientData.id);

      if (updateError) {
        console.error('Erro ao vincular paciente:', updateError);
        return false;
      }

      await loadPatient(user);
      return true;
    } catch (error) {
      console.error('Erro ao vincular paciente:', error);
      return false;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPatient(null);
    // O redirecionamento será feito no componente que chama signOut
    window.location.href = '/login';
  };

  return (
    <PatientAuthContext.Provider
      value={{
        user,
        patient,
        loading,
        signIn,
        signOut,
        linkPatientToUser: linkPatientToUser,
      }}
    >
      {children}
    </PatientAuthContext.Provider>
  );
}

export function usePatientAuth() {
  const context = useContext(PatientAuthContext);
  if (context === undefined) {
    throw new Error('usePatientAuth must be used within PatientAuthProvider');
  }
  return context;
}

