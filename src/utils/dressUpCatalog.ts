import React from 'react';
import {
  CustomBubbleStyle,
  DressUpBubbleId,
  DressUpCardBgId,
  DressUpConfig,
  DressUpFontId,
  DressUpFrameId,
  DressUpPendantId,
  DressUpRingtoneId,
  DressUpThemeId,
} from '../types/qq';

export const DEFAULT_CUSTOM_BUBBLE: CustomBubbleStyle = {
  bgFrom: '#4F46E5',
  bgTo: '#06B6D4',
  textColor: '#FFFFFF',
  borderColor: '#A5F3FC',
  borderStyle: 'glow',
  radiusStyle: 'rounded',
  pattern: 'dots',
  cornerIcon: '✦',
};

export interface ThemePreset {
  id: DressUpThemeId;
  label: string;
  desc: string;
  swatchClass: string;
  accentBgClass: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'classic_blue',
    label: '星涟靛蓝',
    desc: '经典高饱和靛蓝与青碧渐层',
    swatchClass: 'from-[#2563EB] to-[#0D9488]',
    accentBgClass:
      'bg-gradient-to-br from-[#2563EB] to-[#0D9488] text-white shadow-[0_6px_18px_-4px_rgba(37,99,235,0.6)]',
  },
  {
    id: 'midnight',
    label: '极夜暗黑',
    desc: '深空曜石护眼暗色主题',
    swatchClass: 'from-slate-800 via-indigo-950 to-slate-900',
    accentBgClass:
      'bg-gradient-to-br from-indigo-600 to-slate-900 text-white shadow-[0_6px_18px_-4px_rgba(79,70,229,0.55)]',
  },
  {
    id: 'sakura',
    label: '晨曦樱粉',
    desc: '温柔樱花绯粉调社交氛围',
    swatchClass: 'from-rose-500 to-pink-600',
    accentBgClass:
      'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-[0_6px_18px_-4px_rgba(244,63,94,0.55)]',
  },
  {
    id: 'forest',
    label: '松林青绿',
    desc: '沉静森系翡翠护眼配色',
    swatchClass: 'from-emerald-500 to-teal-600',
    accentBgClass:
      'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_6px_18px_-4px_rgba(16,185,129,0.55)]',
  },
  {
    id: 'cyber_neon',
    label: '赛博霓虹',
    desc: '未来电光紫青高对比风格',
    swatchClass: 'from-fuchsia-600 via-violet-600 to-cyan-500',
    accentBgClass:
      'bg-gradient-to-br from-fuchsia-600 to-cyan-500 text-white shadow-[0_6px_18px_-4px_rgba(192,38,211,0.55)]',
  },
  {
    id: 'amber_gold',
    label: '琥珀暖金',
    desc: '尊享暖金流光高雅格调',
    swatchClass: 'from-amber-500 via-orange-500 to-rose-500',
    accentBgClass:
      'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_6px_18px_-4px_rgba(245,158,11,0.55)]',
  },
  {
    id: 'lavender',
    label: '薰衣草雾',
    desc: '柔雾紫丁香轻盈治愈系',
    swatchClass: 'from-violet-500 to-purple-600',
    accentBgClass:
      'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-[0_6px_18px_-4px_rgba(139,92,246,0.55)]',
  },
  {
    id: 'aurora_teal',
    label: '极光翠幕',
    desc: '冰岛极光湖蓝微光质感',
    swatchClass: 'from-cyan-500 to-emerald-500',
    accentBgClass:
      'bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-[0_6px_18px_-4px_rgba(6,182,212,0.55)]',
  },
];

export interface BubblePreset {
  id: DressUpBubbleId;
  label: string;
  desc: string;
  previewClass: string;
  cornerBadge?: string;
}

