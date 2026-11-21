import React, { useState } from 'react';
import {
  Hash,
  Heart,
  MessageSquare,
  Mic,
  MicOff,
  Plus,
  Radio,
  Send,
  Users,
} from 'lucide-react';
import { QqChannel } from '../types/qq';
import { AvatarView } from './AvatarView';
import { ME_PROFILE } from '../data/seedData';

interface ChannelsPanelProps {
  channels: QqChannel[];
  onToggleJoinChannel: (channelId: string) => void;
  onCreateThread: (channelId: string, subChannelId: string, title: string, content: string) => void;
  onLikeThread: (channelId: string, threadId: string) => void;
  onReplyThread: (channelId: string, threadId: string, text: string) => void;
  onToggleVoiceRoom: (channelId: string, subChannelId: string) => void;
  onOpenUserProfile?: (target: { id?: string; name: string; avatar?: string }) => void;
}

export const ChannelsPanel: React.FC<ChannelsPanelProps> = ({
  channels,
  onToggleJoinChannel,
  onCreateThread,
  onLikeThread,
  onReplyThread,
  onToggleVoiceRoom,
  onOpenUserProfile,
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState(channels[0]?.id || '');
  const activeChannel = channels.find((c) => c.id === selectedChannelId) || channels[0];
  const [selectedSubId, setSelectedSubId] = useState(
    activeChannel?.subChannels[0]?.id || ''
  );
  const [composerOpen, setComposerOpen] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadBody, setThreadBody] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  if (!activeChannel) return null;

  const activeSub =
    activeChannel.subChannels.find((s) => s.id === selectedSubId) ||
    activeChannel.subChannels[0];

  const subThreads = activeChannel.threads.filter(
    (t) => t.subChannelId === activeSub?.id
  );

  const isInVoice =
    activeSub?.kind === 'voice' &&
    (activeSub.voiceMembers || []).some((m) => m.id === 'me');

  return (
    <div className="flex h-full w-full overflow-hidden sr-aurora-canvas">
      {/* Left Channel & Sub-Channel Directory */}
      <aside className="w-72 shrink-0 border-r border-slate-200/80 dark:border-slate-800/90 bg-slate-50/90 dark:bg-[#121621]/95 backdrop-blur-md flex flex-col">
        <div className="p-4 bg-gradient-to-br from-[#091022] via-[#13203D] to-[#0D283A] text-white border-b border-white/10">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold tracking-tight">星涟灵感频道</h2>
            <span className="text-[10px] font-mono-tabular uppercase tracking-wider text-sky-300">
              Live Hub
            </span>
          </div>
          <p className="text-xs text-slate-300/85 mt-0.5">
            兴趣主题子频道 · 语音开黑房 · 帖子精华区
          </p>
        </div>

        {/* Channel Switcher */}
        <div className="p-2.5 space-y-1.5 border-b border-slate-200/80 dark:border-slate-800">
          {channels.map((ch) => {
            const active = ch.id === activeChannel.id;
            return (
              <button
                key={ch.id}
                onClick={() => {
                  setSelectedChannelId(ch.id);
                  setSelectedSubId(ch.subChannels[0]?.id || '');
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-left transition-all ${
                  active
                    ? 'bg-gradient-to-r from-[#2563EB] to-[#0D9488] text-white shadow-[0_6px_18px_-6px_rgba(37,99,235,0.5)]'
                    : 'hover:bg-white dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{ch.name}</div>
                  <div
                    className={`text-[11px] font-mono-tabular ${
                      active ? 'text-sky-100' : 'text-slate-500'
                    }`}
                  >
                    {ch.memberCount.toLocaleString()} 人已加入
                  </div>
                </div>
                {ch.joined && (
                  <span
                    className={`text-[10px] font-medium shrink-0 ${
                      active ? 'text-white/95' : 'text-emerald-600'
                    }`}
                  >
                    已加入
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sub-channels list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-2 pb-1 text-[11px] font-medium text-slate-500">
            子频道列表
          </div>
          {activeChannel.subChannels.map((sub) => {
            const active = sub.id === activeSub?.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubId(sub.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                  active
                    ? 'bg-white dark:bg-[#1e2638] text-[#2563EB] dark:text-sky-400 font-semibold shadow-sm ring-1 ring-[#2563EB]/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  {sub.kind === 'voice' ? (
                    <Radio className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Hash className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="truncate">{sub.name}</span>
                </span>
                {sub.kind === 'voice' && (
                  <span className="font-mono-tabular text-[11px] text-emerald-600">
                    {(sub.voiceMembers || []).length}人
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Sub-Channel Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 bg-white/82 dark:bg-[#151a25]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                # {activeSub?.name}
              </h3>
              <span className="text-xs text-slate-400">· {activeChannel.name}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{activeSub?.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleJoinChannel(activeChannel.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
                activeChannel.joined
                  ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-[#2563EB]'
                  : 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              }`}
            >
              {activeChannel.joined ? '已加入频道' : '加入频道'}
            </button>
            {activeSub?.kind === 'feed' && (
              <button
                onClick={() => setComposerOpen(!composerOpen)}
                className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0D9488] text-white shadow-[0_4px_14px_-4px_rgba(37,99,235,0.5)] hover:opacity-95"
              >
                <Plus className="w-3.5 h-3.5" />
                发布主题帖
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Voice Sub-Channel View */}
          {activeSub?.kind === 'voice' ? (
            <div className="max-w-3xl mx-auto space-y-5">
              <div className="rounded-2xl bg-gradient-to-br from-[#0B1224] via-[#132144] to-[#0C293B] border border-white/10 text-white p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>实时语音频道 · {(activeSub.voiceMembers || []).length} 人在麦上</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    低延迟高音质连麦声场，随时上麦交流技术、共听无损或组队协作。
                  </p>
                </div>
                <button
                  onClick={() => onToggleVoiceRoom(activeChannel.id, activeSub.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-md transition-opacity hover:opacity-95 ${
                    isInVoice
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                  }`}
                >
                  {isInVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isInVoice ? '下麦离开语音房' : '立即上麦连麦'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(activeSub.voiceMembers || []).map((vm) => (
                  <button
                    key={vm.id}
                    onClick={() =>
                      onOpenUserProfile?.({ id: vm.id, name: vm.name, avatar: vm.avatar })
                    }
                    className={`rounded-2xl bg-white/95 dark:bg-[#171d2a]/95 backdrop-blur-sm border p-5 flex flex-col items-center gap-2.5 hover:border-[#2563EB] hover:-translate-y-0.5 transition-all shadow-sm ${
                      vm.speaking
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'border-slate-200/80 dark:border-slate-800'
                    }`}
                    title={`点击查看 ${vm.name} 的资料与空间`}
                  >
                    <AvatarView name={vm.name} src={vm.avatar} size="lg" online />
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {vm.name}
                    </div>
                    <span
                      className={`text-[11px] font-medium ${
                        vm.speaking ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {vm.speaking ? '正在发言中' : '安静收听'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {composerOpen && (
                <div className="rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                  <input
                    value={threadTitle}
                    onChange={(e) => setThreadTitle(e.target.value)}
                    placeholder="主题帖标题"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-medium"
                  />
                  <textarea
                    rows={3}
                    value={threadBody}
                    onChange={(e) => setThreadBody(e.target.value)}
                    placeholder="分享你的经验、问题或作品..."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setComposerOpen(false)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        if (!threadTitle.trim() || !threadBody.trim() || !activeSub) return;
                        onCreateThread(
                          activeChannel.id,
                          activeSub.id,
                          threadTitle.trim(),
                          threadBody.trim()
                        );
                        setThreadTitle('');
                        setThreadBody('');
                        setComposerOpen(false);
                      }}
                      className="flex items-center gap-1 px-4 py-1.5 text-xs font-medium rounded-lg bg-[#2563EB] text-white"
                    >
                      <Send className="w-3.5 h-3.5" />
                      发布帖子
                    </button>
                  </div>
                </div>
              )}

              {subThreads.length === 0 ? (
                <div className="rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-10 text-center text-sm text-slate-500">
                  该子频道暂无主题帖，点击右上角发布第一条内容吧！
                </div>
              ) : (
                subThreads.map((th) => (
                  <article
                    key={th.id}
                    className="rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-5 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          onOpenUserProfile?.({
                            name: th.authorName,
                            avatar: th.authorAvatar,
                          })
                        }
                        className="shrink-0 hover:opacity-85"
                        title={`查看 ${th.authorName} 的个人资料与空间`}
                      >
                        <AvatarView name={th.authorName} src={th.authorAvatar} size="sm" />
                      </button>
                      <div>
                        <button
                          onClick={() =>
                            onOpenUserProfile?.({
                              name: th.authorName,
                              avatar: th.authorAvatar,
                            })
                          }
                          className="text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-[#2563EB] text-left"
                        >
                          {th.authorName}
                        </button>
                        <div className="text-[11px] text-slate-400 font-mono-tabular">
                          {th.createdAt}
                        </div>
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {th.title}
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {th.content}
                    </p>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => onLikeThread(activeChannel.id, th.id)}
                        className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg border ${
                          th.likedByMe
                            ? 'border-rose-200 bg-rose-50 dark:bg-rose-950/30 text-rose-600'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${th.likedByMe ? 'fill-rose-500' : ''}`} />
                        赞同 ({th.likes})
                      </button>
                      <span className="flex items-center gap-1 text-xs text-slate-500 font-mono-tabular">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {th.replies.length} 条回复
                      </span>
                    </div>

                    {th.replies.length > 0 && (
                      <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3 space-y-1.5 text-xs">
                        {th.replies.map((r) => (
                          <div key={r.id}>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {r.authorName}：
                            </span>
                            <span className="text-slate-700 dark:text-slate-300">{r.text}</span>
                            <span className="ml-2 text-slate-400 font-mono-tabular">{r.time}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        value={replyDrafts[th.id] || ''}
                        onChange={(e) =>
                          setReplyDrafts((p) => ({ ...p, [th.id]: e.target.value }))
                        }
                        placeholder="参与讨论..."
                        className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs"
                      />
                      <button
                        onClick={() => {
                          const txt = (replyDrafts[th.id] || '').trim();
                          if (!txt) return;
                          onReplyThread(activeChannel.id, th.id, txt);
                          setReplyDrafts((p) => ({ ...p, [th.id]: '' }));
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 dark:bg-slate-700 text-white"
                      >
                        回复
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
