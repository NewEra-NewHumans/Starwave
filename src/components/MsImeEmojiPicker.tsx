import React, { useMemo, useState } from 'react';
import { Search, Sparkles, X } from 'lucide-react';
import {
  MS_IME_CATEGORIES,
  MS_IME_KAOMOJI,
  SUPER_EMOJIS,
} from '../data/msImeEmojis';

const MEME_STICKERS = [
  { label: '收到没问题', emoji: '🫡' },
  { label: '摸鱼中勿cue', emoji: '🐟' },
  { label: '太强了吧', emoji: '🏆' },
  { label: '加急处理中', emoji: '⚡' },
  { label: '晚安好梦', emoji: '🌙' },
  { label: '冲鸭', emoji: '🦆' },
  { label: '加个鸡腿', emoji: '🍗' },
  { label: '先喝杯咖啡', emoji: '☕' },
  { label: '吃瓜围观', emoji: '🍉' },
];

const RECENT_STORAGE_KEY = 'sr_recent_emojis';

function loadRecentEmojis(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    }
  } catch {
    // Ignore storage failures
  }
  return ['👍', '❤️', '😂', '🔥', '🎉', '🫡', '🥳', '✨', '🚀', '☕', '👏', '😭'];
}

function saveRecentEmoji(em: string): string[] {
  const prev = loadRecentEmojis().filter((x) => x !== em);
  const next = [em, ...prev].slice(0, 24);
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore
  }
  return next;
}

interface MsImeEmojiPickerProps {
  compact?: boolean;
  onSelectEmoji: (emoji: string) => void;
  onSelectKaomoji?: (text: string) => void;
  onSendSticker?: (emoji: string, label: string, superEffect?: 'confetti' | 'hearts' | 'fire' | 'stars') => void;
  onClose?: () => void;
}