export const BUBBLE_PRESETS: BubblePreset[] = [
  {
    id: 'clean',
    label: '星涟极光默认',
    desc: '靛蓝到青碧流光渐变',
    previewClass:
      'bg-gradient-to-br from-[#2563EB] via-[#2B6BEE] to-[#0D9488] text-white shadow-[0_6px_20px_-6px_rgba(37,99,235,0.42)] rounded-2xl rounded-tr-sm',
  },
  {
    id: 'aurora',
    label: '深空星河紫',
    desc: '电光蓝紫宇宙渐层',
    previewClass:
      'bg-gradient-to-br from-[#2563EB] via-indigo-600 to-violet-600 text-white shadow-[0_6px_20px_-6px_rgba(79,70,229,0.45)] rounded-2xl rounded-tr-sm',
    cornerBadge: '✦',
  },
  {
    id: 'sakura_bloom',
    label: '初樱落雪',
    desc: '柔美粉绯双色渐变',
    previewClass:
      'bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-500 text-white shadow-[0_6px_20px_-6px_rgba(244,63,94,0.42)] rounded-2xl rounded-tr-sm',
    cornerBadge: '🌸',
  },
  {
    id: 'neon_cyber',
    label: '赛博电光框',
    desc: '暗黑基底配荧光青边框',
    previewClass:
      'bg-slate-950 text-cyan-200 border border-cyan-400/80 shadow-[0_0_16px_-3px_rgba(34,211,238,0.6)] rounded-xl rounded-tr-none',
    cornerBadge: '⚡',
  },
  {
    id: 'obsidian_gold',
    label: '黑金曜石',
    desc: '沉稳曜石镶嵌香槟金边',
    previewClass:
      'bg-gradient-to-br from-slate-900 to-zinc-800 text-amber-200 border border-amber-400/65 shadow-[0_6px_18px_-6px_rgba(245,158,11,0.35)] rounded-2xl rounded-tr-sm',
    cornerBadge: '♛',
  },
  {
    id: 'mint_glass',
    label: '青柠冰透',
    desc: '薄荷冰透渐变轻盈质感',
    previewClass:
      'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-[0_6px_20px_-6px_rgba(16,185,129,0.42)] rounded-3xl rounded-tr-md',
    cornerBadge: '🫧',
  },
  {
    id: 'sunset_peach',
    label: '落日蜜桃橘',
    desc: '晚霞琥珀橘红温暖配色',
    previewClass:
      'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white shadow-[0_6px_20px_-6px_rgba(249,115,22,0.42)] rounded-2xl rounded-tr-sm',
    cornerBadge: '☀',
  },
  {
    id: 'retro_pixel',
    label: '像素极客终端',
    desc: '等宽绿字荧光终端框',
    previewClass:
      'bg-slate-900 text-emerald-300 font-mono border border-emerald-500/70 rounded-lg rounded-tr-none',
  },
  {
    id: 'paper',
    label: '手账暖宣纸',
    desc: '米白手账信笺柔和质感',
    previewClass:
      'bg-amber-50 text-amber-950 border border-amber-200 shadow-sm rounded-2xl rounded-tr-sm',
  },
  {
    id: 'custom',
    label: '自定义气泡工坊',
    desc: '自由调色、圆角、纹理与角标',
    previewClass: 'rounded-2xl rounded-tr-sm shadow-md',
  },
];

export const CUSTOM_BUBBLE_PALETTES: Array<{
  label: string;
  patch: Partial<CustomBubbleStyle>;
}> = [
  {
    label: '极光紫青',
    patch: {
      bgFrom: '#4F46E5',
      bgTo: '#06B6D4',
      textColor: '#FFFFFF',
      borderColor: '#A5F3FC',
      borderStyle: 'glow',
      pattern: 'dots',
      cornerIcon: '✦',
    },
  },
  {
    label: '草莓牛奶',
    patch: {
      bgFrom: '#FB7185',
      bgTo: '#F472B6',
      textColor: '#FFFFFF',
      borderColor: '#FDE68A',
      borderStyle: 'dashed',
      pattern: 'shine',
      cornerIcon: '🍓',
    },
  },
  {
    label: '深海电音',
    patch: {
      bgFrom: '#0F172A',
      bgTo: '#1E1B4B',
      textColor: '#67E8F9',
      borderColor: '#22D3EE',
      borderStyle: 'glow',
      pattern: 'grid',
      cornerIcon: '⚡',
    },
  },
  {
    label: '抹茶奶霜',
    patch: {
      bgFrom: '#ECFDF5',
      bgTo: '#D1FAE5',
      textColor: '#064E3B',
      borderColor: '#34D399',
      borderStyle: 'solid',
      pattern: 'dots',
      cornerIcon: '🌿',
    },
  },
  {
    label: '焦糖烈焰',
    patch: {
      bgFrom: '#EA580C',
      bgTo: '#DC2626',
      textColor: '#FFFBEB',
      borderColor: '#FBBF24',
      borderStyle: 'glow',
      pattern: 'shine',
      cornerIcon: '🔥',
    },
  },
];

export const FRAME_PRESETS: Array<{
  id: DressUpFrameId;
  label: string;
  tag: string;
}> = [
  { id: 'none', label: '纯净无框', tag: '原图' },
  { id: 'glow_blue', label: '星涟流光蓝', tag: '经典' },
  { id: 'gold_ring', label: '鎏金尊享环', tag: '尊享' },
  { id: 'minimal_line', label: '极简银丝线', tag: '极简' },
  { id: 'cyber_neon', label: '赛博霓虹光', tag: '潮酷' },
  { id: 'sakura_petal', label: '樱瓣微光圈', tag: '浪漫' },
  { id: 'aurora_prism', label: '极光棱镜环', tag: '限定' },
  { id: 'emerald_flame', label: '翡翠灵动环', tag: '清新' },
  { id: 'obsidian_diamond', label: '曜石黑金框', tag: '典藏' },
];

