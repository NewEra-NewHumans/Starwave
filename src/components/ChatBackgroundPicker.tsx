import React from 'react';
import { Image as ImageIcon, RotateCcw, Upload, Check } from 'lucide-react';
import { ChatBackgroundPresetId, ChatBackgroundSetting } from '../types/qq';
import { GENERATED_ASSETS } from '../data/seedData';

export const CHAT_BACKGROUND_PRESETS: Array<{
  id: ChatBackgroundPresetId;
  label: string;
  previewStyle: React.CSSProperties;
  imageUrl?: string;
}> = [
  {
    id: 'default',
    label: '星涟极光',
    previewStyle: {
      background:
        'radial-gradient(circle at 20% 15%, rgba(37,99,235,0.18), transparent 65%), radial-gradient(circle at 85% 85%, rgba(13,148,136,0.16), transparent 65%), linear-gradient(135deg, #f3f6fb 0%, #e6edf8 100%)',
    },
  },
  {
    id: 'grid_blueprint',
    label: '极客网格',
    previewStyle: {
      backgroundColor: '#f3f7fc',
      backgroundImage:
        'radial-gradient(rgba(37, 99, 235, 0.25) 1px, transparent 1px)',
      backgroundSize: '14px 14px',
    },
  },
  {
    id: 'aurora_blue',
    label: '极光蔚蓝',
    previewStyle: {
      background:
        'linear-gradient(135deg, #e0f2fe 0%, #c7d2fe 50%, #bae6fd 100%)',
    },
  },
  {
    id: 'sakura_mist',
    label: '樱花粉雾',
    previewStyle: {
      background:
        'linear-gradient(135deg, #fff1f2 0%, #fce7f3 52%, #fae8ff 100%)',
    },
  },
  {
    id: 'night_stars',
    label: '静谧星空',
    previewStyle: {
      background:
        'radial-gradient(circle at 20% 20%, #1e3a8a 0%, #0f172a 60%, #020617 100%)',
    },
  },
  {
    id: 'westlake_photo',
    label: '西湖日落',
    imageUrl: GENERATED_ASSETS.qzoneCover,
    previewStyle: {
      backgroundImage: `url(${GENERATED_ASSETS.qzoneCover})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
  {
    id: 'travel_photo',
    label: '山川远行',
    imageUrl: GENERATED_ASSETS.travelPhoto,
    previewStyle: {
      backgroundImage: `url(${GENERATED_ASSETS.travelPhoto})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  },
];

export const ChatFeedBackdrop: React.FC<{
  bg?: ChatBackgroundSetting;
  minimalMode?: boolean;
}> = ({ bg, minimalMode }) => {
  if (minimalMode) return null;

  if (!bg || bg.presetId === 'default') {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 sr-aurora-canvas" />
    );
  }

  const preset = CHAT_BACKGROUND_PRESETS.find((p) => p.id === bg.presetId);
  const photoUrl =
    bg.presetId === 'custom_image' ? bg.customImageUrl : preset?.imageUrl;

  const isDarkBg = bg.presetId === 'night_stars' || Boolean(photoUrl);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {photoUrl ? (
        <div
          className="absolute -inset-4 bg-cover bg-center transition-all duration-300"
          style={{
            backgroundImage: `url(${photoUrl})`,
            filter: bg.blurPx > 0 ? `blur(${bg.blurPx}px)` : undefined,
          }}
        />
      ) : (
        <div
          className="absolute inset-0 transition-all duration-300"
          style={preset?.previewStyle}
        />
      )}

      {/* Subtle stars decoration for night_stars */}
      {bg.presetId === 'night_stars' && (
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(1.5px 1.5px at 20px 30px, #fff, transparent), radial-gradient(1.5px 1.5px at 90px 110px, #bae6fd, transparent), radial-gradient(1px 1px at 160px 60px, #fef08a, transparent)',
            backgroundSize: '210px 160px',
          }}
        />
      )}

      {/* Readability Veil */}
      <div
        className={`absolute inset-0 transition-opacity ${
          isDarkBg ? 'bg-slate-950 dark:bg-slate-950' : 'bg-white dark:bg-slate-950'
        }`}
        style={{
          opacity: isDarkBg
            ? Math.max(0.15, (100 - bg.overlayOpacity) / 100)
            : Math.max(0.15, bg.overlayOpacity / 120),
        }}
      />
    </div>
  );
};

