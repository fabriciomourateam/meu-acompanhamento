import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compression';

const MAX_INPUT_BYTES = 25 * 1024 * 1024;

interface ProfileAvatarProps {
  patientId: string;
  name?: string;
  photoUrl?: string | null;
  /** Chamado com a nova URL pública após upload bem-sucedido */
  onChange?: (url: string) => void;
}

function initials(name?: string): string {
  if (!name) return '🙂';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');
}

export function ProfileAvatar({ patientId, name, photoUrl, onChange }: ProfileAvatarProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(photoUrl || null);
  const [uploading, setUploading] = useState(false);

  const handlePick = () => {
    if (uploading) return;
    inputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-selecionar o mesmo arquivo
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      toast({ title: 'Imagem muito grande', description: 'Escolha uma imagem de até 25MB.', variant: 'destructive' });
      return;
    }

    try {
      setUploading(true);
      // Avatar não precisa de muita resolução.
      const compressed = await compressImage(file, { maxDim: 800, quality: 0.85 });
      const fileExt = (compressed.name.split('.').pop() || 'jpg').toLowerCase();
      const filePath = `avatars/${patientId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('patient-photos')
        .upload(filePath, compressed, { upsert: true, contentType: compressed.type || 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('patient-photos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('patients')
        .update({ foto_perfil: publicUrl })
        .eq('id', patientId);
      if (updateError) throw updateError;

      setUrl(publicUrl);
      onChange?.(publicUrl);
      toast({ title: 'Foto atualizada! 📸', description: 'Sua foto de perfil foi salva.' });
    } catch (err) {
      console.error('Erro ao enviar foto de perfil:', err);
      toast({ title: 'Erro ao enviar foto', description: 'Tente novamente em instantes.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePick}
      title="Toque para alterar sua foto"
      className="group relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-full border-2 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 overflow-hidden shadow-sm transition-all hover:border-emerald-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
    >
      {url ? (
        <img src={url} alt={name || 'Foto de perfil'} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {initials(name)}
        </span>
      )}

      {/* Overlay de edição */}
      <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        ) : (
          <Camera className="h-4 w-4 text-white" />
        )}
      </span>

      {/* Loading sempre visível enquanto envia */}
      {uploading && !url && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </button>
  );
}
