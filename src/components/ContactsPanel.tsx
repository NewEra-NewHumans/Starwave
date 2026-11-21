import React, { useState } from 'react';
import {
  Ban,
  BellRing,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  Flame,
  FolderPlus,
  MessageSquare,
  Phone,
  QrCode,
  Radar,
  Search,
  Shield,
  Star,
  UserCheck,
  UserMinus,
  UserPlus,
  Video,
  X,
} from 'lucide-react';
import { Contact, FriendGroupName, SecuritySettings } from '../types/qq';
import { AvatarView, QrCodeSvg } from './AvatarView';
import { QqLevelIcons } from './ProfileCenterPanel';
import { ME_PROFILE } from '../data/seedData';
import { getContactLevelInfo } from '../utils/qqLevel';
import { CloudFriendRequest } from '../utils/cloudChatService';

interface ContactsPanelProps {
  contacts: Contact[];
  myAccountId?: string;
  myDisplayName?: string;
  currentUid?: string;
  friendRequests?: CloudFriendRequest[];
  onOpenAuthModal?: () => void;
  onSendFriendRequest?: (contact: Contact, note: string) => Promise<void>;
  onAcceptFriendRequest?: (req: CloudFriendRequest) => Promise<void>;
  onRejectFriendRequest?: (requestId: string) => Promise<void>;
  onCancelFriendRequest?: (requestId: string) => Promise<void>;
  onLookupAccountById?: (accountId: string) => Promise<Contact | null>;
  onUpdateContact: (id: string, patch: Partial<Contact>) => void;
  onDeleteContact: (id: string) => void;
  onAddContact: (newContact: Contact) => void;
  onStartChat: (contact: Contact) => void;
  onStartCall: (contact: Contact, mode: 'audio' | 'video') => void;
  onViewProfile?: (contact: Contact) => void;
  onVisitQzone?: (contact: Contact) => void;
  onOpenLevelCenter?: () => void;
  security: SecuritySettings;
  onUpdateSecurity: (patch: Partial<SecuritySettings>) => void;
  minimalMode: boolean;
}

const DEFAULT_GROUPS: FriendGroupName[] = ['特别关心', '我的好友', '同事伙伴', '校园同学'];

