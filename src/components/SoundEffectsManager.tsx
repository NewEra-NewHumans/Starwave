import React, { useState } from 'react';
import {
  Check,
  Headphones,
  Keyboard,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  ChatSoundConfig,
  NotificationSettings,
  SoundEffectId,
  SoundMessageCategory,
} from '../types/qq';
import {
  playSoundEffect,
  SOUND_LIBRARY,
  SOUND_MESSAGE_CATEGORIES,
  SOUND_PRESETS,
} from '../utils/soundEngine';

interface SoundEffectsManagerProps {
  notifications: NotificationSettings;
  onUpdateNotifications: (patch: Partial<NotificationSettings>) => void;
  compact?: boolean;
}

export const SoundEffectsManager: React.FC<SoundEffectsManagerProps> = ({
  notifications,
  onUpdateNotifications,
  compact = false,
}) => {
  const { chatSounds } = notifications;
  const [selectedCategory, setSelectedCategory] = useState<SoundMessageCategory>('text');
  const [libraryFilter, setLibraryFilter] = useState<
    'all' | 'keyboard' | 'retro' | 'chime' | 'fun'
  >('all');
  const [playingSoundId, setPlayingSoundId] = useState<SoundEffectId | null>(null);

  const updateChatSounds = (patch: Partial<ChatSoundConfig>) => {
    const nextChatSounds: ChatSoundConfig = {
      ...chatSounds,
      ...patch,
    };
    onUpdateNotifications({
      chatSounds: nextChatSounds,
      soundId: nextChatSounds.perMessageType.text,
    });
  };

  const assignSoundToCategory = (
    cat: SoundMessageCategory,
    soundId: SoundEffectId,
    autoPreview = true
  ) => {
    const nextMap = {
      ...chatSounds.perMessageType,
      [cat]: soundId,
    };
    updateChatSounds({ perMessageType: nextMap });
    if (autoPreview) {
      triggerPreview(soundId);
    }
  };

  const triggerPreview = (soundId: SoundEffectId) => {
    setPlayingSoundId(soundId);
    const vol = Math.max(25, chatSounds.masterVolume);
    playSoundEffect(soundId, vol);
    setTimeout(() => {
      setPlayingSoundId((curr) => (curr === soundId ? null : curr));
    }, 520);
  };

  const filteredLibrary = SOUND_LIBRARY.filter(
    (item) => libraryFilter === 'all' || item.category === libraryFilter
  );

  const selectedCatMeta =
    SOUND_MESSAGE_CATEGORIES.find((c) => c.id === selectedCategory) ||
    SOUND_MESSAGE_CATEGORIES[0];

  const getSoundName = (id: SoundEffectId) =>
    SOUND_LIBRARY.find((s) => s.id === id)?.name || '默认音效';

  return (
    <div className="space-y-4">
      {/* Header & Master Controls */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#191c24] p-4 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-[#2563EB]" />
              聊天音效管理中心
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              为发送、接收、打字、文件、红包等不同消息类型搭配独立背景音效，支持实时预览试听
            </p>
          </div>
          <button
            onClick={() => updateChatSounds({ enabled: !chatSounds.enabled })}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1 transition-colors ${
              chatSounds.enabled
                ? 'bg-[#2563EB] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {chatSounds.enabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                已开启
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                已关闭
              </>
            )}
          </button>
        </div>

        {/* Master Volume Slider + Typing Audio Switch */}
        <div className="grid grid-cols-1 gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 shrink-0 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" />
              音效音量
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={chatSounds.masterVolume}
              onChange={(e) => updateChatSounds({ masterVolume: Number(e.target.value) })}
              className="flex-1 accent-[#2563EB] cursor-pointer"
            />
            <span className="w-9 text-right font-mono-tabular font-semibold text-slate-700 dark:text-slate-300">
              {chatSounds.masterVolume}%
            </span>
            <button
              onClick={() => triggerPreview(chatSounds.perMessageType[selectedCategory])}
              className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] text-[11px] text-[#2563EB] font-medium shrink-0"
            >
              试听音量
            </button>
          </div>

          <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/70 cursor-pointer text-xs">
            <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <Keyboard className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>
                打字实时按键音效（当前：
                <span className="font-semibold text-[#2563EB]">
                  {getSoundName(chatSounds.perMessageType.typing)}
                </span>
                ）
              </span>
            </span>
            <input
              type="checkbox"
              checked={chatSounds.typingFeedbackEnabled}
              onChange={(e) => {
                const checked = e.target.checked;
                updateChatSounds({ typingFeedbackEnabled: checked });
                if (checked) triggerPreview(chatSounds.perMessageType.typing);
              }}
              className="w-4 h-4 accent-[#2563EB]"
            />
          </label>
        </div>

        {/* One-Click Presets */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              一键主题音效套装
            </span>
            <button
              onClick={() => {
                const defaultPreset = SOUND_PRESETS[0].config;
                if (defaultPreset.perMessageType) {
                  updateChatSounds({
                    enabled: true,
                    masterVolume: 80,
                    typingFeedbackEnabled: false,
                    perMessageType: { ...defaultPreset.perMessageType },
                  });
                  triggerPreview('dual_chime');
                }
              }}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-[#2563EB]"
            >
              <RotateCcw className="w-3 h-3" />
              恢复默认
            </button>
          </div>
          <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'} gap-1.5`}>
            {SOUND_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  updateChatSounds(preset.config);
                  if (preset.config.perMessageType) {
                    triggerPreview(preset.config.perMessageType.text);
                  }
                }}
                className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] hover:bg-[#2563EB]/5 text-left transition-colors"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {preset.name}
                  </span>
                  <span className="text-[10px] px-1 rounded bg-sky-50 dark:bg-sky-950/60 text-[#2563EB] shrink-0">
                    {preset.tag}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split: Per-Message-Type Mapping + Interactive Sound Library */}
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'} gap-4`}>
        {/* Message Types Binding List */}
        <div
          className={`${
            compact ? '' : 'lg:col-span-6'
          } rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#191c24] overflow-hidden`}
        >
          <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              1. 选择消息类型并配置音效
            </span>
            <span className="text-[11px] text-slate-400">支持单独指定</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {SOUND_MESSAGE_CATEGORIES.map((cat) => {
              const currentSoundId = chatSounds.perMessageType[cat.id];
              const isSelected = selectedCategory === cat.id;
              const isPlaying = playingSoundId === currentSoundId && currentSoundId !== 'silent';

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#2563EB]/8 dark:bg-[#2563EB]/15'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold ${
                          isSelected
                            ? 'text-[#2563EB]'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {cat.label}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2563EB] text-white">
                          配置中
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">{cat.desc}</div>
                  </div>

                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <select
                      value={currentSoundId}
                      onChange={(e) => {
                        setSelectedCategory(cat.id);
                        assignSoundToCategory(cat.id, e.target.value as SoundEffectId, true);
                      }}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#2563EB]"
                    >
                      {SOUND_LIBRARY.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => triggerPreview(currentSoundId)}
                      disabled={currentSoundId === 'silent'}
                      title={
                        currentSoundId === 'silent'
                          ? '当前为静音'
                          : `预览试听「${getSoundName(currentSoundId)}」`
                      }
                      className={`p-1.5 rounded-lg border transition-colors disabled:opacity-35 ${
                        isPlaying
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#2563EB] hover:text-[#2563EB]'
                      }`}
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sound Library Browser with Real-Time Preview & One-Click Apply */}
        <div
          className={`${
            compact ? '' : 'lg:col-span-6'
          } rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#191c24] overflow-hidden flex flex-col`}
        >
          <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                2. 音效库挑选（当前目标：
                <span className="text-[#2563EB]">{selectedCatMeta.label}</span>）
              </span>
              <span className="text-[11px] text-slate-400 font-mono-tabular">
                {SOUND_LIBRARY.length} 款内置音效
              </span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              {(
                [
                  { id: 'all', label: '全部音效' },
                  { id: 'keyboard', label: '键盘/点击' },
                  { id: 'retro', label: '怀旧/拨号' },
                  { id: 'chime', label: '清脆铃声' },
                  { id: 'fun', label: '趣味互动' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setLibraryFilter(tab.id)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap ${
                    libraryFilter === tab.id
                      ? 'bg-[#2563EB] text-white'
                      : 'text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 space-y-2 max-h-[380px] overflow-y-auto">
            {filteredLibrary.map((sound) => {
              const isAssigned = chatSounds.perMessageType[selectedCategory] === sound.id;
              const isPlaying = playingSoundId === sound.id;

              return (
                <div
                  key={sound.id}
                  className={`rounded-xl border p-2.5 flex items-center justify-between gap-2.5 transition-all ${
                    isAssigned
                      ? 'border-[#2563EB] bg-[#2563EB]/5'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Waveform Mini Indicator */}
                    <div
                      className={`w-9 h-9 rounded-lg flex items-end justify-center gap-0.5 p-1.5 shrink-0 ${
                        isPlaying
                          ? 'bg-[#2563EB] text-white'
                          : isAssigned
                          ? 'bg-[#2563EB]/15 text-[#2563EB]'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {sound.bars.map((bar, idx) => (
                        <span
                          key={idx}
                          className={`w-1 rounded-full bg-current transition-all ${
                            isPlaying ? 'scale-y-110 opacity-100' : 'opacity-80'
                          }`}
                          style={{ height: `${Math.max(20, bar)}%` }}
                        />
                      ))}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {sound.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                          {sound.categoryLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {sound.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => triggerPreview(sound.id)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition-colors ${
                        isPlaying
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#2563EB] hover:text-[#2563EB]'
                      }`}
                    >
                      <Volume2 className="w-3 h-3" />
                      {isPlaying ? '试听中' : '预览'}
                    </button>

                    <button
                      onClick={() => assignSoundToCategory(selectedCategory, sound.id, true)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors ${
                        isAssigned
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                      }`}
                    >
                      {isAssigned ? (
                        <>
                          <Check className="w-3 h-3" />
                          已应用
                        </>
                      ) : (
                        '选用'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
