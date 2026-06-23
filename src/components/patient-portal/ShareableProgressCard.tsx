// ITEM 11 — Compartilhar progresso com a marca do trainer (gera PNG vertical).
import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import type { TrainerProfile } from '@/lib/workout/workout-extras-service';

interface Props {
  trainerProfile: TrainerProfile;
  patientName: string;
  stats: {
    weeks: number;
    weightChange?: number;
    bodyFatChange?: number;
    avgAdherence?: number;
    benchPRChange?: number;
  };
  portalUrl?: string;
}

export function ShareableProgressCard({ trainerProfile, patientName, stats, portalUrl }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const logo = trainerProfile.share_logo_url ?? trainerProfile.avatar_url;
  const brandName = trainerProfile.share_brand_name ?? trainerProfile.name ?? 'Meu acompanhamento';
  const brandColor = trainerProfile.share_brand_color ?? '#3b82f6';

  const handleShare = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2, cacheBust: true });

      if (navigator.share && navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'minha-evolucao.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Minha evolução' });
          return;
        }
      }

      const link = document.createElement('a');
      link.download = 'minha-evolucao.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={cardRef}
        className="relative aspect-[9/16] w-[360px] overflow-hidden rounded-2xl p-6 text-white shadow-xl"
        style={{ background: `linear-gradient(135deg, ${brandColor}ee, ${brandColor}99)` }}
      >
        <div className="flex items-center gap-2">
          {logo && (
            <img src={logo} alt="" crossOrigin="anonymous" className="h-10 w-10 rounded-full border-2 border-white/40 object-cover" />
          )}
          <div className="text-sm font-medium opacity-90">{brandName}</div>
        </div>

        <h2 className="mt-6 text-3xl font-bold">{patientName}</h2>
        <p className="text-sm opacity-80">Minha evolução em {stats.weeks} semanas</p>

        <div className="mt-8 space-y-3">
          {stats.weightChange !== undefined && stats.weightChange !== 0 && (
            <StatPill label="Peso" value={`${stats.weightChange > 0 ? '+' : ''}${stats.weightChange}kg`} />
          )}
          {stats.bodyFatChange !== undefined && stats.bodyFatChange !== 0 && (
            <StatPill label="% Gordura" value={`${stats.bodyFatChange > 0 ? '+' : ''}${stats.bodyFatChange}%`} />
          )}
          {stats.benchPRChange !== undefined && stats.benchPRChange > 0 && (
            <StatPill label="Supino PR" value={`+${stats.benchPRChange}kg`} />
          )}
          {stats.avgAdherence !== undefined && (
            <StatPill label="Adesão" value={`${stats.avgAdherence}%`} />
          )}
        </div>

        {portalUrl && (
          <div className="absolute bottom-6 right-6 rounded bg-white dark:bg-slate-900 p-1">
            <QRCodeSVG value={portalUrl} size={48} />
          </div>
        )}
      </div>

      <Button onClick={() => void handleShare()} disabled={busy} className="w-full max-w-[360px]">
        <Share2 className="mr-1.5 h-4 w-4" /> {busy ? 'Gerando…' : 'Compartilhar'}
      </Button>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/15 px-4 py-2 backdrop-blur">
      <span className="text-sm font-medium opacity-80">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}
