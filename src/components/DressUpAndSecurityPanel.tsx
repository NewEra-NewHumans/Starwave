import React, { useState } from 'react';
import {
  Bell,
  Check,
  Flame,
  Laptop,
  Lock,
  Monitor,
  Music,
  Palette,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  Tablet,
  Type,
  Unlock,
  Volume2,
  Waves,
} from 'lucide-react';
import {
  AppMode,
  Contact,
  Conversation,
  CustomBubbleStyle,
  DressUpConfig,
  LoggedDevice,
  NotificationSettings,
  OnlinePlatform,
  SecuritySettings,
} from '../types/qq';
import { AvatarView } from './AvatarView';
import { SoundEffectsManager } from './SoundEffectsManager';
import { MessageVisualEffectsManager } from './MessageVisualEffectsManager';
import { CrossPlatformReport } from './CrossPlatformReport';
import { PWAInstallButton } from './PWAInstallControls';
import { GENERATED_ASSETS, ME_PROFILE } from '../data/seedData';
import { playTone } from '../utils/qr';
import {
  BUBBLE_PRESETS,
  CARD_BG_PRESETS,
  CUSTOM_BUBBLE_PALETTES,
  DEFAULT_CUSTOM_BUBBLE,
  FONT_PRESETS,
  FRAME_PRESETS,
  PENDANT_PRESETS,
  RINGTONE_PRESETS,
  THEME_PRESETS,
  TYPING_DECOR_PRESETS,
  getBubbleVisualProps,
  getFontClass,
  resolveEffectiveDressUp,
} from '../utils/dressUpCatalog';

type DressUpStudioTab =
  | 'bubbles'
  | 'theme'
  | 'frame'
  | 'pendant'
  | 'card'
  | 'ringtone'
  | 'font'
  | 'typing';

