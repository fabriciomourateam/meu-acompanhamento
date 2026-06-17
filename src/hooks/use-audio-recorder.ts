// use-audio-recorder — gravação de nota de voz no navegador (MediaRecorder).
// Zero dependência. Retorna um File ao parar (ou null se nada foi gravado).
import { useCallback, useRef, useState } from 'react';

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      /* noop */
    }
  }
  return '';
}

export interface AudioRecorder {
  recording: boolean;
  seconds: number;
  supported: boolean;
  start: () => Promise<void>;
  stop: () => Promise<File | null>;
  cancel: () => void;
}

export function useAudioRecorder(): AudioRecorder {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeRef = useRef<string>('');

  const supported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof MediaRecorder !== 'undefined';

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recRef.current = null;
    chunksRef.current = [];
    setRecording(false);
    setSeconds(0);
  }, []);

  const start = useCallback(async () => {
    if (!supported) throw new Error('Gravação de áudio não suportada neste dispositivo');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const mime = pickMimeType();
    mimeRef.current = mime;
    const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    chunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.start();
    recRef.current = rec;
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }, [supported]);

  const stop = useCallback((): Promise<File | null> => {
    const rec = recRef.current;
    if (!rec) {
      cleanup();
      return Promise.resolve(null);
    }
    return new Promise<File | null>((resolve) => {
      rec.onstop = () => {
        const type = mimeRef.current || rec.mimeType || 'audio/webm';
        const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
        const hasData = chunksRef.current.length > 0;
        const file = hasData
          ? new File([new Blob(chunksRef.current, { type })], `audio_${Date.now()}.${ext}`, { type })
          : null;
        cleanup();
        resolve(file);
      };
      try {
        rec.stop();
      } catch {
        cleanup();
        resolve(null);
      }
    });
  }, [cleanup]);

  const cancel = useCallback(() => {
    const rec = recRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.onstop = null;
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    }
    cleanup();
  }, [cleanup]);

  return { recording, seconds, supported, start, stop, cancel };
}
