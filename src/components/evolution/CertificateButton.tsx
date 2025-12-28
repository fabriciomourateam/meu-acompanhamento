import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Award, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateCertificate, checkCertificateEligibility, type CertificateData } from '@/lib/certificate-generator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface CertificateButtonProps {
  patientName: string;
  weightLost: number;
  bodyFatLost?: number;
  startDate: string;
  endDate: string;
  totalWeeks: number;
  coachName?: string;
  coachTitle?: string;
  initialWeight?: number;
  currentWeight?: number;
}

export function CertificateButton({
  patientName,
  weightLost,
  bodyFatLost,
  startDate,
  endDate,
  totalWeeks,
  coachName,
  coachTitle,
  initialWeight,
  currentWeight
}: CertificateButtonProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const eligibility = checkCertificateEligibility(weightLost, totalWeeks, bodyFatLost);

  const handleGenerate = async () => {
    if (!eligibility.eligible || !eligibility.achievement) {
      return;
    }

    setGenerating(true);
    
    try {
      const certificateData: CertificateData = {
        patientName,
        achievement: eligibility.achievement,
        startDate,
        endDate,
        weightLost: weightLost > 0 ? weightLost : undefined,
        bodyFatLost: bodyFatLost && bodyFatLost > 0 ? bodyFatLost : undefined,
        totalWeeks,
        coachName,
        coachTitle,
        initialWeight,
        currentWeight
      };

      await generateCertificate(certificateData);
      
      toast({
        title: '🏆 Certificado gerado!',
        description: 'Seu certificado foi baixado com sucesso. Parabéns pela conquista!',
      });
      
      setShowDialog(false);
    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o certificado. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  if (!eligibility.eligible) {
    return (
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="border-slate-600 hover:bg-slate-800 text-slate-400"
            disabled
          >
            <Award className="w-4 h-4 mr-2" />
            Certificado Bloqueado
          </Button>
        </DialogTrigger>
        <DialogContent className="glass-card border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-slate-400" />
              Certificado de Conquista
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Continue sua jornada para desbloquear seu certificado!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-300">
              Para ganhar um certificado, você precisa alcançar uma dessas conquistas:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${weightLost >= 10 ? 'bg-green-500' : 'bg-slate-600'}`} />
                <span className="text-slate-300">Perder 10kg ou mais</span>
                {weightLost >= 10 && <Badge className="bg-green-500/20 text-green-300">✓ Conquistado</Badge>}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${bodyFatLost && bodyFatLost >= 5 ? 'bg-green-500' : 'bg-slate-600'}`} />
                <span className="text-slate-300">Reduzir 5% ou mais de gordura</span>
                {bodyFatLost && bodyFatLost >= 5 && <Badge className="bg-green-500/20 text-green-300">✓ Conquistado</Badge>}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${totalWeeks >= 12 && weightLost >= 5 ? 'bg-green-500' : 'bg-slate-600'}`} />
                <span className="text-slate-300">Completar 12 semanas (perdendo 5kg+)</span>
                {totalWeeks >= 12 && weightLost >= 5 && <Badge className="bg-green-500/20 text-green-300">✓ Conquistado</Badge>}
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                💪 Seu progresso atual: {weightLost.toFixed(1)}kg perdidos em {totalWeeks} semanas. Continue firme!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <Award className="w-4 h-4 mr-2 relative z-10" />
          <span className="relative z-10">Gerar Certificado</span>
          <Badge className="ml-2 bg-white/20 text-white border-0 relative z-10">
            Desbloqueado!
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Award className="w-6 h-6 text-yellow-400" />
            Certificado de Conquista
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Parabéns! Você desbloqueou um certificado.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Preview do certificado */}
          <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
            <div className="text-center space-y-3">
              <div className="text-5xl">🏆</div>
              <h3 className="font-bold text-lg text-white">{patientName}</h3>
              <p className="text-sm text-slate-300">
                {eligibility.achievement}
              </p>
              <div className="flex justify-center gap-4 mt-4">
                {weightLost > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{weightLost.toFixed(1)}kg</div>
                    <div className="text-xs text-slate-400">Perdidos</div>
                  </div>
                )}
                {bodyFatLost && bodyFatLost > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">{bodyFatLost.toFixed(1)}%</div>
                    <div className="text-xs text-slate-400">Gordura</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{totalWeeks}</div>
                  <div className="text-xs text-slate-400">Semanas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Informações */}
          <div className="space-y-2 text-sm">
            <p className="text-slate-300">
              <strong>Período:</strong> {startDate} - {endDate}
            </p>
            {coachName && (
              <p className="text-slate-300">
                <strong>Assinado por:</strong> {coachName}
              </p>
            )}
          </div>

          {/* Botão de geração */}
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando Certificado...
              </>
            ) : (
              <>
                <Award className="w-4 h-4 mr-2" />
                Baixar Certificado Premium
              </>
            )}
          </Button>

          <p className="text-xs text-center text-slate-400">
            O certificado será baixado em formato PNG de alta qualidade
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

