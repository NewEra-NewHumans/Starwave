import React, { useState } from 'react';
import {
  Archive,
  ArrowRightLeft,
  Check,
  FolderKanban,
  FolderPlus,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  ArchivedMessageItem,
  ChatFolder,
  ChatMessage,
  Conversation,
} from '../types/qq';
import { AvatarView } from './AvatarView';

const FOLDER_COLORS = [
  '#2563EB',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#EF4444',
];

interface ChatFoldersModalProps {
  open: boolean;
  onClose: () => void;
  folders: ChatFolder[];
  conversations: Conversation[];
  preselectConvId?: string | null;
  preselectArchiveMessage?: {
    msg: ChatMessage;
    conversationId: string;
    conversationTitle: string;
  } | null;
  onCreateFolder: (
    name: string,
    color: string,
    conversationIds: string[],
    initialArchive?: ArchivedMessageItem
  ) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleConversationInFolder: (folderId: string, convId: string) => void;
  onRemoveArchivedMessage?: (folderId: string, messageId: string) => void;
  onMoveArchivedMessage?: (targetFolderId: string, item: ArchivedMessageItem) => void;
  onLocateArchivedMessage?: (conversationId: string, messageId: string) => void;
}

export const ChatFoldersModal: React.FC<ChatFoldersModalProps> = ({
  open,
  onClose,
  folders,
  conversations,
  preselectConvId,
  preselectArchiveMessage,
  onCreateFolder,
  onDeleteFolder,
  onToggleConversationInFolder,
  onRemoveArchivedMessage,
  onMoveArchivedMessage,
  onLocateArchivedMessage,
}) => {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(FOLDER_COLORS[0]);
  const [selectedConvIds, setSelectedConvIds] = useState<string[]>([]);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(
    folders[0]?.id || null
  );
  const [rightTab, setRightTab] = useState<'conversations' | 'archived'>('conversations');

  React.useEffect(() => {
    if (open && preselectConvId) {
      setSelectedConvIds((prev) =>
        prev.includes(preselectConvId) ? prev : [...prev, preselectConvId]
      );
    }
  }, [open, preselectConvId]);

  if (!open) return null;

  const activeFolder = folders.find((f) => f.id === editingFolderId) || folders[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    const initialArchive: ArchivedMessageItem | undefined = preselectArchiveMessage
      ? {
          id: `arch-${preselectArchiveMessage.msg.id}`,
          messageId: preselectArchiveMessage.msg.id,
          conversationId: preselectArchiveMessage.conversationId,
          conversationTitle: preselectArchiveMessage.conversationTitle,
          senderName: preselectArchiveMessage.msg.senderName,
          senderAvatar: preselectArchiveMessage.msg.senderAvatar,
          content:
            preselectArchiveMessage.msg.content ||
            `[${preselectArchiveMessage.msg.type}]`,
          type: preselectArchiveMessage.msg.type,
          timestamp: preselectArchiveMessage.msg.timestamp,
          archivedAt: new Date().toTimeString().slice(0, 5),
        }
      : undefined;
    onCreateFolder(trimmed, newColor, selectedConvIds, initialArchive);
    setNewName('');
    setSelectedConvIds([]);
    if (preselectArchiveMessage) {
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-[#2563EB]" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                自定义分类标签管理
              </h3>
              <p className="text-[11px] text-slate-500">
                创建自定义分类标签后，可直接按住右键或左键将会话拖拽至上方标签中快速归类
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Create New Folder Form */}
          <form
            onSubmit={handleCreate}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-3"
          >
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-[#2563EB]" />
              新建消息分组
            </div>
            {preselectArchiveMessage && (
              <div className="rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/25 px-3 py-2 text-[11px] text-[#1D4ED8] dark:text-indigo-300 flex items-center gap-2">
                <Archive className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  创建此分组后将立即归档：{preselectArchiveMessage.msg.senderName}「
                  {preselectArchiveMessage.msg.content.slice(0, 28)}」
                </span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="输入分组名称，如：核心项目 / 客户沟通 / 家校群"
                className="flex-1 min-w-[180px] px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
              />
              <div className="flex items-center gap-1.5">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      newColor === color
                        ? 'scale-110 ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900'
                        : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={!newName.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] disabled:opacity-40 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                创建分组
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {conversations.map((conv) => {
                const picked = selectedConvIds.includes(conv.id);
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() =>
                      setSelectedConvIds((prev) =>
                        picked ? prev.filter((id) => id !== conv.id) : [...prev, conv.id]
                      )
                    }
                    className={`px-2 py-1 rounded-md text-[11px] border flex items-center gap-1 transition-colors ${
                      picked
                        ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB] font-medium'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {picked && <Check className="w-3 h-3" />}
                    <span className="truncate max-w-[140px]">{conv.title}</span>
                  </button>
                );
              })}
            </div>
          </form>

          {/* Existing Folders & Member Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5 space-y-2">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                已有自定义分组（{folders.length}）
              </div>
              <div className="space-y-1.5">
                {folders.map((folder) => {
                  const selected = activeFolder?.id === folder.id;
                  return (
                    <div
                      key={folder.id}
                      onClick={() => setEditingFolderId(folder.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        selected
                          ? 'border-[#2563EB] bg-[#2563EB]/10'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: folder.color }}
                        />
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {folder.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono-tabular">
                          ({folder.conversationIds.length}会话 · {(folder.archivedMessages || []).length}归档)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFolder(folder.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded"
                        title="删除此分组"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
                {folders.length === 0 && (
                  <div className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    暂无自定义分组，可在上方新建
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-7 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                  {activeFolder ? `「${activeFolder.name}」详情管理` : '请先选择左侧分组'}
                </div>
                {activeFolder && (
                  <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setRightTab('conversations')}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        rightTab === 'conversations'
                          ? 'bg-white dark:bg-slate-900 text-[#2563EB] font-semibold shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      会话 ({activeFolder.conversationIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRightTab('archived')}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        rightTab === 'archived'
                          ? 'bg-white dark:bg-slate-900 text-[#2563EB] font-semibold shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      归档消息 ({(activeFolder.archivedMessages || []).length})
                    </button>
                  </div>
                )}
              </div>

              {activeFolder && rightTab === 'conversations' && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                  {conversations.map((conv) => {
                    const included = activeFolder.conversationIds.includes(conv.id);
                    return (
                      <label
                        key={conv.id}
                        className="px-3 py-2 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <AvatarView name={conv.title} src={conv.avatar} size="xs" />
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                            {conv.title}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={included}
                          onChange={() =>
                            onToggleConversationInFolder(activeFolder.id, conv.id)
                          }
                          className="w-4 h-4 accent-[#2563EB]"
                        />
                      </label>
                    );
                  })}
                </div>
              )}

              {activeFolder && rightTab === 'archived' && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                  {(activeFolder.archivedMessages || []).length === 0 ? (
                    <div className="py-8 px-4 text-center text-xs text-slate-400">
                      暂无归档消息。在聊天界面长按非系统消息即可拖拽归档至此分组。
                    </div>
                  ) : (
                    (activeFolder.archivedMessages || []).map((item) => (
                      <div key={item.id} className="p-2.5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {item.senderName} · {item.conversationTitle}
                          </span>
                          <span className="font-mono-tabular shrink-0">{item.timestamp}</span>
                        </div>
                        <div className="text-slate-700 dark:text-slate-300 line-clamp-2 break-words bg-slate-50 dark:bg-slate-900/60 rounded-lg px-2.5 py-1.5">
                          {item.content}
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <div className="flex items-center gap-1.5">
                            {onLocateArchivedMessage && (
                              <button
                                type="button"
                                onClick={() => {
                                  onLocateArchivedMessage(item.conversationId, item.messageId);
                                  onClose();
                                }}
                                className="px-2 py-0.5 rounded bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 inline-flex items-center gap-1 text-[11px]"
                              >
                                <MapPin className="w-3 h-3" />
                                定位原消息
                              </button>
                            )}
                            {onMoveArchivedMessage && folders.length > 1 && (
                              <div className="inline-flex items-center gap-1">
                                <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      onMoveArchivedMessage(e.target.value, item);
                                    }
                                  }}
                                  className="text-[11px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                                >
                                  <option value="">移至其他分组...</option>
                                  {folders
                                    .filter((f) => f.id !== activeFolder.id)
                                    .map((f) => (
                                      <option key={f.id} value={f.id}>
                                        {f.name}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            )}
                          </div>
                          {onRemoveArchivedMessage && (
                            <button
                              type="button"
                              onClick={() =>
                                onRemoveArchivedMessage(activeFolder.id, item.messageId)
                              }
                              className="text-[11px] text-rose-500 hover:underline"
                            >
                              移出归档
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