/* Module 6: Personalization (个性装扮与专属聊天装扮中心) */
export const DressUpPanel: React.FC<{
  dressUp: DressUpConfig;
  perConversationDressUp: Record<string, Partial<DressUpConfig>>;
  conversations: Conversation[];
  contacts: Contact[];
  onChangeDressUp: (patch: Partial<DressUpConfig>) => void;
  onUpdateConvDressUp: (convId: string, patch: Partial<DressUpConfig> | null) => void;
  minimalMode: boolean;
}> = ({
  dressUp,
  perConversationDressUp,
  conversations,
  contacts,
  onChangeDressUp,
  onUpdateConvDressUp,
  minimalMode,
}) => {
  const [targetScope, setTargetScope] = useState<'global' | string>('global');
  const [activeTab, setActiveTab] = useState<DressUpStudioTab>('bubbles');
  const [previewVibrating, setPreviewVibrating] = useState(false);

  const isExclusiveScope = targetScope !== 'global';
  const selectedConv = isExclusiveScope
    ? conversations.find((c) => c.id === targetScope)
    : undefined;
  const effectiveDressUp = resolveEffectiveDressUp(
    dressUp,
    perConversationDressUp,
    isExclusiveScope ? targetScope : undefined
  );
  const hasExclusiveOverride = isExclusiveScope && Boolean(perConversationDressUp[targetScope]);

  const applyPatch = (patch: Partial<DressUpConfig>) => {
    if (isExclusiveScope) {
      onUpdateConvDressUp(targetScope, patch);
    } else {
      onChangeDressUp(patch);
    }
  };

  const applyCustomBubblePatch = (cbPatch: Partial<CustomBubbleStyle>) => {
    const nextCustom: CustomBubbleStyle = {
      ...(effectiveDressUp.customBubble || DEFAULT_CUSTOM_BUBBLE),
      ...cbPatch,
    };
    applyPatch({ bubbleId: 'custom', customBubble: nextCustom });
  };

  const triggerPreviewVibrate = () => {
    setPreviewVibrating(false);
    requestAnimationFrame(() => setPreviewVibrating(true));
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([35, 25, 35]);
    }
    playTone('nudge', 55);
    setTimeout(() => setPreviewVibrating(false), 580);
  };

  const activeBubbleVisual = getBubbleVisualProps(effectiveDressUp, minimalMode);
  const activeFontClass = getFontClass(effectiveDressUp.fontId, minimalMode);
  const activeCardPreset =
    CARD_BG_PRESETS.find((c) => c.id === effectiveDressUp.cardBgId) || CARD_BG_PRESETS[0];

  const configuredExclusiveConvs = conversations.filter((c) =>
    Boolean(perConversationDressUp[c.id])
  );

  const tabs: Array<{
    id: DressUpStudioTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'bubbles', label: '聊天气泡', icon: Sparkles },
    { id: 'theme', label: '界面主题', icon: Palette },
    { id: 'frame', label: '头像框', icon: ShieldCheck },
    { id: 'pendant', label: '头像挂件', icon: Flame },
    { id: 'card', label: '名片封面', icon: Monitor },
    { id: 'ringtone', label: '来电彩铃', icon: Music },
    { id: 'font', label: '个性字体', icon: Type },
    { id: 'typing', label: '输入状态', icon: Sliders },
  ];

  return (
    <div className="h-full w-full overflow-y-auto sr-aurora-canvas p-5 lg:p-7">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header + Scope Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Palette className="w-5 h-5 text-[#2563EB]" />
              个性装扮与专属聊天美学中心
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              覆盖主题、自定义聊天气泡、气泡振动、头像框/挂件、名片、彩铃、字体与输入状态；可为任意好友或群聊单独配置专属装扮。
            </p>
          </div>

          {/* Scope Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTargetScope('global')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
                targetScope === 'global'
                  ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm'
                  : 'bg-white dark:bg-[#161b26] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#2563EB]'
              }`}
            >
              全局默认装扮
            </button>
            <select
              value={isExclusiveScope ? targetScope : ''}
              onChange={(e) => {
                if (e.target.value) setTargetScope(e.target.value);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                isExclusiveScope
                  ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]'
                  : 'bg-white dark:bg-[#161b26] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              <option value="">+ 新增/选择专属聊天装扮对象...</option>
              {conversations
                .filter((c) => c.kind === 'single' || c.kind === 'group')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {perConversationDressUp[c.id] ? '✦ ' : ''}
                    {c.kind === 'group' ? '[群聊] ' : '[好友] '}
                    {c.title}
                  </option>
                ))}
            </select>
            {hasExclusiveOverride && (
              <button
                type="button"
                onClick={() => onUpdateConvDressUp(targetScope, null)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 inline-flex items-center gap-1 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                恢复全局默认
              </button>
            )}
          </div>
        </div>

        {/* Active Exclusive Chats Quick Chips */}
        {configuredExclusiveConvs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">已开启专属装扮：</span>
            {configuredExclusiveConvs.map((conv) => (
              <button
                key={`exc-${conv.id}`}
                type="button"
                onClick={() => setTargetScope(conv.id)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                  targetScope === conv.id
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white dark:bg-[#161b26] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#2563EB]'
                }`}
              >
                ✦ {conv.title}
              </button>
            ))}
          </div>
        )}

        {/* Live Interactive Preview Stage */}
        <div
          className={`relative rounded-2xl border border-white/15 p-5 overflow-hidden text-white shadow-xl bg-gradient-to-br ${activeCardPreset.gradientClass} bg-cover bg-center ${
            effectiveDressUp.cardBgId === 'grid' ? 'sr-bubble-grid' : ''
          }`}
          style={
            activeCardPreset.useWestlakeImage
              ? { backgroundImage: `url(${GENERATED_ASSETS.qzoneCover})` }
              : undefined
          }
        >
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px]" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              <AvatarView
                name={ME_PROFILE.name}
                src={ME_PROFILE.avatar}
                size="lg"
                online
                frameId={effectiveDressUp.frameId}
                pendantId={effectiveDressUp.pendantId}
                minimalMode={minimalMode}
              />
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white">
                    {ME_PROFILE.name}
                  </span>
                  <span className="text-[11px] text-sky-200 font-medium">
                    · {isExclusiveScope && selectedConv ? `专属装扮「${selectedConv.title}」` : '全局默认装扮'}
                  </span>
                </div>
                <div className="text-xs text-sky-300 truncate">
                  {effectiveDressUp.typingDecor}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={triggerPreviewVibrate}
                    className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-medium text-white inline-flex items-center gap-1 transition-colors"
                  >
                    <Waves className="w-3.5 h-3.5 text-amber-300" />
                    测试气泡振动
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      playTone(
                        effectiveDressUp.ringtoneId === 'mute'
                          ? 'silent'
                          : effectiveDressUp.ringtoneId
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-medium text-white inline-flex items-center gap-1 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-sky-300" />
                    试听当前彩铃
                  </button>
                </div>
              </div>
            </div>

            {/* Dual Bubble Preview */}
            <div className={`flex flex-col items-end gap-2 ${activeFontClass}`}>
              <div className="self-start px-3.5 py-2 rounded-2xl rounded-tl-sm bg-white/90 text-slate-900 text-xs shadow">
                {selectedConv ? `${selectedConv.title}：这套气泡质感不错！` : '林小雨：这套新装扮太有氛围了！'}
              </div>
              <div
                className={`relative px-4 py-2.5 text-sm ${activeBubbleVisual.className} ${
                  previewVibrating ? 'animate-sr-bubble-vibrate' : ''
                }`}
                style={activeBubbleVisual.style}
              >
                {activeBubbleVisual.cornerIcon && !minimalMode && (
                  <span className="mr-1.5 text-xs opacity-90">
                    {activeBubbleVisual.cornerIcon}
                  </span>
                )}
                <span>支持专属气泡、自定义配色与振动提醒！</span>
              </div>
            </div>
          </div>
        </div>

        {/* 8-Category Studio Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 border ${
                  active
                    ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm'
                    : 'bg-white/90 dark:bg-[#161b26] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#2563EB]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Workspace */}
        <div className="rounded-2xl bg-white/95 dark:bg-[#161b26]/95 border border-slate-200/80 dark:border-slate-800 p-5 space-y-5 shadow-sm">
          {/* 1. Chat Bubbles & Custom Bubble Builder */}
          {activeTab === 'bubbles' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  精选聊天气泡库（{BUBBLE_PRESETS.length} 款）
                </div>
                <span className="text-xs text-slate-500">
                  点击任意预设立即生效，或选择「自定义气泡工坊」深度调制
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {BUBBLE_PRESETS.map((b) => {
                  const selected = effectiveDressUp.bubbleId === b.id;
                  const customSampleStyle =
                    b.id === 'custom'
                      ? getBubbleVisualProps(
                          { ...effectiveDressUp, bubbleId: 'custom' },
                          false
                        )
                      : null;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => applyPatch({ bubbleId: b.id })}
                      className={`p-3.5 rounded-xl border text-left transition-all space-y-2.5 ${
                        selected
                          ? 'border-[#2563EB] bg-[#2563EB]/8 ring-2 ring-[#2563EB]/25'
                          : 'border-slate-200 dark:border-slate-800 hover:border-[#2563EB]/60 bg-slate-50/70 dark:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {b.label}
                        </span>
                        {selected && <Check className="w-4 h-4 text-[#2563EB]" />}
                      </div>
                      <div
                        className={`px-3 py-1.5 text-xs inline-block ${
                          customSampleStyle ? customSampleStyle.className : b.previewClass
                        }`}
                        style={customSampleStyle?.style}
                      >
                        {b.cornerBadge ? `${b.cornerBadge} ` : ''}你好，星涟！
                      </div>
                      <div className="text-[11px] text-slate-500">{b.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Bubble Builder Workshop */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-[#2563EB]" />
                      自定义气泡工坊
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      调整参数后自动启用「自定义气泡」，支持全局或当前专属聊天对象
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {CUSTOM_BUBBLE_PALETTES.map((pal) => (
                      <button
                        key={pal.label}
                        type="button"
                        onClick={() => applyCustomBubblePatch(pal.patch)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-[#2563EB]"
                      >
                        {pal.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <label className="space-y-1">
                    <span className="text-slate-500 block">渐变起始色</span>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5">
                      <input
                        type="color"
                        value={effectiveDressUp.customBubble.bgFrom}
                        onChange={(e) => applyCustomBubblePatch({ bgFrom: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="font-mono-tabular text-[11px]">
                        {effectiveDressUp.customBubble.bgFrom}
                      </span>
                    </div>
                  </label>
                  <label className="space-y-1">
                    <span className="text-slate-500 block">渐变结束色</span>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5">
                      <input
                        type="color"
                        value={effectiveDressUp.customBubble.bgTo}
                        onChange={(e) => applyCustomBubblePatch({ bgTo: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="font-mono-tabular text-[11px]">
                        {effectiveDressUp.customBubble.bgTo}
                      </span>
                    </div>
                  </label>
                  <label className="space-y-1">
                    <span className="text-slate-500 block">气泡文字色</span>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5">
                      <input
                        type="color"
                        value={effectiveDressUp.customBubble.textColor}
                        onChange={(e) => applyCustomBubblePatch({ textColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="font-mono-tabular text-[11px]">
                        {effectiveDressUp.customBubble.textColor}
                      </span>
                    </div>
                  </label>
                  <label className="space-y-1">
                    <span className="text-slate-500 block">边框 / 光晕色</span>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5">
                      <input
                        type="color"
                        value={effectiveDressUp.customBubble.borderColor}
                        onChange={(e) => applyCustomBubblePatch({ borderColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="font-mono-tabular text-[11px]">
                        {effectiveDressUp.customBubble.borderColor}
                      </span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1.5">
                    <span className="text-slate-500 block">边框样式</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { id: 'none', label: '无边框' },
                          { id: 'solid', label: '实线描边' },
                          { id: 'dashed', label: '虚线手账' },
                          { id: 'glow', label: '霓虹光晕' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => applyCustomBubblePatch({ borderStyle: opt.id })}
                          className={`py-1.5 px-2 rounded-lg border font-medium ${
                            effectiveDressUp.customBubble.borderStyle === opt.id
                              ? 'bg-[#2563EB] text-white border-[#2563EB]'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-slate-500 block">气泡轮廓圆角</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { id: 'rounded', label: '流线圆角' },
                          { id: 'pill', label: '柔和胶囊' },
                          { id: 'sharp', label: '利落微角' },
                          { id: 'cyber', label: '赛博切角' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => applyCustomBubblePatch({ radiusStyle: opt.id })}
                          className={`py-1.5 px-2 rounded-lg border font-medium ${
                            effectiveDressUp.customBubble.radiusStyle === opt.id
                              ? 'bg-[#2563EB] text-white border-[#2563EB]'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-slate-500 block">表面底纹纹理</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { id: 'none', label: '纯净无纹' },
                          { id: 'dots', label: '星点波点' },
                          { id: 'grid', label: '极客网格' },
                          { id: 'shine', label: '玻璃高光' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => applyCustomBubblePatch({ pattern: opt.id })}
                          className={`py-1.5 px-2 rounded-lg border font-medium ${
                            effectiveDressUp.customBubble.pattern === opt.id
                              ? 'bg-[#2563EB] text-white border-[#2563EB]'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500">气泡角标：</span>
                  {['', '✦', '⚡', '🌸', '🫧', '🔥', '👑', '🍓', '🎧'].map((sym) => (
                    <button
                      key={sym || 'none'}
                      type="button"
                      onClick={() => applyCustomBubblePatch({ cornerIcon: sym })}
                      className={`px-2.5 py-1 rounded-lg border ${
                        effectiveDressUp.customBubble.cornerIcon === sym
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {sym || '无'}
                    </button>
                  ))}
                  <input
                    value={effectiveDressUp.customBubble.cornerIcon}
                    maxLength={4}
                    onChange={(e) => applyCustomBubblePatch({ cornerIcon: e.target.value })}
                    placeholder="自定义角标"
                    className="w-24 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Interface Themes */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                界面色彩主题（{THEME_PRESETS.length} 套）
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {THEME_PRESETS.map((t) => {
                  const selected = effectiveDressUp.themeId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyPatch({ themeId: t.id })}
                      className={`p-3 rounded-xl border text-left transition-all space-y-2 ${
                        selected
                          ? 'border-[#2563EB] bg-[#2563EB]/8 ring-2 ring-[#2563EB]/25'
                          : 'border-slate-200 dark:border-slate-800 hover:border-[#2563EB]/60'
                      }`}
                    >
                      <div className={`h-10 rounded-lg bg-gradient-to-r ${t.swatchClass}`} />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {t.label}
                        </span>
                        {selected && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
                      </div>
                      <div className="text-[11px] text-slate-500">{t.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Avatar Frames */}
          {activeTab === 'frame' && (
            <div className="space-y-4">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                头像框展馆（{FRAME_PRESETS.length} 款）
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {FRAME_PRESETS.map((fr) => {
                  const selected = effectiveDressUp.frameId === fr.id;
                  return (
                    <button
                      key={fr.id}
                      type="button"
                      onClick={() => applyPatch({ frameId: fr.id })}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 transition-all ${
                        selected
                          ? 'border-[#2563EB] bg-[#2563EB]/8 ring-2 ring-[#2563EB]/25'
                          : 'border-slate-200 dark:border-slate-800 hover:border-[#2563EB]/60'
                      }`}
                    >
                      <AvatarView
                        name={ME_PROFILE.name}
                        src={ME_PROFILE.avatar}
                        size="md"
                        frameId={fr.id}
                        pendantId={effectiveDressUp.pendantId}
                        minimalMode={minimalMode}
                      />
                      <div className="text-center">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {fr.label}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{fr.tag}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Avatar Pendants */}
          {activeTab === 'pendant' && (
            <div className="space-y-4">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                头像挂件库（{PENDANT_PRESETS.length} 款）
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {PENDANT_PRESETS.map((pd) => {
                  const selected = effectiveDressUp.pendantId === pd.id;
                  return (
                    <button
                      key={pd.id}
                      type="button"
                      onClick={() => applyPatch({ pendantId: pd.id })}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 transition-all ${
                        selected
                          ? 'border-[#2563EB] bg-[#2563EB]/8 ring-2 ring-[#2563EB]/25'
                          : 'border-slate-200 dark:border-slate-800 hover:border-[#2563EB]/60'
                      }`}
                    >
                      <AvatarView
                        name={ME_PROFILE.name}
                        src={ME_PROFILE.avatar}
                        size="md"
                        frameId={effectiveDressUp.frameId}
                        pendantId={pd.id}
                        minimalMode={minimalMode}
                      />
                      <div className="text-center">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {pd.label}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{pd.tag}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Profile Card Backgrounds */}
          {activeTab === 'card' && (
            <div className="space-y-4">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                资料名片封面装扮（{CARD_BG_PRESETS.length} 款 · 同步至个人中心名片）
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CARD_BG_PRESETS.map((cb) => {
                  const selected = effectiveDressUp.cardBgId === cb.id;
                  return (
                    <button
                      key={cb.id}
                      type="button"
                      onClick={() => applyPatch({ cardBgId: cb.id })}
                      className={`rounded-xl border overflow-hidden text-left transition-all ${
                        selected
                          ? 'border-[#2563EB] ring-2 ring-[#2563EB]/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-[#2563EB]/60'
                      }`}
                    >
                      <div
                        className={`h-20 bg-gradient-to-br ${cb.gradientClass} bg-cover bg-center ${
                          cb.id === 'grid' ? 'sr-bubble-grid' : ''
                        }`}
                        style={
                          cb.useWestlakeImage
                            ? { backgroundImage: `url(${GENERATED_ASSETS.qzoneCover})` }
                            : undefined
                        }
                      />
                      <div className="p-3 bg-white dark:bg-slate-900/70">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {cb.label}
                          </span>
                          {selected && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{cb.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Ringtones */}
          {activeTab === 'ringtone' && (
            <div className="space-y-4">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                来电与专属提示彩铃（{RINGTONE_PRESETS.length} 款 · 点击即可试听与选用）
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {RINGTONE_PRESETS.map((rt) => {
                  const selected = effectiveDressUp.ringtoneId === rt.id;
                  return (
                    <div
                      key={rt.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        selected
                          ? 'border-[#2563EB] bg-[#2563EB]/8 ring-2 ring-[#2563EB]/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          applyPatch({ ringtoneId: rt.id });
                          playTone(rt.id === 'mute' ? 'silent' : rt.id);
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{rt.label}</span>
                          {selected && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {rt.desc}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => playTone(rt.id === 'mute' ? 'silent' : rt.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-[#2563EB] hover:border-[#2563EB] shrink-0 inline-flex items-center gap-1"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        试听
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7. Typography Fonts */}
          {activeTab === 'font' && (
            <div className="space-y-4">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                个性聊天字体（{FONT_PRESETS.length} 款）
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {FONT_PRESETS.map((ft) => {
                  const selected = effectiveDressUp.fontId === ft.id;
                  return (
                    <button
                      key={ft.id}
                      type="button"
                      onClick={() => applyPatch({ fontId: ft.id })}
                      className={`p-4 rounded-xl border text-left space-y-2 transition-all ${
                        selected
                          ? 'border-[#2563EB] bg-[#2563EB]/8 ring-2 ring-[#2563EB]/25'
                          : 'border-slate-200 dark:border-slate-800 hover:border-[#2563EB]/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {ft.label}
                        </span>
                        {selected && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
                      </div>
                      <div
                        className={`text-sm text-slate-700 dark:text-slate-200 ${ft.className}`}
                      >
                        {ft.sample} · 星涟 StarRipple
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 8. Typing Status Decor */}
          {activeTab === 'typing' && (
            <div className="space-y-4">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                输入状态个性装扮（好友将在聊天窗顶部实时看到你的状态文案）
              </div>
              <div className="flex flex-wrap gap-2">
                {TYPING_DECOR_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyPatch({ typingDecor: preset })}
                    className={`px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                      effectiveDressUp.typingDecor === preset
                        ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB] font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#2563EB]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  value={effectiveDressUp.typingDecor}
                  onChange={(e) => applyPatch({ typingDecor: e.target.value })}
                  maxLength={36}
                  placeholder="输入自定义状态，如：正在一边撸猫一边敲代码 🐱"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Friend Sparks Relationship Badges */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#161b26]/95 p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            好友互动火花关系标识
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {contacts
              .filter((c) => c.sparkDays > 0 && !c.blocked)
              .map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <AvatarView
                      name={c.name}
                      src={c.avatar}
                      size="sm"
                      online={c.online}
                      minimalMode={minimalMode}
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {c.remark || c.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {c.sparkDays >= 100 ? '炽热巨轮火花' : '连续互聊火花'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-600 font-mono-tabular">
                    {c.sparkDays} 天
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* Module 7: Security Center, Modes & Notifications */
export const SecurityAndModesPanel: React.FC<{
  mode: AppMode;
  onChangeMode: (next: AppMode) => void;
  security: SecuritySettings;
  onUpdateSecurity: (patch: Partial<SecuritySettings>) => void;
  notifications: NotificationSettings;
  onUpdateNotifications: (patch: Partial<NotificationSettings>) => void;
  devices: LoggedDevice[];
  onKickDevice: (deviceId: string) => void;
  conversations?: Conversation[];
  onOpenAuthModal?: () => void;
  initialSubTab?: 'security' | 'modes' | 'notifications' | 'visual';
}> = ({
  mode,
  onChangeMode,
  security,
  onUpdateSecurity,
  notifications,
  onUpdateNotifications,
  devices,
  onKickDevice,
  conversations = [],
  onOpenAuthModal,
  initialSubTab = 'modes',
}) => {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [subTab, setSubTab] = useState<'security' | 'modes' | 'notifications' | 'visual'>(initialSubTab);

  const trySwitchMode = (target: AppMode) => {
    if (mode === 'youth' && target !== 'youth') {
      if (pinInput !== security.youthPin) {
        setPinError(`退出青少年模式需输入监护密码（默认 ${security.youthPin}）`);
        return;
      }
      setPinError('');
      setPinInput('');
    }
    onChangeMode(target);
  };

  return (
    <div className="h-full w-full overflow-y-auto sr-aurora-canvas p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
              安全中心、模式切换与精细化通知
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              保护账号安全、管理已登录设备、自由切换青少年/关怀/简洁模式与消息提示音
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 flex-wrap">
            {[
              { id: 'modes', label: '三大模式' },
              { id: 'security', label: '安全与设备管理' },
              { id: 'notifications', label: '聊天与音效设置' },
              { id: 'visual', label: '消息视觉特效' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id as typeof subTab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                  subTab === t.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1. Modes */}
        {subTab === 'modes' && (
          <div className="space-y-5">
            {mode === 'youth' && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-amber-800 dark:text-amber-200">
                  当前处于「青少年模式」锁定状态，切换其他模式需校验监护人 4 位密码（默认 2026）：
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="输入密码"
                    className="w-24 px-2.5 py-1 text-xs rounded border border-amber-300 bg-white dark:bg-slate-900 font-mono-tabular"
                  />
                  {pinError && <span className="text-xs text-rose-600">{pinError}</span>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(
                [
                  {
                    id: 'standard',
                    title: '标准模式',
                    desc: '完整保留星涟即时通讯、个性装扮、星涟空间与办公协作体验。',
                  },
                  {
                    id: 'minimal',
                    title: '简洁模式（黑白灰降噪）',
                    desc: '屏蔽所有个性装扮、聊天气泡、头像框与火花标识，黑白灰降噪专注聊天本身。',
                  },
                  {
                    id: 'care',
                    title: '关怀模式（长辈友好）',
                    desc: '全局放大字体与图标按钮（≥46px 触控区），提升对比度与操作便捷性。',
                  },
                  {
                    id: 'youth',
                    title: '青少年模式（细粒度守护）',
                    desc: '限制每日使用时长、开启夜间宵禁、拦截陌生人会话与隐藏空间动态。',
                  },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => trySwitchMode(m.id)}
                  className={`p-5 rounded-xl border text-left transition-all ${
                    mode === m.id
                      ? 'border-[#2563EB] bg-[#2563EB]/5 ring-1 ring-[#2563EB]'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {m.title}
                    </span>
                    {mode === m.id && (
                      <span className="text-xs font-medium text-[#2563EB]">当前启用</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{m.desc}</p>
                </button>
              ))}
            </div>

            {/* Fine-grained Youth Mode Permissions */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                青少年模式细粒度权限配置
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <span>每日可用时长上限</span>
                  <select
                    value={security.youthDailyLimitMin}
                    onChange={(e) =>
                      onUpdateSecurity({ youthDailyLimitMin: Number(e.target.value) })
                    }
                    className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 font-mono-tabular"
                  >
                    <option value={30}>30 分钟</option>
                    <option value={40}>40 分钟</option>
                    <option value={60}>60 分钟</option>
                  </select>
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 cursor-pointer">
                  <span>夜间宵禁 (22:00 - 06:00 锁定)</span>
                  <input
                    type="checkbox"
                    checked={security.youthCurfewEnabled}
                    onChange={(e) => onUpdateSecurity({ youthCurfewEnabled: e.target.checked })}
                    className="accent-[#2563EB]"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 cursor-pointer">
                  <span>隐藏星涟空间与礼物功能</span>
                  <input
                    type="checkbox"
                    checked={security.youthHideQzone}
                    onChange={(e) => onUpdateSecurity({ youthHideQzone: e.target.checked })}
                    className="accent-[#2563EB]"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 cursor-pointer">
                  <span>禁止接收陌生人消息与搜索加群</span>
                  <input
                    type="checkbox"
                    checked={security.youthBlockStrangers}
                    onChange={(e) => onUpdateSecurity({ youthBlockStrangers: e.target.checked })}
                    className="accent-[#2563EB]"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 2. Security Center & Device Management */}
        {subTab === 'security' && (
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              <label className="p-4 flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    登录保护与新设备二次验证
                  </div>
                  <div className="text-xs text-slate-500">非常用设备登录时需通过本机扫码或短信核验</div>
                </div>
                <input
                  type="checkbox"
                  checked={security.loginProtection}
                  onChange={(e) => onUpdateSecurity({ loginProtection: e.target.checked })}
                  className="w-4 h-4 accent-[#2563EB]"
                />
              </label>

              <label className="p-4 flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    端到端加密传输通道
                  </div>
                  <div className="text-xs text-slate-500 font-mono-tabular">
                    密钥指纹：8F4A-29C1-7B0E-D442 · 聊天与闪传全程加密
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={security.e2eEncryption}
                  onChange={(e) => onUpdateSecurity({ e2eEncryption: e.target.checked })}
                  className="w-4 h-4 accent-[#2563EB]"
                />
              </label>

              <label className="p-4 flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    智能防骚扰与异常消息拦截
                  </div>
                  <div className="text-xs text-slate-500">自动折叠陌生营销广告与高频群发邀请</div>
                </div>
                <input
                  type="checkbox"
                  checked={security.antiHarassment}
                  onChange={(e) => onUpdateSecurity({ antiHarassment: e.target.checked })}
                  className="w-4 h-4 accent-[#2563EB]"
                />
              </label>

              <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Google / Microsoft 邮箱安全通行证（无手机号验证）
                  </div>
                  <div className="text-xs text-slate-500 font-mono-tabular">
                    认证方式：{security.authProviderLabel} · 绑定邮箱：{security.boundEmail}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onOpenAuthModal && (
                    <button
                      onClick={onOpenAuthModal}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#2563EB] hover:text-[#2563EB]"
                    >
                      邮箱通行证管理
                    </button>
                  )}
                  <button
                    onClick={() =>
                      onUpdateSecurity({
                        accountFrozen: !security.accountFrozen,
                      })
                    }
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg ${
                      security.accountFrozen
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {security.accountFrozen ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        解除账号紧急冻结
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        紧急冻结账号
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Device Management */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  已登录设备管理（支持远程下线陌生设备）
                </span>
                <span className="text-xs text-slate-500 font-mono-tabular">
                  共 {devices.length} 台设备
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {devices.map((d) => (
                  <div key={d.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          d.trusted
                            ? 'bg-sky-50 dark:bg-sky-950/40 text-[#2563EB]'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                        }`}
                      >
                        {d.platform === 'iOS' || d.platform === 'Android' ? (
                          <Smartphone className="w-4 h-4" />
                        ) : d.platform === 'iPad' ? (
                          <Tablet className="w-4 h-4" />
                        ) : (
                          <Monitor className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          {d.name}
                          {!d.trusted && (
                            <span className="text-xs text-rose-600 font-normal inline-flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              陌生异地设备
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-mono-tabular">
                          {d.platform} · {d.location} · IP {d.ip} · {d.lastActive}
                        </div>
                      </div>
                    </div>
                    {d.isCurrent ? (
                      <span className="text-xs text-emerald-600 font-medium">本机当前</span>
                    ) : (
                      <button
                        onClick={() => onKickDevice(d.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        远程下线
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Chat Sound Effects Manager & Notification Settings */}
        {subTab === 'notifications' && (
          <div className="space-y-5">
            <SoundEffectsManager
              notifications={notifications}
              onUpdateNotifications={onUpdateNotifications}
            />

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  免打扰与系统通知开关
                </span>
              </div>

              <label className="p-4 flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    全局免打扰模式（定时段：{notifications.dndRange}）
                  </div>
                  <div className="text-xs text-slate-500">
                    开启后仅接收重要来电，所有消息与打字背景音效自动静音收拢
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.dndEnabled}
                  onChange={(e) => onUpdateNotifications({ dndEnabled: e.target.checked })}
                  className="w-4 h-4 accent-[#2563EB]"
                />
              </label>

              {[
                { key: 'dmPopup', label: '单聊新消息桌面弹窗提醒' },
                { key: 'groupAlert', label: '群聊普通消息红点提醒' },
                { key: 'mentionStrongAlert', label: '群内 @我 / 群公告强震动提醒' },
                { key: 'qzoneNotify', label: '星涟空间点赞 / 留言 / 礼物通知' },
                { key: 'callRingtone', label: '音视频来电语音播报与铃声' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="p-4 flex items-center justify-between cursor-pointer"
                >
                  <span className="text-sm text-slate-800 dark:text-slate-200">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(notifications[item.key as keyof NotificationSettings])}
                    onChange={(e) =>
                      onUpdateNotifications({ [item.key]: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#2563EB]"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 4. Message Visual Effects Manager */}
        {subTab === 'visual' && (
          <MessageVisualEffectsManager
            notifications={notifications}
            onUpdateNotifications={onUpdateNotifications}
            conversations={conversations}
          />
        )}
      </div>
    </div>
  );
};

/* Module 8: Multi-Device Sync Center */
export const MultiDeviceSyncPanel: React.FC<{
  devices: LoggedDevice[];
  wsConnected: boolean;
  activePlatformView: OnlinePlatform;
  onSelectPlatformView: (p: OnlinePlatform) => void;
  dualMobileTabletOnline: boolean;
  onToggleDualMobileTablet: () => void;
  onTriggerManualSync: () => void;
  lastSyncTime: string;
  onOpenCompanionDrawer: () => void;
  myAccountId?: string;
  onShowToast?: (msg: string) => void;
}> = ({
  devices,
  wsConnected,
  activePlatformView,
  onSelectPlatformView,
  dualMobileTabletOnline,
  onToggleDualMobileTablet,
  onTriggerManualSync,
  lastSyncTime,
  onOpenCompanionDrawer,
  myAccountId,
  onShowToast,
}) => {
  const platforms: Array<{ id: OnlinePlatform; label: string; desc: string }> = [
    { id: 'Windows', label: 'Windows 桌面端', desc: '主工作站 · 文件极速接收' },
    { id: 'macOS', label: 'macOS 桌面端', desc: 'Retina 适配 · 接力协同' },
    { id: 'iOS', label: 'iPhone 客户端', desc: '移动便携 · 支持与 iPad 双端同时在线' },
    { id: 'Android', label: 'Android 客户端', desc: '系统级推送 · 后台保活' },
    { id: 'iPad', label: 'iPad 平板端', desc: '分屏大窗 · 支持与手机双端共存' },
    { id: 'Web', label: '星涟 Web 网页端', desc: '免安装 · 浏览器实时 WebSocket 互通' },
  ];

  return (
    <div className="h-full w-full overflow-y-auto sr-aurora-canvas p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              全端互通与实时多端同步中心
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-mono-tabular">
              星涟号 {myAccountId || ME_PROFILE.qqNumber} · WebSocket 实时通道：{wsConnected ? '已连接' : '重连中'} · 最近全量同步 {lastSyncTime}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PWAInstallButton variant="button" onToast={onShowToast} />
            <button
              onClick={onTriggerManualSync}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              立即跨端同步记录
            </button>
            <button
              onClick={onOpenCompanionDrawer}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
            >
              <Tablet className="w-3.5 h-3.5" />
              开启五端实时同屏预览
            </button>
          </div>
        </div>

        <label className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between cursor-pointer bg-[#f8fafc] dark:bg-slate-900/50">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              手机 + 平板（iPad）双端同时在线模式
            </div>
            <div className="text-xs text-slate-500">
              开启后，iPhone/Android 与 iPad 可同时登录同一星涟号且互不踢下线，聊天记录与好友列表毫秒级同步。
            </div>
          </div>
          <input
            type="checkbox"
            checked={dualMobileTabletOnline}
            onChange={onToggleDualMobileTablet}
            className="w-4 h-4 accent-[#2563EB]"
          />
        </label>

        {/* 6 Platform Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((p) => {
            const matched = devices.find((d) => d.platform === p.id);
            const active = activePlatformView === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPlatformView(p.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  active
                    ? 'border-[#2563EB] bg-[#2563EB]/5 ring-1 ring-[#2563EB]'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {p.label}
                  </span>
                  <span
                    className={`text-[11px] font-medium ${
                      matched ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {matched ? '账号已互通' : '支持登录'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{p.desc}</p>
                {matched && (
                  <div className="text-[11px] text-slate-400 font-mono-tabular mt-2 truncate">
                    {matched.name} · {matched.lastActive}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Integrated Cross-Platform Test Report & Live Diagnostics */}
        <CrossPlatformReport
          wsConnected={wsConnected}
          devices={devices}
          activePlatformView={activePlatformView}
          myAccountId={myAccountId}
          lastSyncTime={lastSyncTime}
          onShowToast={onShowToast}
        />

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
          <Laptop className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span>
            提示：在浏览器中再打开一个本应用标签页发送消息、撤回或发起群接龙，系统将通过服务端 WebSocket 实时向所有同步终端广播更新。
          </span>
        </div>
      </div>
    </div>
  );
};
