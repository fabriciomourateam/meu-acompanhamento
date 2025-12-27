import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Save, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InitialDataInputProps {
  telefone: string;
  nome: string;
  onSuccess: () => void;
  editMode?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function InitialDataInput({ telefone, nome, onSuccess, editMode = false, open: externalOpen, onOpenChange: externalOnOpenChange }: InitialDataInputProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Estados para as fotos
  const [fotoFrente, setFotoFrente] = useState<File | null>(null);
  const [fotoLado, setFotoLado] = useState<File | null>(null);
  const [fotoLado2, setFotoLado2] = useState<File | null>(null);
  const [fotoCostas, setFotoCostas] = useState<File | null>(null);
  
  // Preview URLs
  const [previewFrente, setPreviewFrente] = useState<string>('');
  const [previewLado, setPreviewLado] = useState<string>('');
  const [previewLado2, setPreviewLado2] = useState<string>('');
  const [previewCostas, setPreviewCostas] = useState<string>('');

  // Estados para as medidas
  const [idade, setIdade] = useState('');
  const [pesoInicial, setPesoInicial] = useState('');
  const [alturaInicial, setAlturaInicial] = useState('');
  const [cinturaInicial, setCinturaInicial] = useState('');
  const [quadrilInicial, setQuadrilInicial] = useState('');
  
  // Função para obter data local sem problema de timezone
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [dataFotos, setDataFotos] = useState(getLocalDateString());

  // Refs para inputs de arquivo
  const frenteInputRef = useRef<HTMLInputElement>(null);
  const ladoInputRef = useRef<HTMLInputElement>(null);
  const lado2InputRef = useRef<HTMLInputElement>(null);
  const costasInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados existentes quando abrir o modal em modo de edição
  useEffect(() => {
    if (open && editMode) {
      loadExistingData();
    }
  }, [open, editMode]);

  const loadExistingData = async () => {
    try {
      const { data: patientData, error } = await supabase
        .from('patients')
        .select('*')
        .eq('telefone', telefone)
        .single();

      if (error) throw error;

      if (patientData) {
        const patient = patientData as any;
        // Carregar medidas
        if (patient.data_nascimento) {
          const hoje = new Date();
          const nascimento = new Date(patient.data_nascimento);
          let idadeCalculada = hoje.getFullYear() - nascimento.getFullYear();
          const mesAtual = hoje.getMonth();
          const mesNascimento = nascimento.getMonth();
          if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
            idadeCalculada--;
          }
          setIdade(idadeCalculada.toString());
        }
        if (patient.peso_inicial) setPesoInicial(patient.peso_inicial.toString());
        if (patient.altura_inicial) setAlturaInicial(patient.altura_inicial.toString());
        if (patient.medida_cintura_inicial) setCinturaInicial(patient.medida_cintura_inicial.toString());
        if (patient.medida_quadril_inicial) setQuadrilInicial(patient.medida_quadril_inicial.toString());
        if (patient.data_fotos_iniciais) setDataFotos(patient.data_fotos_iniciais);

        // Carregar previews das fotos existentes
        if (patient.foto_inicial_frente) setPreviewFrente(patient.foto_inicial_frente);
        if (patient.foto_inicial_lado) setPreviewLado(patient.foto_inicial_lado);
        if (patient.foto_inicial_lado_2) setPreviewLado2(patient.foto_inicial_lado_2);
        if (patient.foto_inicial_costas) setPreviewCostas(patient.foto_inicial_costas);
      }
    } catch (error) {
      console.error('Erro ao carregar dados existentes:', error);
    }
  };

  const handleFileChange = (
    file: File | null,
    setFile: (file: File | null) => void,
    setPreview: (url: string) => void
  ) => {
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (
    setFile: (file: File | null) => void,
    setPreview: (url: string) => void
  ) => {
    setFile(null);
    setPreview('');
  };

  const uploadPhoto = async (file: File, type: string): Promise<string | null> => {
    try {
      console.log('📤 Iniciando upload:', { type, fileName: file.name, size: file.size });
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${telefone}_inicial_${type}_${Date.now()}.${fileExt}`;
      const filePath = `patient-photos/${fileName}`;

      console.log('📁 Caminho do arquivo:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('patient-photos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        throw uploadError;
      }

      console.log('✅ Upload concluído!');

      const { data: { publicUrl } } = supabase.storage
        .from('patient-photos')
        .getPublicUrl(filePath);

      console.log('🔗 URL gerada:', publicUrl);

      return publicUrl;
    } catch (error) {
      console.error('💥 Erro ao fazer upload da foto:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      console.log('🚀 Iniciando salvamento dos dados iniciais...');

      console.log('📋 Dados para salvar:', {
        idade: idade,
        peso: pesoInicial,
        altura: alturaInicial,
        cintura: cinturaInicial,
        quadril: quadrilInicial,
        temFotoFrente: !!fotoFrente,
        temFotoLado: !!fotoLado,
        temFotoLado2: !!fotoLado2,
        temFotoCostas: !!fotoCostas
      });

      // Upload das fotos
      let fotoFrenteUrl = null;
      let fotoLadoUrl = null;
      let fotoLado2Url = null;
      let fotoCostasUrl = null;

      if (fotoFrente) {
        console.log('📸 Fazendo upload da foto frontal...');
        fotoFrenteUrl = await uploadPhoto(fotoFrente, 'frente');
      }
      if (fotoLado) {
        console.log('📸 Fazendo upload da foto lateral 1...');
        fotoLadoUrl = await uploadPhoto(fotoLado, 'lado');
      }
      if (fotoLado2) {
        console.log('📸 Fazendo upload da foto lateral 2...');
        fotoLado2Url = await uploadPhoto(fotoLado2, 'lado_2');
      }
      if (fotoCostas) {
        console.log('📸 Fazendo upload da foto de costas...');
        fotoCostasUrl = await uploadPhoto(fotoCostas, 'costas');
      }

      console.log('🔗 URLs geradas:', {
        frente: fotoFrenteUrl,
        lado: fotoLadoUrl,
        lado2: fotoLado2Url,
        costas: fotoCostasUrl
      });

      // Atualizar o paciente com os dados iniciais
      const updateData: any = {
        data_fotos_iniciais: dataFotos
      };

      // Só atualizar fotos se houver novas fotos (arquivos File)
      if (fotoFrenteUrl) updateData.foto_inicial_frente = fotoFrenteUrl;
      if (fotoLadoUrl) updateData.foto_inicial_lado = fotoLadoUrl;
      if (fotoLado2Url) updateData.foto_inicial_lado_2 = fotoLado2Url;
      if (fotoCostasUrl) updateData.foto_inicial_costas = fotoCostasUrl;
      // Calcular data de nascimento a partir da idade informada
      if (idade) {
        const anoAtual = new Date().getFullYear();
        const anoNascimento = anoAtual - parseInt(idade);
        updateData.data_nascimento = `${anoNascimento}-01-01`; // Define como 1º de janeiro do ano calculado
      }
      if (pesoInicial) updateData.peso_inicial = parseFloat(pesoInicial);
      if (alturaInicial) updateData.altura_inicial = parseFloat(alturaInicial);
      if (cinturaInicial) updateData.medida_cintura_inicial = parseFloat(cinturaInicial);
      if (quadrilInicial) updateData.medida_quadril_inicial = parseFloat(quadrilInicial);

      console.log('💾 Salvando no banco de dados:', updateData);

      const { error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('telefone', telefone);

      if (error) {
        console.error('❌ Erro ao salvar no banco:', error);
        throw error;
      }

      console.log('✅ Dados salvos com sucesso!');

      toast({
        title: 'Sucesso!',
        description: editMode ? 'Dados atualizados com sucesso' : 'Dados iniciais cadastrados com sucesso'
      });

      setOpen(false);
      onSuccess();
      
      // Limpar formulário apenas se não estiver em modo de edição
      if (!editMode) {
        setFotoFrente(null);
        setFotoLado(null);
        setFotoLado2(null);
        setFotoCostas(null);
        setPreviewFrente('');
        setPreviewLado('');
        setPreviewLado2('');
        setPreviewCostas('');
        setIdade('');
        setPesoInicial('');
        setAlturaInicial('');
        setCinturaInicial('');
        setQuadrilInicial('');
      }
    } catch (error: any) {
      console.error('Erro ao salvar dados iniciais:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível salvar os dados iniciais',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {externalOpen === undefined && (
        <DialogTrigger asChild>
          {editMode ? (
            <Button 
              variant="ghost" 
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Editar dados iniciais"
            >
              <Edit className="w-3 h-3" />
            </Button>
          ) : (
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all">
              <Camera className="w-4 h-4" />
              Adicionar Dados Iniciais
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📸 {editMode ? 'Editar' : 'Adicionar'} Dados Iniciais - {nome}</DialogTitle>
          <DialogDescription>
            {editMode ? 'Atualize' : 'Cadastre'} fotos, peso, altura e medidas iniciais do paciente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Data */}
          <div>
            <Label htmlFor="data">📅 Data dos Registros</Label>
            <Input
              id="data"
              type="date"
              value={dataFotos}
              onChange={(e) => setDataFotos(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Medidas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="idade">🎂 Idade</Label>
              <Input
                id="idade"
                type="number"
                placeholder="Ex: 30"
                value={idade}
                onChange={(e) => setIdade(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="peso">⚖️ Peso Inicial (kg)</Label>
              <Input
                id="peso"
                type="number"
                step="0.1"
                placeholder="Ex: 75.5"
                value={pesoInicial}
                onChange={(e) => setPesoInicial(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="altura">📏 Altura (m)</Label>
              <Input
                id="altura"
                type="number"
                step="0.01"
                placeholder="Ex: 1.75"
                value={alturaInicial}
                onChange={(e) => setAlturaInicial(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cintura">📐 Cintura (cm)</Label>
              <Input
                id="cintura"
                type="number"
                step="0.1"
                placeholder="Ex: 85"
                value={cinturaInicial}
                onChange={(e) => setCinturaInicial(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="quadril">📐 Quadril (cm)</Label>
              <Input
                id="quadril"
                type="number"
                step="0.1"
                placeholder="Ex: 95"
                value={quadrilInicial}
                onChange={(e) => setQuadrilInicial(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Fotos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">📷 Fotos Iniciais</h3>
            
            {/* Foto Frente */}
            <div>
              <Label>Foto Frontal</Label>
              <div className="mt-2">
                {previewFrente ? (
                  <div className="relative inline-block">
                    <img
                      src={previewFrente}
                      alt="Preview Frente"
                      className="w-40 h-40 object-cover rounded-lg border-2 border-blue-500"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => removePhoto(setFotoFrente, setPreviewFrente)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => frenteInputRef.current?.click()}
                    className="w-40 h-40 border-dashed"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8" />
                      <span className="text-xs">Upload</span>
                    </div>
                  </Button>
                )}
                <input
                  ref={frenteInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, setFotoFrente, setPreviewFrente)}
                />
              </div>
            </div>

            {/* Foto Lateral Esquerda */}
            <div>
              <Label>Foto Lateral Esquerda</Label>
              <div className="mt-2">
                {previewLado ? (
                  <div className="relative inline-block">
                    <img
                      src={previewLado}
                      alt="Preview Lateral Esquerda"
                      className="w-40 h-40 object-cover rounded-lg border-2 border-blue-500"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => removePhoto(setFotoLado, setPreviewLado)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => ladoInputRef.current?.click()}
                    className="w-40 h-40 border-dashed"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8" />
                      <span className="text-xs">Upload</span>
                    </div>
                  </Button>
                )}
                <input
                  ref={ladoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, setFotoLado, setPreviewLado)}
                />
              </div>
            </div>

            {/* Foto Lateral Direita */}
            <div>
              <Label>Foto Lateral Direita</Label>
              <div className="mt-2">
                {previewLado2 ? (
                  <div className="relative inline-block">
                    <img
                      src={previewLado2}
                      alt="Preview Lateral Direita"
                      className="w-40 h-40 object-cover rounded-lg border-2 border-blue-500"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => removePhoto(setFotoLado2, setPreviewLado2)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => lado2InputRef.current?.click()}
                    className="w-40 h-40 border-dashed"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8" />
                      <span className="text-xs">Upload</span>
                    </div>
                  </Button>
                )}
                <input
                  ref={lado2InputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, setFotoLado2, setPreviewLado2)}
                />
              </div>
            </div>

            {/* Foto Costas */}
            <div>
              <Label>Foto de Costas</Label>
              <div className="mt-2">
                {previewCostas ? (
                  <div className="relative inline-block">
                    <img
                      src={previewCostas}
                      alt="Preview Costas"
                      className="w-40 h-40 object-cover rounded-lg border-2 border-blue-500"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => removePhoto(setFotoCostas, setPreviewCostas)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => costasInputRef.current?.click()}
                    className="w-40 h-40 border-dashed"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8" />
                      <span className="text-xs">Upload</span>
                    </div>
                  </Button>
                )}
                <input
                  ref={costasInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, setFotoCostas, setPreviewCostas)}
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Salvando...' : 'Salvar Dados Iniciais'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

