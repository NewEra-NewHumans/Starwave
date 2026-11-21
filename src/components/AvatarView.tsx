import React from 'react';
import {
  Bell,
  Cat,
  Crown,
  Flower2,
  Headphones,
  Moon,
  Music,
  Sparkles,
  Sprout,
  Zap,
} from 'lucide-react';
import { DressUpConfig, OnlineStatusType } from '../types/qq';
import { generateQrMatrix } from '../utils/qr';

interface AvatarViewProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  onlineStatus?: OnlineStatusType;
  isGroup?: boolean;
  isBot?: boolean;
  isService?: boolean;
  frameId?: DressUpConfig['frameId'];
  pendantId?: DressUpConfig['pendantId'];
  minimalMode?: boolean;
}

const SIZE_MAP = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

const BG_PALETTE = [
  'bg-sky-600',
  'bg-indigo-600',
  'bg-teal-600',
  'bg-amber-600',
  'bg-rose-600',
];

function getInitialColor(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return BG_PALETTE[sum % BG_PALETTE.length];
}

export const AvatarView: React.FC<AvatarViewProps> = ({
  name,
  src,
  size = 'md',
  online,
  onlineStatus,
  isGroup,
  isBot,
  isService,
  frameId = 'none',
  pendantId = 'none',
  minimalMode = false,
}) => {
  const [imgError, setImgError] = React.useState(false);

  const frameClass =
    minimalMode || frameId === 'none'
      ? ''
      : frameId === 'glow_blue'
      ? 'ring-2 ring-[#2563EB] ring-offset-2 ring-offset-white dark:ring-offset-[#191c24] shadow-[0_0_12px_rgba(37,99,235,0.45)]'
      : frameId === 'gold_ring'
      ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-[#191c24] shadow-[0_0_12px_rgba(251,191,36,0.45)]'
      : frameId === 'cyber_neon'
      ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_14px_rgba(34,211,238,0.65)]'
      : frameId === 'sakura_petal'
      ? 'ring-2 ring-rose-400 ring-offset-2 ring-offset-white dark:ring-offset-[#191c24] shadow-[0_0_12px_rgba(244,63,94,0.45)]'
      : frameId === 'aurora_prism'
      ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-white dark:ring-offset-[#191c24] shadow-[0_0_14px_rgba(139,92,246,0.5)]'
      : frameId === 'emerald_flame'
      ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-white dark:ring-offset-[#191c24] shadow-[0_0_12px_rgba(16,185,129,0.5)]'
      : frameId === 'obsidian_diamond'
      ? 'ring-[2.5px] ring-amber-300 ring-offset-2 ring-offset-slate-900 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
      : 'ring-1 ring-slate-400 ring-offset-2 ring-offset-white dark:ring-offset-[#191c24]';

  const initials = isGroup ? '群' : name.slice(0, 1).toUpperCase();

  const statusDotColor =
    onlineStatus === 'busy'
      ? 'bg-rose-500'
      : onlineStatus === 'away'
      ? 'bg-amber-400'
      : onlineStatus === 'dnd'
      ? 'bg-red-600'
      : onlineStatus === 'qme'
      ? 'bg-sky-500'
      : onlineStatus === 'invisible' || online === false
      ? 'bg-slate-400'
      : 'bg-emerald-500';

  const statusDotTitle =
    onlineStatus === 'busy'
      ? '忙碌'
      : onlineStatus === 'away'
      ? '离开'
      : onlineStatus === 'dnd'
      ? '请勿打扰'
      : onlineStatus === 'qme'
      ? 'Q我吧'
      : onlineStatus === 'invisible' || online === false
      ? '离线'
      : '在线';

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
      <div
        className={`${SIZE_MAP[size]} ${frameClass} relative overflow-hidden rounded-full flex items-center justify-center font-semibold text-white select-none ${
          src && !imgError
            ? 'bg-slate-200 dark:bg-slate-700'
            : isService
            ? 'bg-gradient-to-br from-amber-500 to-orange-600'
            : isBot
            ? 'bg-slate-800 dark:bg-slate-700'
            : isGroup
            ? 'bg-[#2563EB]'
            : getInitialColor(name)
        }`}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : isService ? (
          <Bell className="w-4 h-4" />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* Pendant decoration (hidden in minimal mode) */}
      {!minimalMode && pendantId !== 'none' && (
        <span
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700"
          title="头像挂件"
        >
          {pendantId === 'crown' && <Crown className="w-3 h-3 text-amber-500" />}
          {pendantId === 'headset' && <Headphones className="w-3 h-3 text-[#2563EB]" />}
          {pendantId === 'blossom' && <Flower2 className="w-3 h-3 text-rose-500" />}
          {pendantId === 'halo_star' && <Sparkles className="w-3 h-3 text-violet-500" />}
          {pendantId === 'lightning' && <Zap className="w-3 h-3 text-cyan-500" />}
          {pendantId === 'cat_ears' && <Cat className="w-3 h-3 text-pink-500" />}
          {pendantId === 'music_note' && <Music className="w-3 h-3 text-indigo-500" />}
          {pendantId === 'crescent' && <Moon className="w-3 h-3 text-amber-400" />}
          {pendantId === 'sprout' && <Sprout className="w-3 h-3 text-emerald-500" />}
        </span>
      )}

      {/* Real online presence indicator only when explicitly passed */}
      {(typeof online === 'boolean' || onlineStatus !== undefined) && (
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#191c24] ${statusDotColor}`}
          title={statusDotTitle}
        />
      )}
    </div>
  );
};

export const QrCodeSvg: React.FC<{ value: string; size?: number; label?: string }> = ({
  value,
  size = 136,
  label,
}) => {
  const matrix = React.useMemo(() => generateQrMatrix(value, 21), [value]);
  const cell = size / matrix.length;
  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-xl bg-white p-3 border border-slate-200">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label || 'QR Code'}
      >
        <rect width={size} height={size} fill="#ffffff" />
        {matrix.map((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <rect
                key={`${r}-${c}`}
                x={c * cell}
                y={r * cell}
                width={cell + 0.2}
                height={cell + 0.2}
                fill="#0f172a"
              />
            ) : null
          )
        )}
      </svg>
      {label && <span className="text-xs text-slate-500 font-mono-tabular">{label}</span>}
    </div>
  );
};
