import React, { useState } from 'react';
import {
  Compass,
  Edit3,
  Flame,
  MessageSquare,
  Phone,
  Sparkles,
  Star,
  ThumbsUp,
  UserPlus,
  Users,
  Video,
  X,
  Check,
} from 'lucide-react';
import { Contact, Conversation, FriendGroupName, QzonePost } from '../types/qq';
import { AvatarView } from './AvatarView';
import { QqLevelIcons } from './ProfileCenterPanel';
import { GENERATED_ASSETS } from '../data/seedData';
import { getContactLevelInfo } from '../utils/qqLevel';

interface FriendProfileModalProps {
  contact: Contact | null;
  isExistingFriend: boolean;
  sharedGroups: Conversation[];
  friendPosts: QzonePost[];
  likesCount: number;
  likedByMe: boolean;
  minimalMode: boolean;
  onClose: () => void;
  onToggleLike: (contactId: string) => void;
  onStartChat: (contact: Contact) => void;
  onStartCall: (contact: Contact, mode: 'audio' | 'video') => void;
  onVisitQzone: (contact: Contact) => void;
  onUpdateContact: (id: string, patch: Partial<Contact>) => void;
  onAddFriend: (contact: Contact) => void;
  onNudge?: (contact: Contact) => void;
  onOpenLevelCenter?: () => void;
}

const FRIEND_GROUPS: FriendGroupName[] = ['特别关心', '我的好友', '同事伙伴', '校园同学'];

