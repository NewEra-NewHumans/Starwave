import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Briefcase,
  ChevronRight,
  Compass,
  FolderKanban,
  Hash,
  KeyRound,
  Laptop,
  MessageSquare,
  Monitor,
  Moon,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  Phone,
  ShieldCheck,
  Smartphone,
  Sun,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import {
  ActiveCallState,
  AppMode,
  AppSection,
  ArchivedMessageItem,
  ChatBackgroundSetting,
  ChatFolder,
  ChatMessage,
  Contact,
  Conversation,
  DressUpConfig,
  FavoriteItem,
  FlashTransferBatch,
  GuestbookEntry,
  LoggedDevice,
  MailMessage,
  NotificationSettings,
  OnlinePlatform,
  OnlineStatusType,
  QqChannel,
  QzonePhoto,
  QzonePost,
  ScheduleEvent,
  SecuritySettings,
  StoredFileItem,
  UiLayoutStyle,
  UserProfile,
  WalletTransaction,
  WindowDockSettings,
} from './types/qq';
import {
  INITIAL_CHANNELS,
  INITIAL_CHAT_BACKGROUND_DEFAULT,
  INITIAL_CHAT_FOLDERS,
  INITIAL_CONTACTS,
  INITIAL_CONVERSATIONS,
  INITIAL_DEVICES,
  INITIAL_DRESSUP,
  INITIAL_FAVORITES,
  INITIAL_FLASH_BATCHES,
  INITIAL_GUESTBOOK,
  INITIAL_MAILS,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
  INITIAL_QZONE_PHOTOS,
  INITIAL_QZONE_POSTS,
  INITIAL_SCHEDULES,
  INITIAL_SECURITY,
  INITIAL_STORED_FILES,
  ME_PROFILE,
} from './data/seedData';
import { AvatarView } from './components/AvatarView';
import { ChatWorkspace } from './components/ChatWorkspace';
import { ContactsPanel } from './components/ContactsPanel';
import { ChannelsPanel } from './components/ChannelsPanel';
import { ProfileCenterPanel, QqLevelIcons } from './components/ProfileCenterPanel';
import { CallOverlay } from './components/CallOverlay';
import { FilesAndFlashPanel } from './components/FilesAndFlashPanel';
import { OfficeToolsPanel } from './components/OfficeToolsPanel';
import { QzonePanel } from './components/QzonePanel';
import {
  DressUpPanel,
  MultiDeviceSyncPanel,
  SecurityAndModesPanel,
} from './components/DressUpAndSecurityPanel';
import {
  CreateGroupModal,
  ForwardModal,
  PartialCopyModal,
} from './components/Modals';
import {
  PinnedScreenshotItem,
  PinnedScreenshotOverlay,
  ScreenshotStudioModal,
} from './components/ScreenshotStudio';
import { FriendProfileModal } from './components/FriendProfileModal';
import { QqLevelCenterModal } from './components/QqLevelCenterModal';
import { AuthGateModal } from './components/AuthGateModal';
import { DraggableUnreadBadge } from './components/DraggableUnreadBadge';
import {
  DEFAULT_WINDOW_DOCK_SETTINGS,
  DesktopWindowShell,
} from './components/WindowDockManager';
import {
  CompanionSyncPreview,
  CompanionTargetPlatform,
} from './components/CompanionSyncPreview';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallControls';
import { playTone } from './utils/qr';
import { playSoundEffect, resolveMessageSoundCategory } from './utils/soundEngine';
import {
  calculateLevelFromActiveDays,
  formatLevelIconsText,
  QQ_GROWTH_TASKS,
} from './utils/qqLevel';
import { THEME_PRESETS, resolveEffectiveDressUp } from './utils/dressUpCatalog';
import {
  CloudUserAccount,
  deleteFriendFromFirestore,
  ensureAccountIdAndProfile,
  formatAccountIdDisplay,
  lookupAccountById,
  saveFriendToFirestore,
  subscribeToUserFriends,
  updateCloudProfile,
  updateFriendInFirestore,
} from './utils/accountService';
import {
  acceptFriendRequest,
  cancelFriendRequest,
  CloudChat,
  CloudFriendRequest,
  createGroupCloudChat,
  ensureDirectCloudChat,
  isCloudConversationId,
  recallCloudChatMessage,
  rejectFriendRequest,
  sendCloudChatMessage,
  sendFriendRequest,
  subscribeToCloudChatMessages,
  subscribeToCloudChats,
  subscribeToFriendRequests,
} from './utils/cloudChatService';
import { wsUrl } from './utils/serverEndpoint';
import { authedAiPost } from './utils/aiClient';

const ONLINE_STATUS_OPTIONS: Array<{
  id: OnlineStatusType;
  label: string;
  dotClass: string;
}> = [
  { id: 'online', label: '我在线上', dotClass: 'bg-emerald-500' },
  { id: 'qme', label: '欢迎私聊', dotClass: 'bg-sky-500' },
  { id: 'away', label: '离开', dotClass: 'bg-amber-400' },
  { id: 'busy', label: '忙碌', dotClass: 'bg-rose-500' },
  { id: 'dnd', label: '请勿打扰', dotClass: 'bg-red-600' },
  { id: 'invisible', label: '隐身', dotClass: 'bg-slate-400' },
];

export interface MoodBeaconOption {
  id: string;
  emoji: string;
  label: string;
  accent: string;
}

export const MOOD_BEACON_OPTIONS: MoodBeaconOption[] = [
  { id: 'focus', emoji: '🎧', label: '沉浸创作', accent: 'from-indigo-500 to-blue-600' },
  { id: 'inspire', emoji: '✨', label: '灵感闪现', accent: 'from-amber-500 to-rose-500' },
  { id: 'coffee', emoji: '☕', label: '午后摸鱼', accent: 'from-emerald-500 to-teal-600' },
  { id: 'collab', emoji: '🚀', label: '极速协作', accent: 'from-blue-600 to-cyan-500' },
  { id: 'night', emoji: '🌙', label: '深夜静聊', accent: 'from-violet-600 to-indigo-700' },
];

const StarRippleLogo: React.FC = () => (
  <svg
    viewBox="0 0 36 36"
    className="w-8 h-8 shrink-0 drop-shadow-[0_2px_10px_rgba(56,189,248,0.45)]"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="sr-brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="52%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#14B8A6" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="32" height="32" rx="11" fill="url(#sr-brand-grad)" opacity="0.22" />
    <circle cx="18" cy="18" r="13.5" fill="none" stroke="#38BDF8" strokeOpacity="0.38" strokeWidth="1.2" />
    <circle cx="18" cy="18" r="9.5" fill="none" stroke="#60A5FA" strokeOpacity="0.55" strokeWidth="1.2" />
    <path
      d="M18 7.5 L20.6 15.4 L28.5 18 L20.6 20.6 L18 28.5 L15.4 20.6 L7.5 18 L15.4 15.4 Z"
      fill="url(#sr-brand-grad)"
    />
    <circle cx="18" cy="18" r="2.2" fill="#FFFFFF" />
  </svg>
);

