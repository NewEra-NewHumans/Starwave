import React, { useId } from 'react';
import { LevelTierKey } from '../utils/qqLevel';

interface LevelTierBadgeProps {
  tierKey: LevelTierKey;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  active?: boolean;
  className?: string;
}

const SIZE_MAP: Record<NonNullable<LevelTierBadgeProps['size']>, number> = {
  xs: 18,
  sm: 24,
  md: 42,
  lg: 54,
  xl: 64,
};

export const LevelTierBadge: React.FC<LevelTierBadgeProps> = ({
  tierKey,
  size = 'lg',
  active = false,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const px = SIZE_MAP[size];

  const renderArtwork = () => {
    switch (tierKey) {
      case 'initiate':
        // Lv.1-5 初识者: Glossy sky-blue coin with crisp white winged star crest
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60D5FF" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
              <radialGradient id={`${uid}-core`} cx="35%" cy="28%" r="72%">
                <stop offset="0%" stopColor="#93E2FF" />
                <stop offset="55%" stopColor="#2B7BFF" />
                <stop offset="100%" stopColor="#1E40AF" />
              </radialGradient>
            </defs>
            <circle cx="32" cy="34" r="24" fill="#1E3A8A" opacity="0.22" />
            <circle cx="32" cy="32" r="23" fill={`url(#${uid}-rim)`} stroke="#BAE6FD" strokeWidth="2" />
            <circle cx="32" cy="32" r="18" fill={`url(#${uid}-core)`} stroke="#60A5FA" strokeWidth="1.2" />
            <ellipse cx="26" cy="21" rx="9" ry="4" fill="#FFFFFF" opacity="0.32" transform="rotate(-18 26 21)" />
            <path
              d="M32 20L35.2 27.2L43 28.2L37.2 33.4L38.8 41.2L32 37.3L25.2 41.2L26.8 33.4L21 28.2L28.8 27.2Z"
              fill="#FFFFFF"
            />
            <circle cx="32" cy="31" r="3" fill="#38BDF8" />
          </g>
        );

      case 'explorer':
        // Lv.6-10 探索者: Cyan faceted hexagonal badge with glowing lightning bolt
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-hex`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#67E8F9" />
                <stop offset="50%" stopColor="#0EA5E9" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
              <linearGradient id={`${uid}-hexIn`} x1="15%" y1="10%" x2="85%" y2="90%">
                <stop offset="0%" stopColor="#A5F3FC" />
                <stop offset="45%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
            </defs>
            <polygon points="32,7 54,19.5 54,44.5 32,57 10,44.5 10,19.5" fill="#0369A1" opacity="0.25" transform="translate(0,2)" />
            <polygon
              points="32,6 54,18.5 54,43.5 32,56 10,43.5 10,18.5"
              fill={`url(#${uid}-hex)`}
              stroke="#E0F2FE"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <polygon
              points="32,11 49,21 49,41 32,51 15,41 15,21"
              fill={`url(#${uid}-hexIn)`}
              stroke="#BAE6FD"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path
              d="M35 17L24 33H31.5L28.5 45L40 28.5H32.5L35 17Z"
              fill="#FFFFFF"
              stroke="#E0F2FE"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
          </g>
        );

      case 'active':
        // Lv.11-20 活跃者: Faceted cyan-violet crystal cluster shard
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-crysL`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E0F2FE" />
                <stop offset="50%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
              <linearGradient id={`${uid}-crysR`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C4B5FD" />
                <stop offset="55%" stopColor="#818CF8" />
                <stop offset="100%" stopColor="#4F46E5" />
              </linearGradient>
              <linearGradient id={`${uid}-crysC`} x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#F0F9FF" />
                <stop offset="50%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#4338CA" />
              </linearGradient>
            </defs>
            {/* Base aura */}
            <polygon points="32,57 12,41 20,24 32,7 44,24 52,41" fill="#312E81" opacity="0.2" transform="translate(0,2)" />
            {/* Left shard */}
            <polygon points="12,40 16,20 26,30 24,49" fill={`url(#${uid}-crysL)`} stroke="#E0F2FE" strokeWidth="1.2" strokeLinejoin="round" />
            {/* Right shard */}
            <polygon points="52,40 48,20 38,30 40,49" fill={`url(#${uid}-crysR)`} stroke="#DDD6FE" strokeWidth="1.2" strokeLinejoin="round" />
            {/* Center tall crystal */}
            <polygon points="32,6 42,24 39,52 32,57 25,52 22,24" fill={`url(#${uid}-crysC)`} stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" />
            <polygon points="32,6 42,24 32,33 22,24" fill="#FFFFFF" opacity="0.38" />
            <polygon points="32,33 39,52 32,57" fill="#312E81" opacity="0.28" />
          </g>
        );

      case 'advanced':
        // Lv.21-35 进阶达人: Amethyst purple winged shield with raised star
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-advOuter`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E9D5FF" />
                <stop offset="50%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#6D28D9" />
              </linearGradient>
              <linearGradient id={`${uid}-advInner`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="50%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#4C1D95" />
              </linearGradient>
            </defs>
            {/* Side silver-lavender wing accents */}
            <path d="M12 29L6 24L9 34L14 37Z" fill="#DDD6FE" stroke="#7C3AED" strokeWidth="1" />
            <path d="M52 29L58 24L55 34L50 37Z" fill="#DDD6FE" stroke="#7C3AED" strokeWidth="1" />
            {/* Shield */}
            <path
              d="M32 7L51 15V33C51 44.5 42 52.5 32 57C22 52.5 13 44.5 13 33V15L32 7Z"
              fill={`url(#${uid}-advOuter)`}
              stroke="#F3E8FF"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M32 12L46 18V32.5C46 41.5 39 47.8 32 51.5C25 47.8 18 41.5 18 32.5V18L32 12Z"
              fill={`url(#${uid}-advInner)`}
              stroke="#D8B4FE"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Sculpted Star */}
            <path
              d="M32 20L35.4 27.2L43.4 28.2L37.5 33.7L39 41.6L32 37.8L25 41.6L26.5 33.7L20.6 28.2L28.6 27.2Z"
              fill="#F5F3FF"
              stroke="#E9D5FF"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </g>
        );

      case 'social':
        // Lv.36-50 社交达人: Royal blue & gold-rimmed winged crest with silver crown
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-socBlue`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1E3A8A" />
              </linearGradient>
              <linearGradient id={`${uid}-socRim`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="55%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
              <linearGradient id={`${uid}-socWing`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#A5B4FC" />
              </linearGradient>
            </defs>
            {/* Twin Wings */}
            <path d="M14 26L4 19L7 29L3 30L10 38L16 36Z" fill={`url(#${uid}-socWing)`} stroke="#6366F1" strokeWidth="1" strokeLinejoin="round" />
            <path d="M50 26L60 19L57 29L61 30L54 38L48 36Z" fill={`url(#${uid}-socWing)`} stroke="#6366F1" strokeWidth="1" strokeLinejoin="round" />
            {/* Gold-rimmed Royal Shield */}
            <path
              d="M32 8L50 16V33C50 44.5 41.5 52.5 32 57C22.5 52.5 14 44.5 14 33V16L32 8Z"
              fill={`url(#${uid}-socRim)`}
              stroke="#FEF3C7"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M32 12L46 18.5V32.5C46 41.5 39.2 47.8 32 51.5C24.8 47.8 18 41.5 18 32.5V18.5L32 12Z"
              fill={`url(#${uid}-socBlue)`}
            />
            {/* Silver Crown */}
            <path
              d="M21 37L23 25L28 30L32 22L36 30L41 25L43 37Z"
              fill="#F8FAFC"
              stroke="#CBD5E1"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <rect x="22" y="38.5" width="20" height="3.2" rx="1.5" fill="#E0E7FF" />
          </g>
        );

      case 'elite':
        // Lv.51-70 精英玩家: Radiant golden-amber winged shield with bold star
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-elGold`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="45%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id={`${uid}-elIn`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="60%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>
            {/* Side small gold wings */}
            <path d="M13 28L5 22L8 33L15 37Z" fill="#FEF08A" stroke="#D97706" strokeWidth="1" strokeLinejoin="round" />
            <path d="M51 28L59 22L56 33L49 37Z" fill="#FEF08A" stroke="#D97706" strokeWidth="1" strokeLinejoin="round" />
            {/* Outer Shield */}
            <path
              d="M32 7L51 15V33C51 45 42 53 32 57.5C22 53 13 45 13 33V15L32 7Z"
              fill={`url(#${uid}-elGold)`}
              stroke="#FFFBEB"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M32 12L46 18.5V32.5C46 41.8 39 48 32 51.8C25 48 18 41.8 18 32.5V18.5L32 12Z"
              fill={`url(#${uid}-elIn)`}
              stroke="#FEF08A"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            {/* Prominent Golden Star */}
            <path
              d="M32 18.5L35.8 26.8L44.8 27.9L38.1 34L39.9 42.8L32 38.4L24.1 42.8L25.9 34L19.2 27.9L28.2 26.8Z"
              fill="#FFFBEB"
              stroke="#B45309"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </g>
        );

      case 'honor':
        // Lv.71-100 荣耀大师: Imperial violet & blazing gold winged crest with crown
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-hnGold`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
              <linearGradient id={`${uid}-hnPurp`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="50%" stopColor="#7E22CE" />
                <stop offset="100%" stopColor="#4C1D95" />
              </linearGradient>
            </defs>
            {/* Feathered Gold-Purple Wings */}
            <path d="M15 24L3 16L6 26L2 28L9 36L15 35Z" fill={`url(#${uid}-hnGold)`} stroke="#9333EA" strokeWidth="1" strokeLinejoin="round" />
            <path d="M49 24L61 16L58 26L62 28L55 36L49 35Z" fill={`url(#${uid}-hnGold)`} stroke="#9333EA" strokeWidth="1" strokeLinejoin="round" />
            {/* Top 3 Accent Stars */}
            <path d="M32 5L33.7 8.5L37.5 9L34.7 11.6L35.4 15.3L32 13.5L28.6 15.3L29.3 11.6L26.5 9L30.3 8.5Z" fill="#FDE047" stroke="#B45309" strokeWidth="0.7" />
            {/* Crest Body */}
            <path
              d="M32 13L49 20V34C49 45 41 52.5 32 57C23 52.5 15 45 15 34V20L32 13Z"
              fill={`url(#${uid}-hnGold)`}
              stroke="#FEF9C3"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M32 17L44.5 22.5V33.5C44.5 41.8 38.6 47.8 32 51.3C25.4 47.8 19.5 41.8 19.5 33.5V22.5L32 17Z"
              fill={`url(#${uid}-hnPurp)`}
            />
            {/* Inner Gold Crown */}
            <path
              d="M23 39L24.5 28L28.5 32.5L32 25L35.5 32.5L39.5 28L41 39Z"
              fill="#FDE047"
              stroke="#FEF9C3"
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
          </g>
        );

      case 'legend':
        // Lv.101+ 传奇用户: Sovereign blazing gold crowned crest with soaring wings & top stars
        return (
          <g>
            <defs>
              <linearGradient id={`${uid}-lgGold`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="35%" stopColor="#FDE047" />
                <stop offset="70%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
              <linearGradient id={`${uid}-lgCore`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="60%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#92400E" />
              </linearGradient>
            </defs>
            {/* Soaring Twin Golden Wings */}
            <path d="M16 25L2 14L6 24L2 27L8 35L4 37L14 43L18 37Z" fill={`url(#${uid}-lgGold)`} stroke="#B45309" strokeWidth="1" strokeLinejoin="round" />
            <path d="M48 25L62 14L58 24L62 27L56 35L60 37L50 43L46 37Z" fill={`url(#${uid}-lgGold)`} stroke="#B45309" strokeWidth="1" strokeLinejoin="round" />
            {/* Triple Crown Stars */}
            <path d="M22 11L23.2 13.4L25.8 13.8L23.9 15.6L24.4 18.2L22 16.9L19.6 18.2L20.1 15.6L18.2 13.8L20.8 13.4Z" fill="#FDE047" stroke="#B45309" strokeWidth="0.6" />
            <path d="M42 11L43.2 13.4L45.8 13.8L43.9 15.6L44.4 18.2L42 16.9L39.6 18.2L40.1 15.6L38.2 13.8L40.8 13.4Z" fill="#FDE047" stroke="#B45309" strokeWidth="0.6" />
            <path d="M32 4L34 8.2L38.6 8.8L35.2 12L36 16.6L32 14.4L28 16.6L28.8 12L25.4 8.8L30 8.2Z" fill="#FEF08A" stroke="#B45309" strokeWidth="0.8" />
            {/* Sovereign Shield */}
            <path
              d="M32 14L49 21V35C49 45.5 41 53 32 57.5C23 53 15 45.5 15 35V21L32 14Z"
              fill={`url(#${uid}-lgGold)`}
              stroke="#FFFBEB"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M32 18L44.5 23.2V34.2C44.5 42.2 38.6 48.2 32 51.8C25.4 48.2 19.5 42.2 19.5 34.2V23.2L32 18Z"
              fill={`url(#${uid}-lgCore)`}
            />
            {/* Royal Crown Inside */}
            <path
              d="M22.5 39.5L24 27L28.5 32.5L32 23.5L35.5 32.5L40 27L41.5 39.5Z"
              fill="#FFFBEB"
              stroke="#D97706"
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="34.5" r="2.2" fill="#EF4444" />
          </g>
        );
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 transition-transform duration-200 ${
        active ? 'scale-105 drop-shadow-[0_4px_12px_rgba(37,99,235,0.35)]' : ''
      } ${className}`}
      style={{ width: px, height: px }}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {renderArtwork()}
      </svg>
    </span>
  );
};
