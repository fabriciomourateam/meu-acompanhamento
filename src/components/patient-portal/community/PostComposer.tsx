import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  communityService,
  CATEGORIES,
  type CommunityCategory,
} from '@/lib/community-service';
import { cn } from '@/lib/utils';

interface PostComposerProps {
  patientId: string;
  onPosted: () => void;
  /** Categoria controlada externamente (ex.: CTA "postar em X"). Opcional. */
  category?: CommunityCategory;
  onCategoryChange?: (c: CommunityCategory) => void;
}

export function PostComposer({ patientId, onPosted, category: categoryProp, onCategoryChange }: PostComposerProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [categoryInternal, setCategoryInternal] = useState<CommunityCategory>('geral');
  const category = categoryProp ?? categoryInternal;
  const setCategory = onCategoryChange ?? setCategoryInternal;
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Imagem muito grande', description: 'Escolha uma imagem de até 5MB.', variant: 'destructive' });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
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
        {CATEGORIES.map((c) => (
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

      <div className="mt-3 flex items-center justify-between">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handlePickImage} />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="text-slate-600 hover:text-emerald-600"
        >
          <ImagePlus className="mr-1.5 h-4 w-4" /> Foto
        </Button>
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
