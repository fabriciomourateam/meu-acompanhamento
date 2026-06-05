import { useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  communityService,
  POST_CATEGORIES,
  type CommunityCategory,
} from '@/lib/community-service';
import { dailyChallengesService } from '@/lib/daily-challenges-service';
import { compressImage } from '@/lib/image-compression';
import { cn } from '@/lib/utils';

// Limite ANTES da compressão. Compressão reduz pra ~300–800kb.
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

interface PostComposerProps {
  patientId: string;
  onPosted: () => void;
  /** Categoria controlada externamente (ex.: CTA "postar em X"). Opcional. */
  category?: CommunityCategory;
  onCategoryChange?: (c: CommunityCategory) => void;
}

export function PostComposer({ patientId, onPosted, category: categoryProp, onCategoryChange }: PostComposerProps) {
  const { toast } = useToast();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [preparingImage, setPreparingImage] = useState(false);
  const [categoryInternal, setCategoryInternal] = useState<CommunityCategory>('geral');
  const category = categoryProp ?? categoryInternal;
  const setCategory = onCategoryChange ?? setCategoryInternal;
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
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
      setPreparingImage(true);
      const compressed = await compressImage(file);
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    } catch (err) {
      console.error('Falha ao processar imagem, usando original:', err);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } finally {
      setPreparingImage(false);
    }
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const canSubmit = content.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await communityService.uploadPostImage(patientId, imageFile);
      }
      await communityService.createPost(patientId, content.trim(), imageUrl, category);
      // Postar uma FOTO na comunidade marca a meta "Registro Visual" do dia.
      if (imageUrl) {
        dailyChallengesService.completeChallenge(patientId, 'registro_visual')
          .catch((e) => console.error('Falha ao marcar meta registro_visual:', e));
      }
      setContent('');
      setCategory('geral');
      clearImage();
      toast({ title: 'Publicado! 🎉', description: 'Sua mensagem foi compartilhada na comunidade.' });
      onPosted();
    } catch (err) {
      console.error('Erro ao publicar:', err);
      toast({ title: 'Erro ao publicar', description: 'Tente novamente em instantes.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={5000}
        placeholder="Compartilhe uma conquista, dúvida ou motivação com a comunidade..."
        className="min-h-[80px] resize-none bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-500"
      />

      {imagePreview && (
        <div className="relative mt-3 inline-block">
          <img src={imagePreview} alt="Prévia" className="max-h-48 rounded-xl object-cover" />
          <button
            onClick={clearImage}
            className="absolute -right-2 -top-2 rounded-full bg-slate-900/80 p-1 text-white hover:bg-slate-900"
            aria-label="Remover imagem"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {POST_CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              category === c.value
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handlePickImage} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePickImage} />
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => cameraRef.current?.click()}
            disabled={preparingImage}
            className="text-slate-600 hover:text-emerald-600"
            title="Tirar foto"
          >
            {preparingImage ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Camera className="mr-1.5 h-4 w-4" />}
            Câmera
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => galleryRef.current?.click()}
            disabled={preparingImage}
            className="text-slate-600 hover:text-emerald-600"
            title="Escolher da galeria"
          >
            <ImagePlus className="mr-1.5 h-4 w-4" /> Galeria
          </Button>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="bg-emerald-500 hover:bg-emerald-600"
          size="sm"
        >
          {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
          Publicar
        </Button>
      </div>
    </div>
  );
}
