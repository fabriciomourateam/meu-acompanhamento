import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Check,
  Sparkles,
  Eye
} from 'lucide-react';
import { useFeedbackTemplates } from '../../hooks/use-feedback-templates';
import { checkinFeedbackAI, PromptTemplate } from '../../lib/checkin-feedback-ai';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';

export const PromptEditor: React.FC = () => {
  const { templates, activeTemplate, loading, saveTemplate, setTemplateActive, deleteTemplate } = useFeedbackTemplates();
  const [editingTemplate, setEditingTemplate] = useState<Partial<PromptTemplate> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testingPrompt, setTestingPrompt] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Template padrão do usuário
  const defaultTemplate: Partial<PromptTemplate> = {
    name: 'Template Padrão Fabricio Moura',
    description: 'Template personalizado com o estilo e formato do Fabricio Moura',
    ai_model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1200,
    temperature: 0.3,
    prompt_template: `Quero que você seja eu, Fabricio Moura, nutricionista e treinador, com mais de 500 alunos ativos.

*Objetivo:* Responder como eu, especialista em análise de check-ins, entregando feedback objetivo, claro e motivador. O foco é resumir evolução, pontos de melhoria, ajustes e próximos passos — sem introduções longas, direto na estrutura abaixo.

*DADOS DO PACIENTE:*
Nome: {patientName}

*DADOS DO CHECK-IN ATUAL:*
{checkinData}

*DADOS COMPARATIVOS DE EVOLUÇÃO:*
{evolutionData}

*MINHAS OBSERVAÇÕES DE MELHORAS:*
{observedImprovements}

*AJUSTES QUE FIZ NA DIETA:*
{dietAdjustments}

*INSTRUÇÕES:*
- SEMPRE use minha linguagem: empatia, descontração, clareza e carisma;
- Não faça introduções fora da estrutura. Comece direto com: 📌 *FEEDBACK DO CHECK-IN*;
- Seja direto e enxuto, sem repetir demais as mesmas informações;
- Não repita métricas já ditas (exemplo: quantos treinos e cardios fez, quantas refeições livres fez, quanto de água bebeu, quanto tempo de sono);
- Não descreva alimentos específicos, apenas estratégias;
- Não dê sugestões sobre os treinos e cardios;
- Use gírias leves que eu costumo usar: show, top, perfeito;
- Evite termos: arrasou, tentar, acho;
- Dê espaçamento de linhas a cada duas frases com pontos finais.

*Formato de saída esperado:*
📌 *FEEDBACK DO CHECK-IN*
📈 *Progresso e Evolução:* {resumo objetivo da evolução, mencionando as métricas quando houver}
💡 *Pontos de Melhoria:*
{oportunidade 1}
{oportunidade 2}
🔄 *Ajustes no Planejamento:*
- {ajustes feitos e motivo, mencione em quais refeições foram feitas modificações (se houver), sempre frisando o objetivo de recomposição corporal, visando trazer aumento de massa muscular enquanto perde gordura}
📢 *Conclusão e Próximos Passos:*
{fechamento com próximos passos baseados no que foi dito acima}
Se tiver alguma dúvida pode me mandar aqui`
  };

  const handleCreateDefaultTemplate = async () => {
    try {
      await saveTemplate(defaultTemplate);
      toast.success('Template padrão criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar template padrão');
    }
  };

  const handleCreateNew = () => {
    setEditingTemplate({
      name: '',
      description: '',
      ai_model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      temperature: 0.7,
      prompt_template: ''
    });
    setIsModalOpen(true);
  };

  const handleEditTemplate = (template: PromptTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    try {
      await saveTemplate(editingTemplate);
      setIsModalOpen(false);
      setEditingTemplate(null);
      toast.success('Template salvo com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar template');
    }
  };

  const handleTestPrompt = async (template: PromptTemplate) => {
    setTestingPrompt(true);
    try {
      const result = await checkinFeedbackAI.testPromptWithSampleData(template);
      setTestResult(result);
      toast.success('Teste concluído!');
    } catch (error) {
      toast.error('Erro ao testar prompt');
    } finally {
      setTestingPrompt(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-base text-slate-200 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Editor de Prompts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-slate-400 dark:text-slate-500 mt-2">Carregando templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-200 mb-2">Nenhum template encontrado</h3>
            <p className="text-slate-400 dark:text-slate-500 mb-4">
              Crie seu primeiro template de prompt para gerar feedbacks personalizados.
            </p>
            <Button
              onClick={handleCreateDefaultTemplate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Template Padrão
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-4 rounded-lg border transition-colors ${
                  template.is_active 
                    ? 'bg-blue-900/30 border-blue-500/50' 
                    : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-slate-200">{template.name}</h4>
                      {template.is_active && (
                        <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">
                          Ativo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mb-2">{template.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>Modelo: {template.ai_model}</span>
                      <span>Tokens: {template.max_tokens}</span>
                      <span>Temperatura: {template.temperature}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestPrompt(template)}
                      disabled={testingPrompt}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTemplate(template)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    {!template.is_active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTemplateActive(template.id)}
                        className="border-green-600 text-green-400 hover:bg-green-900/20"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTemplate(template.id)}
                      className="border-red-600 text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              onClick={handleCreateNew}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </div>
        )}

        {/* Modal de Edição */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-200">
                {editingTemplate?.id ? 'Editar Template' : 'Novo Template'}
              </DialogTitle>
              <DialogDescription className="text-slate-400 dark:text-slate-500">
                Configure seu template de prompt personalizado para gerar feedbacks únicos.
              </DialogDescription>
            </DialogHeader>
            
            {editingTemplate && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Nome do Template</Label>
                    <Input
                      value={editingTemplate.name || ''}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        name: e.target.value
                      })}
                      placeholder="Ex: Meu Template Personalizado"
                      className="bg-slate-700/50 border-slate-600 text-slate-200"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Modelo de IA</Label>
                    <select
                      value={editingTemplate.ai_model || 'claude-sonnet-4-5-20250929'}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        ai_model: e.target.value
                      })}
                      className="w-full p-2 rounded-md bg-slate-700/50 border border-slate-600 text-slate-200"
                    >
                      <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5 (Mais Recente)</option>
                      <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                      <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                      <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300">Descrição</Label>
                  <Input
                    value={editingTemplate.description || ''}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      description: e.target.value
                    })}
                    placeholder="Descreva o propósito deste template"
                    className="bg-slate-700/50 border-slate-600 text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Máximo de Tokens</Label>
                    <Input
                      type="number"
                      value={editingTemplate.max_tokens || 1000}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        max_tokens: parseInt(e.target.value)
                      })}
                      min="100"
                      max="4000"
                      className="bg-slate-700/50 border-slate-600 text-slate-200"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Temperatura (0-1)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editingTemplate.temperature || 0.7}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        temperature: parseFloat(e.target.value)
                      })}
                      min="0"
                      max="1"
                      className="bg-slate-700/50 border-slate-600 text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300">Template do Prompt</Label>
                  <Textarea
                    value={editingTemplate.prompt_template || ''}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      prompt_template: e.target.value
                    })}
                    placeholder="Digite seu prompt aqui. Use {patientName}, {checkinData}, {evolutionData}, {observedImprovements}, {dietAdjustments} como variáveis."
                    rows={15}
                    className="bg-slate-700/50 border-slate-600 text-slate-200 font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Variáveis disponíveis: {'{patientName}'}, {'{checkinData}'}, {'{evolutionData}'}, {'{observedImprovements}'}, {'{dietAdjustments}'}
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={() => handleTestPrompt(editingTemplate as PromptTemplate)}
                    disabled={testingPrompt || !editingTemplate.prompt_template}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    {testingPrompt ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        Testando...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Testar Prompt
                      </>
                    )}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsModalOpen(false)}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveTemplate}
                      disabled={!editingTemplate.name || !editingTemplate.prompt_template}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Resultado do Teste */}
        {testResult && (
          <Card className="bg-slate-700/30 border-slate-600/50">
            <CardHeader>
              <CardTitle className="text-sm text-slate-200">🧪 Resultado do Teste</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-800/50 p-3 rounded border border-slate-600/50">
                <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans">
                  {testResult}
                </pre>
              </div>
              <Button
                onClick={() => setTestResult(null)}
                size="sm"
                variant="outline"
                className="mt-2 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Fechar
              </Button>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};