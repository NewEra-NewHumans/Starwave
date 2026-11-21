import React, { useState } from 'react';
import {
  Activity,
  BatteryCharging,
  CheckCheck,
  FileText,
  Laptop,
  Maximize2,
  Mic,
  Minimize2,
  Monitor,
  PhoneCall,
  Send,
  Smartphone,
  Sparkles,
  Tablet,
  Wifi,
  X,
} from 'lucide-react';
import { ChatMessage, Conversation } from '../types/qq';

export type CompanionTargetPlatform = 'iOS' | 'Android' | 'iPad' | 'macOS' | 'Windows';

const TARGET_PLATFORMS: Array<{
  id: CompanionTargetPlatform;
  short: string;
  label: string;
  isDesktop?: boolean;
  isTablet?: boolean;
}> = [
  { id: 'iOS', short: 'iOS', label: 'iPhone 16 Pro' },
  { id: 'Android', short: 'Android', label: 'Android 旗舰' },
  { id: 'iPad', short: 'iPad', label: 'iPadOS 分屏', isTablet: true },
  { id: 'macOS', short: 'macOS', label: 'macOS 桌面', isDesktop: true },
  { id: 'Windows', short: 'Win', label: 'Windows 11', isDesktop: true },
];

export const CompanionSyncPreview: React.FC<{
  platform: CompanionTargetPlatform;
  onChangePlatform: (p: CompanionTargetPlatform) => void;
  conversation?: Conversation;
  messages: ChatMessage[];
  myName: string;
  wsConnected: boolean;
  lastSyncTime: string;
  draft: string;
  onDraftChange: (v: string) => void;
  onSendFromCompanion: (text: string) => void;
  onOpenTestReport: () => void;
  onClose: () => void;
}> = ({
  platform,
  onChangePlatform,
  conversation,
  messages,
  myName,
  wsConnected,
  lastSyncTime,
  draft,
  onDraftChange,
  onSendFromCompanion,
  onOpenTestReport,
  onClose,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [mirrorTyping, setMirrorTyping] = useState(false);

  const visibleMessages = messages.filter((m) => !m.recalled).slice(-12);
  const currentMeta =
    TARGET_PLATFORMS.find((p) => p.id === platform) || TARGET_PLATFORMS[0];

  const renderMessageContent = (m: ChatMessage, isMine: boolean) => {
    if (m.type === 'image' && m.mediaUrl) {
      return (
        <div className="space-y-1">
          <img
            src={m.mediaUrl}
            alt={m.content || '图片消息'}
            className="w-full max-h-32 object-cover rounded-lg border border-black/10"
          />
          {m.content && <div className="text-[11px]">{m.content}</div>}
        </div>
      );
    }

    if (m.type === 'file' && m.file) {
      const sizeMb = (m.file.sizeBytes / (1024 * 1024)).toFixed(1);
      return (
        <div
          className={`rounded-lg p-2 text-[11px] space-y-1 ${
            isMine ? 'bg-white/15' : 'bg-slate-100 dark:bg-slate-900/70'
          }`}
        >
          <div className="flex items-center gap-1.5 font-medium truncate">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{m.file.name}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] opacity-80 font-mono-tabular">
            <span>{sizeMb} MB</span>
            <span>{m.file.progress ?? 100}%</span>
          </div>
          {(m.file.progress ?? 100) < 100 && (
            <div className="h-1 rounded-full bg-black/15 overflow-hidden">
              <div
                className="h-full bg-emerald-400"
                style={{ width: `${m.file.progress ?? 0}%` }}
              />
            </div>
          )}
        </div>
      );
    }

    if (m.type === 'voice') {
      return (
        <div className="flex items-center gap-2 text-[11px]">
          <Mic className="w-3.5 h-3.5 shrink-0" />
          <span className="font-mono-tabular">{m.voiceDurationSec || 6}″</span>
          <span className="truncate opacity-85">
            {m.voiceTranscript || '语音消息已转文字同步'}
          </span>
        </div>
      );
    }

    if (m.type === 'poll' && m.poll) {
      return (
        <div className="space-y-1 text-[11px]">
          <div className="font-semibold">群投票：{m.poll.question}</div>
          {m.poll.options.slice(0, 2).map((opt) => (
            <div
              key={opt.id}
              className={`px-2 py-0.5 rounded text-[10px] flex justify-between ${
                isMine ? 'bg-white/15' : 'bg-slate-100 dark:bg-slate-900/60'
              }`}
            >
              <span className="truncate">{opt.text}</span>
              <span className="font-mono-tabular">{opt.voterIds.length}票</span>
            </div>
          ))}
        </div>
      );
    }

    if (m.type === 'red_packet' && m.redPacket) {
      return (
        <div className="rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white px-2.5 py-1.5 text-[11px] font-medium">
          🧧 {m.redPacket.title} · ¥{m.redPacket.totalAmount}
        </div>
      );
    }

    if (m.type === 'call_log') {
      return (
        <div className="flex items-center gap-1.5 text-[11px]">
          <PhoneCall className="w-3.5 h-3.5 shrink-0" />
          <span>{m.content}</span>
        </div>
      );
    }

    if (m.type === 'sticker') {
      return (
        <div className="flex items-center gap-1.5 text-sm">
          <span>{m.stickerLabel || m.content}</span>
        </div>
      );
    }

    return <div className="break-words leading-relaxed">{m.content}</div>;
  };

  return (
    <aside
      className={`${
        expanded ? 'w-[430px]' : 'w-88'
      } shrink-0 border-l border-slate-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-[#14171f] flex flex-col transition-all duration-200`}
    >
      {/* Top Control Header */}
      <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100 min-w-0">
            {currentMeta.isDesktop ? (
              <Laptop className="w-4 h-4 text-[#2563EB] shrink-0" />
            ) : currentMeta.isTablet ? (
              <Tablet className="w-4 h-4 text-[#2563EB] shrink-0" />
            ) : (
              <Smartphone className="w-4 h-4 text-[#2563EB] shrink-0" />
            )}
            <span className="truncate">{currentMeta.label} 实时同步镜像</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
              title={expanded ? '收窄预览视口' : '加宽视口（适合 iPad/桌面预览）'}
            >
              {expanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={onOpenTestReport}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#2563EB] hover:bg-slate-200/60 dark:hover:bg-slate-800"
              title="打开跨端测试报告与实时诊断"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="关闭同步预览"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5-Platform Switcher */}
        <div className="grid grid-cols-5 gap-1">
          {TARGET_PLATFORMS.map((p) => {
            const active = platform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onChangePlatform(p.id)}
                className={`py-1 px-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300/70 dark:hover:bg-slate-700'
                }`}
              >
                {p.short}
              </button>
            );
          })}
        </div>

        {/* Sync Status Strip */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono-tabular">
          <span>
            通道：{wsConnected ? 'WebSocket 实时' : '本地镜像'} · 同步 {lastSyncTime}
          </span>
          <label className="flex items-center gap-1 cursor-pointer select-none text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={mirrorTyping}
              onChange={(e) => setMirrorTyping(e.target.checked)}
              className="accent-[#2563EB] w-3 h-3"
            />
            <span>输入态镜像</span>
          </label>
        </div>
      </div>

      {/* Simulated Target Device Shell */}
      <div className="p-3 flex-1 flex flex-col overflow-hidden">
        <div
          className={`flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#191c24] shadow-xl ${
            currentMeta.isDesktop
              ? 'rounded-xl border border-slate-300 dark:border-slate-700'
              : 'rounded-[26px] border-[5px] border-slate-800 dark:border-slate-700'
          }`}
        >
          {/* Platform-Specific Top Chrome */}
          {platform === 'iOS' && (
            <div className="px-4 pt-2 pb-1 bg-slate-900 text-white flex items-center justify-between text-[10px] font-mono-tabular">
              <span>9:41</span>
              <div className="w-16 h-3.5 rounded-full bg-black border border-slate-700" />
              <div className="flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          )}

          {platform === 'Android' && (
            <div className="px-4 py-1.5 bg-slate-950 text-white flex items-center justify-between text-[10px] font-mono-tabular">
              <span>16:12</span>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700 ring-1 ring-slate-600" />
              <div className="flex items-center gap-1">
                <span>5G</span>
                <BatteryCharging className="w-3.5 h-3.5 text-sky-400" />
              </div>
            </div>
          )}

          {platform === 'iPad' && (
            <div className="px-4 py-1 bg-slate-900 text-slate-200 flex items-center justify-between text-[10px] font-mono-tabular">
              <span>iPadOS Split View</span>
              <span>星涟双端共生</span>
              <span>100%</span>
            </div>
          )}

          {platform === 'macOS' && (
            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[10px] font-medium text-slate-500">
                StarRipple · macOS Retina
              </span>
              <Monitor className="w-3 h-3 text-slate-400" />
            </div>
          )}

          {platform === 'Windows' && (
            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300">
              <span className="font-medium">星涟 StarRipple · Windows 11</span>
              <div className="flex items-center gap-2 font-mono-tabular">
                <span>─</span>
                <span>□</span>
                <span>×</span>
              </div>
            </div>
          )}

          {/* Active Conversation Header */}
          <div className="px-3 py-2 bg-[#2563EB] text-white text-xs flex items-center justify-between shrink-0">
            <div className="min-w-0">
              <div className="font-semibold truncate">
                {conversation?.title || '星涟实时会话'}
              </div>
              <div className="text-[10px] text-sky-100 flex items-center gap-1">
                <span>{platform} 在线</span>
                <span>·</span>
                <span>{myName}</span>
              </div>
            </div>
            <span className="text-[10px] font-mono-tabular px-1.5 py-0.5 rounded bg-white/15 shrink-0">
              {visibleMessages.length} 条同步
            </span>
          </div>

          {/* Rich Message Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs bg-[#f5f7fa] dark:bg-[#111318]">
            {visibleMessages.map((m) => {
              const isMine = m.senderId === 'me';
              return (
                <div
                  key={`comp-${m.id}`}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-slate-400 mb-0.5 px-1 flex items-center gap-1">
                    <span>{m.senderName}</span>
                    <span className="font-mono-tabular">{m.timestamp}</span>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-2xl max-w-[88%] shadow-xs ${
                      isMine
                        ? 'bg-[#2563EB] text-white rounded-br-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-sm'
                    }`}
                  >
                    {m.quote && (
                      <div
                        className={`text-[10px] px-2 py-1 rounded mb-1 border-l-2 ${
                          isMine
                            ? 'bg-white/15 border-white/60 text-sky-100'
                            : 'bg-slate-100 dark:bg-slate-900/70 border-[#2563EB] text-slate-500'
                        }`}
                      >
                        {m.quote.senderName}: {m.quote.preview}
                      </div>
                    )}

                    {renderMessageContent(m, isMine)}

                    {m.reactions && m.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.reactions.map((r) => (
                          <span
                            key={r.emoji}
                            className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                              isMine
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {r.emoji} {r.userIds.length}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {isMine && (
                    <div className="text-[10px] text-slate-400 mt-0.5 px-1 flex items-center gap-0.5">
                      <CheckCheck className="w-3 h-3 text-emerald-500" />
                      <span>多端已同步</span>
                    </div>
                  )}
                </div>
              );
            })}

            {(mirrorTyping || draft.trim().length > 0) && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#2563EB] dark:text-sky-400 px-1">
                <Sparkles className="w-3 h-3" />
                <span>正在 {platform} 端实时输入并镜像同步...</span>
              </div>
            )}
          </div>

          {/* Interactive Composer */}
          <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#191c24] space-y-1.5">
            <div className="flex gap-1.5">
              <input
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && draft.trim()) {
                    onSendFromCompanion(draft.trim());
                  }
                }}
                placeholder={`从 ${platform} 端实时发送消息...`}
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
              <button
                onClick={() => {
                  if (!draft.trim()) return;
                  onSendFromCompanion(draft.trim());
                }}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center gap-1 shrink-0"
              >
                <Send className="w-3 h-3" />
                <span>发送</span>
              </button>
            </div>

            {!currentMeta.isDesktop && (
              <div className="flex justify-center pt-0.5">
                <div className="w-20 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
