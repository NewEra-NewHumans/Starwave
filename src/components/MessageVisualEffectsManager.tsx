import React, { useMemo, useState } from 'react';
import {
  AudioWaveform,
  Play,
  Sparkles,
  Users,
  MessageSquare,
} from 'lucide-react';
import {
  Conversation,
  MessageEffectType,
  NotificationSettings,
} from '../types/qq';
import { AvatarView } from './AvatarView';
import {
  MESSAGE_EFFECT_CATALOG,
  MessageVisualEffectsOverlay,
} from './MessageVisualEffectsOverlay';

interface MessageVisualEffectsManagerProps {
  notifications: NotificationSettings;
  onUpdateNotifications: (patch: Partial<NotificationSettings>) => void;
  conversations: Conversation[];
  activeConversation?: Conversation | null;
  compact?: boolean;
}

export const MessageVisualEffectsManager: React.FC<
  MessageVisualEffectsManagerProps
> = ({
  notifications,
  onUpdateNotifications,
  conversations,
  activeConversation,
  compact = false,
}) => {
  const config = notifications.visualEffects;
  const [filterKind, setFilterKind] = useState<'all' | 'single' | 'group'>('all');
  const [previewOverlay, setPreviewOverlay] = useState<{
    id: number;
    effect: MessageEffectType;
  } | null>(null);

  const updateVisualConfig = (
    patch: Partial<NotificationSettings['visualEffects']>
  ) => {
    onUpdateNotifications({
      visualEffects: {
        ...config,
        ...patch,
      },
    });
  };

  const setConversationEffect = (convId: string, effect: MessageEffectType | 'default') => {
    const nextMap = { ...config.perConversation };
    if (effect === 'default') {
      delete nextMap[convId];
    } else {
      nextMap[convId] = effect;
    }
    updateVisualConfig({ perConversation: nextMap });
  };

  const triggerPreview = (effect: MessageEffectType) => {
    if (effect === 'none') return;
    const pid = Date.now();
    setPreviewOverlay({ id: pid, effect });
    setTimeout(() => {
      setPreviewOverlay((curr) => (curr?.id === pid ? null : curr));
    }, 2500);
  };

  const configurableConvs = useMemo(() => {
    return conversations
      .filter((c) => c.kind !== 'device')
      .filter((c) => (filterKind === 'all' ? true : c.kind === filterKind));
  }, [conversations, filterKind]);

  const activeConvEffect = activeConversation
    ? config.perConversation[activeConversation.id] || 'default'
    : 'default';

  const resolvedActiveEffect: MessageEffectType = activeConversation
    ? config.perConversation[activeConversation.id] || config.defaultEffect
    : config.defaultEffect;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#191c24] overflow-hidden">
      {/* Header + Master Toggles */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#2563EB]" />
          <div>
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              消息视觉特效（专属发送动画与声波可视化）
            </div>
            {!compact && (
              <div className="text-[11px] text-slate-500">
                为特定联系人或群聊定制烟花、飘雪、闪烁等发送动画，并控制语音声波动态视觉
              </div>
            )}
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <span className="text-slate-600 dark:text-slate-300 font-medium">
            {config.enabled ? '已开启特效' : '已关闭'}
          </span>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => updateVisualConfig({ enabled: e.target.checked })}
            className="w-4 h-4 accent-[#2563EB]"
          />
        </label>
      </div>

      <div className="p-4 space-y-4">
        {/* Voice Waveform Dynamic Visualizer Toggle */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/15 text-[#2563EB] flex items-center justify-center shrink-0">
              <AudioWaveform className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                语音消息声波可视化动态效果
              </div>
              <div className="text-[11px] text-slate-500">
                录制语音时实时跳动声波频谱，播放语音条同步律动
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Mini Live Soundwave Preview */}
            <div className="flex items-center gap-0.5 h-5 px-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {[7, 13, 10, 16, 11, 14, 8, 12].map((h, i) => (
                <span
                  key={i}
                  className={`w-0.5 rounded-full bg-[#2563EB] ${
                    config.voiceWaveformEnabled ? 'animate-sr-voice-bar' : 'opacity-40'
                  }`}
                  style={{
                    height: `${h}px`,
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              ))}
            </div>
            <input
              type="checkbox"
              checked={config.voiceWaveformEnabled}
              onChange={(e) =>
                updateVisualConfig({ voiceWaveformEnabled: e.target.checked })
              }
              className="w-4 h-4 accent-[#2563EB] cursor-pointer"
            />
          </div>
        </div>

        {/* Active Conversation Specific Override (when inside Chat Settings Drawer) */}
        {activeConversation && activeConversation.kind !== 'device' && (
          <div className="rounded-xl border border-[#2563EB]/30 bg-sky-50/60 dark:bg-sky-950/20 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <AvatarView
                  name={activeConversation.title}
                  src={activeConversation.avatar}
                  size="xs"
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    当前会话专属特效 · {activeConversation.title}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {activeConversation.kind === 'group' ? '群聊专属发送动画' : '联系人单聊专属动画'}
                  </div>
                </div>
              </div>
              {resolvedActiveEffect !== 'none' && (
                <button
                  type="button"
                  onClick={() => triggerPreview(resolvedActiveEffect)}
                  className="px-2 py-1 rounded-lg bg-[#2563EB] text-white text-[11px] font-medium flex items-center gap-1 shrink-0 hover:bg-[#1D4ED8]"
                >
                  <Play className="w-3 h-3" />
                  预览
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setConversationEffect(activeConversation.id, 'default')}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border text-center ${
                  activeConvEffect === 'default'
                    ? 'border-[#2563EB] bg-[#2563EB] text-white'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                }`}
              >
                跟随默认
              </button>
              {MESSAGE_EFFECT_CATALOG.map((ef) => {
                const selected = activeConvEffect === ef.id;
                return (
                  <button
                    key={ef.id}
                    type="button"
                    onClick={() => {
                      setConversationEffect(activeConversation.id, ef.id);
                      if (ef.id !== 'none') triggerPreview(ef.id);
                    }}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border flex items-center justify-center gap-1 ${
                      selected
                        ? 'border-[#2563EB] bg-[#2563EB] text-white'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-[#2563EB]/50'
                    }`}
                  >
                    <span>{ef.emoji}</span>
                    <span className="truncate">{ef.label.replace('发送特效', '')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Global Default Effect Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              全局默认发送动画（未单独配置会话时生效）
            </span>
            {config.defaultEffect !== 'none' && (
              <button
                type="button"
                onClick={() => triggerPreview(config.defaultEffect)}
                className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1"
              >
                <Play className="w-3 h-3" />
                预览全局特效
              </button>
            )}
          </div>
          <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {MESSAGE_EFFECT_CATALOG.map((ef) => {
              const selected = config.defaultEffect === ef.id;
              return (
                <button
                  key={ef.id}
                  type="button"
                  onClick={() => {
                    updateVisualConfig({ defaultEffect: ef.id });
                    if (ef.id !== 'none') triggerPreview(ef.id);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selected
                      ? 'border-[#2563EB] bg-[#2563EB]/10 ring-1 ring-[#2563EB]/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{ef.emoji}</span>
                      <span>{ef.label}</span>
                    </span>
                    {selected && (
                      <span className="text-[10px] font-bold text-[#2563EB]">当前</span>
                    )}
                  </div>
                  {!compact && (
                    <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                      {ef.desc}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Full Per-Contact & Per-Group Assignment List */}
        {!compact && (
          <div className="space-y-2.5 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                为指定联系人 / 群聊设置专属发送动画
              </span>
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px]">
                {[
                  { id: 'all' as const, label: '全部会话' },
                  { id: 'single' as const, label: '联系人单聊' },
                  { id: 'group' as const, label: '群聊' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilterKind(f.id)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      filterKind === f.id
                        ? 'bg-white dark:bg-slate-900 text-[#2563EB] shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {configurableConvs.map((conv) => {
                const assigned = config.perConversation[conv.id];
                const effective: MessageEffectType = assigned || config.defaultEffect;
                const meta =
                  MESSAGE_EFFECT_CATALOG.find((m) => m.id === effective) ||
                  MESSAGE_EFFECT_CATALOG[0];

                return (
                  <div
                    key={conv.id}
                    className="p-3 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AvatarView
                        name={conv.title}
                        src={conv.avatar}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                          <span className="truncate">{conv.title}</span>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-normal shrink-0">
                            {conv.kind === 'group' ? (
                              <>
                                <Users className="w-2.5 h-2.5" />
                                群聊
                              </>
                            ) : (
                              <>
                                <MessageSquare className="w-2.5 h-2.5" />
                                好友
                              </>
                            )}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {assigned ? (
                            <span className="text-[#2563EB] font-medium">
                              专属特效：{meta.emoji} {meta.label}
                            </span>
                          ) : (
                            <span>跟随全局默认（{meta.emoji} {meta.label}）</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={assigned || 'default'}
                        onChange={(e) => {
                          const val = e.target.value as MessageEffectType | 'default';
                          setConversationEffect(conv.id, val);
                          if (val !== 'default' && val !== 'none') {
                            triggerPreview(val);
                          }
                        }}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                      >
                        <option value="default">跟随全局默认</option>
                        {MESSAGE_EFFECT_CATALOG.map((ef) => (
                          <option key={ef.id} value={ef.id}>
                            {ef.emoji} {ef.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        disabled={effective === 'none'}
                        onClick={() => triggerPreview(effective)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:border-[#2563EB] hover:text-[#2563EB] disabled:opacity-40 flex items-center gap-1"
                        title="立即预览动画效果"
                      >
                        <Play className="w-3 h-3" />
                        预览
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Live Preview Overlay */}
      <MessageVisualEffectsOverlay activeEffect={previewOverlay} />
    </div>
  );
};
