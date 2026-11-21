import React from 'react';
import { MessageEffectType } from '../types/qq';

export const MESSAGE_EFFECT_CATALOG: Array<{
  id: MessageEffectType;
  label: string;
  emoji: string;
  desc: string;
  badgeClass: string;
}> = [
  {
    id: 'none',
    label: '无发送特效',
    emoji: '⚪',
    desc: '保持纯净安静的默认发送体验',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  },
  {
    id: 'fireworks',
    label: '烟花绽放',
    emoji: '🎆',
    desc: '多簇礼花径向炸裂绽放，适合群公告、庆祝与重要时刻',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600',
  },
  {
    id: 'snow',
    label: '冬日飘雪',
    emoji: '❄️',
    desc: '晶莹雪花自屏幕上方轻盈飘落，营造浪漫冬日氛围',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600',
  },
  {
    id: 'sparkle',
    label: '星光闪烁',
    emoji: '✨',
    desc: '金色星芒闪烁耀动并伴随气泡流光脉冲特效',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600',
  },
  {
    id: 'hearts',
    label: '心动飘爱',
    emoji: '💖',
    desc: '满屏粉色爱心缓缓升腾，适合特别关心与挚友聊天',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600',
  },
  {
    id: 'sakura',
    label: '樱花漫舞',
    emoji: '🌸',
    desc: '粉色樱花瓣随微风斜向旋落，唯美治愈',
    badgeClass: 'bg-pink-50 dark:bg-pink-950/40 text-pink-600',
  },
];

interface MessageVisualEffectsOverlayProps {
  activeEffect: {
    id: number;
    effect: MessageEffectType;
    customEmoji?: string;
  } | null;
}

const FIREWORK_CENTERS = [
  { left: '26%', top: '34%', delay: 0 },
  { left: '68%', top: '28%', delay: 220 },
  { left: '48%', top: '52%', delay: 420 },
];

const FIREWORK_RAYS = Array.from({ length: 12 }).map((_, i) => {
  const angle = (i * Math.PI * 2) / 12;
  const dist = i % 2 === 0 ? 96 : 68;
  return {
    dx: Math.round(Math.cos(angle) * dist),
    dy: Math.round(Math.sin(angle) * dist),
    glyph: i % 3 === 0 ? '🎆' : i % 3 === 1 ? '✨' : '🌟',
  };
});

export const MessageVisualEffectsOverlay: React.FC<
  MessageVisualEffectsOverlayProps
> = ({ activeEffect }) => {
  if (!activeEffect || activeEffect.effect === 'none') return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {activeEffect.effect === 'fireworks' &&
        FIREWORK_CENTERS.map((center, cIdx) => (
          <div
            key={`${activeEffect.id}-fw-${cIdx}`}
            className="absolute"
            style={{ left: center.left, top: center.top }}
          >
            {FIREWORK_RAYS.map((ray, rIdx) => (
              <span
                key={`ray-${cIdx}-${rIdx}`}
                className="absolute text-2xl animate-sr-firework-burst"
                style={
                  {
                    '--fw-dx': `${ray.dx}px`,
                    '--fw-dy': `${ray.dy}px`,
                    animationDelay: `${center.delay + (rIdx % 3) * 40}ms`,
                  } as React.CSSProperties
                }
              >
                {ray.glyph}
              </span>
            ))}
          </div>
        ))}

      {activeEffect.effect === 'snow' &&
        Array.from({ length: 26 }).map((_, idx) => (
          <span
            key={`${activeEffect.id}-snow-${idx}`}
            className="absolute top-0 animate-sr-snow-fall select-none"
            style={{
              left: `${3 + ((idx * 17) % 94)}%`,
              fontSize: `${14 + (idx % 4) * 5}px`,
              animationDelay: `${(idx % 7) * 140}ms`,
              animationDuration: `${2.1 + (idx % 4) * 0.35}s`,
            }}
          >
            {idx % 3 === 0 ? '❄️' : idx % 3 === 1 ? '❅' : '✻'}
          </span>
        ))}

      {activeEffect.effect === 'sparkle' &&
        Array.from({ length: 22 }).map((_, idx) => (
          <span
            key={`${activeEffect.id}-sp-${idx}`}
            className="absolute animate-sr-sparkle-twinkle select-none"
            style={{
              left: `${8 + ((idx * 23) % 84)}%`,
              top: `${12 + ((idx * 19) % 74)}%`,
              fontSize: `${18 + (idx % 3) * 8}px`,
              animationDelay: `${(idx % 6) * 120}ms`,
            }}
          >
            {activeEffect.customEmoji ||
              (idx % 3 === 0 ? '✨' : idx % 3 === 1 ? '🌟' : '💫')}
          </span>
        ))}

      {activeEffect.effect === 'hearts' &&
        Array.from({ length: 18 }).map((_, idx) => (
          <span
            key={`${activeEffect.id}-ht-${idx}`}
            className="absolute text-3xl animate-sr-float-particle select-none"
            style={{
              left: `${6 + ((idx * 19) % 88)}%`,
              bottom: `${8 + ((idx * 13) % 28)}%`,
              animationDelay: `${(idx % 5) * 100}ms`,
            }}
          >
            {idx % 3 === 0 ? '❤️' : idx % 3 === 1 ? '💖' : '💕'}
          </span>
        ))}

      {activeEffect.effect === 'sakura' &&
        Array.from({ length: 22 }).map((_, idx) => (
          <span
            key={`${activeEffect.id}-sk-${idx}`}
            className="absolute top-0 animate-sr-sakura-drift select-none"
            style={{
              left: `${2 + ((idx * 17) % 90)}%`,
              fontSize: `${16 + (idx % 3) * 5}px`,
              animationDelay: `${(idx % 6) * 130}ms`,
            }}
          >
            {idx % 2 === 0 ? '🌸' : '💮'}
          </span>
        ))}
    </div>
  );
};