export const FriendProfileModal: React.FC<FriendProfileModalProps> = ({
  contact,
  isExistingFriend,
  sharedGroups,
  friendPosts,
  likesCount,
  likedByMe,
  minimalMode,
  onClose,
  onToggleLike,
  onStartChat,
  onStartCall,
  onVisitQzone,
  onUpdateContact,
  onAddFriend,
  onNudge,
  onOpenLevelCenter,
}) => {
  const [editingRemark, setEditingRemark] = useState(false);
  const [remarkDraft, setRemarkDraft] = useState('');

  if (!contact) return null;

  const levelInfo = getContactLevelInfo(contact);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Top Cover Banner */}
        <div
          className="h-32 relative bg-gradient-to-r from-[#2563EB] via-sky-500 to-indigo-600 bg-cover bg-center"
          style={{ backgroundImage: `url(${GENERATED_ASSETS.qzoneCover})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/35 text-white hover:bg-black/55"
            title="关闭资料卡"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Floating Like Button */}
          <button
            onClick={() => onToggleLike(contact.id)}
            className={`absolute right-3 bottom-3 px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md border transition-colors ${
              likedByMe
                ? 'bg-rose-500/90 text-white border-rose-400'
                : 'bg-black/45 text-white border-white/25 hover:bg-black/65'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span className="font-mono-tabular">{likesCount}</span>
          </button>
        </div>

        {/* Overlapping Avatar & Identity */}
        <div className="px-6 pb-6 -mt-10 relative space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-end gap-3.5 min-w-0">
              <div className="p-1 rounded-full bg-white dark:bg-[#191c24] shadow-lg shrink-0">
                <AvatarView
                  name={contact.name}
                  src={contact.avatar}
                  size="xl"
                  online={contact.online}
                  isBot={contact.isBot}
                  minimalMode={minimalMode}
                />
              </div>
              <div className="pb-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                    {contact.remark || contact.name}
                  </h3>
                  {!minimalMode && contact.sparkDays > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600 font-mono-tabular">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {contact.sparkDays}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-mono-tabular truncate">
                  昵称：{contact.name} · 星涟号 {contact.qqNumber}
                </div>
              </div>
            </div>

            {isExistingFriend && (
              <button
                onClick={() =>
                  onUpdateContact(contact.id, { starred: !contact.starred })
                }
                className={`p-2 rounded-lg border shrink-0 ${
                  contact.starred
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-500'
                    : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500'
                }`}
                title={contact.starred ? '取消特别关心/星标' : '设为特别关心'}
              >
                <Star className={`w-4 h-4 ${contact.starred ? 'fill-amber-500' : ''}`} />
              </button>
            )}
          </div>

          {/* Signature & Status */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/70 px-3.5 py-2.5 text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-slate-500">
              <span>{contact.online ? `${contact.platform} 在线` : '当前离线'}</span>
              <button
                type="button"
                onClick={() => {
                  if (onOpenLevelCenter) {
                    onClose();
                    onOpenLevelCenter();
                  }
                }}
                className="flex items-center gap-1.5 hover:opacity-80"
                title="点击查看星阶成长体系"
              >
                <QqLevelIcons level={levelInfo.level} />
                <span className="font-mono-tabular text-[11px] font-semibold text-amber-600">
                  LV.{levelInfo.level}
                </span>
                <span className="text-[10px] text-slate-400">
                  {levelInfo.title} · {levelInfo.activeDays}天
                </span>
              </button>
            </div>
            <div className="text-slate-700 dark:text-slate-200 leading-relaxed">
              {contact.signature || '这个人很懒，什么都没有留下～'}
            </div>
          </div>

          {/* Remark & Group (for existing friends) */}
          {isExistingFriend && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                <span className="text-slate-500">好友备注</span>
                {editingRemark ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      value={remarkDraft}
                      onChange={(e) => setRemarkDraft(e.target.value)}
                      placeholder="输入备注名"
                      className="px-2 py-1 rounded border border-[#2563EB] bg-white dark:bg-slate-900 w-32 text-xs"
                    />
                    <button
                      onClick={() => {
                        onUpdateContact(contact.id, {
                          remark: remarkDraft.trim() || undefined,
                        });
                        setEditingRemark(false);
                      }}
                      className="p-1 rounded bg-[#2563EB] text-white"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setRemarkDraft(contact.remark || '');
                      setEditingRemark(true);
                    }}
                    className="font-medium text-slate-800 dark:text-slate-200 hover:text-[#2563EB] flex items-center gap-1"
                  >
                    <span>{contact.remark || '点击设置备注'}</span>
                    <Edit3 className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>

              <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                <span className="text-slate-500">好友分组</span>
                <select
                  value={contact.groupName}
                  onChange={(e) =>
                    onUpdateContact(contact.id, {
                      groupName: e.target.value as FriendGroupName,
                    })
                  }
                  className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-xs"
                >
                  {FRIEND_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {sharedGroups.length > 0 && (
                <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500 flex items-center gap-1 shrink-0">
                    <Users className="w-3.5 h-3.5" />
                    共同群聊
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 truncate">
                    {sharedGroups.map((g) => g.title).join('、')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TA's Qzone Preview Strip */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#2563EB]" />
                {contact.name} 的星涟空间
              </span>
              <button
                onClick={() => {
                  onVisitQzone(contact);
                  onClose();
                }}
                className="text-xs font-medium text-[#2563EB] hover:underline"
              >
                进入空间主页 →
              </button>
            </div>
            {friendPosts.length > 0 ? (
              <div
                onClick={() => {
                  onVisitQzone(contact);
                  onClose();
                }}
                className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
              >
                <div className="text-[11px] text-slate-400 mb-0.5">
                  最新动态 · {friendPosts[0].createdAt}
                </div>
                <div className="line-clamp-2">{friendPosts[0].content}</div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">
                点击「进入空间主页」可查看 TA 的相册、留言板或踩一踩空间
              </div>
            )}
          </div>

          {/* Primary Action Bar */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                onVisitQzone(contact);
                onClose();
              }}
              className="py-2.5 px-3 rounded-xl border border-[#2563EB]/40 bg-[#2563EB]/10 text-[#2563EB] text-xs font-semibold hover:bg-[#2563EB]/15 flex items-center justify-center gap-1.5"
            >
              <Compass className="w-4 h-4" />
              进入 TA 的空间
            </button>
            <button
              onClick={() => {
                onStartChat(contact);
                onClose();
              }}
              className="py-2.5 px-3 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              发消息
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => {
                onStartCall(contact, 'audio');
                onClose();
              }}
              className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
            >
              <Phone className="w-3.5 h-3.5" />
              语音通话
            </button>
            <button
              onClick={() => {
                onStartCall(contact, 'video');
                onClose();
              }}
              className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
            >
              <Video className="w-3.5 h-3.5" />
              视频通话
            </button>
            {onNudge && (
              <button
                onClick={() => {
                  onNudge(contact);
                  onClose();
                }}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
                title="拍一拍对方"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                拍一拍
              </button>
            )}
            {!isExistingFriend && (
              <button
                onClick={() => onAddFriend(contact)}
                className="py-2 px-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 flex items-center justify-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                加好友
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