export default function App() {
  const [section, setSection] = useState<AppSection>('chat');
  const [dark, setDark] = useState(false);
  const [mode, setMode] = useState<AppMode>('standard');

  // Core state
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>(INITIAL_CONVERSATIONS[0].id);
  const [messagesByConv, setMessagesByConv] =
    useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);

  // Files & Flash Transfer
  const [storedFiles, setStoredFiles] = useState<StoredFileItem[]>(INITIAL_STORED_FILES);
  const [flashBatches, setFlashBatches] =
    useState<FlashTransferBatch[]>(INITIAL_FLASH_BATCHES);

  // Qzone
  const [qzonePosts, setQzonePosts] = useState<QzonePost[]>(INITIAL_QZONE_POSTS);
  const [qzonePhotos, setQzonePhotos] = useState<QzonePhoto[]>(INITIAL_QZONE_PHOTOS);
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>(INITIAL_GUESTBOOK);

  // Office & Favorites
  const [mails, setMails] = useState<MailMessage[]>(INITIAL_MAILS);
  const [schedules, setSchedules] = useState<ScheduleEvent[]>(INITIAL_SCHEDULES);
  const [favorites, setFavorites] = useState<FavoriteItem[]>(INITIAL_FAVORITES);

  // Personalization, Security, Notifications & Multi-Device Sync
  const [dressUp, setDressUp] = useState<DressUpConfig>(INITIAL_DRESSUP);
  const [perConversationDressUp, setPerConversationDressUp] = useState<
    Record<string, Partial<DressUpConfig>>
  >({});
  const [security, setSecurity] = useState<SecuritySettings>(INITIAL_SECURITY);
  const [notifications, setNotifications] =
    useState<NotificationSettings>(INITIAL_NOTIFICATIONS);
  const [devices, setDevices] = useState<LoggedDevice[]>(INITIAL_DEVICES);
  const [activePlatformView, setActivePlatformView] = useState<OnlinePlatform>('Windows');
  const [dualMobileTabletOnline, setDualMobileTabletOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState('刚刚');

  // Active Call
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);

  // Channels, Wallet, Profile & Classic/Modern UI Layout
  const [channels, setChannels] = useState<QqChannel[]>(INITIAL_CHANNELS);
  const [walletBalance, setWalletBalance] = useState<number>(520.0);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([
    { id: 'tx-1', title: '零钱钱包余额初始充值', amount: 520.0, kind: 'in', time: '今天 09:00' },
  ]);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatusType>('online');
  const [moodBeacon, setMoodBeacon] = useState<MoodBeaconOption>(MOOD_BEACON_OPTIONS[0]);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [uiLayout, setUiLayout] = useState<UiLayoutStyle>('modern');
  const [profile, setProfile] = useState<UserProfile>({
    ...ME_PROFILE,
    likesCount: 1286,
    likedByMe: false,
    location: '杭州 · 余杭区',
    genderAge: '男 · 26岁 · 天蝎座',
  });

  // Firebase Email Auth & Exclusive 9-digit StarRipple Account ID
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [cloudAccount, setCloudAccount] = useState<CloudUserAccount | null>(null);
  const [allocatingAccountId, setAllocatingAccountId] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [friendRequests, setFriendRequests] = useState<CloudFriendRequest[]>([]);
  const [cloudChats, setCloudChats] = useState<CloudChat[]>([]);
  const activeConvIdRef = useRef(activeConvId);
  const prevCloudChatMetaRef = useRef<
    Record<string, { preview: string; time: string; senderUid: string }>
  >({});
  const initializedCloudChatsRef = useRef(false);

  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  const effectiveCloudAccount: CloudUserAccount | null = useMemo(() => {
    if (!cloudAccount) return null;
    return {
      ...cloudAccount,
      name: profile.name || cloudAccount.name,
      avatar: profile.avatar || cloudAccount.avatar,
      signature: profile.signature || cloudAccount.signature,
      level: profile.level || cloudAccount.level,
      activeDays: profile.activeDays || cloudAccount.activeDays,
    };
  }, [
    cloudAccount,
    profile.name,
    profile.avatar,
    profile.signature,
    profile.level,
    profile.activeDays,
  ]);

  // Modals & Companion Preview
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [partialCopyMsg, setPartialCopyMsg] = useState<ChatMessage | null>(null);
  const [forwardPayload, setForwardPayload] = useState<{
    summary: string;
    items: Array<{ type: ChatMessage['type']; content: string; file?: ChatMessage['file'] }>;
  } | null>(null);
  const [screenshotOpen, setScreenshotOpen] = useState(false);
  const [screenshotInitialMode, setScreenshotInitialMode] = useState<'capture' | 'doodle'>('capture');
  const [pinnedScreenshots, setPinnedScreenshots] = useState<PinnedScreenshotItem[]>([]);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [companionDrawerOpen, setCompanionDrawerOpen] = useState(false);
  const [companionPlatform, setCompanionPlatform] =
    useState<CompanionTargetPlatform>('iOS');
  const [companionDraft, setCompanionDraft] = useState('');
  const [leftRailCollapsed, setLeftRailCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sr_left_rail_collapsed_v1') === '1';
    } catch {
      return false;
    }
  });
  const [leftRailPeekOpen, setLeftRailPeekOpen] = useState(false);
  const leftRailHideTimerRef = useRef<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [securityInitialTab, setSecurityInitialTab] = useState<
    'modes' | 'security' | 'notifications' | 'visual'
  >('modes');
  const [viewingProfileContact, setViewingProfileContact] = useState<Contact | null>(null);
  const [viewingQzoneOwner, setViewingQzoneOwner] = useState<Contact | null>(null);
  const [friendCardLikes, setFriendCardLikes] = useState<
    Record<string, { count: number; liked: boolean }>
  >({});
  const [levelCenterOpen, setLevelCenterOpen] = useState(false);

  // Message List Grouping & Custom Chat Backgrounds
  const [chatFolders, setChatFolders] = useState<ChatFolder[]>(INITIAL_CHAT_FOLDERS);
  const [chatBackgrounds, setChatBackgrounds] = useState<{
    defaultBg: ChatBackgroundSetting;
    perConversation: Record<string, ChatBackgroundSetting>;
  }>({
    defaultBg: INITIAL_CHAT_BACKGROUND_DEFAULT,
    perConversation: {
      'conv-lin': { presetId: 'sakura_mist', blurPx: 0, overlayOpacity: 70 },
    },
  });

  // Floating Window & Edge Auto-Hide Settings
  const [windowDockSettings, setWindowDockSettings] = useState<WindowDockSettings>(() => {
    try {
      const raw = localStorage.getItem('sr_window_dock_settings_v1');
      if (raw) {
        return { ...DEFAULT_WINDOW_DOCK_SETTINGS, ...JSON.parse(raw) };
      }
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_WINDOW_DOCK_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('sr_window_dock_settings_v1', JSON.stringify(windowDockSettings));
    } catch {
      // Ignore storage errors
    }
  }, [windowDockSettings]);

  // WebSocket multi-device sync
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const notificationsRef = useRef(notifications);
  const conversationsRef = useRef(conversations);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const syncCloudUserAccount = async (fbUser: FirebaseUser) => {
    if (!fbUser.emailVerified) return;
    setAllocatingAccountId(true);
    try {
      const acct = await ensureAccountIdAndProfile(
        fbUser,
        ME_PROFILE.avatar,
        ME_PROFILE.signature
      );
      setCloudAccount(acct);
      setProfile((prev) => ({
        ...prev,
        qqNumber: acct.accountId,
        name: acct.name || prev.name,
        avatar: acct.avatar || prev.avatar,
        signature: acct.signature || prev.signature,
        level: Math.max(prev.level, acct.level),
        activeDays: Math.max(prev.activeDays, acct.activeDays),
      }));
      setSecurity((prev) => ({
        ...prev,
        boundEmail: acct.email,
        authProviderLabel:
          acct.emailProvider === 'google' ? 'Google 邮箱验证' : 'Microsoft 邮箱验证',
      }));
      showToast(`已同步星涟号 ${formatAccountIdDisplay(acct.accountId)}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '云端星涟号同步失败');
    } finally {
      setAllocatingAccountId(false);
    }
  };

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      if (!user) {
        setCloudAccount(null);
        setFriendRequests([]);
        setCloudChats([]);
        prevCloudChatMetaRef.current = {};
        initializedCloudChatsRef.current = false;
        setContacts((prev) => prev.filter((c) => !c.id.startsWith('uid-')));
        setConversations((prev) => prev.filter((c) => !isCloudConversationId(c.id)));
        return;
      }
      if (user.emailVerified) {
        void syncCloudUserAccount(user);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to Firestore friends, friend requests, and cloud chats once authenticated & verified
  useEffect(() => {
    if (!authUser || !authUser.emailVerified) return;

    const unsubFriends = subscribeToUserFriends(authUser.uid, (cloudFriends) => {
      setContacts((prev) => {
        const localOnly = prev.filter((c) => !c.id.startsWith('uid-'));
        const prevMap = new Map(prev.map((c) => [c.id, c]));
        const mergedCloud = cloudFriends.map((cf) => ({
          ...prevMap.get(cf.id),
          ...cf,
        }));
        return [...mergedCloud, ...localOnly];
      });
    });

    const unsubRequests = subscribeToFriendRequests(authUser.uid, setFriendRequests);
    const unsubChats = subscribeToCloudChats(authUser.uid, setCloudChats);

    return () => {
      unsubFriends();
      unsubRequests();
      unsubChats();
    };
  }, [authUser]);

  const cloudChatIdsKey = useMemo(
    () => cloudChats.map((c) => c.chatId).join('|'),
    [cloudChats]
  );

  // Subscribe to real-time messages for all joined cloud chats
  useEffect(() => {
    if (!authUser || !authUser.emailVerified || cloudChats.length === 0) return;

    const unsubs = cloudChats.map((chat) =>
      subscribeToCloudChatMessages(chat.chatId, authUser.uid, (msgs) => {
        setMessagesByConv((prev) => {
          const existingMap = new Map((prev[chat.chatId] || []).map((m) => [m.id, m]));
          const merged = msgs.map((m) => {
            const old = existingMap.get(m.id);
            if (!old) return m;
            return {
              ...m,
              translatedText: old.translatedText,
              starred: old.starred,
              burnRevealedAt: old.burnRevealedAt,
              burned: old.burned,
            };
          });
          return {
            ...prev,
            [chat.chatId]: merged,
          };
        });
      })
    );

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [authUser, cloudChatIdsKey]);

  // Synchronize cloudChats metadata into conversation list (resolving DM peer names/avatars)
  useEffect(() => {
    if (!authUser || !authUser.emailVerified) return;
    if (cloudChats.length === 0) {
      initializedCloudChatsRef.current = true;
      return;
    }

    const myUid = authUser.uid;
    const isInitialBatch = !initializedCloudChatsRef.current;
    let shouldPlayIncomingSound = false;

    setConversations((prev) => {
      const prevMap = new Map(prev.map((c) => [c.id, c]));
      const nonCloud = prev.filter((c) => !isCloudConversationId(c.id));

      const syncedCloudConvs: Conversation[] = cloudChats.map((cc) => {
        const existingConv = prevMap.get(cc.chatId);
        let displayTitle = cc.title;
        let displayAvatar = cc.avatar;
        let targetContactId: string | undefined = existingConv?.targetContactId;

        if (cc.kind === 'single') {
          const peerUid = cc.memberUids.find((u) => u !== myUid) || '';
          targetContactId = peerUid ? `uid-${peerUid}` : undefined;
          const peerContact = peerUid
            ? contacts.find((c) => c.id === `uid-${peerUid}`)
            : undefined;
          if (peerContact) {
            displayTitle = peerContact.remark || peerContact.name;
            displayAvatar = peerContact.avatar || displayAvatar;
          } else if (peerUid) {
            const reqFrom = friendRequests.find((r) => r.fromUid === peerUid);
            const reqTo = friendRequests.find((r) => r.toUid === peerUid);
            if (reqFrom) {
              displayTitle = reqFrom.fromName;
              displayAvatar = reqFrom.fromAvatar || displayAvatar;
            } else if (reqTo) {
              displayTitle = reqTo.toName;
              displayAvatar = reqTo.toAvatar || displayAvatar;
            }
          }
        }

        const prevMeta = prevCloudChatMetaRef.current[cc.chatId];
        const hasNewPeerActivity =
          !isInitialBatch &&
          Boolean(prevMeta) &&
          (prevMeta.preview !== cc.lastMessagePreview ||
            prevMeta.time !== cc.lastMessageTime) &&
          cc.lastMessageSenderUid !== myUid &&
          cc.chatId !== activeConvIdRef.current;

        if (hasNewPeerActivity && !existingConv?.muted) {
          shouldPlayIncomingSound = true;
        }

        prevCloudChatMetaRef.current[cc.chatId] = {
          preview: cc.lastMessagePreview,
          time: cc.lastMessageTime,
          senderUid: cc.lastMessageSenderUid,
        };

        const mappedMembers =
          cc.kind === 'group'
            ? cc.memberUids.map((mUid) => {
                if (mUid === myUid) {
                  return {
                    id: 'me',
                    name: profile.name,
                    avatar: profile.avatar,
                    role: (cc.ownerUid === myUid ? 'owner' : 'member') as 'owner' | 'member',
                    online: true,
                    status: 'online' as const,
                    platform: activePlatformView,
                  };
                }
                const c = contacts.find((ct) => ct.id === `uid-${mUid}`);
                return {
                  id: `uid-${mUid}`,
                  name: c?.remark || c?.name || `星涟好友`,
                  avatar: c?.avatar,
                  role: (cc.ownerUid === mUid ? 'owner' : 'member') as 'owner' | 'member',
                  online: c?.online ?? true,
                  status: (c?.online ? 'online' : 'invisible') as 'online' | 'invisible',
                  platform: c?.platform || ('Web' as const),
                };
              })
            : undefined;

        return {
          id: cc.chatId,
          kind: cc.kind,
          title: displayTitle,
          avatar: displayAvatar,
          targetContactId,
          pinned: existingConv?.pinned ?? false,
          muted: existingConv?.muted ?? false,
          unreadCount:
            cc.chatId === activeConvIdRef.current
              ? 0
              : (existingConv?.unreadCount ?? 0) + (hasNewPeerActivity ? 1 : 0),
          lastMessagePreview: cc.lastMessagePreview || '开始对话吧',
          lastMessageTime: cc.lastMessageTime || '刚刚',
          maxMembers: cc.kind === 'group' ? 50 : undefined,
          memberCount: cc.kind === 'group' ? cc.memberUids.length : undefined,
          members: mappedMembers || existingConv?.members,
          announcement:
            existingConv?.announcement ||
            (cc.kind === 'group' ? '云端多用户实时群聊已就绪' : undefined),
          quickBar: existingConv?.quickBar,
          checkIns: existingConv?.checkIns,
          album: existingConv?.album,
          activeCall: existingConv?.activeCall,
          memos: existingConv?.memos,
        };
      });

      return [...syncedCloudConvs, ...nonCloud];
    });

    initializedCloudChatsRef.current = true;
    if (shouldPlayIncomingSound) {
      const notif = notificationsRef.current;
      if (notif.chatSounds.enabled && !notif.dndEnabled) {
        playSoundEffect(
          notif.chatSounds.perMessageType.incoming,
          notif.chatSounds.masterVolume
        );
      }
    }
  }, [authUser, cloudChats, contacts, friendRequests, profile.name, profile.avatar, activePlatformView]);

  // Sync dark mode class on <html>
  useEffect(() => {
    const isDarkTheme = dark || dressUp.themeId === 'midnight';
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark, dressUp.themeId]);

  // Connect authenticated WebSocket for real-time same-account multi-device sync
  useEffect(() => {
    if (!authUser) {
      wsRef.current = null;
      setWsConnected(false);
      return;
    }

    let cancelled = false;
    const ws = new WebSocket(wsUrl('/ws'));
    wsRef.current = ws;

    ws.onopen = () => {
      void authUser
        .getIdToken()
        .then((token) => {
          if (!cancelled && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'auth',
                token,
                platform: activePlatformView,
                deviceName: `星涟 ${activePlatformView} 客户端`,
              })
            );
          }
        })
        .catch(() => {
          if (!cancelled) {
            ws.close();
          }
        });
    };

    ws.onclose = () => {
      if (!cancelled) {
        setWsConnected(false);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'sync:connected') {
          setWsConnected(true);
        } else if (data.type === 'sync:auth_error') {
          setWsConnected(false);
        } else if (data.type === 'chat:message' && data.message) {
          const incoming = data.message as ChatMessage;
          if (!incoming || typeof incoming.id !== 'string' || typeof incoming.conversationId !== 'string') {
            return;
          }
          setMessagesByConv((prev) => {
            const list = prev[incoming.conversationId] || [];
            if (list.some((m) => m.id === incoming.id)) return prev;
            return { ...prev, [incoming.conversationId]: [...list, incoming] };
          });
          setConversations((prev) =>
            prev.map((c) =>
              c.id === incoming.conversationId
                ? {
                    ...c,
                    lastMessagePreview: incoming.content,
                    lastMessageTime: incoming.timestamp,
                  }
                : c
            )
          );
          setLastSyncTime(new Date().toTimeString().slice(0, 5));
          const notif = notificationsRef.current;
          const targetC = conversationsRef.current.find((c) => c.id === incoming.conversationId);
          if (
            notif.chatSounds.enabled &&
            !notif.dndEnabled &&
            !targetC?.muted
          ) {
            playSoundEffect(
              notif.chatSounds.perMessageType.incoming,
              notif.chatSounds.masterVolume
            );
          }
        } else if (data.type === 'chat:recall' && typeof data.conversationId === 'string') {
          setMessagesByConv((prev) => ({
            ...prev,
            [data.conversationId]: (prev[data.conversationId] || []).map((m) =>
              m.id === data.messageId ? { ...m, recalled: true } : m
            ),
          }));
        } else if (data.type === 'device:kick' && typeof data.deviceId === 'string') {
          setDevices((prev) => prev.filter((d) => d.id !== data.deviceId));
        }
      } catch {
        // Ignore
      }
    };

    return () => {
      cancelled = true;
      setWsConnected(false);
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
      ws.close();
    };
  }, [authUser?.uid]);

  const broadcastWs = (payload: Record<string, unknown>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  // P2P resumable transfer simulated progress tick when not paused
  useEffect(() => {
    const timer = setInterval(() => {
      setMessagesByConv((prev) => {
        let changed = false;
        const next: Record<string, ChatMessage[]> = {};
        for (const [cid, list] of Object.entries(prev)) {
          next[cid] = list.map((m) => {
            if (
              m.type === 'file' &&
              m.file &&
              !m.file.paused &&
              (m.file.progress ?? 100) < 100
            ) {
              changed = true;
              const p = Math.min(100, (m.file.progress ?? 0) + 4);
              return { ...m, file: { ...m.file, progress: p } };
            }
            return m;
          });
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const p2pTransfers = useMemo(() => {
    const files: ChatMessage['file'][] = [];
    Object.values(messagesByConv).forEach((list) => {
      list.forEach((m) => {
        if (m.type === 'file' && m.file) files.push(m.file);
      });
    });
    return files.filter((f): f is NonNullable<typeof f> => Boolean(f));
  }, [messagesByConv]);

  const handleToggleP2pPause = (fileId: string) => {
    setMessagesByConv((prev) => {
      const next: Record<string, ChatMessage[]> = {};
      for (const [cid, list] of Object.entries(prev)) {
        next[cid] = list.map((m) =>
          m.file?.id === fileId
            ? { ...m, file: { ...m.file, paused: !m.file.paused } }
            : m
        );
      }
      return next;
    });
  };

  const handleSendMessage = async (
    convId: string,
    partial: Partial<ChatMessage> & { type: ChatMessage['type']; content: string },
    customSenderName?: string
  ) => {
    const now = new Date();
    const timestamp = now.toTimeString().slice(0, 5);
    const preview =
      partial.burnAfterSeconds
        ? '[阅后即焚消息]'
        : partial.type === 'image'
        ? '[图片]'
        : partial.type === 'voice'
        ? `[语音 ${partial.voiceDurationSec || 5}"]`
        : partial.type === 'file'
        ? `[文件] ${partial.file?.name || partial.content}`
        : partial.type === 'red_packet'
        ? `[心意红包] ${partial.redPacket?.title || '恭喜发财'}`
        : partial.content;

    const targetConv = conversations.find((c) => c.id === convId);
    const isCloudConv = isCloudConversationId(convId);

    if (isCloudConv) {
      if (!authUser || !authUser.emailVerified || !effectiveCloudAccount) {
        showToast('请先登录并完成邮箱验证后再发送云端消息');
        setAuthModalOpen(true);
        return;
      }
      const targetCloudChat = cloudChats.find((c) => c.chatId === convId);
      const memberUids = targetCloudChat?.memberUids || [effectiveCloudAccount.uid];
      try {
        const sentId = await sendCloudChatMessage(
          convId,
          effectiveCloudAccount,
          memberUids,
          partial,
          preview,
          timestamp
        );
        if (partial.type === 'file' && partial.file) {
          setStoredFiles((prev) => [
            {
              id: `sf-${Date.now()}`,
              name: partial.file!.name,
              sizeBytes: partial.file!.sizeBytes,
              fileType: partial.file!.fileType,
              conversationId: convId,
              conversationTitle: targetConv?.title || '云端会话',
              messageId: sentId,
              senderName: effectiveCloudAccount.name,
              dateStr: now.toISOString().slice(0, 10),
              timeStr: timestamp,
            },
            ...prev,
          ]);
        }
        if (
          notifications.chatSounds.enabled &&
          !notifications.dndEnabled &&
          !targetConv?.muted
        ) {
          const cat = resolveMessageSoundCategory(partial.type, false);
          const mappedSound = notifications.chatSounds.perMessageType[cat];
          playSoundEffect(mappedSound, notifications.chatSounds.masterVolume);
        }
        setLastSyncTime(timestamp);
        if (partial.type !== 'system') {
          handleClaimGrowthTask('chat_active', true);
        }
      } catch (err) {
        showToast(err instanceof Error ? err.message : '云端消息发送失败，请稍后重试');
      }
      return;
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      conversationId: convId,
      senderId: 'me',
      senderName: customSenderName || ME_PROFILE.name,
      senderAvatar: ME_PROFILE.avatar,
      timestamp,
      createdAt: Date.now(),
      ...partial,
    };

    setMessagesByConv((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              lastMessagePreview: preview,
              lastMessageTime: timestamp,
              unreadCount: 0,
            }
          : c
      )
    );

    if (partial.type === 'file' && partial.file) {
      const conv = conversations.find((c) => c.id === convId);
      setStoredFiles((prev) => [
        {
          id: `sf-${Date.now()}`,
          name: partial.file!.name,
          sizeBytes: partial.file!.sizeBytes,
          fileType: partial.file!.fileType,
          conversationId: convId,
          conversationTitle: conv?.title || '会话',
          messageId: newMsg.id,
          senderName: profile.name || ME_PROFILE.name,
          dateStr: '2026-11-19',
          timeStr: timestamp,
        },
        ...prev,
      ]);
    }

    if (
      notifications.chatSounds.enabled &&
      !notifications.dndEnabled &&
      !targetConv?.muted
    ) {
      const cat = resolveMessageSoundCategory(partial.type, false);
      const mappedSound = notifications.chatSounds.perMessageType[cat];
      playSoundEffect(mappedSound, notifications.chatSounds.masterVolume);
    }
    broadcastWs({ type: 'chat:message', message: newMsg });
    setLastSyncTime(timestamp);
    if (partial.type !== 'system') {
      handleClaimGrowthTask('chat_active', true);
    }

    // If chatting with StarBot or mentioning @星澜/@StarBot, invoke authenticated Gemini proxy (or demo fallback)
    if (
      partial.type === 'text' &&
      (convId === 'conv-bot' ||
        partial.content.includes('@星澜') ||
        partial.content.includes('@StarBot'))
    ) {
      try {
        let replyText = '';
        if (!auth.currentUser) {
          replyText =
            '「星澜（演示模式）」已收到你的消息！点击右上角登录后，即可解锁真实云端 Gemini AI 智能回复。';
        } else {
          const res = await authedAiPost<{ reply?: string }>('/api/ai/bot-reply', {
            prompt: partial.content,
            contextTitle: targetConv?.title,
          });
          replyText = res.ok
            ? res.data.reply || '已收到。'
            : res.data.error || '星澜智能助手暂时无法连接服务，请稍后再试。';
        }
        const botMsg: ChatMessage = {
          id: `msg-bot-${Date.now()}`,
          conversationId: convId,
          senderId: 'c-bot',
          senderName: '星澜智能助手',
          senderRole: 'bot',
          type: 'text',
          content: replyText,
          timestamp: new Date().toTimeString().slice(0, 5),
          createdAt: Date.now(),
        };
        setMessagesByConv((prev) => ({
          ...prev,
          [convId]: [...(prev[convId] || []), botMsg],
        }));
        const latestNotif = notificationsRef.current;
        if (latestNotif.chatSounds.enabled && !latestNotif.dndEnabled && !targetConv?.muted) {
          playSoundEffect(
            latestNotif.chatSounds.perMessageType.incoming,
            latestNotif.chatSounds.masterVolume
          );
        }
      } catch {
        // Ignore transient network failure
      }
    }
  };

  const handleRecallMessage = (convId: string, msgId: string) => {
    if (isCloudConversationId(convId)) {
      void recallCloudChatMessage(convId, msgId);
      showToast('已撤回云端消息');
      return;
    }
    setMessagesByConv((prev) => ({
      ...prev,
      [convId]: (prev[convId] || []).map((m) =>
        m.id === msgId
          ? { ...m, recalled: true, originalTextForEdit: m.content }
          : m
      ),
    }));
    broadcastWs({ type: 'chat:recall', conversationId: convId, messageId: msgId });
  };

  const handleTranslateMessage = async (convId: string, msgId: string) => {
    const target = (messagesByConv[convId] || []).find((m) => m.id === msgId);
    if (!target) return;
    if (!auth.currentUser) {
      showToast('请先登录星涟账号后再使用 AI 翻译功能');
      return;
    }
    setMessagesByConv((prev) => ({
      ...prev,
      [convId]: (prev[convId] || []).map((m) =>
        m.id === msgId ? { ...m, translating: true } : m
      ),
    }));

    try {
      const res = await authedAiPost<{ translatedText?: string }>('/api/ai/translate', {
        text: target.content,
      });
      setMessagesByConv((prev) => ({
        ...prev,
        [convId]: (prev[convId] || []).map((m) =>
          m.id === msgId
            ? {
                ...m,
                translating: false,
                translatedText: res.ok
                  ? res.data.translatedText
                  : res.data.error || '翻译失败',
              }
            : m
        ),
      }));
    } catch {
      setMessagesByConv((prev) => ({
        ...prev,
        [convId]: (prev[convId] || []).map((m) =>
          m.id === msgId
            ? { ...m, translating: false, translatedText: '翻译请求异常' }
            : m
        ),
      }));
    }
  };

  const handleStartOrJoinCall = (conv: Conversation, callMode: 'audio' | 'video') => {
    const convRingtone = resolveEffectiveDressUp(
      dressUp,
      perConversationDressUp,
      conv.id
    ).ringtoneId;
    playTone(convRingtone === 'mute' ? 'silent' : convRingtone || 'call');
    if (conv.activeCall) {
      setActiveCall({
        ...conv.activeCall,
        mode: callMode,
      });
      return;
    }

    const participants =
      conv.kind === 'group'
        ? (conv.members || [])
            .filter((m) => m.id !== 'me' && m.role !== 'bot')
            .slice(0, 3)
            .map((m) => ({
              id: m.id,
              name: m.name,
              avatar: m.avatar,
              speaking: false,
              videoOn: callMode === 'video',
              muted: false,
            }))
        : [
            {
              id: conv.targetContactId || 'peer',
              name: conv.title,
              avatar: conv.avatar,
              speaking: true,
              videoOn: callMode === 'video',
              muted: false,
            },
          ];

    const newCall: ActiveCallState = {
      id: `call-${Date.now()}`,
      conversationId: conv.id,
      conversationTitle: conv.title,
      mode: callMode,
      isGroup: conv.kind === 'group',
      startedAt: Date.now(),
      participants,
      screenSharing: false,
      docPresenting: false,
      docPage: 0,
      watchTogether: false,
      watchPlaying: false,
      watchProgress: 18,
      listenTogether: false,
      listenTrackIndex: 0,
      listenPlaying: false,
      beautyFilter: 'natural',
      virtualAvatar: false,
    };

    setActiveCall(newCall);
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, activeCall: newCall } : c))
    );
  };

  const handleHangUpCall = () => {
    if (!activeCall) return;
    const convId = activeCall.conversationId;
    setActiveCall(null);
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, activeCall: null } : c))
    );
  };

  const handleToggleReaction = (convId: string, msgId: string, emoji: string) => {
    setMessagesByConv((prev) => ({
      ...prev,
      [convId]: (prev[convId] || []).map((m) => {
        if (m.id !== msgId) return m;
        const existing = m.reactions || [];
        const target = existing.find((r) => r.emoji === emoji);
        let nextReactions;
        if (target) {
          const hasMe = target.userIds.includes('me');
          const updatedIds = hasMe
            ? target.userIds.filter((id) => id !== 'me')
            : [...target.userIds, 'me'];
          nextReactions =
            updatedIds.length === 0
              ? existing.filter((r) => r.emoji !== emoji)
              : existing.map((r) => (r.emoji === emoji ? { ...r, userIds: updatedIds } : r));
        } else {
          nextReactions = [...existing, { emoji, userIds: ['me'] }];
        }
        return { ...m, reactions: nextReactions };
      }),
    }));
  };

  const handleTranscribeVoice = (convId: string, msgId: string) => {
    setMessagesByConv((prev) => ({
      ...prev,
      [convId]: (prev[convId] || []).map((m) => {
        if (m.id !== msgId) return m;
        if (m.voiceTranscript) {
          return { ...m, voiceTranscript: undefined };
        }
        const cleaned = m.content.replace(/^\[语音[^\]]*\]\s*/, '').trim();
        return {
          ...m,
          voiceTranscript:
            cleaned && !cleaned.startsWith('语音消息')
              ? cleaned
              : '收到，这边已经同步好最新排期，稍后发到群文件里。',
        };
      }),
    }));
  };

  const handleClaimRedPacket = (
    convId: string,
    msgId: string,
    passwordInput?: string
  ): string | null => {
    const targetMsg = (messagesByConv[convId] || []).find((m) => m.id === msgId);
    if (!targetMsg || !targetMsg.redPacket) return '红包数据不存在';
    const rp = targetMsg.redPacket;
    if (rp.claims.some((c) => c.userId === 'me')) return '你已领取过该红包';
    if (rp.claims.length >= rp.totalCount) return '手慢了，红包已被抢完';
    if (rp.kind === 'password' && (passwordInput || '').trim() !== (rp.password || '').trim()) {
      return '口令不匹配，请核对后再试';
    }

    const claimedSum = rp.claims.reduce((s, c) => s + c.amount, 0);
    const remainingAmount = Math.max(0.01, Number((rp.totalAmount - claimedSum).toFixed(2)));
    const remainingSlots = rp.totalCount - rp.claims.length;

    let gotAmount = remainingAmount;
    if (remainingSlots > 1) {
      const avg = remainingAmount / remainingSlots;
      const minKeep = (remainingSlots - 1) * 0.01;
      const maxDraw = Math.max(0.01, remainingAmount - minKeep);
      const randomDraw = Math.max(0.01, Math.min(maxDraw, avg * (0.4 + Math.random() * 1.3)));
      gotAmount = Number(randomDraw.toFixed(2));
    }

    const nowTime = new Date().toTimeString().slice(0, 5);
    setMessagesByConv((prev) => ({
      ...prev,
      [convId]: (prev[convId] || []).map((m) => {
        if (m.id !== msgId || !m.redPacket) return m;
        return {
          ...m,
          redPacket: {
            ...m.redPacket,
            claims: [
              ...m.redPacket.claims,
              {
                userId: 'me',
                userName: ME_PROFILE.name,
                amount: gotAmount,
                time: nowTime,
              },
            ],
          },
        };
      }),
    }));
    setWalletBalance((prev) => Number((prev + gotAmount).toFixed(2)));
    setWalletTransactions((prev) => [
      {
        id: `tx-${Date.now()}`,
        title: `领取红包「${rp.title}」`,
        amount: gotAmount,
        kind: 'in',
        time: nowTime,
      },
      ...prev,
    ]);
    showToast(`恭喜领到 ¥${gotAmount.toFixed(2)}，已自动存入零钱钱包`);
    return null;
  };

  const handleSendRedPacket = (
    convId: string,
    kind: 'lucky' | 'password',
    title: string,
    amount: number,
    count: number,
    password?: string
  ) => {
    if (amount <= 0 || count <= 0) return;
    if (amount > walletBalance) {
      showToast('零钱钱包余额不足，可先在头像菜单快速充值');
      return;
    }
    setWalletBalance((prev) => Number((prev - amount).toFixed(2)));
    setWalletTransactions((prev) => [
      {
        id: `tx-${Date.now()}`,
        title: `发出${kind === 'password' ? '口令' : '拼手气'}红包「${title}」`,
        amount: Number(amount.toFixed(2)),
        kind: 'out',
        time: new Date().toTimeString().slice(0, 5),
      },
      ...prev,
    ]);
    handleSendMessage(convId, {
      type: 'red_packet',
      content: title,
      redPacket: {
        id: `rp-${Date.now()}`,
        kind,
        title,
        password: kind === 'password' ? password : undefined,
        totalAmount: Number(amount.toFixed(2)),
        totalCount: count,
        claims: [],
      },
    });
    showToast(`已发出 ${kind === 'password' ? '口令' : '拼手气'}红包 ¥${amount.toFixed(2)}`);
  };

  const handleClaimGrowthTask = (taskId: string, silent?: boolean) => {
    const task = QQ_GROWTH_TASKS.find((t) => t.id === taskId);
    if (!task) return;
    setProfile((prev) => {
      if (prev.completedGrowthTaskIds.includes(taskId)) return prev;
      const nextActiveDays = Number((prev.activeDays + task.rewardDays).toFixed(1));
      const nextLevel = calculateLevelFromActiveDays(nextActiveDays);
      const promoted = nextLevel > prev.level;
      if (promoted) {
        playTone('chime');
        showToast(
          `恭喜升级至星阶 LV.${nextLevel}（${formatLevelIconsText(nextLevel)}）！`
        );
      } else if (!silent) {
        playTone('chime');
        showToast(`已完成「${task.title}」，活跃天数 +${task.rewardDays} 天`);
      }
      return {
        ...prev,
        activeDays: nextActiveDays,
        level: nextLevel,
        todayGrowthEarned: Number((prev.todayGrowthEarned + task.rewardDays).toFixed(1)),
        completedGrowthTaskIds: [...prev.completedGrowthTaskIds, taskId],
      };
    });
  };

  const handleLookupAccountById = async (rawAccountId: string): Promise<Contact | null> => {
    const cleanId = rawAccountId.replace(/\s+/g, '').trim();
    const localMatch = contacts.find((c) => c.qqNumber === cleanId);
    if (localMatch) return localMatch;
    const entry = await lookupAccountById(cleanId);
    if (!entry) return null;
    return {
      id: `uid-${entry.uid}`,
      qqNumber: entry.accountId,
      name: entry.name,
      avatar: entry.avatar,
      signature: entry.signature || '星涟认证用户',
      online: entry.online,
      platform: entry.platform,
      groupName: '我的好友',
      starred: false,
      sparkDays: 1,
      level: entry.level,
    };
  };

  const openUserProfile = (target: { id?: string; name: string; avatar?: string }) => {
    if (
      target.id === 'me' ||
      target.name === profile.name ||
      target.name === ME_PROFILE.name
    ) {
      setSection('profile');
      return;
    }
    const matched = contacts.find(
      (c) =>
        (target.id && c.id === target.id) ||
        c.name === target.name ||
        c.remark === target.name
    );
    if (matched) {
      setViewingProfileContact(matched);
      return;
    }
    const hashSeed = Array.from(target.id || target.name).reduce(
      (acc, ch) => acc + ch.charCodeAt(0),
      10000
    );
    const fallbackContact: Contact = {
      id: target.id || `temp-${target.name}`,
      qqNumber: `800${(hashSeed % 900000) + 100000}`,
      name: target.name,
      avatar: target.avatar,
      signature: '这个人很神秘，暂未设置签名',
      online: true,
      platform: 'Web',
      groupName: '我的好友',
      starred: false,
      sparkDays: 0,
    };
    setViewingProfileContact(fallbackContact);
  };

  const handleSendFriendRequest = async (contact: Contact, note: string) => {
    if (!authUser || !authUser.emailVerified || !effectiveCloudAccount) {
      showToast('请先登录并完成邮箱验证，再发送云端好友申请');
      setAuthModalOpen(true);
      return;
    }
    const targetUid = contact.id.replace(/^uid-/, '');
    try {
      const outcome = await sendFriendRequest(
        effectiveCloudAccount,
        {
          accountId: contact.qqNumber,
          uid: targetUid,
          name: contact.name,
          avatar: contact.avatar || '',
          signature: contact.signature,
          emailProvider: 'google',
          level: contact.level || 1,
          online: contact.online,
          platform: contact.platform,
        },
        note,
        friendRequests
      );
      if (outcome === 'sent') {
        showToast(`已向 ${contact.name}（星涟号 ${contact.qqNumber}）发送好友申请`);
      } else if (outcome === 'resent') {
        showToast(`已重新向 ${contact.name} 发送好友申请`);
      } else if (outcome === 'already_pending') {
        showToast('您已向对方发送过申请，请耐心等待对方验证');
      } else if (outcome === 'incoming_exists') {
        showToast('对方已经向您发来好友申请，请在「申请」列表点击同意即可');
      } else if (outcome === 'already_accepted') {
        showToast('对方已通过您的好友申请');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : '发送好友申请失败');
    }
  };

  const handleAcceptFriendRequest = async (req: CloudFriendRequest) => {
    if (!authUser || !authUser.emailVerified || !effectiveCloudAccount) {
      showToast('请先登录并验证邮箱');
      setAuthModalOpen(true);
      return;
    }
    try {
      const existingIds = new Set(contacts.map((c) => c.id));
      const dmChatId = await acceptFriendRequest(
        req,
        effectiveCloudAccount,
        existingIds,
        cloudChats
      );
      showToast(`已同意 ${req.fromName} 的好友申请，双方已互加好友`);
      setActiveConvId(dmChatId);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '同意好友申请失败');
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      showToast('已拒绝该好友申请');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleCancelFriendRequest = async (requestId: string) => {
    try {
      await cancelFriendRequest(requestId);
      showToast('已撤回该好友申请');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '撤回失败');
    }
  };

  const handleStartSingleChat = async (contact: Contact) => {
    if (contact.id.startsWith('uid-')) {
      if (!authUser || !authUser.emailVerified || !effectiveCloudAccount) {
        showToast('请先登录并完成邮箱验证后再发起云端私聊');
        setAuthModalOpen(true);
        return;
      }
      const peerUid = contact.id.replace(/^uid-/, '');
      try {
        const dmChatId = await ensureDirectCloudChat(
          effectiveCloudAccount,
          peerUid,
          contact.remark || contact.name,
          contact.avatar || '',
          cloudChats
        );
        setConversations((prev) => {
          if (prev.some((c) => c.id === dmChatId)) return prev;
          return [
            {
              id: dmChatId,
              kind: 'single',
              title: contact.remark || contact.name,
              avatar: contact.avatar,
              targetContactId: contact.id,
              pinned: false,
              muted: false,
              unreadCount: 0,
              lastMessagePreview: '已建立云端会话，开始对话吧',
              lastMessageTime: '刚刚',
            },
            ...prev,
          ];
        });
        setActiveConvId(dmChatId);
        setSection('chat');
      } catch (err) {
        showToast(err instanceof Error ? err.message : '创建云端会话失败');
      }
      return;
    }

    const found = conversations.find((c) => c.targetContactId === contact.id);
    if (found) {
      setActiveConvId(found.id);
    } else {
      const newConv: Conversation = {
        id: `conv-${contact.id}`,
        kind: 'single',
        title: contact.remark || contact.name,
        avatar: contact.avatar,
        targetContactId: contact.id,
        pinned: false,
        muted: false,
        unreadCount: 0,
        lastMessagePreview: '已建立好友连接，打个招呼吧',
        lastMessageTime: '刚刚',
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
    }
    setSection('chat');
  };

  const handleCallContact = (contact: Contact, callMode: 'audio' | 'video') => {
    const found = conversations.find((c) => c.targetContactId === contact.id) || {
      id: `conv-${contact.id}`,
      kind: 'single' as const,
      title: contact.remark || contact.name,
      avatar: contact.avatar,
      targetContactId: contact.id,
      pinned: false,
      muted: false,
      unreadCount: 0,
      lastMessagePreview: '',
      lastMessageTime: '刚刚',
    };
    handleStartOrJoinCall(found, callMode);
  };

  const handleVisitFriendQzone = (contact: Contact) => {
    setViewingQzoneOwner(contact);
    setSection('qzone');
  };

  const handleNudgeContact = (contact: Contact) => {
    playTone('nudge');
    const targetConv = conversations.find((c) => c.targetContactId === contact.id);
    const convId = targetConv ? targetConv.id : activeConvId;
    const label = contact.remark || contact.name;
    handleSendMessage(convId, {
      type: 'system',
      content: `你拍了拍「${label}」`,
    });
    showToast(`你拍了拍「${label}」`);
  };

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);
  const pendingIncomingRequestsCount = authUser
    ? friendRequests.filter((r) => r.toUid === authUser.uid && r.status === 'pending').length
    : 0;
  const minimalMode = mode === 'minimal';
  const careMode = mode === 'care';
  const currentStatusMeta =
    ONLINE_STATUS_OPTIONS.find((s) => s.id === onlineStatus) || ONLINE_STATUS_OPTIONS[0];

  const navItems: Array<{
    id: AppSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'chat', label: '消息', icon: MessageSquare, badge: totalUnread },
    { id: 'contacts', label: '联系人', icon: Users, badge: pendingIncomingRequestsCount },
    { id: 'channels', label: '频道', icon: Hash },
    { id: 'qzone', label: '空间', icon: Compass },
    { id: 'profile', label: '我的', icon: User },
    { id: 'files', label: '快传', icon: FolderKanban },
    { id: 'office', label: '办公', icon: Briefcase },
    { id: 'dressup', label: '装扮', icon: Palette },
    { id: 'security', label: '安全', icon: ShieldCheck },
    { id: 'sync', label: '多端', icon: Laptop },
  ];

  const themeAccentBg = minimalMode
    ? 'bg-slate-700 text-white shadow-sm'
    : (THEME_PRESETS.find((t) => t.id === dressUp.themeId) || THEME_PRESETS[0]).accentBgClass;

  const hasBlockingModalOpen = Boolean(
    createGroupOpen ||
      screenshotOpen ||
      authModalOpen ||
      levelCenterOpen ||
      viewingProfileContact ||
      forwardPayload ||
      partialCopyMsg ||
      security.accountFrozen ||
      activeCall ||
      companionDrawerOpen
  );

  return (
    <DesktopWindowShell
      settings={windowDockSettings}
      onUpdateSettings={(patch) =>
        setWindowDockSettings((prev) => ({ ...prev, ...patch }))
      }
      totalUnread={totalUnread}
      blockingModalOpen={hasBlockingModalOpen}
      onToast={showToast}
    >
      <div
        className={`relative ${
          windowDockSettings.displayMode === 'floating'
            ? 'h-full w-full'
            : 'h-screen w-screen'
        } flex overflow-hidden bg-[#f3f6fb] dark:bg-[#0d111a] text-slate-900 dark:text-slate-100 ${
          careMode ? 'care-mode' : ''
        } ${minimalMode ? 'minimal-mode' : ''}`}
      >
      {/* Account Frozen Overlay */}
      {security.accountFrozen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="max-w-sm w-full rounded-2xl bg-white dark:bg-[#191c24] p-6 text-center space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <ShieldCheck className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="text-base font-bold">星涟账号已紧急冻结</h3>
            <p className="text-xs text-slate-500">
              当前账号处于安全保护冻结状态，所有登录与消息收发已暂停。
            </p>
            <button
              onClick={() => setSecurity((p) => ({ ...p, accountFrozen: false }))}
              className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-medium"
            >
              通过邮箱通行证验证并解除冻结
            </button>
          </div>
        </div>
      )}

      {/* Left Edge Sensor Strip & Pull Handle when Navigation Rail is Collapsed */}
      {leftRailCollapsed && !leftRailPeekOpen && (
        <div
          onPointerEnter={() => {
            if (leftRailHideTimerRef.current !== null) {
              window.clearTimeout(leftRailHideTimerRef.current);
              leftRailHideTimerRef.current = null;
            }
            setLeftRailPeekOpen(true);
          }}
          onClick={() => setLeftRailPeekOpen(true)}
          className="absolute left-0 top-0 bottom-0 w-3.5 z-40 cursor-pointer flex items-center justify-start group"
          title="悬停或点击展开左侧导航图标栏"
        >
          <div className="w-1.5 group-hover:w-3 h-28 rounded-r-full bg-gradient-to-b from-sky-400 via-[#2563EB] to-teal-400 shadow-[0_0_14px_rgba(37,99,235,0.55)] transition-all flex items-center justify-center relative">
            <ChevronRight className="w-2.5 h-2.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            {totalUnread > 0 && (
              <span className="absolute -right-2.5 top-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-mono-tabular font-bold flex items-center justify-center shadow">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Left Primary Navigation Rail — Collapsible, Auto-Hideable & Scrollable */}
      <nav
        onPointerEnter={() => {
          if (leftRailHideTimerRef.current !== null) {
            window.clearTimeout(leftRailHideTimerRef.current);
            leftRailHideTimerRef.current = null;
          }
        }}
        onPointerLeave={() => {
          if (!leftRailCollapsed || statusPopoverOpen) return;
          leftRailHideTimerRef.current = window.setTimeout(() => {
            setLeftRailPeekOpen(false);
          }, 260);
        }}
        className={`${careMode ? 'w-[84px]' : 'w-[72px]'} ${
          leftRailCollapsed
            ? `absolute left-0 top-0 bottom-0 z-40 shadow-2xl transition-transform duration-200 ease-out ${
                leftRailPeekOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
              }`
            : 'relative shrink-0 z-30'
        } h-full sr-obsidian-dock border-r border-white/10 flex flex-col items-center py-2.5 select-none`}
      >
        {/* Collapse / Pin Rail Control */}
        <div className="w-full px-2 pb-1.5 flex items-center justify-center shrink-0">
          <button
            type="button"
            onClick={() => {
              if (leftRailCollapsed) {
                setLeftRailCollapsed(false);
                setLeftRailPeekOpen(false);
                try {
                  localStorage.setItem('sr_left_rail_collapsed_v1', '0');
                } catch {
                  // ignore
                }
                showToast('已固定展开左侧导航栏');
              } else {
                setLeftRailCollapsed(true);
                setLeftRailPeekOpen(false);
                setStatusPopoverOpen(false);
                try {
                  localStorage.setItem('sr_left_rail_collapsed_v1', '1');
                } catch {
                  // ignore
                }
                showToast('左侧导航栏已缩进隐藏，移至屏幕最左侧可随时滑出');
              }
            }}
            className={`w-full py-1 rounded-lg flex items-center justify-center gap-1 text-[10px] transition-colors ${
              leftRailCollapsed
                ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title={
              leftRailCollapsed
                ? '点击固定展开左侧导航栏'
                : '点击缩进隐藏左侧导航图标栏'
            }
          >
            {leftRailCollapsed ? (
              <>
                <PanelLeftOpen className="w-3.5 h-3.5" />
                <span>固定</span>
              </>
            ) : (
              <>
                <PanelLeftClose className="w-3.5 h-3.5" />
                <span>缩进</span>
              </>
            )}
          </button>
        </div>

        <div className="flex-1 min-h-0 w-full overflow-y-auto no-scrollbar flex flex-col items-center justify-between gap-3">
        <div className="flex flex-col items-center gap-2.5 w-full">
          {/* StarRipple Brand Mark */}
          <button
            type="button"
            onClick={() => setSection('chat')}
            className="group flex flex-col items-center gap-0.5 pt-0.5 focus:outline-none"
            title="星涟 StarRipple · 回到消息工作台"
          >
            <div className="transition-transform duration-200 group-hover:scale-105">
              <StarRippleLogo />
            </div>
            <span className="text-[9px] font-bold tracking-[0.18em] text-sky-300/80 uppercase">
              星涟
            </span>
          </button>

          {/* Profile Avatar & Live Mood Beacon */}
          <div className="relative">
            <button
              onClick={() => setStatusPopoverOpen((v) => !v)}
              title={`${profile.name} · ${currentStatusMeta.label} · ${moodBeacon.emoji} ${moodBeacon.label}`}
              className="relative rounded-full ring-2 ring-white/15 hover:ring-sky-400/70 transition-all"
            >
              <AvatarView
                name={profile.name}
                src={profile.avatar}
                size="md"
                frameId={dressUp.frameId}
                pendantId={dressUp.pendantId}
                minimalMode={minimalMode}
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0b1222] ${currentStatusMeta.dotClass}`}
              />
            </button>
            <button
              type="button"
              onClick={() => setStatusPopoverOpen((v) => !v)}
              className="mt-1 mx-auto flex items-center justify-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/15 text-[9px] text-slate-200 border border-white/10 max-w-[60px] truncate"
              title="切换今日星语状态"
            >
              <span>{moodBeacon.emoji}</span>
              <span className="truncate">{moodBeacon.label.slice(0, 2)}</span>
            </button>

            {statusPopoverOpen && (
              <div className="absolute left-16 top-0 z-50 w-76 rounded-2xl bg-white dark:bg-[#161b26] border border-slate-200 dark:border-slate-700/80 shadow-2xl p-3.5 space-y-3 text-slate-900 dark:text-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span className="truncate">{profile.name}</span>
                      <QqLevelIcons
                        level={profile.level}
                        onClick={() => {
                          setStatusPopoverOpen(false);
                          setLevelCenterOpen(true);
                        }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono-tabular truncate">
                      星涟号 {formatAccountIdDisplay(profile.qqNumber)} · {profile.vipLabel}
                    </div>
                  </div>
                  <button
                    onClick={() => setStatusPopoverOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Live Mood Beacon Switcher */}
                <div>
                  <div className="text-[11px] font-medium text-slate-500 mb-1.5">
                    今日星语状态 · Live Mood
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {MOOD_BEACON_OPTIONS.map((m) => {
                      const active = moodBeacon.id === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setMoodBeacon(m);
                            showToast(`已点亮今日星语「${m.emoji} ${m.label}」`);
                          }}
                          className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                            active
                              ? `bg-gradient-to-r ${m.accent} text-white border-transparent shadow-sm`
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#2563EB]'
                          }`}
                        >
                          {m.emoji} {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Email Account & Exclusive Account ID Quick Card */}
                <button
                  type="button"
                  onClick={() => {
                    setStatusPopoverOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/70 hover:bg-[#2563EB]/10 border border-slate-200 dark:border-slate-800 px-3 py-2 text-left flex items-center justify-between gap-2 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-[#2563EB] truncate">
                      {authUser && authUser.emailVerified
                        ? `已认证：${authUser.email}`
                        : 'Google / Microsoft 邮箱登录与领号'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {cloudAccount ? '专属星涟号已与云端同步' : '点击绑定邮箱并领取专属 9 位星涟号'}
                    </div>
                  </div>
                  <KeyRound className="w-4 h-4 text-[#2563EB] shrink-0" />
                </button>

                <div>
                  <div className="text-[11px] font-medium text-slate-500 mb-1.5">
                    在线状态切换
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ONLINE_STATUS_OPTIONS.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => {
                          setOnlineStatus(st.id);
                          setStatusPopoverOpen(false);
                          showToast(`在线状态已切换为「${st.label}」`);
                        }}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left border ${
                          onlineStatus === st.id
                            ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB] font-semibold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${st.dotClass}`} />
                        <span>{st.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-900/70 p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="text-[10px] text-slate-500">零钱钱包余额</div>
                      <div className="text-xs font-bold font-mono-tabular text-slate-900 dark:text-slate-100">
                        ¥{walletBalance.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setWalletBalance((p) => Number((p + 100).toFixed(2)));
                      setWalletTransactions((prev) => [
                        {
                          id: `tx-${Date.now()}`,
                          title: '零钱钱包快捷充值',
                          amount: 100,
                          kind: 'in',
                          time: new Date().toTimeString().slice(0, 5),
                        },
                        ...prev,
                      ]);
                      showToast('零钱钱包已充值 ¥100.00');
                    }}
                    className="px-2 py-1 text-[11px] font-medium rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                  >
                    +¥100
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      setStatusPopoverOpen(false);
                      setSection('profile');
                    }}
                    className="py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-medium hover:bg-[#1D4ED8]"
                  >
                    个人中心
                  </button>
                  <button
                    onClick={() => {
                      setStatusPopoverOpen(false);
                      setSection('dressup');
                    }}
                    className="py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    个性装扮
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-8 h-px bg-white/10" />

          <div className="flex flex-col items-center gap-1 w-full px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'qzone') {
                      setViewingQzoneOwner(null);
                    }
                    setSection(item.id);
                  }}
                  className={`relative w-full py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 ${
                    active
                      ? themeAccentBg
                      : 'text-slate-400 hover:text-white hover:bg-white/8'
                  }`}
                >
                  {active && (
                    <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full bg-sky-300" />
                  )}
                  <Icon className={careMode ? 'w-5 h-5' : 'w-4 h-4'} />
                  <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    item.id === 'chat' ? (
                      <DraggableUnreadBadge
                        count={item.badge}
                        soundEnabled={notifications.chatSounds.enabled}
                        title="长按拖拽红点可一键清除全部未读"
                        className="absolute top-0.5 right-1.5 !min-w-[16px] !h-[16px] ring-2 ring-[#0b1222]"
                        onDismiss={() => {
                          setConversations((prev) =>
                            prev.map((c) => ({ ...c, unreadCount: 0 }))
                          );
                          showToast('已拖拽清除全部未读消息红点');
                        }}
                      />
                    ) : (
                      <span
                        title={`${item.badge} 条待处理好友申请`}
                        className="absolute top-0.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-mono-tabular font-bold flex items-center justify-center ring-2 ring-[#0b1222]"
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Rail Utility Controls */}
        <div className="flex flex-col items-center gap-1.5 px-2 w-full">
          {activeCall && (
            <button
              onClick={() => setSection('chat')}
              className="w-full py-1.5 rounded-xl bg-emerald-500 text-white text-[10px] font-medium flex flex-col items-center gap-0.5 shadow-[0_4px_12px_rgba(16,185,129,0.45)]"
              title="当前正在通话中"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>通话中</span>
            </button>
          )}

          <button
            onClick={() => setAuthModalOpen(true)}
            className={`w-full py-1.5 rounded-xl flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
              authUser && authUser.emailVerified
                ? 'bg-teal-500/20 text-teal-300 font-semibold border border-teal-400/30'
                : 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-400/25 hover:bg-sky-500/25'
            }`}
            title={
              authUser && authUser.emailVerified
                ? `已绑定 ${authUser.email} · 星涟号 ${profile.qqNumber}`
                : '使用 Google / Microsoft 邮箱注册与登录，领取专属星涟号'
            }
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{authUser && authUser.emailVerified ? '通行证' : '登录'}</span>
          </button>

          <button
            onClick={() => {
              const nextMode =
                windowDockSettings.displayMode === 'floating' ? 'fullscreen' : 'floating';
              setWindowDockSettings((prev) => ({ ...prev, displayMode: nextMode }));
              showToast(
                nextMode === 'floating'
                  ? '已开启悬浮可调窗口 · 拖至屏幕右侧松手可贴边自动隐藏'
                  : '已切换回全屏工作台视图'
              );
            }}
            className={`w-full py-1.5 rounded-xl flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
              windowDockSettings.displayMode === 'floating'
                ? 'bg-sky-500/20 text-sky-300 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/8'
            }`}
            title="开启可自由缩放窗口与 QQ 经典贴边自动隐藏"
          >
            <PanelRightClose className="w-3.5 h-3.5" />
            <span>{windowDockSettings.displayMode === 'floating' ? '全屏' : '贴边窗'}</span>
          </button>

          <button
            onClick={() => {
              const next = uiLayout === 'modern' ? 'compact' : 'modern';
              setUiLayout(next);
              setSection('chat');
              showToast(
                next === 'compact'
                  ? '已切换为「星涟紧凑双栏视图」'
                  : '已切换为「现代极简桌面界面」'
              );
            }}
            className={`w-full py-1.5 rounded-xl flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
              uiLayout === 'compact'
                ? 'bg-sky-500/20 text-sky-300 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/8'
            }`}
            title="切换紧凑视图 / 现代桌面视图"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>{uiLayout === 'compact' ? '现代' : '紧凑'}</span>
          </button>

          <button
            onClick={() => setCompanionDrawerOpen(!companionDrawerOpen)}
            className={`w-full py-1.5 rounded-xl flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
              companionDrawerOpen
                ? 'bg-sky-500/20 text-sky-300 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/8'
            }`}
            title="五端实时同屏同步预览"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>同屏</span>
          </button>

          <PWAInstallButton variant="rail" onToast={showToast} />

            <button
              onClick={() => setDark(!dark)}
              className="w-full py-1.5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
              title="切换浅色 / 深色模式"
            >
              {dark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          </div>
        </nav>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
        <OfflineIndicator />
        {/* Subtle Mode Banner only when in non-standard accessibility/youth mode */}
        {mode !== 'standard' && (
          <div className="px-5 py-1.5 bg-slate-900 text-white text-xs flex items-center justify-between shrink-0">
            <span>
              {mode === 'minimal' && '简洁模式已开启 · 已屏蔽聊天气泡与个性装扮，专注纯净沟通'}
              {mode === 'care' && '关怀模式已开启 · 大字体与高对比度触控优化'}
              {mode === 'youth' &&
                `青少年模式守护中 · 每日限额 ${security.youthDailyLimitMin} 分钟 · 已屏蔽陌生人消息`}
            </span>
            <button
              onClick={() => setSection('security')}
              className="underline text-sky-300 hover:text-white"
            >
              管理模式
            </button>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-hidden">
          {section === 'chat' && (
            <ChatWorkspace
              conversations={conversations}
              activeConvId={activeConvId}
              onSelectConv={(id) => {
                setActiveConvId(id);
                setConversations((prev) =>
                  prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
                );
              }}
              messagesByConv={messagesByConv}
              contacts={contacts}
              dressUp={dressUp}
              perConversationDressUp={perConversationDressUp}
              onUpdateConvDressUp={(cid, patch) => {
                if (patch === null) {
                  setPerConversationDressUp((prev) => {
                    const next = { ...prev };
                    delete next[cid];
                    return next;
                  });
                  showToast('已恢复该会话为全局默认装扮');
                } else {
                  setPerConversationDressUp((prev) => ({
                    ...prev,
                    [cid]: {
                      ...(prev[cid] || {}),
                      ...patch,
                      ...(patch.customBubble
                        ? {
                            customBubble: {
                              ...(prev[cid]?.customBubble || dressUp.customBubble),
                              ...patch.customBubble,
                            },
                          }
                        : {}),
                    },
                  }));
                }
              }}
              onOpenDressUpStudio={() => setSection('dressup')}
              minimalMode={minimalMode}
              careMode={careMode}
              highlightedMessageId={highlightedMessageId}
              onClearHighlight={() => setHighlightedMessageId(null)}
              onSendMessage={(cid, partial) => handleSendMessage(cid, partial)}
              onRecallMessage={handleRecallMessage}
              onTranslateMessage={handleTranslateMessage}
              onFavoriteMessage={(msg, convTitle) => {
                setFavorites((prev) => [
                  {
                    id: `fav-${Date.now()}`,
                    category: msg.type === 'image' ? 'image' : 'chat',
                    title: `${msg.senderName} 的发言`,
                    content: msg.content,
                    sourceName: convTitle,
                    savedAt: '刚刚',
                    mediaUrl: msg.mediaUrl,
                  },
                  ...prev,
                ]);
                showToast('已加入「我的收藏」');
              }}
              onToggleEssence={(cid, mid) => {
                setMessagesByConv((prev) => ({
                  ...prev,
                  [cid]: (prev[cid] || []).map((m) =>
                    m.id === mid ? { ...m, isEssence: !m.isEssence } : m
                  ),
                }));
              }}
              onDeleteMessages={(cid, mids) => {
                setMessagesByConv((prev) => ({
                  ...prev,
                  [cid]: (prev[cid] || []).filter((m) => !mids.includes(m.id)),
                }));
              }}
              onVotePoll={(cid, mid, optId) => {
                setMessagesByConv((prev) => ({
                  ...prev,
                  [cid]: (prev[cid] || []).map((m) => {
                    if (m.id !== mid || !m.poll) return m;
                    return {
                      ...m,
                      poll: {
                        ...m.poll,
                        options: m.poll.options.map((o) => {
                          const withoutMe = o.voterIds.filter((id) => id !== 'me');
                          if (o.id === optId) {
                            return {
                              ...o,
                              voterIds: o.voterIds.includes('me')
                                ? withoutMe
                                : [...withoutMe, 'me'],
                            };
                          }
                          return m.poll!.multiSelect ? o : { ...o, voterIds: withoutMe };
                        }),
                      },
                    };
                  }),
                }));
              }}
              onAppendSolitaire={(cid, mid, value) => {
                setMessagesByConv((prev) => ({
                  ...prev,
                  [cid]: (prev[cid] || []).map((m) => {
                    if (m.id !== mid || !m.solitaire) return m;
                    return {
                      ...m,
                      solitaire: {
                        ...m.solitaire,
                        entries: [
                          ...m.solitaire.entries,
                          {
                            index: m.solitaire.entries.length + 1,
                            authorId: 'me',
                            authorName: ME_PROFILE.name,
                            value,
                            time: new Date().toTimeString().slice(0, 5),
                          },
                        ],
                      },
                    };
                  }),
                }));
              }}
              onToggleHomeworkSubmit={(cid, mid) => {
                setMessagesByConv((prev) => ({
                  ...prev,
                  [cid]: (prev[cid] || []).map((m) => {
                    if (m.id !== mid || !m.homework) return m;
                    const exists = m.homework.submittedUserIds.includes('me');
                    return {
                      ...m,
                      homework: {
                        ...m.homework,
                        submittedUserIds: exists
                          ? m.homework.submittedUserIds.filter((x) => x !== 'me')
                          : [...m.homework.submittedUserIds, 'me'],
                      },
                    };
                  }),
                }));
              }}
              onUpdateConversation={(cid, patch) => {
                setConversations((prev) =>
                  prev.map((c) => (c.id === cid ? { ...c, ...patch } : c))
                );
              }}
              onOpenCreateGroup={() => setCreateGroupOpen(true)}
              onOpenPartialCopy={(msg) => setPartialCopyMsg(msg)}
              onOpenForwardMessages={(msgs) => {
                setForwardPayload({
                  summary: `${msgs.length} 条精选消息`,
                  items: msgs.map((m) => ({
                    type: m.type,
                    content: m.content,
                    file: m.file,
                  })),
                });
              }}
              onOpenScreenshot={() => {
                setScreenshotInitialMode('capture');
                setScreenshotOpen(true);
              }}
              onOpenDoodle={() => {
                setScreenshotInitialMode('doodle');
                setScreenshotOpen(true);
              }}
              onStartOrJoinCall={handleStartOrJoinCall}
              onToggleP2pPause={handleToggleP2pPause}
              onJumpToContact={() => setSection('contacts')}
              onToggleReaction={handleToggleReaction}
              onTranscribeVoice={handleTranscribeVoice}
              onClaimRedPacket={handleClaimRedPacket}
              onSendRedPacket={handleSendRedPacket}
              onOpenChannelsTab={() => setSection('channels')}
              onBurnMessage={(cid, mid, action) => {
                setMessagesByConv((prev) => ({
                  ...prev,
                  [cid]: (prev[cid] || []).map((m) => {
                    if (m.id !== mid) return m;
                    if (action === 'reveal') {
                      return m.burnRevealedAt ? m : { ...m, burnRevealedAt: Date.now() };
                    }
                    return { ...m, burned: true, content: '[该消息已阅后即焚]' };
                  }),
                }));
              }}
              onTogglePomodoroJoin={(cid, mid) => {
                setMessagesByConv((prev) => ({
                  ...prev,
                  [cid]: (prev[cid] || []).map((m) => {
                    if (m.id !== mid || !m.pomodoro) return m;
                    const joined = m.pomodoro.joinedUserIds.includes('me');
                    return {
                      ...m,
                      pomodoro: {
                        ...m.pomodoro,
                        joinedUserIds: joined
                          ? m.pomodoro.joinedUserIds.filter((id) => id !== 'me')
                          : [...m.pomodoro.joinedUserIds, 'me'],
                      },
                    };
                  }),
                }));
              }}
              walletBalance={walletBalance}
              uiLayout={uiLayout}
              profile={profile}
              moodBeacon={moodBeacon}
              moodOptions={MOOD_BEACON_OPTIONS}
              onSelectMoodBeacon={(m) => {
                setMoodBeacon(m);
                showToast(`已点亮今日星语「${m.emoji} ${m.label}」`);
              }}
              onNavigateSection={setSection}
              notifications={notifications}
              onUpdateNotifications={(patch) =>
                setNotifications((p) => ({ ...p, ...patch }))
              }
              onOpenFullSoundSettings={() => {
                setSecurityInitialTab('notifications');
                setSection('security');
              }}
              onOpenFullVisualSettings={() => {
                setSecurityInitialTab('visual');
                setSection('security');
              }}
              onOpenUserProfile={openUserProfile}
              onOpenLevelCenter={() => setLevelCenterOpen(true)}
              chatFolders={chatFolders}
              onCreateChatFolder={(name, color, conversationIds, initialArchive) => {
                setChatFolders((prev) => [
                  ...prev,
                  {
                    id: `folder-${Date.now()}`,
                    name,
                    color,
                    conversationIds,
                    archivedMessages: initialArchive ? [initialArchive] : [],
                  },
                ]);
                showToast(
                  initialArchive
                    ? `已新建分组「${name}」并归档消息`
                    : `已新建消息分组「${name}」`
                );
              }}
              onDeleteChatFolder={(folderId) => {
                setChatFolders((prev) => prev.filter((f) => f.id !== folderId));
                showToast('已删除消息分组');
              }}
              onToggleConversationInFolder={(folderId, convId) => {
                setChatFolders((prev) =>
                  prev.map((f) =>
                    f.id !== folderId
                      ? f
                      : {
                          ...f,
                          conversationIds: f.conversationIds.includes(convId)
                            ? f.conversationIds.filter((id) => id !== convId)
                            : [...f.conversationIds, convId],
                        }
                  )
                );
              }}
              onAssignConversationToFolder={(folderId, convId) => {
                setChatFolders((prev) =>
                  prev.map((f) =>
                    f.id !== folderId || f.conversationIds.includes(convId)
                      ? f
                      : {
                          ...f,
                          conversationIds: [...f.conversationIds, convId],
                        }
                  )
                );
                const targetFolder = chatFolders.find((f) => f.id === folderId);
                const targetConv = conversations.find((c) => c.id === convId);
                if (targetFolder && targetConv) {
                  showToast(`已将「${targetConv.title}」归入「${targetFolder.name}」`);
                }
              }}
              onArchiveMessageToFolder={(folderId, msg, conversationId, conversationTitle) => {
                const previousFolder = chatFolders.find((f) =>
                  (f.archivedMessages || []).some((a) => a.messageId === msg.id)
                );
                const targetFolder = chatFolders.find((f) => f.id === folderId);
                if (!targetFolder) return;
                const entry: ArchivedMessageItem = {
                  id: `arch-${msg.id}`,
                  messageId: msg.id,
                  conversationId,
                  conversationTitle,
                  senderName: msg.senderName,
                  senderAvatar: msg.senderAvatar,
                  content: msg.content || `[${msg.type}]`,
                  type: msg.type,
                  timestamp: msg.timestamp,
                  archivedAt: new Date().toTimeString().slice(0, 5),
                };
                setChatFolders((prev) =>
                  prev.map((f) => {
                    const cleaned = (f.archivedMessages || []).filter(
                      (a) => a.messageId !== msg.id
                    );
                    if (f.id === folderId) {
                      return {
                        ...f,
                        archivedMessages: [entry, ...cleaned],
                      };
                    }
                    return {
                      ...f,
                      archivedMessages: cleaned,
                    };
                  })
                );
                showToast(
                  previousFolder && previousFolder.id !== folderId
                    ? `已将消息从「${previousFolder.name}」移至「${targetFolder.name}」归档`
                    : `已将消息归档至分组「${targetFolder.name}」`
                );
              }}
              onRemoveArchivedMessage={(folderId, messageId) => {
                setChatFolders((prev) =>
                  prev.map((f) =>
                    f.id !== folderId
                      ? f
                      : {
                          ...f,
                          archivedMessages: (f.archivedMessages || []).filter(
                            (a) => a.messageId !== messageId
                          ),
                        }
                  )
                );
                showToast('已将消息移出归档分组');
              }}
              onJumpToMessage={(convId, msgId) => {
                setActiveConvId(convId);
                setHighlightedMessageId(msgId);
              }}
              chatBackgrounds={chatBackgrounds}
              onUpdateChatBackground={(target, next) => {
                if (target === 'all' && next) {
                  setChatBackgrounds({ defaultBg: next, perConversation: {} });
                  showToast('已将聊天背景应用到全部会话');
                } else if (target === 'reset_conv') {
                  setChatBackgrounds((prev) => {
                    const nextPer = { ...prev.perConversation };
                    delete nextPer[activeConvId];
                    return { ...prev, perConversation: nextPer };
                  });
                  showToast('已恢复默认聊天背景');
                } else if (next) {
                  setChatBackgrounds((prev) => ({
                    ...prev,
                    perConversation: {
                      ...prev.perConversation,
                      [target]: next,
                    },
                  }));
                }
              }}
            />
          )}

          {section === 'channels' && (
            <ChannelsPanel
              channels={channels}
              onOpenUserProfile={openUserProfile}
              onToggleJoinChannel={(channelId) => {
                setChannels((prev) =>
                  prev.map((ch) =>
                    ch.id === channelId
                      ? {
                          ...ch,
                          joined: !ch.joined,
                          memberCount: ch.joined ? ch.memberCount - 1 : ch.memberCount + 1,
                        }
                      : ch
                  )
                );
              }}
              onCreateThread={(channelId, subChannelId, title, content) => {
                setChannels((prev) =>
                  prev.map((ch) =>
                    ch.id === channelId
                      ? {
                          ...ch,
                          threads: [
                            {
                              id: `th-${Date.now()}`,
                              subChannelId,
                              authorName: ME_PROFILE.name,
                              authorAvatar: ME_PROFILE.avatar,
                              title,
                              content,
                              createdAt: '刚刚',
                              likes: 0,
                              likedByMe: false,
                              replies: [],
                            },
                            ...ch.threads,
                          ],
                        }
                      : ch
                  )
                );
                showToast('频道主题帖已发布');
              }}
              onLikeThread={(channelId, threadId) => {
                setChannels((prev) =>
                  prev.map((ch) =>
                    ch.id === channelId
                      ? {
                          ...ch,
                          threads: ch.threads.map((th) =>
                            th.id === threadId
                              ? {
                                  ...th,
                                  likedByMe: !th.likedByMe,
                                  likes: th.likedByMe ? th.likes - 1 : th.likes + 1,
                                }
                              : th
                          ),
                        }
                      : ch
                  )
                );
              }}
              onReplyThread={(channelId, threadId, text) => {
                setChannels((prev) =>
                  prev.map((ch) =>
                    ch.id === channelId
                      ? {
                          ...ch,
                          threads: ch.threads.map((th) =>
                            th.id === threadId
                              ? {
                                  ...th,
                                  replies: [
                                    ...th.replies,
                                    {
                                      id: `rep-${Date.now()}`,
                                      authorName: ME_PROFILE.name,
                                      text,
                                      time: new Date().toTimeString().slice(0, 5),
                                    },
                                  ],
                                }
                              : th
                          ),
                        }
                      : ch
                  )
                );
              }}
              onToggleVoiceRoom={(channelId, subChannelId) => {
                setChannels((prev) =>
                  prev.map((ch) => {
                    if (ch.id !== channelId) return ch;
                    return {
                      ...ch,
                      subChannels: ch.subChannels.map((sub) => {
                        if (sub.id !== subChannelId) return sub;
                        const members = sub.voiceMembers || [];
                        const inRoom = members.some((m) => m.id === 'me');
                        return {
                          ...sub,
                          voiceMembers: inRoom
                            ? members.filter((m) => m.id !== 'me')
                            : [
                                ...members,
                                {
                                  id: 'me',
                                  name: ME_PROFILE.name,
                                  avatar: ME_PROFILE.avatar,
                                  speaking: true,
                                },
                              ],
                        };
                      }),
                    };
                  })
                );
              }}
            />
          )}

          {section === 'contacts' && (
            <ContactsPanel
              contacts={contacts}
              myAccountId={profile.qqNumber}
              myDisplayName={profile.name}
              currentUid={authUser && authUser.emailVerified ? authUser.uid : undefined}
              friendRequests={friendRequests}
              onOpenAuthModal={() => setAuthModalOpen(true)}
              onSendFriendRequest={handleSendFriendRequest}
              onAcceptFriendRequest={handleAcceptFriendRequest}
              onRejectFriendRequest={handleRejectFriendRequest}
              onCancelFriendRequest={handleCancelFriendRequest}
              onLookupAccountById={handleLookupAccountById}
              onUpdateContact={(id, patch) => {
                setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
                if (authUser && authUser.emailVerified) {
                  void updateFriendInFirestore(authUser.uid, id, {
                    remark: patch.remark,
                    groupName: patch.groupName,
                    starred: patch.starred,
                  });
                }
              }}
              onDeleteContact={(id) => {
                setContacts((prev) => prev.filter((c) => c.id !== id));
                if (authUser && authUser.emailVerified) {
                  void deleteFriendFromFirestore(authUser.uid, id);
                }
              }}
              onAddContact={(c) => {
                setContacts((prev) =>
                  prev.some((x) => x.id === c.id || x.qqNumber === c.qqNumber) ? prev : [c, ...prev]
                );
                if (authUser && authUser.emailVerified) {
                  void saveFriendToFirestore(authUser.uid, c);
                }
                showToast(`已添加好友 ${c.name}（星涟号 ${c.qqNumber}）`);
              }}
              onStartChat={handleStartSingleChat}
              onStartCall={handleCallContact}
              onViewProfile={(contact) => setViewingProfileContact(contact)}
              onVisitQzone={handleVisitFriendQzone}
              onOpenLevelCenter={() => setLevelCenterOpen(true)}
              security={security}
              onUpdateSecurity={(patch) => setSecurity((p) => ({ ...p, ...patch }))}
              minimalMode={minimalMode}
            />
          )}

          {section === 'qzone' && (
            <QzonePanel
              posts={qzonePosts}
              photos={qzonePhotos}
              guestbook={guestbook}
              contacts={contacts}
              viewingOwner={
                viewingQzoneOwner
                  ? contacts.find((c) => c.id === viewingQzoneOwner.id) || viewingQzoneOwner
                  : null
              }
              onBackToMyQzone={() => setViewingQzoneOwner(null)}
              onOpenUserProfile={openUserProfile}
              youthHideQzone={mode === 'youth' && security.youthHideQzone}
              onAddPost={(post) => {
                setQzonePosts((prev) => [post, ...prev]);
                handleClaimGrowthTask('qzone_interact', true);
              }}
              onToggleLike={(postId) => {
                setQzonePosts((prev) =>
                  prev.map((p) => {
                    if (p.id !== postId) return p;
                    const exists = p.likes.some((l) => l.userId === 'me');
                    return {
                      ...p,
                      likes: exists
                        ? p.likes.filter((l) => l.userId !== 'me')
                        : [...p.likes, { userId: 'me', name: ME_PROFILE.name }],
                    };
                  })
                );
                handleClaimGrowthTask('qzone_interact', true);
              }}
              onReactPost={(postId, emoji) => {
                setQzonePosts((prev) =>
                  prev.map((p) => {
                    if (p.id !== postId) return p;
                    const list = p.reactions || [];
                    const existing = list.find((r) => r.emoji === emoji);
                    const nextReactions = existing
                      ? list
                          .map((r) =>
                            r.emoji === emoji
                              ? {
                                  ...r,
                                  userIds: r.userIds.includes('me')
                                    ? r.userIds.filter((u) => u !== 'me')
                                    : [...r.userIds, 'me'],
                                }
                              : r
                          )
                          .filter((r) => r.userIds.length > 0)
                      : [...list, { emoji, userIds: ['me'] }];
                    return { ...p, reactions: nextReactions };
                  })
                );
                handleClaimGrowthTask('qzone_interact', true);
              }}
              onVotePostPoll={(postId, optionId) => {
                setQzonePosts((prev) =>
                  prev.map((p) => {
                    if (p.id !== postId || !p.poll) return p;
                    return {
                      ...p,
                      poll: {
                        ...p.poll,
                        options: p.poll.options.map((opt) => {
                          const cleaned = opt.voterIds.filter((id) => id !== 'me');
                          return opt.id === optionId
                            ? { ...opt, voterIds: [...cleaned, 'me'] }
                            : { ...opt, voterIds: cleaned };
                        }),
                      },
                    };
                  })
                );
                handleClaimGrowthTask('qzone_interact', true);
                showToast('投票已记录');
              }}
              onAddComment={(postId, content, replyTo) => {
                setQzonePosts((prev) =>
                  prev.map((p) =>
                    p.id === postId
                      ? {
                          ...p,
                          comments: [
                            ...p.comments,
                            {
                              id: `qc-${Date.now()}`,
                              authorName: profile.name,
                              replyTo,
                              content,
                              time: '刚刚',
                              likes: [],
                            },
                          ],
                        }
                      : p
                  )
                );
                handleClaimGrowthTask('qzone_interact', true);
              }}
              onLikeComment={(postId, commentId) => {
                setQzonePosts((prev) =>
                  prev.map((p) =>
                    p.id === postId
                      ? {
                          ...p,
                          comments: p.comments.map((c) => {
                            if (c.id !== commentId) return c;
                            const cur = c.likes || [];
                            return {
                              ...c,
                              likes: cur.includes('me')
                                ? cur.filter((u) => u !== 'me')
                                : [...cur, 'me'],
                            };
                          }),
                        }
                      : p
                  )
                );
              }}
              onSendGift={(postId, giftName) => {
                setQzonePosts((prev) =>
                  prev.map((p) =>
                    p.id === postId
                      ? { ...p, gifts: [...p.gifts, { fromName: profile.name, giftName }] }
                      : p
                  )
                );
                handleClaimGrowthTask('qzone_interact', true);
                showToast(`已向动态赠送「${giftName}」`);
              }}
              onToggleBookmarkPost={(postId) => {
                setQzonePosts((prev) =>
                  prev.map((p) =>
                    p.id === postId ? { ...p, bookmarkedByMe: !p.bookmarkedByMe } : p
                  )
                );
                showToast('已更新空间动态收藏');
              }}
              onRepostToQzone={(post) => {
                const reposted: QzonePost = {
                  id: `qz-repost-${Date.now()}`,
                  authorId: ME_PROFILE.id,
                  authorName: profile.name,
                  authorAvatar: profile.avatar,
                  kind: 'shuoshuo',
                  content: `转发了 ${post.authorName} 的动态，一起来围观~`,
                  images: [],
                  tags: post.tags.slice(0, 2),
                  mentions: [],
                  mood: '✨ 分享好内容',
                  visibility: 'public',
                  isAiGenerated: false,
                  autoDelete24h: false,
                  views: 1,
                  createdAt: '刚刚',
                  likes: [],
                  reactions: [],
                  gifts: [],
                  repostFrom: {
                    authorName: post.authorName,
                    content: post.content,
                    image: post.images[0],
                  },
                  comments: [],
                };
                setQzonePosts((prev) => [reposted, ...prev]);
                handleClaimGrowthTask('qzone_interact', true);
                showToast('已转发至你的星涟空间');
              }}
              onForwardPostToChat={(post) => {
                setForwardPayload({
                  summary: `${post.authorName} 的星涟空间动态`,
                  items: [
                    {
                      type: 'text',
                      content: `【星涟空间动态分享】来自 ${post.authorName}：\n${post.content}`,
                    },
                  ],
                });
              }}
              onAddGuestbook={(content) => {
                setGuestbook((prev) => [
                  {
                    id: `gb-${Date.now()}`,
                    authorName: profile.name,
                    authorAvatar: profile.avatar,
                    content,
                    time: '刚刚',
                  },
                  ...prev,
                ]);
                handleClaimGrowthTask('qzone_interact', true);
              }}
              onUpdatePhoto={(photoId, patch) => {
                setQzonePhotos((prev) =>
                  prev.map((ph) => (ph.id === photoId ? { ...ph, ...patch } : ph))
                );
              }}
              onOpenChannels={() => setSection('channels')}
              onOpenProfile={() => setSection('profile')}
            />
          )}

          {section === 'profile' && (
            <ProfileCenterPanel
              profile={profile}
              onUpdateProfile={(patch) => {
                setProfile((p) => {
                  const next = { ...p, ...patch };
                  if (authUser && authUser.emailVerified && cloudAccount) {
                    void updateCloudProfile(authUser.uid, cloudAccount.accountId, {
                      name: next.name,
                      avatar: next.avatar,
                      signature: next.signature,
                      level: next.level,
                      activeDays: next.activeDays,
                      platform: activePlatformView,
                      online: true,
                    });
                  }
                  return next;
                });
              }}
              dressUp={dressUp}
              onlineStatus={onlineStatus}
              walletBalance={walletBalance}
              transactions={walletTransactions}
              onRechargeWallet={(amt) => {
                setWalletBalance((p) => Number((p + amt).toFixed(2)));
                setWalletTransactions((prev) => [
                  {
                    id: `tx-${Date.now()}`,
                    title: '零钱钱包在线充值',
                    amount: amt,
                    kind: 'in',
                    time: new Date().toTimeString().slice(0, 5),
                  },
                  ...prev,
                ]);
                showToast(`已成功充值 ¥${amt.toFixed(2)}`);
              }}
              favoritesCount={favorites.length}
              photosCount={qzonePhotos.length}
              postsCount={qzonePosts.length}
              onNavigate={setSection}
              onOpenLevelCenter={() => setLevelCenterOpen(true)}
              minimalMode={minimalMode}
              boundEmail={security.boundEmail}
              authProviderLabel={security.authProviderLabel}
              onOpenAuthModal={() => setAuthModalOpen(true)}
            />
          )}

          {section === 'files' && (
            <FilesAndFlashPanel
              storedFiles={storedFiles}
              flashBatches={flashBatches}
              p2pTransfers={p2pTransfers}
              conversations={conversations}
              onToggleP2pPause={handleToggleP2pPause}
              onCreateFlashBatch={(batch) => {
                setFlashBatches((prev) => [batch, ...prev]);
                showToast(`极速快传已创建（提取码 ${batch.shareCode}）`);
              }}
              onAddFileToFlashBatch={(batchId, file) => {
                setFlashBatches((prev) =>
                  prev.map((b) =>
                    b.id === batchId ? { ...b, files: [...b.files, file] } : b
                  )
                );
              }}
              onDeleteFileFromFlashBatch={(batchId, fileId) => {
                setFlashBatches((prev) =>
                  prev.map((b) =>
                    b.id === batchId
                      ? { ...b, files: b.files.filter((f) => f.id !== fileId) }
                      : b
                  )
                );
              }}
              onUpdateFlashExpiry={(batchId, expiryDays) => {
                setFlashBatches((prev) =>
                  prev.map((b) =>
                    b.id === batchId
                      ? {
                          ...b,
                          expiryDays,
                          expiresAt: expiryDays === 90 ? '2027-02-17' : '2027-05-18',
                        }
                      : b
                  )
                );
              }}
              onBatchDeleteFiles={(ids) => {
                setStoredFiles((prev) => prev.filter((f) => !ids.includes(f.id)));
              }}
              onBatchForwardFiles={(files) => {
                setForwardPayload({
                  summary: `${files.length} 个聊天文件`,
                  items: files.map((f) => ({
                    type: 'file',
                    content: `转发文件 ${f.name}`,
                    file: {
                      id: `fwd-${Date.now()}-${Math.random()}`,
                      name: f.name,
                      sizeBytes: f.sizeBytes,
                      fileType: f.fileType,
                      progress: 100,
                    },
                  })),
                });
              }}
              onLocateInChat={(convId, messageId) => {
                setActiveConvId(convId);
                setHighlightedMessageId(messageId);
                setSection('chat');
              }}
              onShowToast={showToast}
            />
          )}

          {section === 'office' && (
            <OfficeToolsPanel
              mails={mails}
              onSendMail={(m) => {
                setMails((prev) => [m, ...prev]);
                showToast('邮件已发送');
              }}
              schedules={schedules}
              onAddSchedule={(ev) => {
                setSchedules((prev) => [ev, ...prev]);
                showToast('已添加日程提醒');
              }}
              favorites={favorites}
              onOpenScreenshotModal={() => {
                setScreenshotInitialMode('capture');
                setScreenshotOpen(true);
              }}
              onShareDocToGroup={(docTitle, docSummary) => {
                handleSendMessage('conv-group-dev', {
                  type: 'text',
                  content: `【协同云文档分享】《${docTitle}》\n摘要：${docSummary}`,
                });
                setActiveConvId('conv-group-dev');
                setSection('chat');
              }}
            />
          )}

          {section === 'dressup' && (
            <DressUpPanel
              dressUp={dressUp}
              perConversationDressUp={perConversationDressUp}
              conversations={conversations}
              contacts={contacts}
              onChangeDressUp={(patch) => setDressUp((p) => ({ ...p, ...patch }))}
              onUpdateConvDressUp={(cid, patch) => {
                if (patch === null) {
                  setPerConversationDressUp((prev) => {
                    const next = { ...prev };
                    delete next[cid];
                    return next;
                  });
                  showToast('已重置该会话为全局默认装扮');
                } else {
                  setPerConversationDressUp((prev) => ({
                    ...prev,
                    [cid]: {
                      ...(prev[cid] || {}),
                      ...patch,
                      ...(patch.customBubble
                        ? {
                            customBubble: {
                              ...(prev[cid]?.customBubble || dressUp.customBubble),
                              ...patch.customBubble,
                            },
                          }
                        : {}),
                    },
                  }));
                }
              }}
              minimalMode={minimalMode}
            />
          )}

          {section === 'security' && (
            <SecurityAndModesPanel
              key={securityInitialTab}
              initialSubTab={securityInitialTab}
              mode={mode}
              onChangeMode={(next) => {
                setMode(next);
                showToast(
                  next === 'standard'
                    ? '已切回标准模式'
                    : next === 'minimal'
                    ? '已启用简洁降噪模式'
                    : next === 'care'
                    ? '已启用关怀大字模式'
                    : '已启用青少年守护模式'
                );
              }}
              security={security}
              onUpdateSecurity={(patch) => setSecurity((p) => ({ ...p, ...patch }))}
              notifications={notifications}
              onUpdateNotifications={(patch) =>
                setNotifications((p) => ({ ...p, ...patch }))
              }
              devices={devices}
              conversations={conversations}
              onKickDevice={(deviceId) => {
                setDevices((prev) => prev.filter((d) => d.id !== deviceId));
                broadcastWs({ type: 'device:kick', deviceId });
                showToast('已远程强制下线该设备');
              }}
              onOpenAuthModal={() => setAuthModalOpen(true)}
            />
          )}

          {section === 'sync' && (
            <MultiDeviceSyncPanel
              devices={devices}
              wsConnected={wsConnected}
              activePlatformView={activePlatformView}
              onSelectPlatformView={(p) => {
                setActivePlatformView(p);
                showToast(`当前视口已切换同步至 ${p} 终端身份`);
              }}
              dualMobileTabletOnline={dualMobileTabletOnline}
              onToggleDualMobileTablet={() =>
                setDualMobileTabletOnline(!dualMobileTabletOnline)
              }
              onTriggerManualSync={() => {
                setLastSyncTime(new Date().toTimeString().slice(0, 5));
                showToast('全端好友列表与聊天记录已同步完成');
              }}
              lastSyncTime={lastSyncTime}
              onOpenCompanionDrawer={() => setCompanionDrawerOpen(true)}
              myAccountId={profile.qqNumber}
              onShowToast={showToast}
            />
          )}
        </div>
      </main>

      {/* Right Companion Drawer: Enhanced 5-Platform Real-Time Sync Mirror */}
      {companionDrawerOpen && (
        <CompanionSyncPreview
          platform={companionPlatform}
          onChangePlatform={(p) => {
            setCompanionPlatform(p);
            showToast(`同屏同步镜像已切换为 ${p} 客户端视角`);
          }}
          conversation={conversations.find((c) => c.id === activeConvId)}
          messages={messagesByConv[activeConvId] || []}
          myName={profile.name}
          wsConnected={wsConnected}
          lastSyncTime={lastSyncTime}
          draft={companionDraft}
          onDraftChange={setCompanionDraft}
          onSendFromCompanion={(text) => {
            handleSendMessage(
              activeConvId,
              { type: 'text', content: text },
              `${profile.name} (${companionPlatform})`
            );
            setCompanionDraft('');
          }}
          onOpenTestReport={() => {
            setSection('sync');
            showToast('已跳转至跨端测试报告与实时诊断中心');
          }}
          onClose={() => setCompanionDrawerOpen(false)}
        />
      )}

      {/* Global Call Overlay */}
      <CallOverlay
        call={activeCall}
        onUpdateCall={(updater) => {
          setActiveCall((prev) => {
            if (!prev) return null;
            const next = updater(prev);
            setConversations((convs) =>
              convs.map((c) =>
                c.id === next.conversationId ? { ...c, activeCall: next } : c
              )
            );
            return next;
          });
        }}
        onHangUp={handleHangUpCall}
        onInviteMore={() => showToast('已向群内在线好友发送通话邀请')}
      />

      {/* Global Modals */}
      <CreateGroupModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        contacts={contacts}
        conversations={conversations}
        currentUserName={profile.name}
        currentUserAvatar={profile.avatar}
        onCreateGroup={(title, maxMembers, members) => {
          const cloudMemberUids = members
            .filter((m) => m.id.startsWith('uid-'))
            .map((m) => m.id.replace(/^uid-/, ''));
          if (authUser && authUser.emailVerified && effectiveCloudAccount && cloudMemberUids.length > 0) {
            void createGroupCloudChat(effectiveCloudAccount, title, cloudMemberUids)
              .then((cloudGroupId) => {
                const newCloudGroup: Conversation = {
                  id: cloudGroupId,
                  kind: 'group',
                  title,
                  pinned: false,
                  muted: false,
                  unreadCount: 0,
                  lastMessagePreview: '云端群聊已创建，欢迎加入',
                  lastMessageTime: '刚刚',
                  maxMembers: 50,
                  memberCount: cloudMemberUids.length + 1,
                  members,
                  announcement: '云端多用户实时群聊已就绪！',
                  quickBar: [
                    { id: 'notices', label: '通知', enabled: true },
                    { id: 'toolbox', label: '工具箱', enabled: true },
                    { id: 'directory', label: '通讯录', enabled: true },
                    { id: 'docs', label: '文档', enabled: true },
                    { id: 'channel', label: '频道', enabled: true },
                  ],
                  checkIns: [],
                };
                setConversations((prev) =>
                  prev.some((c) => c.id === cloudGroupId) ? prev : [newCloudGroup, ...prev]
                );
                setActiveConvId(cloudGroupId);
                setSection('chat');
                showToast(`已创建云端多人群聊「${title}」`);
              })
              .catch((err) => {
                showToast(err instanceof Error ? err.message : '创建云端群聊失败');
              });
            return;
          }

          const newGroup: Conversation = {
            id: `conv-g-${Date.now()}`,
            kind: 'group',
            title,
            pinned: false,
            muted: false,
            unreadCount: 0,
            lastMessagePreview: `群聊已创建（最高支持 ${maxMembers} 人）`,
            lastMessageTime: '刚刚',
            maxMembers,
            memberCount: members.length,
            members,
            announcement: '欢迎大家加入新群！',
            quickBar: [
              { id: 'notices', label: '通知', enabled: true },
              { id: 'toolbox', label: '工具箱', enabled: true },
              { id: 'directory', label: '通讯录', enabled: true },
              { id: 'docs', label: '文档', enabled: true },
              { id: 'channel', label: '频道', enabled: true },
            ],
            checkIns: [],
          };
          setConversations((prev) => [newGroup, ...prev]);
          setActiveConvId(newGroup.id);
          setSection('chat');
          showToast(`成功创建 ${maxMembers} 人规模群聊「${title}」`);
        }}
      />

      <PartialCopyModal
        message={partialCopyMsg}
        onClose={() => setPartialCopyMsg(null)}
        onCopied={(slice) => showToast(`已复制片段：「${slice.slice(0, 18)}」`)}
      />

      <ForwardModal
        open={Boolean(forwardPayload)}
        summaryLabel={forwardPayload?.summary || ''}
        conversations={conversations}
        onClose={() => setForwardPayload(null)}
        onForwardTo={(targetConvId) => {
          if (!forwardPayload) return;
          forwardPayload.items.forEach((item) => {
            handleSendMessage(targetConvId, item);
          });
          setActiveConvId(targetConvId);
          setSection('chat');
          showToast('转发成功');
        }}
      />

      <ScreenshotStudioModal
        open={screenshotOpen}
        initialMode={screenshotInitialMode}
        onClose={() => setScreenshotOpen(false)}
        activeConvTitle={
          conversations.find((c) => c.id === activeConvId)?.title || '星涟会话'
        }
        activeMessages={messagesByConv[activeConvId] || []}
        onToast={showToast}
        onSendToChat={(dataUrl) => {
          handleSendMessage(activeConvId, {
            type: 'image',
            content: screenshotInitialMode === 'doodle' ? '随手涂鸦.png' : '星涟截图.png',
            mediaUrl: dataUrl,
          });
          setSection('chat');
          showToast('已发送作品至当前会话');
        }}
        onSendTextToChat={(text) => {
          handleSendMessage(activeConvId, {
            type: 'text',
            content: text,
          });
          setSection('chat');
          showToast('已发送识别文字至当前会话');
        }}
        onPinToScreen={(dataUrl) => {
          setPinnedScreenshots((prev) => [
            ...prev.slice(-2),
            {
              id: `pin-${Date.now()}`,
              dataUrl,
              x: 110 + prev.length * 28,
              y: 80 + prev.length * 24,
              scale: 1,
              opacity: 1,
            },
          ]);
          showToast('已将截图钉在桌面，可拖拽或调整透明度对照');
        }}
        onShareToQzone={(dataUrl, caption) => {
          const newPost: QzonePost = {
            id: `qz-studio-${Date.now()}`,
            authorId: ME_PROFILE.id,
            authorName: profile.name,
            authorAvatar: profile.avatar,
            kind: 'shuoshuo',
            content: caption,
            images: [dataUrl],
            tags: ['灵感涂鸦'],
            mentions: [],
            mood: '🎨 创作分享',
            visibility: 'public',
            isAiGenerated: false,
            autoDelete24h: false,
            views: 1,
            createdAt: '刚刚',
            likes: [],
            reactions: [],
            gifts: [],
            comments: [],
          };
          setQzonePosts((prev) => [newPost, ...prev]);
          handleClaimGrowthTask('qzone_interact', true);
          setSection('qzone');
          showToast('已发布作品到星涟空间动态');
        }}
      />

      <PinnedScreenshotOverlay
        items={pinnedScreenshots}
        onUpdateItem={(id, patch) =>
          setPinnedScreenshots((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
          )
        }
        onCloseItem={(id) =>
          setPinnedScreenshots((prev) => prev.filter((item) => item.id !== id))
        }
        onSendToChat={(dataUrl) => {
          handleSendMessage(activeConvId, {
            type: 'image',
            content: '桌面贴图截图.png',
            mediaUrl: dataUrl,
          });
          setSection('chat');
          showToast('已发送贴图至当前会话');
        }}
      />

      {(() => {
        const activeModalContact = viewingProfileContact
          ? contacts.find((c) => c.id === viewingProfileContact.id) || viewingProfileContact
          : null;
        if (!activeModalContact) return null;
        const isExistingFriend = contacts.some((c) => c.id === activeModalContact.id);
        const sharedGroups = conversations.filter(
          (conv) =>
            conv.kind === 'group' &&
            (conv.members || []).some(
              (m) => m.id === activeModalContact.id || m.name === activeModalContact.name
            )
        );
        const friendPosts = qzonePosts.filter(
          (p) =>
            p.authorId === activeModalContact.id ||
            p.authorName === activeModalContact.name
        );
        const defaultLikes =
          168 + ((activeModalContact.qqNumber.charCodeAt(activeModalContact.qqNumber.length - 1) || 0) % 240);
        const likeState = friendCardLikes[activeModalContact.id] || {
          count: defaultLikes,
          liked: false,
        };
        return (
          <FriendProfileModal
            contact={activeModalContact}
            isExistingFriend={isExistingFriend}
            sharedGroups={sharedGroups}
            friendPosts={friendPosts}
            likesCount={likeState.count}
            likedByMe={likeState.liked}
            minimalMode={minimalMode}
            onClose={() => setViewingProfileContact(null)}
            onToggleLike={(cid) => {
              setFriendCardLikes((prev) => {
                const cur = prev[cid] || { count: defaultLikes, liked: false };
                return {
                  ...prev,
                  [cid]: {
                    liked: !cur.liked,
                    count: cur.liked ? cur.count - 1 : cur.count + 1,
                  },
                };
              });
            }}
            onStartChat={handleStartSingleChat}
            onStartCall={handleCallContact}
            onVisitQzone={handleVisitFriendQzone}
            onUpdateContact={(id, patch) => {
              setContacts((prev) =>
                prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
              );
              setViewingProfileContact((prev) =>
                prev && prev.id === id ? { ...prev, ...patch } : prev
              );
              if (authUser && authUser.emailVerified) {
                void updateFriendInFirestore(authUser.uid, id, {
                  remark: patch.remark,
                  groupName: patch.groupName,
                  starred: patch.starred,
                });
              }
            }}
            onAddFriend={(contact) => {
              if (!contacts.some((c) => c.id === contact.id || c.qqNumber === contact.qqNumber)) {
                setContacts((prev) => [contact, ...prev]);
              }
              if (authUser && authUser.emailVerified) {
                void saveFriendToFirestore(authUser.uid, contact);
              }
              showToast(`已添加好友 ${contact.name}`);
            }}
            onNudge={handleNudgeContact}
            onOpenLevelCenter={() => setLevelCenterOpen(true)}
          />
        );
      })()}

      <QqLevelCenterModal
        open={levelCenterOpen}
        onClose={() => setLevelCenterOpen(false)}
        profile={profile}
        contacts={contacts}
        minimalMode={minimalMode}
        onClaimTask={(taskId) => handleClaimGrowthTask(taskId)}
        onSelectContactProfile={(contact) => setViewingProfileContact(contact)}
      />

      <AuthGateModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        authUser={authUser}
        cloudAccount={cloudAccount}
        allocatingId={allocatingAccountId}
        onJumpToAddById={() => setSection('contacts')}
        onSyncComplete={syncCloudUserAccount}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium shadow-xl border border-slate-700">
          {toast}
        </div>
      )}
      </div>
    </DesktopWindowShell>
  );
}