export const PENDANT_PRESETS: Array<{
  id: DressUpPendantId;
  label: string;
  tag: string;
}> = [
  { id: 'none', label: '无挂件', tag: '纯净' },
  { id: 'crown', label: '星耀小皇冠', tag: '尊享' },
  { id: 'headset', label: '潮酷降噪耳机', tag: '音乐' },
  { id: 'blossom', label: '春日初樱', tag: '季节' },
  { id: 'halo_star', label: '四芒星光点', tag: '星轨' },
  { id: 'lightning', label: '高能闪电标', tag: '能量' },
  { id: 'cat_ears', label: '软萌猫耳', tag: '趣味' },
  { id: 'music_note', label: '律动音符', tag: '声控' },
  { id: 'crescent', label: '夜色弯月', tag: '晚安' },
  { id: 'sprout', label: '元气小嫩芽', tag: '治愈' },
];

export interface CardBgPreset {
  id: DressUpCardBgId;
  label: string;
  subtitle: string;
  gradientClass: string;
  useWestlakeImage?: boolean;
}

export const CARD_BG_PRESETS: CardBgPreset[] = [
  {
    id: 'westlake',
    label: '西湖暮色晚霞',
    subtitle: '高清风景摄影封面',
    gradientClass: 'from-amber-600 via-rose-500 to-indigo-800',
    useWestlakeImage: true,
  },
  {
    id: 'geometric',
    label: '星涟靛青几何',
    subtitle: '极简几何渐变名片',
    gradientClass: 'from-[#0A1124] via-[#1D4ED8] to-[#0D9488]',
  },
  {
    id: 'grid',
    label: '蓝图工程网格',
    subtitle: '极客科技坐标线封面',
    gradientClass: 'from-slate-950 via-sky-950 to-slate-900',
  },
  {
    id: 'aurora_night',
    label: '极夜北极光',
    subtitle: '翡翠与深紫夜空渐层',
    gradientClass: 'from-slate-950 via-teal-800 to-indigo-900',
  },
  {
    id: 'sakura_sky',
    label: '樱云晴空',
    subtitle: '软粉桃雾与晴蓝渐变',
    gradientClass: 'from-rose-400 via-pink-500 to-sky-500',
  },
  {
    id: 'cyber_matrix',
    label: '赛博电光矩阵',
    subtitle: '霓虹洋红撞色电光蓝',
    gradientClass: 'from-fuchsia-800 via-violet-900 to-cyan-700',
  },
  {
    id: 'sunset_dunes',
    label: '大漠落日流金',
    subtitle: '琥珀暮光暖金渐变',
    gradientClass: 'from-orange-600 via-amber-500 to-rose-700',
  },
  {
    id: 'starlight_velvet',
    label: '丝绒星海夜幕',
    subtitle: '深紫丝绒微光名片',
    gradientClass: 'from-purple-950 via-indigo-900 to-slate-900',
  },
];

export const RINGTONE_PRESETS: Array<{
  id: DressUpRingtoneId;
  label: string;
  desc: string;
}> = [
  { id: 'dual_chime', label: '清脆双音提示', desc: '星涟经典轻快双音阶' },
  { id: 'chime', label: '水晶风铃三连音', desc: '通透悦耳高泛音铃声' },
  { id: 'lofi', label: '暖调 Lo-Fi 电钢', desc: '舒缓轻柔夜间不刺耳' },
  { id: 'bubble_pop', label: '水滴气泡啵', desc: 'Q 弹灵动水滴提示音' },
  { id: 'typewriter', label: '机械打字机', desc: '清脆机械轴敲击反馈' },
  { id: 'retro_dial', label: '千禧怀旧拨号', desc: '经典双音多频记忆音' },
  { id: 'woodblock', label: '清润木鱼', desc: '温润木质轻敲舒心音' },
  { id: 'pixel_coin', label: '8-bit 游戏金币', desc: '复古掌机拾取跳跃音' },
  { id: 'red_packet_joy', label: '喜庆欢快金铃', desc: '明亮四连音节庆铃声' },
  { id: 'mute', label: '专注静音', desc: '来电与提醒保持静默' },
];

