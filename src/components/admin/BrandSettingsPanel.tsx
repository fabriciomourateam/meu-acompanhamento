import { useEffect, useRef, useState } from 'react';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { portalSettingsService } from '@/lib/portal-settings-service';

interface Props {
  trainerUserId: string;
}

/**
 * Aba "Marca" do /admin: o treinador sobe o próprio logo, escolhe a cor e a
 * frase que aparecem na tela de login dos alunos (rota /portal-<slug>).
 * Grava via RPC update_trainer_brand (o /admin é PIN-based, sem auth Supabase).
 */
export function BrandSettingsPanel({ trainerUserId }: Props) {
  const { toast } = useToast();
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [tagline, setTagline] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!trainerUserId) return;
    portalSettingsService.getBrand(trainerUserId).then((b) => {
      setLogoUrl(b.logoUrl);
      setPrimaryColor(b.primaryColor);
      setTagline(b.tagline);
      setLoading(false);
    });
  }, [trainerUserId]);

  const handlePickLogo = () => fileRef.current?.click();

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem.', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Imagem muito grande', description: 'Escolha um logo de até 2MB.', variant: 'destructive' });
      return;
    }
    try {
      setUploading(true);
      const ext = file.name.split('.').pop() || 'png';
      // Bucket público patient-photos já permite upload anon (mesmo do avatar).
      const filePath = `brand/${trainerUserId}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('patient-photos').upload(filePath, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('patient-photos').getPublicUrl(filePath);
      setLogoUrl(publicUrl);
      toast({ title: 'Logo enviado! 🖼️', description: 'Clique em Salvar para aplicar.' });
    } catch (err) {
      console.error('Erro ao enviar logo:', err);
      toast({ title: 'Erro ao enviar logo', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await portalSettingsService.saveBrand(trainerUserId, { logoUrl, primaryColor, tagline });
      toast({ title: 'Marca salva! ✅', description: 'Seus alunos já veem a nova identidade no login.' });
    } catch (err) {
      console.error('Erro ao salvar marca:', err);
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const inputCls =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none';

  return (
    <div className="space-y-6">
      {/* Preview de como aparece no login */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Prévia do login do aluno</h3>
        <div className="flex flex-col items-center gap-2 rounded-xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black py-6">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-amber-500/20 bg-zinc-900">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-[85%] w-[85%] object-contain" />
            ) : (
              <ImageIcon className="h-8 w-8 text-slate-600" />
            )}
          </div>
          <span className="text-lg font-bold text-amber-300">Meu Acompanhamento</span>
          <span className="text-sm font-semibold" style={{ color: primaryColor || '#cbd5e1' }}>
            {tagline || 'Construindo Resultados'}
          </span>
        </div>
      </div>

      {/* Logo */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="text-sm font-medium text-slate-800">Logo</label>
        <p className="mb-2 text-xs text-slate-500">PNG com fundo transparente fica melhor. Até 2MB.</p>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={handlePickLogo} disabled={uploading} className="gap-1.5">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Enviando...' : 'Enviar logo'}
          </Button>
          {logoUrl && (
            <button type="button" onClick={() => setLogoUrl('')} className="text-xs text-slate-400 hover:text-red-500">
              Remover
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoFile} className="hidden" />
      </div>

      {/* Cor */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="text-sm font-medium text-slate-800">Cor principal</label>
        <p className="mb-2 text-xs text-slate-500">Usada na frase abaixo do título no login.</p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={primaryColor || '#10b981'}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded border border-slate-200 bg-white"
          />
          <input
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            placeholder="#10b981 (deixe vazio para o padrão)"
            className={inputCls}
          />
        </div>
      </div>

      {/* Frase */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="text-sm font-medium text-slate-800">Frase (tagline)</label>
        <p className="mb-2 text-xs text-slate-500">Aparece abaixo de "Meu Acompanhamento" no login.</p>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          maxLength={60}
          placeholder="Ex.: Construindo Resultados"
          className={inputCls}
        />
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Salvar marca
      </Button>
    </div>
  );
}
