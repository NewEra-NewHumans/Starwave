import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Send, Trash2 } from 'lucide-react';

interface VoiceRecorderWaveformBarProps {
  seconds: number;
  waveformEnabled: boolean;
  onCancel: () => void;
  onSend: () => void;
}

const BAR_COUNT = 24;

export const VoiceRecorderWaveformBar: React.FC<VoiceRecorderWaveformBarProps> = ({
  seconds,
  waveformEnabled,
  onCancel,
  onSend,
}) => {
  const [bars, setBars] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, (_, i) => 22 + ((i * 17) % 45))
  );
  const [micActive, setMicActive] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!waveformEnabled) {
      setBars(Array.from({ length: BAR_COUNT }, () => 30));
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array<ArrayBuffer> | null = null;

    async function tryConnectMic() {
      try {
        if (
          typeof navigator !== 'undefined' &&
          navigator.mediaDevices &&
          navigator.mediaDevices.getUserMedia
        ) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          if (AudioCtx) {
            audioCtx = new AudioCtx();
            const source = audioCtx.createMediaStreamSource(stream);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            const buffer = new ArrayBuffer(analyser.frequencyBinCount);
            dataArray = new Uint8Array(buffer);
            setMicActive(true);
          }
        }
      } catch {
        // Fallback silently to smooth organic synthetic waveform animation
      }
    }

    tryConnectMic();

    let lastUpdate = 0;
    const tick = (now: number) => {
      if (cancelled) return;
      if (now - lastUpdate >= 65) {
        lastUpdate = now;
        const phase = now / 170;

        if (analyser && dataArray) {
          analyser.getByteFrequencyData(dataArray);
          const avg =
            dataArray.reduce((sum, v) => sum + v, 0) /
            Math.max(1, dataArray.length);
          const hasSignal = avg > 6;

          const nextBars = Array.from({ length: BAR_COUNT }, (_, i) => {
            if (hasSignal) {
              const binIdx = Math.min(dataArray!.length - 1, Math.floor((i / BAR_COUNT) * dataArray!.length));
              const raw = dataArray![binIdx] || 0;
              return Math.min(100, Math.max(14, Math.round((raw / 255) * 100)));
            }
            // Gentle breathing idle mic wave
            const wave =
              Math.sin(phase + i * 0.45) * 18 +
              Math.cos(phase * 1.4 - i * 0.3) * 14;
            return Math.min(92, Math.max(16, Math.round(42 + wave)));
          });
          setBars(nextBars);
        } else {
          // Multi-frequency organic speech-like soundwave
          const nextBars = Array.from({ length: BAR_COUNT }, (_, i) => {
            const env = 1 - Math.abs(i - (BAR_COUNT - 1) / 2) / (BAR_COUNT * 0.72);
            const osc =
              Math.sin(phase * 1.35 + i * 0.52) * 24 +
              Math.cos(phase * 2.1 - i * 0.37) * 16 +
              Math.sin(phase * 0.7 + i * 0.85) * 12;
            return Math.min(100, Math.max(14, Math.round((46 + osc) * (0.55 + env * 0.55))));
          });
          setBars(nextBars);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };
  }, [waveformEnabled]);

  const formattedTime = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60
  ).padStart(2, '0')}`;

  return (
    <div className="mx-4 mt-2.5 px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-gradient-to-r from-rose-50/90 via-sky-50/70 to-indigo-50/80 dark:from-rose-950/30 dark:via-sky-950/20 dark:to-indigo-950/20 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
        </span>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
          <Mic className="w-3.5 h-3.5" />
          <span>{micActive ? '实时拾音录制中' : '语音录制中'}</span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/70 font-mono-tabular text-xs font-bold text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700">
          {formattedTime}
        </span>
      </div>

      {/* Dynamic Soundwave Visualizer Bars */}
      <div
        className="flex-1 min-w-[140px] max-w-xs h-8 flex items-center justify-center gap-1 px-2"
        aria-label="语音声波可视化"
      >
        {bars.map((pct, idx) => (
          <span
            key={idx}
            className="w-1 rounded-full bg-gradient-to-t from-[#2563EB] via-sky-400 to-teal-400 transition-all duration-75"
            style={{ height: `${Math.max(16, pct)}%` }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          取消
        </button>
        <button
          type="button"
          onClick={onSend}
          className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          发送语音
        </button>
      </div>
    </div>
  );
};

interface VoiceBubbleWaveformProps {
  messageId: string;
  playing: boolean;
  waveformEnabled: boolean;
}

export const VoiceBubbleWaveform: React.FC<VoiceBubbleWaveformProps> = ({
  messageId,
  playing,
  waveformEnabled,
}) => {
  const heights = useMemo(() => {
    const seed = Array.from(messageId).reduce(
      (acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1),
      17
    );
    return Array.from({ length: 16 }, (_, idx) => {
      const val = Math.abs(Math.sin(seed * 0.13 + idx * 0.72));
      return Math.round(7 + val * 15);
    });
  }, [messageId]);

  return (
    <div className="flex items-center gap-[3px] h-5">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-[2.5px] rounded-full bg-current transition-all ${
            playing && waveformEnabled
              ? 'animate-sr-voice-bar'
              : playing
              ? 'opacity-100'
              : 'opacity-75'
          }`}
          style={{
            height: `${h}px`,
            animationDelay: playing && waveformEnabled ? `${(i % 6) * 90}ms` : undefined,
          }}
        />
      ))}
    </div>
  );
};
