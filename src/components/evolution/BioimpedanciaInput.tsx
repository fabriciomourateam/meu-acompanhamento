import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Activity, Plus, ExternalLink, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  calcularIMC, 
  calcularMassaGorda, 
  calcularMassaMagra, 
  calcularTMB,
  classificarIMC 
} from '@/lib/body-calculations';

interface BioimpedanciaInputProps {
  telefone: string;
  nome: string;
  idade: number | null;
  altura: number | null; // em metros, ex: 1.75
  pesoInicial?: number | null; // peso inicial do paciente
  sexo: string | null; // 'M' ou 'F'
  onSuccess: () => void;
}

export function BioimpedanciaInput({ 
  telefone, 
  nome, 
  idade, 
  altura,
  pesoInicial, 
  sexo, 
  onSuccess 
}: BioimpedanciaInputProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingLastBio, setLoadingLastBio] = useState(false);
  const [hasLastBio, setHasLastBio] = useState(false);
  
  // Função para obter data local sem problema de timezone
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [formData, setFormData] = useState({
    data: getLocalDateString(),
    textoGPT: '',
    peso: '',
    altura: altura?.toString() || '',
    idade: idade?.toString() || '',
    sexo: sexo || ''
  });
  const [calculosPreview, setCalculosPreview] = useState<any>(null);

  // Buscar última bioimpedância quando abrir o dialog
  useEffect(() => {
    async function loadLastBioimpedancia() {
      if (!open) return;
      
      try {
        setLoadingLastBio(true);
        setHasLastBio(false);
        
        // Buscar última bioimpedância do paciente
        const { data: lastBio } = await supabase
          .from('body_composition')
          .select('peso, data_avaliacao')
          .eq('telefone', telefone)
          .order('data_avaliacao', { ascending: false })
          .limit(1)
          .single();

        if (lastBio) {
          // Pré-preencher com dados da última bioimpedância
          setFormData(prev => ({
            ...prev,
            peso: lastBio.peso?.toString() || prev.peso,
            // Altura já vem do cadastro do paciente, mantém se existir
            altura: prev.altura || ''
          }));
          
          setHasLastBio(true);
          
          toast({
            title: 'Dados carregados ✅',
            description: `Última avaliação: ${new Date(lastBio.data_avaliacao).toLocaleDateString('pt-BR')}`,
          });
        } else {
          // Se não há bioimpedância anterior, usar peso inicial do cadastro
          if (pesoInicial) {
            setFormData(prev => ({
              ...prev,
              peso: pesoInicial.toString()
            }));
          }
        }
      } catch (error) {
        // Não há bioimpedância anterior, usar peso inicial do cadastro
        console.log('Primeira bioimpedância do paciente');
        setHasLastBio(false);
        if (pesoInicial) {
          setFormData(prev => ({
            ...prev,
            peso: pesoInicial.toString()
          }));
        }
      } finally {
        setLoadingLastBio(false);
      }
    }

    loadLastBioimpedancia();
  }, [open, telefone, toast]);

  const parseGPTText = (texto: string) => {
    const dataMatch = texto.match(/📆\s*Data:\s*(\d{2}\/\d{2}\/\d{4})/i);
    const gorduraMatch = texto.match(/🧍\s*Percentual de Gordura Estimado:\s*([\d,]+)%/i);
    const classificacaoMatch = texto.match(/🏅\s*Classificação do Shape:\s*(.+?)(?:\n|$)/i);

    if (!gorduraMatch) {
      throw new Error('Formato inválido: % de Gordura não encontrado no texto');
    }

    const percentualGordura = parseFloat(gorduraMatch[1].replace(',', '.'));
    const classificacao = classificacaoMatch ? classificacaoMatch[1].trim() : null;
    
    let dataAvaliacao = formData.data;
    if (dataMatch) {
      const [dia, mes, ano] = dataMatch[1].split('/');
      dataAvaliacao = `${ano}-${mes}-${dia}`;
    }

    return {
      data_avaliacao: dataAvaliacao,
      percentual_gordura: percentualGordura,
      classificacao
    };
  };

  // Calcular valores em tempo real para preview
  useEffect(() => {
    if (formData.peso && formData.altura && formData.textoGPT && formData.idade && formData.sexo) {
      try {
        const parsedData = parseGPTText(formData.textoGPT);
        const peso = parseFloat(formData.peso);
        const alturaNum = parseFloat(formData.altura);
        const idadeNum = parseInt(formData.idade);
        
        if (peso && alturaNum && idadeNum && formData.sexo) {
          const imc = calcularIMC(peso, alturaNum);
          const massaGorda = calcularMassaGorda(peso, parsedData.percentual_gordura);
          const massaMagra = calcularMassaMagra(peso, massaGorda);
          const tmb = calcularTMB(peso, alturaNum, idadeNum, formData.sexo as 'M' | 'F');
          
          setCalculosPreview({
            imc,
            massaGorda,
            massaMagra,
            tmb,
            classificacaoIMC: classificarIMC(imc)
          });
        }
      } catch (error) {
        setCalculosPreview(null);
      }
    } else {
      setCalculosPreview(null);
    }
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.peso || !formData.altura) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Peso e Altura são necessários para os cálculos',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.idade || !formData.sexo) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Idade e Sexo são necessários para os cálculos',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setLoading(true);

      const parsedData = parseGPTText(formData.textoGPT);
      const peso = parseFloat(formData.peso);
      const alturaNum = parseFloat(formData.altura);
      const idadeNum = parseInt(formData.idade);

      // Cálculos automáticos
      const imc = calcularIMC(peso, alturaNum);
      const massaGorda = calcularMassaGorda(peso, parsedData.percentual_gordura);
      const massaMagra = calcularMassaMagra(peso, massaGorda);
      const tmb = calcularTMB(peso, alturaNum, idadeNum, formData.sexo as 'M' | 'F');

      // Inserir no Supabase
      const { error } = await supabase
        .from('body_composition')
        .insert({
          telefone,
          ...parsedData,
          peso,
          massa_gorda: massaGorda,
          massa_magra: massaMagra,
          imc,
          tmb,
          observacoes: formData.textoGPT
        });

      if (error) throw error;

      // Se o paciente não tem altura cadastrada, atualizar com a altura da bioimpedância
      if (!altura && alturaNum) {
        const { error: updateError } = await supabase
          .from('patients')
          .update({ altura_inicial: alturaNum })
          .eq('telefone', telefone);

        if (!updateError) {
          console.log('✅ Altura do paciente atualizada:', alturaNum);
        }
      }

      toast({
        title: 'Bioimpedância adicionada! ✅',
        description: `${parsedData.percentual_gordura}% BF | IMC: ${imc} | TMB: ${tmb} kcal`,
      });

      setOpen(false);
      setFormData({ 
        data: getLocalDateString(), 
        textoGPT: '',
        peso: '',
        altura: altura?.toString() || '',
        idade: idade?.toString() || '',
        sexo: sexo || ''
      });
      setCalculosPreview(null);
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar bioimpedância:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Verifique o formato dos dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* BOTÃO PARA ABRIR O INSHAPE GPT */}
      <Button
        onClick={() => window.open('https://chatgpt.com/g/g-685e0c8b2d8c8191b896dd996cab7537-inshape', '_blank')}
        className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
      >
        <ExternalLink className="w-4 h-4" />
        Abrir InShape GPT
      </Button>

      {/* DIALOG PARA ADICIONAR BIOIMPEDÂNCIA */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all">
            <Plus className="w-4 h-4" />
            Adicionar Bioimpedância
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Adicionar Análise de Bioimpedância
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
              <p className="text-sm text-slate-300 mb-2">
                📋 <strong>Paciente:</strong> {nome}
              </p>
              <p className="text-xs text-slate-400">
                💡 Use o botão "Abrir InShape GPT" para obter a análise e cole a resposta abaixo
              </p>
              {loadingLastBio && (
                <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                  🔄 Carregando dados da última avaliação...
                </p>
              )}
              {hasLastBio && !loadingLastBio && (
                <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                  ✅ Dados pré-preenchidos da última avaliação (você pode editar se mudou)
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="peso" className="text-slate-300">
                  Peso (kg) *
                </Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  placeholder="75.5"
                  value={formData.peso}
                  onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                  required
                  disabled={loadingLastBio}
                  className="bg-slate-800 border-slate-600 text-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="altura" className="text-slate-300">
                  Altura (m) *
                </Label>
                <Input
                  id="altura"
                  type="number"
                  step="0.01"
                  placeholder="1.75"
                  value={formData.altura}
                  onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                  required
                  disabled={loadingLastBio}
                  className="bg-slate-800 border-slate-600 text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idade" className="text-slate-300">
                  Idade (anos) * {idade && <span className="text-xs text-emerald-400">✓ Do cadastro</span>}
                </Label>
                <Input
                  id="idade"
                  type="number"
                  placeholder="25"
                  value={formData.idade}
                  onChange={(e) => setFormData({ ...formData, idade: e.target.value })}
                  required
                  className="bg-slate-800 border-slate-600 text-slate-200"
                />
                {!idade && (
                  <p className="text-xs text-amber-400">
                    ℹ️ Preencha manualmente (não está no cadastro)
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sexo" className="text-slate-300">
                  Sexo * {sexo && <span className="text-xs text-emerald-400">✓ Do cadastro</span>}
                </Label>
                <select
                  id="sexo"
                  value={formData.sexo}
                  onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                  required
                  className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
                {!sexo && (
                  <p className="text-xs text-amber-400">
                    ℹ️ Selecione manualmente (não está no cadastro)
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="textoGPT" className="text-slate-300">
                Resposta do GPT InShape *
              </Label>
              <Textarea
                id="textoGPT"
                placeholder="📆 Data: 21/10/2025
🧍 Percentual de Gordura Estimado: 18,5%
🏅 Classificação do Shape: Percentual de gordura mediano"
                value={formData.textoGPT}
                onChange={(e) => setFormData({ ...formData, textoGPT: e.target.value })}
                required
                rows={6}
                className="bg-slate-800 border-slate-600 text-slate-200 font-mono text-sm"
              />
              <p className="text-xs text-slate-500">
                Cole aqui o texto completo retornado pelo GPT InShape
              </p>
            </div>

            {/* PREVIEW DOS CÁLCULOS */}
            {calculosPreview && (
              <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-semibold text-emerald-300">
                    Cálculos Automáticos (Preview)
                  </h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-800/50 p-2 rounded">
                    <p className="text-xs text-slate-400">IMC</p>
                    <p className="text-lg font-bold text-white">{calculosPreview.imc}</p>
                    <p className="text-xs text-slate-500">{calculosPreview.classificacaoIMC}</p>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded">
                    <p className="text-xs text-slate-400">Massa Gorda</p>
                    <p className="text-lg font-bold text-red-400">{calculosPreview.massaGorda} kg</p>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded">
                    <p className="text-xs text-slate-400">Massa Magra</p>
                    <p className="text-lg font-bold text-emerald-400">{calculosPreview.massaMagra} kg</p>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded">
                    <p className="text-xs text-slate-400">TMB</p>
                    <p className="text-lg font-bold text-blue-400">{calculosPreview.tmb} kcal</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.textoGPT || !formData.peso || !formData.altura}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? 'Salvando...' : 'Salvar Bioimpedância'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