export const FONT_PRESETS: Array<{
  id: DressUpFontId;
  label: string;
  sample: string;
  className: string;
}> = [
  { id: 'sans', label: '星涟现代黑体', sample: '清晰利落 · 默认', className: '' },
  { id: 'rounded', label: '轻柔圆润体', sample: '温润舒适 · 聊天', className: 'font-sr-rounded' },
  { id: 'serif', label: '优雅文艺衬线', sample: '书卷质感 · 散文', className: 'font-serif' },
  { id: 'editorial', label: '报刊典雅宋体', sample: '沉稳叙事 · 长文', className: 'font-sr-editorial' },
  { id: 'mono', label: '极客等宽体', sample: 'Code 100% 精准', className: 'font-mono' },
  { id: 'pixel', label: '复古终端体', sample: 'SYS://READY_01', className: 'font-sr-pixel' },
];

export const TYPING_DECOR_PRESETS: string[] = [
  '正在全神贯注输入中...',
  '正在疯狂敲键盘 ⚡',
  '正在边喝奶茶边回复 🧋',
  '正在认真思考中 💭',
  '灵感泉涌，飞速码字 ✨',
  '戴着降噪耳机马上回 🎧',
  '正在精挑细选表情包 🎭',
  '摸鱼片刻，立刻回复 🐟',
];

export function resolveEffectiveDressUp(
  globalDressUp: DressUpConfig,
  perConversationDressUp: Record<string, Partial<DressUpConfig>> | undefined,
  convId?: string
): DressUpConfig {
  if (!convId || !perConversationDressUp?.[convId]) {
    return globalDressUp;
  }
  const override = perConversationDressUp[convId];
  return {
    ...globalDressUp,
    ...override,
    customBubble: {
      ...(globalDressUp.customBubble || DEFAULT_CUSTOM_BUBBLE),
      ...(override.customBubble || {}),
    },
  };
}

export function getFontClass(fontId: DressUpFontId, minimalMode: boolean): string {
  if (minimalMode) return '';
  const match = FONT_PRESETS.find((f) => f.id === fontId);
  return match?.className || '';
}

export function getBubbleVisualProps(
  dressUp: DressUpConfig,
  minimalMode: boolean
): {
  className: string;
  style?: React.CSSProperties;
  cornerIcon?: string;
} {
  if (minimalMode) {
    return {
      className: 'bg-slate-800 text-white rounded-2xl rounded-tr-sm',
    };
  }

  if (dressUp.bubbleId === 'custom') {
    const cb = dressUp.customBubble || DEFAULT_CUSTOM_BUBBLE;
    const radiusClass =
      cb.radiusStyle === 'pill'
        ? 'rounded-3xl rounded-tr-md'
        : cb.radiusStyle === 'sharp'
        ? 'rounded-md rounded-tr-none'
        : cb.radiusStyle === 'cyber'
        ? 'rounded-xl rounded-tl-sm rounded-br-sm rounded-tr-none'
        : 'rounded-2xl rounded-tr-sm';
    const patternClass =
      cb.pattern === 'dots'
        ? 'sr-bubble-dots'
        : cb.pattern === 'grid'
        ? 'sr-bubble-grid'
        : cb.pattern === 'shine'
        ? 'sr-bubble-shine'
        : '';

    const borderCss =
      cb.borderStyle === 'none'
        ? 'none'
        : cb.borderStyle === 'dashed'
        ? `1.5px dashed ${cb.borderColor}`
        : `1.5px solid ${cb.borderColor}`;

    const shadowCss =
      cb.borderStyle === 'glow'
        ? `0 6px 20px -4px ${cb.borderColor}70, 0 0 0 1px ${cb.borderColor}40`
        : '0 6px 18px -6px rgba(15, 23, 42, 0.22)';

    const gradientLayer = `linear-gradient(135deg, ${cb.bgFrom}, ${cb.bgTo})`;
    const bgStyle: React.CSSProperties =
      cb.pattern === 'dots'
        ? {
            backgroundImage: `radial-gradient(rgba(255,255,255,0.22) 1.25px, transparent 1.25px), ${gradientLayer}`,
            backgroundSize: '12px 12px, 100% 100%',
            color: cb.textColor,
            border: borderCss,
            boxShadow: shadowCss,
          }
        : cb.pattern === 'grid'
        ? {
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px), ${gradientLayer}`,
            backgroundSize: '14px 14px, 14px 14px, 100% 100%',
            color: cb.textColor,
            border: borderCss,
            boxShadow: shadowCss,
          }
        : {
            backgroundImage: gradientLayer,
            color: cb.textColor,
            border: borderCss,
            boxShadow: shadowCss,
          };

    return {
      className: `${radiusClass} ${patternClass}`.trim(),
      style: bgStyle,
      cornerIcon: cb.cornerIcon?.trim() || undefined,
    };
  }

  const found = BUBBLE_PRESETS.find((b) => b.id === dressUp.bubbleId) || BUBBLE_PRESETS[0];
  return {
    className: found.previewClass,
    cornerIcon: found.cornerBadge,
  };
}
