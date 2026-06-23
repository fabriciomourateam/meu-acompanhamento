import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, ChevronRight, ChevronDown, ChevronUp, ZoomIn, Calendar, ExternalLink, Trash2, Download, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getMediaType } from "@/lib/media-utils";
import { convertGoogleDriveUrl, isGoogleDriveUrl } from "@/lib/google-drive-utils";
import { GoogleDriveImage } from "@/components/ui/google-drive-image";
import type { Database } from "@/integrations/supabase/types";
import { parseLocalISODate } from "@/lib/utils";

type Checkin = Database['public']['Tables']['checkin']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

interface PhotoComparisonProps {
  checkins: Checkin[];
  patient?: Patient | null;
  onPhotoDeleted?: () => void; // Callback para recarregar dados após deletar
  isPatientView?: boolean;
}

interface PhotoData {
  url: string;
  date: string;
  weight: string;
  checkinId: string;
  photoNumber: number;
  isInitial?: boolean;
  isVideo?: boolean;
  angle?: 'frente' | 'lado' | 'lado_2' | 'costas';
}

export function PhotoComparison({ checkins, patient, onPhotoDeleted, isPatientView }: PhotoComparisonProps) {
  console.log('🚀 PhotoComparison RENDERIZADO!', { checkinsLength: checkins.length, hasPatient: !!patient });

  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [alternativeUrls, setAlternativeUrls] = useState<Map<string, string>>(new Map());
  const [selectedBeforeIndex, setSelectedBeforeIndex] = useState<number>(0);
  const [selectedAfterIndex, setSelectedAfterIndex] = useState<number | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<PhotoData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const { toast } = useToast();

  // Função para baixar foto do Google Drive (versão melhorada para download direto)
  const handleDownloadPhoto = async (url: string, label: string) => {
    try {
      // Extrair ID do Google Drive
      const fileId = url.match(/[?&]id=([^&]+)/)?.[1] ||
        url.match(/\/file\/d\/([^\/]+)/)?.[1] ||
        url.match(/\/d\/([^\/]+)/)?.[1];

      if (fileId && url.includes('drive.google.com')) {
        // Para Google Drive, usar fetch para baixar como blob
        try {
          const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

          toast({
            title: 'Iniciando download...',
            description: `Baixando ${label}...`
          });

          // Tentar fetch direto primeiro
          const response = await fetch(downloadUrl, {
            method: 'GET',
            mode: 'cors'
          });

          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${label.replace(/\s+/g, '-').toLowerCase()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Limpar blob URL
            window.URL.revokeObjectURL(blobUrl);

            toast({
              title: 'Download concluído!',
              description: `${label} foi baixado com sucesso.`
            });
          } else {
            throw new Error('Fetch falhou');
          }
        } catch (fetchError) {
          console.log('Fetch falhou, tentando método alternativo...', fetchError);

          // Fallback: tentar converter URL para formato direto
          const directUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;

          try {
            const response = await fetch(directUrl);
            if (response.ok) {
              const blob = await response.blob();
              const blobUrl = window.URL.createObjectURL(blob);

              const link = document.createElement('a');
              link.href = blobUrl;
              link.download = `${label.replace(/\s+/g, '-').toLowerCase()}.jpg`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              window.URL.revokeObjectURL(blobUrl);

              toast({
                title: 'Download concluído!',
                description: `${label} foi baixado com sucesso.`
              });
            } else {
              throw new Error('Thumbnail fetch falhou');
            }
          } catch (thumbnailError) {
            console.log('Thumbnail fetch falhou, abrindo em nova aba...', thumbnailError);

            // Último recurso: abrir em nova aba
            const fallbackUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            window.open(fallbackUrl, '_blank');

            toast({
              title: 'Download iniciado',
              description: `${label} será aberto em nova aba para download manual.`
            });
          }
        }
      } else {
        // Para outras URLs, tentar download direto via fetch
        try {
          const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
          });

          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${label.replace(/\s+/g, '-').toLowerCase()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(blobUrl);

            toast({
              title: 'Download concluído!',
              description: `${label} foi baixado com sucesso.`
            });
          } else {
            throw new Error('Fetch direto falhou');
          }
        } catch (directError) {
          console.log('Fetch direto falhou, usando método tradicional...', directError);

          // Fallback para método tradicional
          const link = document.createElement('a');
          link.href = url;
          link.download = `${label.replace(/\s+/g, '-').toLowerCase()}.jpg`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast({
            title: 'Download iniciado',
            description: `Baixando ${label}...`
          });
        }
      }
    } catch (error) {
      console.error('Erro ao baixar foto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar a foto. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  // Log de debug
  const patientPhotos = patient ? {
    frente: (patient as any).foto_inicial_frente,
    lado: (patient as any).foto_inicial_lado,
    lado_2: (patient as any).foto_inicial_lado_2,
    costas: (patient as any).foto_inicial_costas,
  } : null;

  console.log('📸 PhotoComparison - Dados recebidos:', {
    hasPatient: !!patient,
    patientName: patient?.nome,
    checkinsCount: checkins.length,
    patientPhotos
  });

  console.log('📸 URLs das fotos (completas):', patientPhotos);

  const handleImageError = (photoId: string, url: string, originalUrl?: string) => {
    console.log('❌ Erro ao carregar imagem:', photoId);
    console.log('❌ URL que falhou:', url);

    // Tentar URL alternativa se ainda não tentou
    if (!alternativeUrls.has(photoId) && originalUrl) {
      console.log('🔄 Tentando URL alternativa (thumbnail)...');
      const fileId = url.match(/[?&]id=([^&]+)/)?.[1];
      if (fileId) {
        const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        setAlternativeUrls(prev => new Map(prev).set(photoId, thumbnailUrl));
        return;
      }
    }

    setImageErrors(prev => new Set(prev).add(photoId));
  };

  const getPhotoId = (photo: PhotoData) => {
    return `${photo.checkinId}-${photo.photoNumber}`;
  };

  const getPhotoUrl = (photo: PhotoData) => {
    const photoId = getPhotoId(photo);
    return alternativeUrls.get(photoId) || photo.url;
  };

  // Adicionar fotos iniciais do paciente (se existirem)
  const initialPhotos: PhotoData[] = [];
  if (patient) {
    const patientWithInitialData = patient as any;
    if (patientWithInitialData.foto_inicial_frente) {
      const isVideo = getMediaType(patientWithInitialData.foto_inicial_frente) === 'video';
      // Tentar usar URL original primeiro, só converter se necessário
      const originalUrl = patientWithInitialData.foto_inicial_frente;
      const convertedUrl = originalUrl.includes('drive.google.com')
        ? convertGoogleDriveUrl(originalUrl, isVideo)
        : originalUrl;

      console.log('📸 Foto Frente - URL Original:', originalUrl);
      console.log('📸 Foto Frente - URL Convertida:', convertedUrl);
      console.log('📸 Foto Frente - É vídeo?', isVideo);

      initialPhotos.push({
        url: originalUrl, // Usar URL original, não convertida
        date: patientWithInitialData.data_fotos_iniciais ? parseLocalISODate(patientWithInitialData.data_fotos_iniciais).toLocaleDateString('pt-BR') : 'Data Inicial',
        weight: patientWithInitialData.peso_inicial?.toString() || 'N/A',
        checkinId: 'initial-frente',
        photoNumber: 0,
        isInitial: true,
        isVideo,
        angle: 'frente'
      });
    }
    if (patientWithInitialData.foto_inicial_lado) {
      const isVideo = getMediaType(patientWithInitialData.foto_inicial_lado) === 'video';
      const originalUrl = patientWithInitialData.foto_inicial_lado;
      initialPhotos.push({
        url: originalUrl,
        date: patientWithInitialData.data_fotos_iniciais ? parseLocalISODate(patientWithInitialData.data_fotos_iniciais).toLocaleDateString('pt-BR') : 'Data Inicial',
        weight: patientWithInitialData.peso_inicial?.toString() || 'N/A',
        checkinId: 'initial-lado',
        photoNumber: 0,
        isInitial: true,
        isVideo,
        angle: 'lado'
      });
    }
    if (patientWithInitialData.foto_inicial_lado_2) {
      const isVideo = getMediaType(patientWithInitialData.foto_inicial_lado_2) === 'video';
      const originalUrl = patientWithInitialData.foto_inicial_lado_2;
      initialPhotos.push({
        url: originalUrl,
        date: patientWithInitialData.data_fotos_iniciais ? parseLocalISODate(patientWithInitialData.data_fotos_iniciais).toLocaleDateString('pt-BR') : 'Data Inicial',
        weight: patientWithInitialData.peso_inicial?.toString() || 'N/A',
        checkinId: 'initial-lado-2',
        photoNumber: 0,
        isInitial: true,
        isVideo,
        angle: 'lado_2'
      });
    }
    if (patientWithInitialData.foto_inicial_costas) {
      const isVideo = getMediaType(patientWithInitialData.foto_inicial_costas) === 'video';
      const originalUrl = patientWithInitialData.foto_inicial_costas;
      initialPhotos.push({
        url: originalUrl,
        date: patientWithInitialData.data_fotos_iniciais ? parseLocalISODate(patientWithInitialData.data_fotos_iniciais).toLocaleDateString('pt-BR') : 'Data Inicial',
        weight: patientWithInitialData.peso_inicial?.toString() || 'N/A',
        checkinId: 'initial-costas',
        photoNumber: 0,
        isInitial: true,
        isVideo,
        angle: 'costas'
      });
    }
  }

  console.log('📸 initialPhotos criado:', initialPhotos.length, initialPhotos);

  // Extrair todas as fotos/vídeos dos check-ins (inverter ordem para ter do mais antigo ao mais recente)
  const checkinPhotos: PhotoData[] = [...checkins].reverse().flatMap(checkin => {
    const photos: PhotoData[] = [];
    if (checkin.foto_1) {
      const isVideo = getMediaType(checkin.foto_1) === 'video';
      const url = checkin.foto_1.includes('drive.google.com')
        ? convertGoogleDriveUrl(checkin.foto_1, isVideo)
        : checkin.foto_1;
      photos.push({
        url: url || checkin.foto_1,
        date: parseLocalISODate(checkin.data_checkin).toLocaleDateString('pt-BR'),
        weight: checkin.peso || 'N/A',
        checkinId: checkin.id,
        photoNumber: 1,
        isVideo,
        angle: 'frente'
      });
    }
    if (checkin.foto_2) {
      const isVideo = getMediaType(checkin.foto_2) === 'video';
      const url = checkin.foto_2.includes('drive.google.com')
        ? convertGoogleDriveUrl(checkin.foto_2, isVideo)
        : checkin.foto_2;
      photos.push({
        url: url || checkin.foto_2,
        date: parseLocalISODate(checkin.data_checkin).toLocaleDateString('pt-BR'),
        weight: checkin.peso || 'N/A',
        checkinId: checkin.id,
        photoNumber: 2,
        isVideo,
        angle: 'lado'
      });
    }
    if (checkin.foto_3) {
      const isVideo = getMediaType(checkin.foto_3) === 'video';
      const url = checkin.foto_3.includes('drive.google.com')
        ? convertGoogleDriveUrl(checkin.foto_3, isVideo)
        : checkin.foto_3;
      photos.push({
        url: url || checkin.foto_3,
        date: parseLocalISODate(checkin.data_checkin).toLocaleDateString('pt-BR'),
        weight: checkin.peso || 'N/A',
        checkinId: checkin.id,
        photoNumber: 3,
        isVideo,
        angle: 'lado_2'
      });
    }
    if (checkin.foto_4) {
      const isVideo = getMediaType(checkin.foto_4) === 'video';
      const url = checkin.foto_4.includes('drive.google.com')
        ? convertGoogleDriveUrl(checkin.foto_4, isVideo)
        : checkin.foto_4;
      photos.push({
        url: url || checkin.foto_4,
        date: parseLocalISODate(checkin.data_checkin).toLocaleDateString('pt-BR'),
        weight: checkin.peso || 'N/A',
        checkinId: checkin.id,
        photoNumber: 4,
        isVideo,
        angle: 'costas'
      });
    }
    return photos;
  });

  // Combinar fotos iniciais com fotos de check-ins
  const allPhotos = [...initialPhotos, ...checkinPhotos];

  console.log('📸 allPhotos final:', allPhotos.length, allPhotos);

  // Inicializar índice "Depois" quando allPhotos mudar
  if (selectedAfterIndex === null && allPhotos.length > 1) {
    setSelectedAfterIndex(allPhotos.length - 1);
  }

  const handleZoomPhoto = (photo: PhotoData) => {
    setSelectedPhoto(photo);
    setIsZoomOpen(true);
  };

  // Obter fotos selecionadas pelos índices
  const firstPhoto = allPhotos[selectedBeforeIndex] || allPhotos[0];
  const lastPhoto = allPhotos[selectedAfterIndex ?? allPhotos.length - 1] || allPhotos[allPhotos.length - 1];

  // Função para formatar label da foto
  const getPhotoLabel = (photo: PhotoData, index: number) => {
    // Numeração genérica pelo ângulo (Foto 1/2/3/4) em vez do nome do lado.
    // Algumas fotos vêm salvas no campo "errado" no banco — mostrar "Frente"
    // numa foto de costas ficava feio. Numerar por slot esconde isso.
    const angleLabel = photo.angle === 'frente' ? '📷 Foto 1' :
      photo.angle === 'lado' ? '📷 Foto 2' :
        photo.angle === 'lado_2' ? '📷 Foto 3' :
          photo.angle === 'costas' ? '📷 Foto 4' : '📷';
    const prefix = photo.isInitial ? '⭐ INICIAL' : `#${index + 1}`;
    return `${prefix} - ${angleLabel} - ${photo.date} (${photo.weight}kg)`;
  };

  // Função para deletar foto
  const handleDeletePhoto = async (photo: PhotoData) => {
    setIsDeleting(true);
    try {
      if (photo.isInitial) {
        // Deletar foto inicial do paciente
        if (!patient?.id) {
          throw new Error('ID do paciente não encontrado');
        }

        const fieldMap: Record<string, string> = {
          'frente': 'foto_inicial_frente',
          'lado': 'foto_inicial_lado',
          'lado_2': 'foto_inicial_lado_2',
          'costas': 'foto_inicial_costas'
        };

        const fieldToUpdate = fieldMap[photo.angle || ''];
        if (!fieldToUpdate) {
          throw new Error('Ângulo da foto não identificado');
        }

        const { error } = await supabase
          .from('patients')
          .update({ [fieldToUpdate]: null })
          .eq('id', patient.id);

        if (error) throw error;

        toast({
          title: "Foto deletada com sucesso",
          description: "A foto inicial foi removida.",
        });
      } else {
        // Deletar foto de check-in
        const fieldMap: Record<number, string> = {
          1: 'foto_1',
          2: 'foto_2',
          3: 'foto_3',
          4: 'foto_4'
        };

        const fieldToUpdate = fieldMap[photo.photoNumber];
        if (!fieldToUpdate) {
          throw new Error('Número da foto não identificado');
        }

        const { error } = await supabase
          .from('checkin')
          .update({ [fieldToUpdate]: null })
          .eq('id', photo.checkinId);

        if (error) throw error;

        toast({
          title: "Foto deletada com sucesso",
          description: "A foto do check-in foi removida.",
        });
      }

      // Chamar callback para recarregar dados
      if (onPhotoDeleted) {
        onPhotoDeleted();
      }
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      toast({
        title: "Erro ao deletar foto",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setPhotoToDelete(null);
    }
  };

  if (allPhotos.length === 0) {
    const patientWithData = patient as any;
    const hasPhotoUrls = patientWithData?.foto_inicial_frente ||
      patientWithData?.foto_inicial_lado ||
      patientWithData?.foto_inicial_lado_2 ||
      patientWithData?.foto_inicial_costas;

    return (
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Camera className="w-5 h-5 text-blue-500" />
                Evolução Fotográfica
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Comparação visual da evolução
              </CardDescription>
            </div>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-white/10 dark:hover:bg-slate-800/10 rounded-lg transition-colors duration-200 flex items-center justify-center"
              aria-label={isMinimized ? 'Expandir' : 'Minimizar'}
            >
              {isMinimized ? (
                <ChevronDown className="w-5 h-5 text-slate-300" />
              ) : (
                <ChevronUp className="w-5 h-5 text-slate-300" />
              )}
            </button>
          </div>
        </CardHeader>
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Camera className="w-16 h-16 text-slate-600 dark:text-slate-400 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 text-lg">Nenhuma foto disponível</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                    As fotos dos check-ins aparecerão aqui para comparação
                  </p>

                  {hasPhotoUrls && (
                    <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg text-left max-w-2xl">
                      <p className="text-yellow-400 font-semibold mb-2">⚠️ Debug: URLs encontradas mas fotos não processadas</p>
                      <div className="text-xs text-yellow-300 space-y-1">
                        {patientWithData.foto_inicial_frente && (
                          <div>
                            <strong>Frente:</strong> {patientWithData.foto_inicial_frente.substring(0, 80)}...
                          </div>
                        )}
                        {patientWithData.foto_inicial_lado && (
                          <div>
                            <strong>Lado:</strong> {patientWithData.foto_inicial_lado.substring(0, 80)}...
                          </div>
                        )}
                        {patientWithData.foto_inicial_lado_2 && (
                          <div>
                            <strong>Lado 2:</strong> {patientWithData.foto_inicial_lado_2.substring(0, 80)}...
                          </div>
                        )}
                        {patientWithData.foto_inicial_costas && (
                          <div>
                            <strong>Costas:</strong> {patientWithData.foto_inicial_costas.substring(0, 80)}...
                          </div>
                        )}
                      </div>
                      <p className="text-yellow-300 text-xs mt-2">
                        Verifique o console do navegador (F12) para mais detalhes
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Camera className="w-5 h-5 text-blue-500" />
                Evolução Fotográfica
              </CardTitle>
              {!isPatientView && (
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  Comparação visual da evolução - {allPhotos.length} {allPhotos.length === 1 ? 'foto' : 'fotos'} disponíveis
                </CardDescription>
              )}
            </div>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-200 flex items-center justify-center"
              aria-label={isMinimized ? 'Expandir' : 'Minimizar'}
            >
              {isMinimized ? (
                <ChevronDown className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              ) : (
                <ChevronUp className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              )}
            </button>
          </div>
        </CardHeader>
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="space-y-6">
                {/* Comparação Antes/Depois */}
                {allPhotos.length >= 2 && firstPhoto && lastPhoto && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <ChevronRight className="w-5 h-5 text-emerald-400" />
                        Comparação: Antes e Depois
                      </h3>
                    </div>

                    {/* Seletores de Fotos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-slate-50 dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                      <div className="space-y-2.5">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                          Momento Inicial ("Antes")
                        </label>
                        <Select
                          value={selectedBeforeIndex.toString()}
                          onValueChange={(value) => setSelectedBeforeIndex(parseInt(value))}
                        >
                          <SelectTrigger className="w-full h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-lg shadow-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                            {allPhotos.map((photo, index) => (
                              <SelectItem
                                key={`before-${index}`}
                                value={index.toString()}
                                className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 py-2.5 cursor-pointer data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-700"
                              >
                                {getPhotoLabel(photo, index)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                          Momento Final ("Depois")
                        </label>
                        <Select
                          value={(selectedAfterIndex ?? allPhotos.length - 1).toString()}
                          onValueChange={(value) => setSelectedAfterIndex(parseInt(value))}
                        >
                          <SelectTrigger className="w-full h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-lg shadow-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                            {allPhotos.map((photo, index) => (
                              <SelectItem
                                key={`after-${index}`}
                                value={index.toString()}
                                className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 py-2.5 cursor-pointer data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-700"
                              >
                                {getPhotoLabel(photo, index)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Foto/Vídeo Inicial */}
                      <div className="space-y-3">
                        <div className="relative group">
                          {firstPhoto.isVideo ? (
                            <video
                              src={firstPhoto.url}
                              controls
                              className="w-full h-80 object-cover rounded-lg border-2 border-slate-600 hover:border-blue-500 transition-all"
                            />
                          ) : isGoogleDriveUrl(firstPhoto.url) ? (
                            <GoogleDriveImage
                              src={firstPhoto.url}
                              alt="Foto Inicial"
                              className="w-full h-80 object-cover rounded-lg border-2 border-slate-600 hover:border-blue-500 transition-all cursor-pointer"
                              onClick={() => handleZoomPhoto(firstPhoto)}
                              onError={() => handleImageError(getPhotoId(firstPhoto), getPhotoUrl(firstPhoto), firstPhoto.url)}
                            />
                          ) : imageErrors.has(getPhotoId(firstPhoto)) ? (
                            <div className="w-full h-80 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700">
                              <ExternalLink className="h-12 w-12 text-slate-400 dark:text-slate-500 mb-3" />
                              <p className="text-slate-600 dark:text-slate-400 mb-4">Foto não disponível</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(firstPhoto.url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Abrir em nova aba
                              </Button>
                            </div>
                          ) : (
                            <img
                              src={getPhotoUrl(firstPhoto)}
                              alt="Foto Inicial"
                              loading="lazy"
                              className="w-full h-96 object-cover rounded-lg border-2 border-slate-600 hover:border-blue-500 transition-all cursor-pointer"
                              onClick={() => handleZoomPhoto(firstPhoto)}
                              onError={() => handleImageError(getPhotoId(firstPhoto), getPhotoUrl(firstPhoto), firstPhoto.url)}
                            />
                          )}
                          <Badge className={`absolute top-2 left-2 ${firstPhoto.isInitial ? 'bg-purple-600/90' : 'bg-blue-600/90'} text-white`}>
                            {firstPhoto.isInitial ? 'INICIAL' : 'ANTES'}
                          </Badge>
                          {!firstPhoto.isVideo && !imageErrors.has(getPhotoId(firstPhoto)) && (
                            <>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="absolute top-1/2 -translate-y-1/2 right-12 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 bg-white/90 dark:bg-slate-950/90 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadPhoto(firstPhoto.url, `Foto-Antes-${firstPhoto.date}-${firstPhoto.weight}kg`);
                                }}
                                title="Baixar foto"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 bg-white/90 dark:bg-slate-950/90 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50"
                                onClick={() => handleZoomPhoto(firstPhoto)}
                              >
                                <ZoomIn className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <Calendar className="w-4 h-4" />
                              {firstPhoto.date}
                            </div>
                            <div className="text-slate-900 dark:text-slate-100 font-semibold">
                              {firstPhoto.weight} kg
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Foto/Vídeo Final */}
                      <div className="space-y-3">
                        <div className="relative group">
                          {lastPhoto.isVideo ? (
                            <video
                              src={lastPhoto.url}
                              controls
                              className="w-full h-80 object-cover rounded-lg border-2 border-slate-600 hover:border-emerald-500 transition-all"
                            />
                          ) : isGoogleDriveUrl(lastPhoto.url) ? (
                            <GoogleDriveImage
                              src={lastPhoto.url}
                              alt="Foto Atual"
                              className="w-full h-80 object-cover rounded-lg border-2 border-slate-600 hover:border-emerald-500 transition-all cursor-pointer"
                              onClick={() => handleZoomPhoto(lastPhoto)}
                              onError={() => handleImageError(getPhotoId(lastPhoto), getPhotoUrl(lastPhoto), lastPhoto.url)}
                            />
                          ) : imageErrors.has(getPhotoId(lastPhoto)) ? (
                            <div className="w-full h-80 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700">
                              <ExternalLink className="h-12 w-12 text-slate-400 dark:text-slate-500 mb-3" />
                              <p className="text-slate-600 dark:text-slate-400 mb-4">Foto não disponível</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(lastPhoto.url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Abrir em nova aba
                              </Button>
                            </div>
                          ) : (
                            <img
                              src={getPhotoUrl(lastPhoto)}
                              alt="Foto Atual"
                              loading="lazy"
                              className="w-full h-96 object-cover rounded-lg border-2 border-slate-600 hover:border-emerald-500 transition-all cursor-pointer"
                              onClick={() => handleZoomPhoto(lastPhoto)}
                              onError={() => handleImageError(getPhotoId(lastPhoto), getPhotoUrl(lastPhoto), lastPhoto.url)}
                            />
                          )}
                          <Badge className="absolute top-2 left-2 bg-emerald-600/90 text-white">
                            ATUAL
                          </Badge>
                          {!lastPhoto.isVideo && !imageErrors.has(getPhotoId(lastPhoto)) && (
                            <>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="absolute top-1/2 -translate-y-1/2 right-12 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 bg-white/90 dark:bg-slate-950/90 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadPhoto(lastPhoto.url, `Foto-Depois-${lastPhoto.date}-${lastPhoto.weight}kg`);
                                }}
                                title="Baixar foto"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 bg-white/90 dark:bg-slate-950/90 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50"
                                onClick={() => handleZoomPhoto(lastPhoto)}
                              >
                                <ZoomIn className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <Calendar className="w-4 h-4" />
                              {lastPhoto.date}
                            </div>
                            <div className="text-slate-900 dark:text-slate-100 font-semibold">
                              {lastPhoto.weight} kg
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Galeria de Todas as Fotos */}
                {!isPatientView && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Camera className="w-5 h-5 text-purple-400" />
                      Galeria Completa ({allPhotos.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {allPhotos.map((photo, index) => (
                        <div key={`${photo.checkinId}-${photo.photoNumber}`} className="space-y-2">
                          <div className="relative group">
                            {photo.isVideo ? (
                              <video
                                src={photo.url}
                                controls
                                className="w-full h-48 object-cover rounded-lg border border-slate-600 hover:border-purple-500 transition-all"
                              />
                            ) : isGoogleDriveUrl(photo.url) ? (
                              <GoogleDriveImage
                                src={photo.url}
                                alt={`Foto ${index + 1}`}
                                className="w-full h-48 object-cover rounded-lg border border-slate-600 hover:border-purple-500 transition-all cursor-pointer hover:scale-105"
                                onClick={() => handleZoomPhoto(photo)}
                                onError={() => handleImageError(getPhotoId(photo), getPhotoUrl(photo), photo.url)}
                              />
                            ) : imageErrors.has(getPhotoId(photo)) ? (
                              <div className="w-full h-48 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <ExternalLink className="h-8 w-8 text-slate-400 dark:text-slate-500 mb-2" />
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 px-2 text-center">Foto não disponível</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => window.open(photo.url, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Abrir
                                </Button>
                              </div>
                            ) : (
                              <img
                                src={getPhotoUrl(photo)}
                                alt={`Foto ${index + 1}`}
                                loading="lazy"
                                className="w-full h-48 object-cover rounded-lg border border-slate-600 hover:border-purple-500 transition-all cursor-pointer hover:scale-105"
                                onClick={() => handleZoomPhoto(photo)}
                                onError={() => handleImageError(getPhotoId(photo), getPhotoUrl(photo), photo.url)}
                              />
                            )}
                            <Badge className={`absolute top-2 left-2 ${photo.isInitial ? 'bg-purple-600/90' : 'bg-slate-800/90'} text-white text-xs`}>
                              {photo.isInitial ? '⭐' : `#${index + 1}`}
                            </Badge>
                            {/* Botão de download */}
                            <Button
                              size="sm"
                              variant="secondary"
                              className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPhoto(photo.url, `Foto-${photo.date}-${photo.weight}kg`);
                              }}
                              title="Baixar foto"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            {/* Botão de deletar */}
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPhotoToDelete(photo);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="text-xs text-center">
                            <p className="text-slate-500 dark:text-slate-400">{photo.date}</p>
                            <p className="text-slate-900 dark:text-slate-100 font-semibold">{photo.weight} kg</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!photoToDelete} onOpenChange={(open) => !open && setPhotoToDelete(null)}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-100">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              Tem certeza que deseja deletar esta foto?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {photoToDelete && (
            <div className="px-6 pb-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-slate-100">Data:</strong> {photoToDelete.date}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-slate-100">Peso:</strong> {photoToDelete.weight} kg
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-slate-100">Tipo:</strong> {photoToDelete.isInitial ? 'Foto Inicial' : 'Foto de Check-in'}
                </div>
              </div>
              <div className="mt-3 text-red-600 dark:text-red-400 font-semibold text-sm">
                ⚠️ Esta ação não pode ser desfeita!
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => photoToDelete && handleDeletePhoto(photoToDelete)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deletando...' : 'Deletar Foto'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Zoom */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-4xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>Foto - {selectedPhoto?.date}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                  {selectedPhoto?.weight} kg
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="!bg-white dark:!bg-slate-900 border-emerald-300 text-emerald-700 dark:text-emerald-300 hover:!bg-emerald-50 hover:text-emerald-800"
                  onClick={() => {
                    if (selectedPhoto) {
                      const link = document.createElement('a');
                      link.href = selectedPhoto.url;
                      link.download = `foto-${selectedPhoto.date}.jpg`;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Baixar
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="relative">
              {selectedPhoto.isVideo ? (
                <video
                  src={selectedPhoto.url}
                  controls
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                  onError={(e) => {
                    console.error('Erro ao carregar vídeo:', selectedPhoto.url);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : isGoogleDriveUrl(selectedPhoto.url) ? (
                <img
                  src={convertGoogleDriveUrl(selectedPhoto.url, false) || selectedPhoto.url}
                  alt="Foto ampliada"
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg bg-slate-100 dark:bg-slate-800"
                  onError={(e) => {
                    console.error('Erro ao carregar imagem do Google Drive');
                    handleImageError(getPhotoId(selectedPhoto), getPhotoUrl(selectedPhoto), selectedPhoto.url);
                  }}
                  crossOrigin="anonymous"
                />
              ) : imageErrors.has(getPhotoId(selectedPhoto)) ? (
                <div className="w-full h-[70vh] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <ExternalLink className="h-16 w-16 text-slate-400 dark:text-slate-500 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 text-lg mb-6">Foto não disponível</p>
                  <Button
                    onClick={() => window.open(selectedPhoto.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir em nova aba
                  </Button>
                </div>
              ) : (
                <img
                  src={getPhotoUrl(selectedPhoto)}
                  alt="Foto ampliada"
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                  onError={() => handleImageError(getPhotoId(selectedPhoto), getPhotoUrl(selectedPhoto), selectedPhoto.url)}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
