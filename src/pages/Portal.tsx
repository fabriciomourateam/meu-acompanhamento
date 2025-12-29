import { useEffect, useState } from 'react';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PatientDietPortal } from '@/components/patient-portal/PatientDietPortal';
import { EvolutionCharts } from '@/components/evolution/EvolutionCharts';
import { PhotoComparison } from '@/components/evolution/PhotoComparison';
import { Timeline } from '@/components/evolution/Timeline';
import { AchievementBadges } from '@/components/evolution/AchievementBadges';
import { detectAchievements } from '@/lib/achievement-system';
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

export default function Portal() {
  const { patient, loading, signOut } = usePatientAuth();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [bodyCompositions, setBodyCompositions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (patient?.telefone) {
      loadPortalData();
    }
  }, [patient]);

  const loadPortalData = async () => {
    if (!patient?.telefone) return;

    try {
      setLoadingData(true);
      
      // Buscar check-ins
      const { data: checkinsData, error: checkinsError } = await supabase
        .from('checkin')
        .select('*')
        .eq('telefone', patient.telefone)
        .order('data_checkin', { ascending: false });

      if (!checkinsError && checkinsData) {
        setCheckins(checkinsData);
      }

      // Buscar composição corporal
      const { data: bioData, error: bioError } = await supabase
        .from('body_composition')
        .select('*')
        .eq('telefone', patient.telefone)
        .order('data_avaliacao', { ascending: false });

      if (!bioError && bioData) {
        setBodyCompositions(bioData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Calcular conquistas
  const achievements = checkins.length > 0 ? detectAchievements(checkins, bodyCompositions) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!patient) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            Olá, {patient.nome}! 👋
          </h1>
          <Button
            variant="ghost"
            onClick={signOut}
            className="text-white hover:bg-slate-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {loadingData ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            {/* Evolução */}
            <EvolutionCharts checkins={checkins} bodyCompositions={bodyCompositions} />
            
            {/* Comparação de Fotos */}
            <PhotoComparison checkins={checkins} />
            
            {/* Timeline */}
            <Timeline checkins={checkins} />
            
            {/* Conquistas */}
            <AchievementBadges checkins={checkins} bodyCompositions={bodyCompositions} />
            
            {/* Dieta */}
            {patient.id && (
              <PatientDietPortal
                patientId={patient.id}
                patientName={patient.nome}
                checkins={checkins}
                patient={patient as any}
                bodyCompositions={bodyCompositions}
                achievements={achievements}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
