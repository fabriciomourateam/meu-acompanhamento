import { useEffect, useState } from 'react';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];

export default function Portal() {
  const { patient, loading, signOut } = usePatientAuth();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
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
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoadingData(false);
    }
  };

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
            {/* Resumo */}
            <Card>
              <CardHeader>
                <CardTitle>Meu Acompanhamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Check-ins</p>
                    <p className="text-2xl font-bold">{checkins.length}</p>
                  </div>
                  
                  {checkins.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Último Check-in</p>
                      <p className="text-lg">
                        {new Date(checkins[0].data_checkin).toLocaleDateString('pt-BR')}
                      </p>
                      {checkins[0].peso && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Peso: {checkins[0].peso} kg
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Check-ins */}
            {checkins.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Check-ins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {checkins.slice(0, 10).map((checkin) => (
                      <div
                        key={checkin.id}
                        className="p-4 border rounded-lg hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">
                              {new Date(checkin.data_checkin).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                            {checkin.peso && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Peso: {checkin.peso} kg
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {checkins.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Ainda não há check-ins registrados.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}