export const MsImeEmojiPicker: React.FC<MsImeEmojiPickerProps> = ({
  compact = false,
  onSelectEmoji,
  onSelectKaomoji,
  onSendSticker,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('smileys');
  const [recent, setRecent] = useState<string[]>(() => loadRecentEmojis());

  const handlePickEmoji = (char: string) => {
    setRecent(saveRecentEmoji(char));
    onSelectEmoji(char);
  };

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const matched: Array<{ char: string; keywords: string }> = [];
    const seen = new Set<string>();
    for (const cat of MS_IME_CATEGORIES) {
      for (const item of cat.items) {
        if (!seen.has(item.char) && item.keywords.toLowerCase().includes(q)) {
          seen.add(item.char);
          matched.push(item);
        }
      }
    }
    return matched;
  }, [query]);

  const currentCategory = MS_IME_CATEGORIES.find((c) => c.id === activeTab);

  return (
    <div
      className={`${
        compact ? 'w-80' : 'w-[376px]'
      } rounded-2xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header + Search */}
      <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            全量表情与颜文字库 · {compact ? '点击快速回应消息' : '快捷搜索与互动贴纸'}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索表情（如：笑哭、点赞、猫、咖啡、火箭）"
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-[#2563EB] text-slate-900 dark:text-slate-100 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tab Strip */}
      {!query.trim() && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 overflow-x-auto bg-slate-50/70 dark:bg-slate-900/40">
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-2 py-1 rounded-md text-xs shrink-0 transition-colors ${
              activeTab === 'recent'
                ? 'bg-[#2563EB] text-white font-medium'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
            title="最近使用"
          >
            🕒 最近
          </button>
          {MS_IME_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-2 py-1 rounded-md text-xs shrink-0 transition-colors ${
                activeTab === cat.id
                  ? 'bg-[#2563EB] text-white font-medium'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
              title={cat.label}
            >
              {cat.icon}
            </button>
          ))}
          {!compact && (
            <>
              <button
                onClick={() => setActiveTab('kaomoji')}
                className={`px-2 py-1 rounded-md text-[11px] shrink-0 transition-colors ${
                  activeTab === 'kaomoji'
                    ? 'bg-[#2563EB] text-white font-medium'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
                title="经典颜文字"
              >
                (●&apos;◡&apos;●) 颜文字
              </button>
              <button
                onClick={() => setActiveTab('super')}
                className={`px-2 py-1 rounded-md text-[11px] shrink-0 transition-colors flex items-center gap-0.5 ${
                  activeTab === 'super'
                    ? 'bg-[#2563EB] text-white font-medium'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
                title="超级大表情特效"
              >
                <Sparkles className="w-3 h-3" />
                超级
              </button>
              <button
                onClick={() => setActiveTab('stickers')}
                className={`px-2 py-1 rounded-md text-[11px] shrink-0 transition-colors ${
                  activeTab === 'stickers'
                    ? 'bg-[#2563EB] text-white font-medium'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                表情包
              </button>
            </>
          )}
        </div>
      )}

      {/* Body Grid */}
      <div className={`${compact ? 'h-56' : 'h-64'} overflow-y-auto p-2.5`}>
        {query.trim() ? (
          searchResults.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              未找到匹配「{query}」的表情
            </div>
          ) : (
            <div className="grid grid-cols-8 gap-1">
              {searchResults.map((item) => (
                <button
                  key={item.char}
                  onClick={() => handlePickEmoji(item.char)}
                  title={item.keywords}
                  className="h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xl flex items-center justify-center transition-transform active:scale-90"
                >
                  {item.char}
                </button>
              ))}
            </div>
          )
        ) : activeTab === 'recent' ? (
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-slate-400 px-1">
              最近使用 ({recent.length})
            </div>
            <div className="grid grid-cols-8 gap-1">
              {recent.map((em) => (
                <button
                  key={em}
                  onClick={() => handlePickEmoji(em)}
                  className="h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xl flex items-center justify-center transition-transform active:scale-90"
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        ) : activeTab === 'kaomoji' && onSelectKaomoji ? (
          <div className="grid grid-cols-2 gap-1.5">
            {MS_IME_KAOMOJI.map((k) => (
              <button
                key={k.text}
                onClick={() => onSelectKaomoji(k.text)}
                className="px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-[#2563EB]/10 text-left border border-slate-100 dark:border-slate-800"
              >
                <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                  {k.text}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{k.label}</div>
              </button>
            ))}
          </div>
        ) : activeTab === 'super' && onSendSticker ? (
          <div className="space-y-2">
            <div className="text-[11px] text-slate-500 px-1">
              点击发送超级大表情，触发全屏互动特效！
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SUPER_EMOJIS.map((se) => (
                <button
                  key={se.label}
                  onClick={() => onSendSticker(se.emoji, se.label, se.effect)}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-[#2563EB]/10 border border-slate-200 dark:border-slate-800 text-center transition-transform hover:scale-[1.02]"
                >
                  <div className="text-3xl">{se.emoji}</div>
                  <div className="text-[11px] font-medium text-slate-700 dark:text-slate-200 mt-1">
                    {se.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : activeTab === 'stickers' && onSendSticker ? (
          <div className="grid grid-cols-3 gap-1.5">
            {MEME_STICKERS.map((s) => (
              <button
                key={s.label}
                onClick={() => onSendSticker(s.emoji, s.label)}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-[#2563EB]/10 text-center"
              >
                <div className="text-2xl">{s.emoji}</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                  {s.label}
                </div>
              </button>
            ))}
          </div>
        ) : currentCategory ? (
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-slate-400 px-1 flex items-center justify-between">
              <span>{currentCategory.label}</span>
              <span className="font-mono-tabular">{currentCategory.items.length} 个</span>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {currentCategory.items.map((item) => (
                <button
                  key={item.char}
                  onClick={() => handlePickEmoji(item.char)}
                  title={item.keywords}
                  className="h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xl flex items-center justify-center transition-transform active:scale-90"
                >
                  {item.char}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