interface ChatBackgroundPickerProps {
  currentBg: ChatBackgroundSetting;
  conversationTitle: string;
  hasCustomOverride: boolean;
  onChangeCurrentBg: (next: ChatBackgroundSetting) => void;
  onApplyToAll: (next: ChatBackgroundSetting) => void;
  onResetCurrent: () => void;
}

export const ChatBackgroundPicker: React.FC<ChatBackgroundPickerProps> = ({
  currentBg,
  conversationTitle,
  hasCustomOverride,
  onChangeCurrentBg,
  onApplyToAll,
  onResetCurrent,
}) => {
  const handleUploadCustomImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChangeCurrentBg({
        ...currentBg,
        presetId: 'custom_image',
        customImageUrl: String(reader.result),
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#191c24] overflow-hidden">
      <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ImageIcon className="w-4 h-4 text-[#2563EB] shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              聊天背景自定义
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {hasCustomOverride
                ? `正在为「${conversationTitle}」单独定制`
                : '使用全局背景 · 点击下方即时切换'}
            </div>
          </div>
        </div>
        {hasCustomOverride && (
          <button
            type="button"
            onClick={onResetCurrent}
            className="text-[11px] text-slate-500 hover:text-[#2563EB] flex items-center gap-1 shrink-0"
            title="恢复默认背景"
          >
            <RotateCcw className="w-3 h-3" />
            恢复
          </button>
        )}
      </div>

      <div className="p-3.5 space-y-3">
        {/* Preset Swatches */}
        <div className="grid grid-cols-4 gap-2">
          {CHAT_BACKGROUND_PRESETS.map((preset) => {
            const active = currentBg.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  onChangeCurrentBg({
                    ...currentBg,
                    presetId: preset.id,
                  })
                }
                className={`group rounded-lg overflow-hidden border text-center transition-all ${
                  active
                    ? 'border-[#2563EB] ring-2 ring-[#2563EB]/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-[#2563EB]/50'
                }`}
              >
                <div
                  className="h-11 w-full relative"
                  style={preset.previewStyle}
                >
                  {active && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <div className="py-1 text-[10px] font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 truncate px-1">
                  {preset.label}
                </div>
              </button>
            );
          })}

          {/* Upload Custom Image */}
          <label
            className={`cursor-pointer rounded-lg overflow-hidden border text-center transition-all ${
              currentBg.presetId === 'custom_image'
                ? 'border-[#2563EB] ring-2 ring-[#2563EB]/30'
                : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-[#2563EB]'
            }`}
          >
            <div
              className="h-11 w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 bg-cover bg-center relative"
              style={
                currentBg.customImageUrl
                  ? { backgroundImage: `url(${currentBg.customImageUrl})` }
                  : undefined
              }
            >
              <Upload className="w-4 h-4 text-[#2563EB] drop-shadow" />
            </div>
            <div className="py-1 text-[10px] font-medium text-[#2563EB] bg-white dark:bg-slate-900 truncate px-1">
              上传图片
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadCustomImage}
              className="hidden"
            />
          </label>
        </div>

        {/* Fine-Tuning Sliders when non-default */}
        {currentBg.presetId !== 'default' && (
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-2.5 space-y-2 text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-300">背景虚化</span>
              <input
                type="range"
                min={0}
                max={16}
                value={currentBg.blurPx}
                onChange={(e) =>
                  onChangeCurrentBg({
                    ...currentBg,
                    blurPx: Number(e.target.value),
                  })
                }
                className="flex-1 accent-[#2563EB]"
              />
              <span className="w-8 text-right font-mono-tabular text-slate-500">
                {currentBg.blurPx}px
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-300">清晰护眼</span>
              <input
                type="range"
                min={20}
                max={92}
                value={currentBg.overlayOpacity}
                onChange={(e) =>
                  onChangeCurrentBg({
                    ...currentBg,
                    overlayOpacity: Number(e.target.value),
                  })
                }
                className="flex-1 accent-[#2563EB]"
              />
              <span className="w-8 text-right font-mono-tabular text-slate-500">
                {currentBg.overlayOpacity}%
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => onApplyToAll(currentBg)}
          className="w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-[#2563EB] hover:text-[#2563EB]"
        >
          将当前背景应用到所有聊天会话
        </button>
      </div>
    </div>
  );
};