export const ContactsPanel: React.FC<ContactsPanelProps> = ({
  contacts,
  myAccountId,
  myDisplayName,
  currentUid,
  friendRequests = [],
  onOpenAuthModal,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onCancelFriendRequest,
  onLookupAccountById,
  onUpdateContact,
  onDeleteContact,
  onAddContact,
  onStartChat,
  onStartCall,
  onViewProfile,
  onVisitQzone,
  onOpenLevelCenter,
  security,
  onUpdateSecurity,
  minimalMode,
}) => {
  const [subTab, setSubTab] = useState<'friends' | 'requests' | 'add' | 'oneway' | 'blacklist' | 'stranger'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string>(contacts[0]?.id || '');
  const [editingRemark, setEditingRemark] = useState(false);
  const [remarkDraft, setRemarkDraft] = useState('');

  // Add friend workflows
  const [qqLookupInput, setQqLookupInput] = useState('');
  const [lookupResult, setLookupResult] = useState<Contact | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupNotice, setLookupNotice] = useState('');
  const [friendRequestNote, setFriendRequestNote] = useState('');
  const [requestBusyId, setRequestBusyId] = useState<string | null>(null);
  const [radarDigits, setRadarDigits] = useState('4829');
  const [radarMatches, setRadarMatches] = useState<Contact[]>([]);
  const [scanSimulated, setScanSimulated] = useState(false);
  const [customGroupNames, setCustomGroupNames] = useState<string[]>(DEFAULT_GROUPS);
  const [newGroupName, setNewGroupName] = useState('');

  const selfAccountId = myAccountId || ME_PROFILE.qqNumber;

  const incomingRequests = currentUid
    ? friendRequests.filter((r) => r.toUid === currentUid)
    : [];
  const outgoingRequests = currentUid
    ? friendRequests.filter((r) => r.fromUid === currentUid)
    : [];
  const pendingIncomingCount = incomingRequests.filter((r) => r.status === 'pending').length;

  const activeContacts = contacts.filter((c) => !c.blocked);
  const oneWayContacts = contacts.filter((c) => c.isOneWay && !c.blocked);
  const blockedContacts = contacts.filter((c) => c.blocked);

  const selectedContact = contacts.find((c) => c.id === selectedId) || activeContacts[0];

  const handleLookupQq = async () => {
    const raw = qqLookupInput.trim();
    const cleanDigits = raw.replace(/\s+/g, '');
    if (!cleanDigits) return;
    setLookupNotice('');
    setLookupResult(null);

    if (cleanDigits === selfAccountId) {
      setLookupNotice('这是您自己的专属星涟号，无需重复添加自己为好友。');
      return;
    }

    const existing = contacts.find(
      (c) =>
        c.qqNumber === cleanDigits ||
        c.name.includes(raw) ||
        (c.remark || '').includes(raw)
    );
    if (existing) {
      setLookupResult(existing);
      return;
    }

    if (/^[1-9][0-9]{8}$/.test(cleanDigits)) {
      if (onLookupAccountById) {
        setLookupLoading(true);
        try {
          const cloudContact = await onLookupAccountById(cleanDigits);
          if (cloudContact) {
            setLookupResult(cloudContact);
          } else {
            setLookupNotice(
              `未在星涟云端索引找到星涟号 ${cleanDigits}。请核对 9 位数字，或请对方先使用 Google / Microsoft 邮箱登录激活账号。`
            );
          }
        } catch {
          setLookupNotice('云端星涟号查询失败，请稍后重试。');
        } finally {
          setLookupLoading(false);
        }
        return;
      }
      setLookupNotice(`未找到星涟号 ${cleanDigits} 对应的用户。`);
      return;
    }

    if (/^\d+$/.test(cleanDigits)) {
      setLookupNotice('星涟号为 9 位数字（例如 310482910），请输入完整 9 位数字进行查找。');
      return;
    }

    setLookupNotice('未在本地好友中找到该昵称，请输入对方的 9 位星涟号精确查找。');
  };

  const handleRadarMatch = () => {
    if (radarDigits.length < 4) return;
    setRadarMatches([
      {
        id: `c-face-${Date.now()}`,
        qqNumber: `88${radarDigits}02`,
        name: '面对面新伙伴 · 许知行',
        signature: `口令 ${radarDigits} 现场添加`,
        online: true,
        platform: 'Android',
        groupName: '我的好友',
        starred: false,
        sparkDays: 1,
      },
    ]);
  };

  const handleAddGroup = () => {
    const trimmed = newGroupName.trim();
    if (!trimmed || customGroupNames.includes(trimmed)) return;
    setCustomGroupNames((prev) => [...prev, trimmed]);
    setNewGroupName('');
  };

  return (
    <div className="flex h-full w-full overflow-hidden sr-aurora-canvas">
      {/* Left Directory Column */}
      <div className="w-80 shrink-0 border-r border-slate-200/80 dark:border-slate-800/90 flex flex-col bg-slate-50/90 dark:bg-[#121621]/95 backdrop-blur-md">
        <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              通讯录与好友管理
            </h2>
            <button
              onClick={() => setSubTab('add')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0D9488] text-white shadow-sm hover:opacity-95 whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" />
              加好友
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索好友昵称、备注或星涟号"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-5 gap-1 p-1 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-[11px]">
            {[
              { id: 'friends', label: '好友' },
              {
                id: 'requests',
                label: pendingIncomingCount > 0 ? `申请(${pendingIncomingCount})` : '申请',
                highlight: pendingIncomingCount > 0,
              },
              { id: 'oneway', label: `单向(${oneWayContacts.length})` },
              { id: 'blacklist', label: `黑名单(${blockedContacts.length})` },
              { id: 'stranger', label: '权限' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id as typeof subTab)}
                className={`py-1 rounded-md font-medium truncate transition-colors ${
                  subTab === t.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : t.highlight
                    ? 'text-rose-600 dark:text-rose-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {/* Starred Friends Section */}
          {activeContacts.some((c) => c.starred) && (
            <div>
              <div className="px-2 py-1 text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                星标好友 ({activeContacts.filter((c) => c.starred).length})
              </div>
              {activeContacts
                .filter(
                  (c) =>
                    c.starred &&
                    (!searchQuery ||
                      c.name.includes(searchQuery) ||
                      (c.remark || '').includes(searchQuery) ||
                      c.qqNumber.includes(searchQuery))
                )
                .map((c) => (
                  <button
                    key={`star-${c.id}`}
                    onClick={() => {
                      setSelectedId(c.id);
                      setSubTab('friends');
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                      selectedContact?.id === c.id && subTab === 'friends'
                        ? 'bg-[#2563EB]/10 text-[#2563EB]'
                        : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <AvatarView
                      name={c.name}
                      src={c.avatar}
                      size="sm"
                      online={c.online}
                      minimalMode={minimalMode}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {c.remark || c.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {c.online ? `${c.platform} 在线` : '离线'} · {c.signature}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}

          {/* Collapsible Friend Groups */}
          {customGroupNames.map((gName) => {
            const members = activeContacts.filter(
              (c) =>
                c.groupName === gName &&
                (!searchQuery ||
                  c.name.includes(searchQuery) ||
                  (c.remark || '').includes(searchQuery) ||
                  c.qqNumber.includes(searchQuery))
            );
            const isCollapsed = !!collapsedGroups[gName];
            return (
              <div key={gName}>
                <button
                  onClick={() =>
                    setCollapsedGroups((prev) => ({ ...prev, [gName]: !prev[gName] }))
                  }
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  <span className="flex items-center gap-1">
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                    {gName}
                  </span>
                  <span className="font-mono-tabular text-[11px] text-slate-400">
                    {members.filter((m) => m.online).length}/{members.length}
                  </span>
                </button>
                {!isCollapsed &&
                  members.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedId(c.id);
                        setSubTab('friends');
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                        selectedContact?.id === c.id && subTab === 'friends'
                          ? 'bg-[#2563EB]/10'
                          : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <AvatarView
                        name={c.name}
                        src={c.avatar}
                        size="sm"
                        online={c.online}
                        isBot={c.isBot}
                        minimalMode={minimalMode}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {c.remark || c.name}
                          </span>
                          {!minimalMode && c.sparkDays > 0 && (
                            <span className="text-[11px] text-amber-600 font-mono-tabular shrink-0 flex items-center gap-0.5">
                              <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                              {c.sparkDays}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{c.signature}</div>
                      </div>
                    </button>
                  ))}
              </div>
            );
          })}

          {/* Create New Friend Group */}
          <div className="pt-2 px-2 flex items-center gap-1.5">
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="新建好友分组名称"
              className="flex-1 px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
            <button
              onClick={handleAddGroup}
              className="p-1.5 rounded-md bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200"
              title="新增分组"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Workspace Content */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        {subTab === 'add' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                添加好友
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                支持通过 9 位专属星涟号云端精确查找、扫一扫二维码名片、或面对面输入 4 位数字口令添加好友。
              </p>
            </div>

            {/* 1. StarRipple Account ID Lookup */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  方式一：通过专属星涟号 / 昵称查找
                </div>
                <span className="text-[11px] font-mono-tabular text-slate-500">
                  我的星涟号：{selfAccountId}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  value={qqLookupInput}
                  onChange={(e) => setQqLookupInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLookupQq();
                  }}
                  placeholder="输入对方 9 位星涟号（如 310482910）或已注册好友的星涟号"
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
                />
                <button
                  onClick={handleLookupQq}
                  disabled={lookupLoading}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] whitespace-nowrap disabled:opacity-50"
                >
                  {lookupLoading ? '查找中...' : '查找账号'}
                </button>
              </div>
              {lookupNotice && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                  {lookupNotice}
                </div>
              )}
              {lookupResult && (() => {
                const isCloudUser = lookupResult.id.startsWith('uid-');
                const peerUid = isCloudUser ? lookupResult.id.replace(/^uid-/, '') : '';
                const alreadyFriend = contacts.some(
                  (c) => c.qqNumber === lookupResult.qqNumber && !c.blocked
                );
                const incomingPending = isCloudUser
                  ? incomingRequests.find((r) => r.fromUid === peerUid && r.status === 'pending')
                  : undefined;
                const outgoingPending = isCloudUser
                  ? outgoingRequests.find((r) => r.toUid === peerUid && r.status === 'pending')
                  : undefined;

                return (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <AvatarView name={lookupResult.name} src={lookupResult.avatar} size="md" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {lookupResult.name}
                          </div>
                          <div className="text-xs text-slate-500 font-mono-tabular truncate">
                            星涟号 {lookupResult.qqNumber} · {lookupResult.signature}
                          </div>
                        </div>
                      </div>
                      {alreadyFriend ? (
                        <button
                          onClick={() => {
                            const existing = contacts.find(
                              (c) => c.qqNumber === lookupResult.qqNumber
                            );
                            if (existing) onStartChat(existing);
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] shrink-0"
                        >
                          已是好友 · 发消息
                        </button>
                      ) : isCloudUser && !currentUid ? (
                        <button
                          onClick={() => onOpenAuthModal?.()}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] shrink-0"
                        >
                          登录后发送好友申请
                        </button>
                      ) : isCloudUser && incomingPending ? (
                        <button
                          disabled={requestBusyId === incomingPending.requestId}
                          onClick={async () => {
                            if (!onAcceptFriendRequest) return;
                            setRequestBusyId(incomingPending.requestId);
                            try {
                              await onAcceptFriendRequest(incomingPending);
                              setLookupResult(null);
                              setQqLookupInput('');
                              setSubTab('friends');
                            } finally {
                              setRequestBusyId(null);
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 shrink-0"
                        >
                          对方已申请 · 立即同意
                        </button>
                      ) : isCloudUser && outgoingPending ? (
                        <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                          已发送申请 · 等待验证
                        </span>
                      ) : isCloudUser && onSendFriendRequest ? (
                        <button
                          disabled={requestBusyId === lookupResult.id}
                          onClick={async () => {
                            setRequestBusyId(lookupResult.id);
                            try {
                              const noteText =
                                friendRequestNote.trim() ||
                                `你好，我是 ${myDisplayName || '星涟好友'}，想加你为好友`;
                              await onSendFriendRequest(lookupResult, noteText);
                              setFriendRequestNote('');
                              setLookupResult(null);
                              setQqLookupInput('');
                              setSubTab('requests');
                            } finally {
                              setRequestBusyId(null);
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 shrink-0"
                        >
                          {requestBusyId === lookupResult.id ? '发送中...' : '发送好友申请'}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onAddContact(lookupResult);
                            setLookupResult(null);
                            setQqLookupInput('');
                            setSubTab('friends');
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shrink-0"
                        >
                          加为好友
                        </button>
                      )}
                    </div>
                    {isCloudUser && currentUid && !alreadyFriend && !incomingPending && !outgoingPending && (
                      <input
                        value={friendRequestNote}
                        onChange={(e) => setFriendRequestNote(e.target.value.slice(0, 120))}
                        placeholder={`填写验证消息（例如：你好，我是 ${myDisplayName || '你的朋友'}）`}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
                      />
                    )}
                  </div>
                );
              })()}
            </div>

            {/* 2. QR Code Add */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <QrCode className="w-4 h-4 text-[#2563EB]" />
                  方式二：扫码添加好友 & 我的二维码名片
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  让对方使用星涟客户端扫一扫右侧二维码即可秒加好友；也可点击下方按钮识别本地二维码图片。
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={() => setScanSimulated(true)}
                    className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    模拟扫码识别好友
                  </button>
                  {scanSimulated && (
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      已扫描识别星涟号 209948120，请求已发送
                    </span>
                  )}
                </div>
              </div>
              <QrCodeSvg value={`starripple://addfriend/${selfAccountId}`} label={`星涟号 ${selfAccountId}`} />
            </div>

            {/* 3. Face-to-Face Radar */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Radar className="w-4 h-4 text-[#2563EB]" />
                方式三：面对面加好友 / 面对面建群
              </div>
              <p className="text-xs text-slate-500">
                和身边的朋友输入相同的 4 位数字口令，即可快速建立好友关系。
              </p>
              <div className="flex items-center gap-3">
                <input
                  maxLength={4}
                  value={radarDigits}
                  onChange={(e) => setRadarDigits(e.target.value.replace(/\D/g, ''))}
                  className="w-32 text-center tracking-[0.4em] font-mono-tabular text-lg font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-2 text-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={handleRadarMatch}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                >
                  匹配身边的人
                </button>
              </div>
              {radarMatches.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <AvatarView name={m.name} size="sm" online />
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {m.name}
                      </div>
                      <div className="text-xs text-slate-500">{m.signature}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onAddContact(m);
                      setRadarMatches([]);
                      setSubTab('friends');
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white"
                  >
                    确认添加
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {subTab === 'requests' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-[#2563EB]" />
                  云端好友申请与验证
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  同意好友申请后，双方通讯录将自动互加，并建立加密云端私聊会话。
                </p>
              </div>
              <button
                onClick={() => setSubTab('add')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] whitespace-nowrap"
              >
                去搜星涟号
              </button>
            </div>

            {!currentUid ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3 bg-white/70 dark:bg-slate-900/50">
                <UserCheck className="w-9 h-9 text-[#2563EB] mx-auto" />
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  登录后可收发实时云端好友申请
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  使用 Google 或 Microsoft 邮箱登录并完成验证后，其他用户即可通过您的 9 位星涟号向您发送好友申请。
                </p>
                <button
                  onClick={() => onOpenAuthModal?.()}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                >
                  立即登录 / 激活云端账号
                </button>
              </div>
            ) : (
              <>
                {/* Incoming Friend Requests */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      收到的好友申请 ({incomingRequests.length})
                    </span>
                    {pendingIncomingCount > 0 && (
                      <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                        {pendingIncomingCount} 条待处理
                      </span>
                    )}
                  </div>
                  {incomingRequests.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      暂无收到的好友申请
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {incomingRequests.map((req) => {
                        const busy = requestBusyId === req.requestId;
                        return (
                          <div
                            key={req.requestId}
                            className="p-4 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <AvatarView name={req.fromName} src={req.fromAvatar} size="md" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {req.fromName}
                                  </span>
                                  <span className="text-[11px] font-mono-tabular text-slate-400">
                                    星涟号 {req.fromAccountId}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5">
                                  验证信息：{req.note || '请求添加你为好友'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {req.status === 'pending' ? (
                                <>
                                  <button
                                    disabled={busy}
                                    onClick={async () => {
                                      if (!onAcceptFriendRequest) return;
                                      setRequestBusyId(req.requestId);
                                      try {
                                        await onAcceptFriendRequest(req);
                                      } finally {
                                        setRequestBusyId(null);
                                      }
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
                                  >
                                    {busy ? '处理中...' : '同意'}
                                  </button>
                                  <button
                                    disabled={busy}
                                    onClick={async () => {
                                      if (!onRejectFriendRequest) return;
                                      setRequestBusyId(req.requestId);
                                      try {
                                        await onRejectFriendRequest(req.requestId);
                                      } finally {
                                        setRequestBusyId(null);
                                      }
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                                  >
                                    拒绝
                                  </button>
                                </>
                              ) : req.status === 'accepted' ? (
                                <button
                                  onClick={() => {
                                    const friend = contacts.find((c) => c.id === `uid-${req.fromUid}`);
                                    if (friend) onStartChat(friend);
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20"
                                >
                                  已同意 · 发消息
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">已拒绝</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Outgoing Friend Requests */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    我发出的申请 ({outgoingRequests.length})
                  </div>
                  {outgoingRequests.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      暂无发出的好友申请
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {outgoingRequests.map((req) => {
                        const busy = requestBusyId === req.requestId;
                        return (
                          <div
                            key={req.requestId}
                            className="p-4 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <AvatarView name={req.toName} src={req.toAvatar} size="md" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {req.toName}
                                  </span>
                                  <span className="text-[11px] font-mono-tabular text-slate-400">
                                    星涟号 {req.toAccountId}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 truncate mt-0.5">
                                  验证留言：{req.note || '无'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {req.status === 'pending' ? (
                                <>
                                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    等待验证
                                  </span>
                                  <button
                                    disabled={busy}
                                    onClick={async () => {
                                      if (!onCancelFriendRequest) return;
                                      setRequestBusyId(req.requestId);
                                      try {
                                        await onCancelFriendRequest(req.requestId);
                                      } finally {
                                        setRequestBusyId(null);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600"
                                    title="撤回申请"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : req.status === 'accepted' ? (
                                <button
                                  onClick={() => {
                                    const friend = contacts.find((c) => c.id === `uid-${req.toUid}`);
                                    if (friend) onStartChat(friend);
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                                >
                                  已通过 · 发消息
                                </button>
                              ) : (
                                <button
                                  disabled={busy}
                                  onClick={async () => {
                                    if (!onSendFriendRequest) return;
                                    setRequestBusyId(req.requestId);
                                    try {
                                      await onSendFriendRequest(
                                        {
                                          id: `uid-${req.toUid}`,
                                          qqNumber: req.toAccountId,
                                          name: req.toName,
                                          avatar: req.toAvatar,
                                          signature: '',
                                          online: true,
                                          platform: 'Web',
                                          groupName: '我的好友',
                                          starred: false,
                                          sparkDays: 1,
                                        },
                                        req.note || '你好，请重新通过一下好友验证'
                                      );
                                    } finally {
                                      setRequestBusyId(null);
                                    }
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                  对方已拒绝 · 重发
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {subTab === 'oneway' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                单向好友检测与清理
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                以下联系人列表中存在单向关系（对方未将您保留在通讯录中），您可以选择一键清理或重新发送验证。
              </p>
            </div>
            {oneWayContacts.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
                当前所有好友均为双向好友，无单向好友异常。
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {oneWayContacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <AvatarView name={c.name} size="md" />
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {c.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono-tabular">
                          星涟号 {c.qqNumber} · 状态：对方通讯录未包含您
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateContact(c.id, { isOneWay: false })}
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        重新申请双向验证
                      </button>
                      <button
                        onClick={() => onDeleteContact(c.id)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-rose-600 text-white hover:bg-rose-500"
                      >
                        删除单向好友
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {subTab === 'blacklist' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                黑名单管理
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                加入黑名单后，将自动屏蔽对方发送的所有消息、语音来电及空间动态。
              </p>
            </div>
            {blockedContacts.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500">
                黑名单为空
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {blockedContacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <AvatarView name={c.name} size="md" />
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {c.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono-tabular">
                          星涟号 {c.qqNumber} · 已屏蔽消息与来电
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpdateContact(c.id, { blocked: false })}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      移出黑名单
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {subTab === 'stranger' && (
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#2563EB]" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                陌生人权限设置
              </h3>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    加我为好友时的验证方式
                  </div>
                  <div className="text-xs text-slate-500">控制陌生人通过星涟号或群聊搜索添加您的门槛</div>
                </div>
                <select
                  value={security.strangerVerifyMode}
                  onChange={(e) =>
                    onUpdateSecurity({
                      strangerVerifyMode: e.target.value as SecuritySettings['strangerVerifyMode'],
                    })
                  }
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="verify">需要身份验证信息</option>
                  <option value="question">需要正确回答问题</option>
                  <option value="deny_all">不允许任何人添加</option>
                </select>
              </div>
              <label className="p-4 flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    允许群内陌生人发起临时会话
                  </div>
                  <div className="text-xs text-slate-500">关闭后非好友群成员无法直接给您私信</div>
                </div>
                <input
                  type="checkbox"
                  checked={security.allowGroupTempChat}
                  onChange={(e) => onUpdateSecurity({ allowGroupTempChat: e.target.checked })}
                  className="w-4 h-4 accent-[#2563EB]"
                />
              </label>
              <label className="p-4 flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    允许陌生人查看我的星涟空间最近 10 条动态
                  </div>
                  <div className="text-xs text-slate-500">关闭后仅双向好友可访问空间动态与相册</div>
                </div>
                <input
                  type="checkbox"
                  checked={security.allowStrangerQzone}
                  onChange={(e) => onUpdateSecurity({ allowStrangerQzone: e.target.checked })}
                  className="w-4 h-4 accent-[#2563EB]"
                />
              </label>
            </div>
          </div>
        )}

        {subTab === 'friends' && selectedContact && (
          <div className="max-w-xl mx-auto space-y-6 pt-2">
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onViewProfile?.(selectedContact)}
                  className="hover:opacity-85 transition-opacity shrink-0"
                  title={`点击查看 ${selectedContact.name} 的个人名片与空间`}
                >
                  <AvatarView
                    name={selectedContact.name}
                    src={selectedContact.avatar}
                    size="xl"
                    online={selectedContact.online}
                    isBot={selectedContact.isBot}
                    minimalMode={minimalMode}
                  />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {selectedContact.remark || selectedContact.name}
                    </h3>
                    {!minimalMode && selectedContact.sparkDays > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 font-mono-tabular">
                        <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        互动火花 {selectedContact.sparkDays} 天
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono-tabular mt-1">
                    昵称：{selectedContact.name} · 星涟号 {selectedContact.qqNumber} ·{' '}
                    {selectedContact.online ? `${selectedContact.platform} 在线` : '当前离线'}
                  </div>
                  {(() => {
                    const lv = getContactLevelInfo(selectedContact);
                    return (
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <QqLevelIcons
                          level={lv.level}
                          onClick={onOpenLevelCenter}
                        />
                        <span className="text-xs font-semibold font-mono-tabular text-amber-600">
                          LV.{lv.level}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {lv.title}（{lv.iconsText} · 活跃 {lv.activeDays} 天）
                        </span>
                      </div>
                    );
                  })()}
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                    {selectedContact.signature}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  onUpdateContact(selectedContact.id, { starred: !selectedContact.starred })
                }
                className={`p-2 rounded-lg border ${
                  selectedContact.starred
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-500'
                    : 'border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
                title="设为星标好友"
              >
                <Star className={`w-4 h-4 ${selectedContact.starred ? 'fill-amber-500' : ''}`} />
              </button>
            </div>

            {/* Remark & Group Assignment */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="p-4 flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">好友备注</span>
                {editingRemark ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={remarkDraft}
                      onChange={(e) => setRemarkDraft(e.target.value)}
                      className="px-2.5 py-1 text-sm rounded border border-[#2563EB] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                    <button
                      onClick={() => {
                        onUpdateContact(selectedContact.id, { remark: remarkDraft.trim() || undefined });
                        setEditingRemark(false);
                      }}
                      className="px-2.5 py-1 text-xs rounded bg-[#2563EB] text-white"
                    >
                      保存
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setRemarkDraft(selectedContact.remark || '');
                      setEditingRemark(true);
                    }}
                    className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-[#2563EB]"
                  >
                    {selectedContact.remark || '点击设置备注'}
                  </button>
                )}
              </div>

              <div className="p-4 flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">所在分组</span>
                <select
                  value={selectedContact.groupName}
                  onChange={(e) =>
                    onUpdateContact(selectedContact.id, {
                      groupName: e.target.value as FriendGroupName,
                    })
                  }
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  {customGroupNames.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onStartChat(selectedContact)}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8]"
              >
                <MessageSquare className="w-4 h-4" />
                发消息
              </button>
              <button
                onClick={() => onVisitQzone?.(selectedContact)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-[#2563EB]/40 bg-[#2563EB]/10 text-[#2563EB] text-sm font-medium hover:bg-[#2563EB]/15"
              >
                <Compass className="w-4 h-4" />
                TA 的空间
              </button>
              <button
                onClick={() => onStartCall(selectedContact, 'audio')}
                className="flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Phone className="w-4 h-4" />
                语音
              </button>
              <button
                onClick={() => onStartCall(selectedContact, 'video')}
                className="flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Video className="w-4 h-4" />
                视频
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                onClick={() => onUpdateContact(selectedContact.id, { blocked: true })}
                className="flex items-center gap-1 text-slate-500 hover:text-rose-600"
              >
                <Ban className="w-3.5 h-3.5" />
                加入黑名单
              </button>
              <button
                onClick={() => onDeleteContact(selectedContact.id)}
                className="flex items-center gap-1 text-rose-500 hover:text-rose-600"
              >
                <UserMinus className="w-3.5 h-3.5" />
                删除好友
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
