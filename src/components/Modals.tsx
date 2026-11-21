import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Check,
  Copy,
  Forward,
  Send,
  Users,
  X,
} from 'lucide-react';
import { ChatMessage, Contact, Conversation, GroupMember } from '../types/qq';
import { AvatarView } from './AvatarView';
import { GENERATED_ASSETS } from '../data/seedData';

/* 1. Create Group Modal (up to 2000 members, pick from Friends / Existing Groups / Bots) */
interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  contacts: Contact[];
  conversations: Conversation[];
  onCreateGroup: (title: string, maxMembers: number, members: GroupMember[]) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  open,
  onClose,
  contacts,
  conversations,
  onCreateGroup,
}) => {
  const [tab, setTab] = useState<'friends' | 'groups' | 'bots'>('friends');
  const [groupTitle, setGroupTitle] = useState('');
  const [maxMembers, setMaxMembers] = useState<number>(2000);
  const [selectedIds, setSelectedIds] = useState<string[]>(['c-lin', 'c-chen']);

  if (!open) return null;

  const friendsList = contacts.filter((c) => !c.blocked && !c.isBot);
  const botsList = contacts.filter((c) => c.isBot);
  const existingGroups = conversations.filter((c) => c.kind === 'group');

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const importGroupMembers = (conv: Conversation) => {
    const memberIds = (conv.members || [])
      .map((m) => m.id)
      .filter((id) => id !== 'me');
    setSelectedIds((prev) => Array.from(new Set([...prev, ...memberIds])));
  };

  const handleCreate = () => {
    const pickedMembers: GroupMember[] = [
      {
        id: 'me',
        name: '苏明远',
        avatar: GENERATED_ASSETS.me,
        role: 'owner',
        title: '群主',
        online: true,
        status: 'online',
        platform: 'Windows',
        moodText: '发起新群聊中',
      },
      ...selectedIds.map((id) => {
        const found = contacts.find((c) => c.id === id);
        return {
          id,
          name: found?.name || '群成员',
          avatar: found?.avatar,
          role: found?.isBot ? ('bot' as const) : ('member' as const),
          title: found?.isBot ? '智能助手' : undefined,
          online: found ? found.online : true,
          status: found?.online ? ('online' as const) : ('invisible' as const),
          platform: found?.platform || 'Web',
          moodText: found?.typingStatus || found?.signature,
        };
      }),
    ];
    onCreateGroup(
      groupTitle.trim() || `协作新群 (${pickedMembers.length}人)`,
      maxMembers,
      pickedMembers
    );
    setGroupTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2563EB]" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              发起群聊（最高支持 2000 人）
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">群名称</label>
              <input
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="例如：2026 设计与研发协同大群"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">群规模上限</label>
              <select
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
              >
                <option value={200}>200 人群</option>
                <option value={500}>500 人群</option>
                <option value={1000}>1000 人群</option>
                <option value={2000}>2000 人超级大群</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 w-fit">
            {[
              { key: 'friends', label: '从好友选人' },
              { key: 'groups', label: '从已有群聊导入' },
              { key: 'bots', label: '添加群机器人' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key as typeof tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  tab === item.key
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {tab === 'friends' &&
              friendsList.map((c) => {
                const checked = selectedIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleId(c.id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <AvatarView name={c.name} src={c.avatar} size="sm" online={c.online} />
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {c.remark || c.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono-tabular">
                          星涟号 {c.qqNumber} · {c.groupName}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        checked
                          ? 'bg-[#2563EB] border-[#2563EB] text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                );
              })}

            {tab === 'groups' &&
              existingGroups.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {g.title}
                    </div>
                    <div className="text-xs text-slate-500 font-mono-tabular">
                      当前 {g.memberCount || g.members?.length || 1} / {g.maxMembers || 2000} 人
                    </div>
                  </div>
                  <button
                    onClick={() => importGroupMembers(g)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 whitespace-nowrap"
                  >
                    一键导入群成员
                  </button>
                </div>
              ))}

            {tab === 'bots' &&
              botsList.map((b) => {
                const checked = selectedIds.includes(b.id);
                return (
                  <button
                    key={b.id}
                    onClick={() => toggleId(b.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {b.name}
                        </div>
                        <div className="text-xs text-slate-500">{b.signature}</div>
                      </div>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        checked
                          ? 'bg-[#2563EB] border-[#2563EB] text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                );
              })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 font-mono-tabular">
              已选 {selectedIds.length} 位成员 · 规模上限 {maxMembers} 人
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              >
                立即建群
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* 2. Partial Text Selection & Copy Modal (部分选中复制) */
export const PartialCopyModal: React.FC<{
  message: ChatMessage | null;
  onClose: () => void;
  onCopied: (text: string) => void;
}> = ({ message, onClose, onCopied }) => {
  const [selectedSlice, setSelectedSlice] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setSelectedSlice('');
  }, [message?.id]);

  if (!message) return null;

  const handleMouseUp = () => {
    const el = textAreaRef.current;
    if (!el) return;
    const sub = el.value.substring(el.selectionStart, el.selectionEnd);
    setSelectedSlice(sub);
  };

  const copyText = async (all: boolean) => {
    const target = all ? message.content : selectedSlice || message.content;
    try {
      await navigator.clipboard.writeText(target);
    } catch {
      // Fallback
    }
    onCopied(target);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            部分选中复制
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500">
          请在下方文本框中用鼠标拖选需要复制的局部文字，然后点击复制选中片段。
        </p>
        <textarea
          ref={textAreaRef}
          readOnly
          value={message.content}
          onMouseUp={handleMouseUp}
          onKeyUp={handleMouseUp}
          rows={4}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-900 dark:text-slate-100 select-text focus:outline-none focus:border-[#2563EB]"
        />
        {selectedSlice && (
          <div className="rounded-lg bg-[#2563EB]/5 border border-[#2563EB]/20 px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
            已选片段：「{selectedSlice}」
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => copyText(true)}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            复制整条
          </button>
          <button
            onClick={() => copyText(false)}
            disabled={!selectedSlice}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-40"
          >
            <Copy className="w-3.5 h-3.5" />
            复制选中片段
          </button>
        </div>
      </div>
    </div>
  );
};

/* 3. Forward Modal (多选转发 / 文件批量转发) */
export const ForwardModal: React.FC<{
  open: boolean;
  summaryLabel: string;
  conversations: Conversation[];
  onClose: () => void;
  onForwardTo: (targetConversationId: string) => void;
}> = ({ open, summaryLabel, conversations, onClose, onForwardTo }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Forward className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              转发到会话
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-500 border-b border-slate-200 dark:border-slate-800">
          即将转发：{summaryLabel}
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => {
                onForwardTo(conv.id);
                onClose();
              }}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
            >
              <div className="flex items-center gap-3">
                <AvatarView
                  name={conv.title}
                  src={conv.avatar}
                  size="sm"
                  isGroup={conv.kind === 'group'}
                />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {conv.title}
                </span>
              </div>
              <span className="text-xs text-[#2563EB] font-medium">发送</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
