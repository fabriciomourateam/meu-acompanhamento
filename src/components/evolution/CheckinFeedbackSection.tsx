import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Loader2, Settings, MessageSquare, Copy, ExternalLink, Save, Send } from 'lucide-react';
import { useCheckinFeedback } from '../../hooks/use-checkin-feedback';
import { useFeedbackTemplates } from '../../hooks/use-feedback-templates';
import { extractMeasurements } from '../../lib/measurement-utils';
import { PromptEditor } from './PromptEditor';
import { toast } from 'sonner';

interface CheckinFeedbackSectionProps {
  telefone: string;
  patientName: string;
}

export const CheckinFeedbackSection: React.FC<CheckinFeedbackSectionProps> = ({
  telefone,
  patientName
}) => {
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [observedImprovements, setObservedImprovements] = useState('');
  const [dietAdjustments, setDietAdjustments] = useState('');
  const [generatedFeedback, setGeneratedFeedback] = useState('');

  const {
    latestCheckin,
    evolutionData,
    feedbackAnalysis,
    isGenerating,
    loading,
    patientId,
    generateFeedback,
    saveFeedbackAnalysis,
    markFeedbackAsSent
  } = useCheckinFeedback(telefone);

  const { activeTemplate } = useFeedbackTemplates();

  // Carregar dados existentes quando disponível
  React.useEffect(() => {
    if (feedbackAnalysis) {
      setObservedImprovements(feedbackAnalysis.observed_improvements || '');
      setDietAdjustments(feedbackAnalysis.diet_adjustments || '');
      setGeneratedFeedback(feedbackAnalysis.generated_feedback || '');
    }
  }, [feedbackAnalysis]);

  // Debug: Log dos campos do check-in para verificar nomes corretos
  React.useEffect(() => {
    if (latestCheckin) {
      console.log('🔍 Campos disponíveis no check-in:', Object.keys(latestCheckin));
      console.log('🍽️ Campos alimentares:', {
        oq_comeu_ref_livre: latestCheckin.oq_comeu_ref_livre,
        oq_beliscou: latestCheckin.oq_beliscou,
        beliscos: latestCheckin.beliscos,
        comeu_menos_planejado: latestCheckin.comeu_menos_planejado,
        comeu_menos: latestCheckin.comeu_menos,
        fome_horario: latestCheckin.fome_horario,
        fome: latestCheckin.fome,
        alimento_incluir: latestCheckin.alimento_incluir,
        alimento_para_incluir: latestCheckin.alimento_para_incluir
      });
    }
  }, [latestCheckin]);

  const handleGenerateFeedback = async () => {
    if (!activeTemplate) {
      toast.error('Nenhum template ativo encontrado');
      return;
    }

    const feedback = await generateFeedback(
      patientName,
      observedImprovements,
      dietAdjustments,
      activeTemplate
    );

    if (feedback) {
      setGeneratedFeedback(feedback);
    }
  };

  const handleSaveAnnotations = async () => {
    if (!latestCheckin || !patientId) return;

    await saveFeedbackAnalysis({
      patient_id: patientId!, // Usar o ID do paciente
      checkin_date: latestCheckin.data_checkin?.split('T')[0] || new Date().toISOString().split('T')[0],
      checkin_data: latestCheckin,
      evolution_data: evolutionData,
      observed_improvements: observedImprovements,
      diet_adjustments: dietAdjustments,
      generated_feedback: generatedFeedback,
      feedback_status: 'draft',
      prompt_template_id: activeTemplate?.id || null
    });
  };

  const handleCopyFeedback = async () => {
    if (!generatedFeedback) return;
    
    try {
      await navigator.clipboard.writeText(generatedFeedback);
      toast.success('Feedback copiado para área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar feedback');
    }
  };

  const handleOpenWhatsApp = () => {
    if (!generatedFeedback) return;
    
    const encodedMessage = encodeURIComponent(generatedFeedback);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    markFeedbackAsSent('whatsapp');
  };

  if (loading) {
    return (
      <Card className="mt-8 bg-slate-800/50 border-slate-700/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2 text-slate-400" />
          <span className="text-slate-300">Carregando dados do check-in...</span>
        </CardContent>
      </Card>
    );
  }

  if (!latestCheckin) {
    return (
      <Card className="mt-8 bg-slate-800/50 border-slate-700/50">
        <CardContent className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-200 mb-2">
            Nenhum check-in encontrado
          </h3>
          <p className="text-slate-400">
            Este paciente ainda não possui check-ins registrados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          🤖 Feedback de Check-in
          {feedbackAnalysis?.feedback_status && (
            <Badge variant={feedbackAnalysis.feedback_status === 'sent' ? 'default' : 'secondary'}>
              {feedbackAnalysis.feedback_status === 'sent' ? 'Enviado' : 'Rascunho'}
            </Badge>
          )}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPromptEditor(!showPromptEditor)}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <Settings className="h-4 w-4 mr-2" />
          Configurar Prompt
        </Button>
      </div>

      {/* Editor de Prompt (colapsável) */}
      {showPromptEditor && (
        <PromptEditor />
      )}

      {/* Dados do Check-in e Evolução */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Último Check-in */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-base text-slate-200">
              📅 Último Check-in ({new Date(latestCheckin.data_checkin).toLocaleDateString('pt-BR')})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {latestCheckin.peso && (
              <div className="flex justify-between">
                <span className="text-slate-400">⚖️ Peso:</span>
                <span className="font-medium text-slate-200">
                  {latestCheckin.peso.toString().replace(/kg$/, '')}kg
                </span>
              </div>
            )}
            {latestCheckin.medida && (
              (() => {
                const measurements = extractMeasurements(latestCheckin.medida);
                
                return (
                  <>
                    {measurements.cintura && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">📏 Cintura:</span>
                        <span className="font-medium text-slate-200">{measurements.cintura}cm</span>
                      </div>
                    )}
                    {measurements.quadril && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">📐 Quadril:</span>
                        <span className="font-medium text-slate-200">{measurements.quadril}cm</span>
                      </div>
                    )}
                    {!measurements.cintura && !measurements.quadril && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">📏 Medida:</span>
                        <span className="font-medium text-slate-200">{latestCheckin.medida}</span>
                      </div>
                    )}
                  </>
                );
              })()
            )}
            {latestCheckin.treino && (
              <div className="flex justify-between">
                <span className="text-slate-400">🏃 Treinos:</span>
                <span className="font-medium text-slate-200">{latestCheckin.treino}</span>
              </div>
            )}
            {latestCheckin.cardio && (
              <div className="flex justify-between">
                <span className="text-slate-400">🏃‍♂️ Cardio:</span>
                <span className="font-medium text-slate-200">{latestCheckin.cardio}</span>
              </div>
            )}
            {latestCheckin.agua && (
              <div className="flex justify-between">
                <span className="text-slate-400">💧 Água:</span>
                <span className="font-medium text-slate-200">{latestCheckin.agua}</span>
              </div>
            )}
            {latestCheckin.sono && (
              <div className="flex justify-between">
                <span className="text-slate-400">😴 Sono:</span>
                <span className="font-medium text-slate-200">{latestCheckin.sono}</span>
              </div>
            )}
            {latestCheckin.ref_livre && (
              <div className="flex justify-between">
                <span className="text-slate-400">🍽️ Refeições Livres:</span>
                <span className="font-medium text-slate-200">{latestCheckin.ref_livre}</span>
              </div>
            )}
            {latestCheckin.beliscos && (
              <div className="flex justify-between">
                <span className="text-slate-400">🍪 Beliscos:</span>
                <span className="font-medium text-slate-200">{latestCheckin.beliscos}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evolução Comparativa */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-base text-slate-200">📈 Evolução Comparativa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {evolutionData?.peso_diferenca !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">⚖️ Peso:</span>
                <span className={`font-medium ${evolutionData.peso_diferenca < 0 ? 'text-green-400' : evolutionData.peso_diferenca > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {evolutionData.peso_diferenca > 0 ? '+' : ''}{evolutionData.peso_diferenca}kg
                </span>
              </div>
            )}
            {evolutionData?.cintura_diferenca !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">📏 Cintura:</span>
                <span className={`font-medium ${evolutionData.cintura_diferenca < 0 ? 'text-green-400' : evolutionData.cintura_diferenca > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {evolutionData.cintura_diferenca > 0 ? '+' : ''}{evolutionData.cintura_diferenca}cm
                </span>
              </div>
            )}
            {evolutionData?.quadril_diferenca !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">📐 Quadril:</span>
                <span className={`font-medium ${evolutionData.quadril_diferenca < 0 ? 'text-green-400' : evolutionData.quadril_diferenca > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {evolutionData.quadril_diferenca > 0 ? '+' : ''}{evolutionData.quadril_diferenca}cm
                </span>
              </div>
            )}
            {evolutionData?.treino_diferenca !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">🏃 Treinos:</span>
                <span className={`font-medium ${evolutionData.treino_diferenca > 0 ? 'text-green-400' : evolutionData.treino_diferenca < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {evolutionData.treino_diferenca > 0 ? '+' : ''}{evolutionData.treino_diferenca}
                </span>
              </div>
            )}
            {evolutionData?.cardio_diferenca !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">🏃‍♂️ Cardio:</span>
                <span className={`font-medium ${evolutionData.cardio_diferenca > 0 ? 'text-green-400' : evolutionData.cardio_diferenca < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {evolutionData.cardio_diferenca > 0 ? '+' : ''}{evolutionData.cardio_diferenca}
                </span>
              </div>
            )}
            {evolutionData?.agua_diferenca !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">💧 Água:</span>
                <span className={`font-medium ${evolutionData.agua_diferenca > 0 ? 'text-green-400' : evolutionData.agua_diferenca < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {evolutionData.agua_diferenca > 0 ? '+' : ''}{evolutionData.agua_diferenca}L
                </span>
              </div>
            )}
            {evolutionData?.sono_diferenca !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">😴 Sono:</span>
                <span className={`font-medium ${evolutionData.sono_diferenca > 0 ? 'text-green-400' : evolutionData.sono_diferenca < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {evolutionData.sono_diferenca > 0 ? '+' : ''}{evolutionData.sono_diferenca}h
                </span>
              </div>
            )}
            {evolutionData?.ref_livre_diferenca !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">🍽️ Refeições Livres:</span>
                <span className={`font-medium ${evolutionData.ref_livre_diferenca > 0 ? 'text-red-400' : evolutionData.ref_livre_diferenca < 0 ? 'text-green-400' : 'text-slate-400'}`}>
                  {evolutionData.ref_livre_diferenca > 0 ? '+' : ''}{evolutionData.ref_livre_diferenca}
                </span>
              </div>
            )}
            {evolutionData?.beliscos_diferenca !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">🍪 Beliscos:</span>
                <span className={`font-medium ${evolutionData.beliscos_diferenca > 0 ? 'text-red-400' : evolutionData.beliscos_diferenca < 0 ? 'text-green-400' : 'text-slate-400'}`}>
                  {evolutionData.beliscos_diferenca > 0 ? '+' : ''}{evolutionData.beliscos_diferenca}
                </span>
              </div>
            )}
            {evolutionData?.aderencia && (
              <div className="flex justify-between">
                <span className="text-slate-400">Aproveitamento:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-400">{evolutionData.aderencia}%</span>
                  {evolutionData.aderencia_diferenca !== undefined && evolutionData.aderencia_diferenca !== 0 && (
                    <span className={`text-xs font-medium ${
                      evolutionData.aderencia_diferenca > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ({evolutionData.aderencia_diferenca > 0 ? '+' : ''}{evolutionData.aderencia_diferenca}%)
                    </span>
                  )}
                </div>
              </div>
            )}
            {!evolutionData?.tem_checkin_anterior && (
              <div className="text-sm text-slate-500 italic">
                Primeiro check-in - sem comparação anterior
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informações Adicionais do Check-in */}
      {(latestCheckin.objetivo || latestCheckin.dificuldades || latestCheckin.melhora_visual || latestCheckin.quais_pontos) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Objetivo e Dificuldades */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-base text-slate-200">🎯 Objetivo & Dificuldades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestCheckin.objetivo && (
                <div>
                  <span className="text-slate-400 text-sm">Objetivo:</span>
                  <p className="text-slate-200 mt-1">{latestCheckin.objetivo}</p>
                </div>
              )}
              {latestCheckin.dificuldades && (
                <div>
                  <span className="text-slate-400 text-sm">Dificuldades:</span>
                  <p className="text-slate-200 mt-1">{latestCheckin.dificuldades}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Melhora Visual e Quais Pontos */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-base text-slate-200">👁️ Percepções Visuais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestCheckin.melhora_visual && (
                <div>
                  <span className="text-slate-400 text-sm">Melhora Visual:</span>
                  <p className="text-slate-200 mt-1">{latestCheckin.melhora_visual}</p>
                </div>
              )}
              {latestCheckin.quais_pontos && (
                <div>
                  <span className="text-slate-400 text-sm">Quais Pontos:</span>
                  <p className="text-slate-200 mt-1">{latestCheckin.quais_pontos}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Informações Alimentares Detalhadas */}
      {(latestCheckin.oq_comeu_ref_livre || latestCheckin.oq_beliscou || 
        latestCheckin.comeu_menos_planejado || latestCheckin.comeu_menos || 
        latestCheckin.fome_horario || latestCheckin.fome || 
        latestCheckin.alimento_incluir || latestCheckin.alimento_para_incluir) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Refeições Livres e Beliscos - só mostrar se tiver conteúdo qualitativo */}
          {(latestCheckin.oq_comeu_ref_livre || latestCheckin.oq_beliscou) && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-base text-slate-200">🍽️ Refeições Livres & Beliscos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {latestCheckin.oq_comeu_ref_livre && (
                  <div>
                    <span className="text-slate-400 text-sm">O que comeu na refeição livre:</span>
                    <p className="text-slate-200 mt-1">{latestCheckin.oq_comeu_ref_livre}</p>
                  </div>
                )}
                {latestCheckin.oq_beliscou && (
                  <div>
                    <span className="text-slate-400 text-sm">O que beliscou:</span>
                    <p className="text-slate-200 mt-1">{latestCheckin.oq_beliscou}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Fome e Ajustes */}
          {(latestCheckin.comeu_menos_planejado || latestCheckin.comeu_menos || 
            latestCheckin.fome_horario || latestCheckin.fome || 
            latestCheckin.alimento_incluir || latestCheckin.alimento_para_incluir) && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-base text-slate-200">🍴 Fome & Ajustes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {latestCheckin.comeu_menos_planejado && (
                  <div>
                    <span className="text-slate-400 text-sm">Comeu menos que o planejado:</span>
                    <p className="text-slate-200 mt-1">{latestCheckin.comeu_menos_planejado}</p>
                  </div>
                )}
                {latestCheckin.fome_horario && (
                  <div>
                    <span className="text-slate-400 text-sm">Fome em algum horário:</span>
                    <p className="text-slate-200 mt-1">{latestCheckin.fome_horario}</p>
                  </div>
                )}
                {latestCheckin.alimento_incluir && (
                  <div>
                    <span className="text-slate-400 text-sm">Alimento para incluir:</span>
                    <p className="text-slate-200 mt-1">{latestCheckin.alimento_incluir}</p>
                  </div>
                )}
                {/* Campos alternativos caso os nomes sejam diferentes */}
                {latestCheckin.comeu_menos && (
                  <div>
                    <span className="text-slate-400 text-sm">Comeu menos que o planejado:</span>
                    <p className="text-slate-200 mt-1">{latestCheckin.comeu_menos}</p>
                  </div>
                )}
                {latestCheckin.fome && (
                  <div>
                    <span className="text-slate-400 text-sm">Fome em algum horário:</span>
                    <p className="text-slate-200 mt-1">{latestCheckin.fome}</p>
                  </div>
                )}
                {latestCheckin.alimento_para_incluir && (
                  <div>
                    <span className="text-slate-400 text-sm">Alimento para incluir:</span>
                    <p className="text-slate-200 mt-1">{latestCheckin.alimento_para_incluir}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Suas Observações */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-base text-slate-200">📝 Suas Observações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              🔍 Melhoras Observadas:
            </label>
            <Textarea
              value={observedImprovements}
              onChange={(e) => setObservedImprovements(e.target.value)}
              placeholder="Descreva as melhoras que você observou no paciente (físico, peso, medidas, rotina, etc.)"
              rows={3}
              className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              ⚙️ Ajustes Realizados na Dieta:
            </label>
            <Textarea
              value={dietAdjustments}
              onChange={(e) => setDietAdjustments(e.target.value)}
              placeholder="Descreva os ajustes que você fez na dieta baseado nas informações do check-in"
              rows={3}
              className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSaveAnnotations}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Anotações
            </Button>
            
            <Button
              onClick={handleGenerateFeedback}
              disabled={isGenerating || !activeTemplate}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? 'Gerando...' : 'Gerar Feedback'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Gerado */}
      {generatedFeedback && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-base text-slate-200">🤖 Feedback Gerado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600/50">
              <pre className="whitespace-pre-wrap text-sm font-sans text-slate-200">
                {generatedFeedback}
              </pre>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleCopyFeedback}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Texto
              </Button>
              
              <Button
                onClick={handleOpenWhatsApp}
                variant="outline"
                size="sm"
                className="text-green-400 border-green-600 hover:bg-green-900/20"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir WhatsApp
              </Button>
              
              <Button
                onClick={() => markFeedbackAsSent('manual')}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Marcar como Enviado
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};