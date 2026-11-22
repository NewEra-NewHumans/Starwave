import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArrowRightLeft,
  Bell,
  Bookmark,
  BookOpen,
  Brush,
  CalendarClock,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Copy,
  Crop,
  Crown,
  Dices,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Film,
  Flame,
  FolderInput,
  FolderKanban,
  FolderOpen,
  FolderPlus,
  Forward,
  GraduationCap,
  GripVertical,
  Hand,
  Image as ImageIcon,
  Languages,
  Layers,
  ListChecks,
  ListTodo,
  MapPin,
  Megaphone,
  MessageSquareQuote,
  Mic,
  MoreHorizontal,
  Palette,
  Paperclip,
  Pause,
  Phone,
  Pin,
  PinOff,
  Play,
  Plus,
  Radio,
  Reply,
  RotateCcw,
  Scissors,
  Search,
  Send,
  Settings2,
  Shield,
  Smile,
  SmilePlus,
  Sparkles,
  Star,
  Tag,
  Timer,
  Trash2,
  UserSquare2,
  Users,
  Video,
  Volume2,
  Vote,
  Wand2,
  Waves,
  Wrench,
  X,
  Zap,
  Gift,
} from 'lucide-react';
import { authedAiPost } from '../utils/aiClient';
import {
  ActiveCallState,
  AppSection,
  ArchivedMessageItem,
  ChatBackgroundSetting,
  ChatFolder,
  ChatMemoItem,
  ChatMessage,
  Contact,
  Conversation,
  DressUpConfig,
  GroupQuickBarItem,
  MessageEffectType,
  MessageQuote,
  NotificationSettings,
  UiLayoutStyle,
  UserProfile,
} from '../types/qq';
import { AvatarView } from './AvatarView';
import { QqLevelIcons } from './ProfileCenterPanel';
import { MsImeEmojiPicker } from './MsImeEmojiPicker';
import { SoundEffectsManager } from './SoundEffectsManager';
import { MessageVisualEffectsManager } from './MessageVisualEffectsManager';
import { MessageVisualEffectsOverlay } from './MessageVisualEffectsOverlay';
import {
  ChatBackgroundPicker,
  ChatFeedBackdrop,
} from './ChatBackgroundPicker';
import { ChatFoldersModal } from './ChatFoldersModal';
import { DraggableUnreadBadge } from './DraggableUnreadBadge';
import {
  VoiceBubbleWaveform,
  VoiceRecorderWaveformBar,
} from './VoiceWaveformVisualizer';
import { ME_PROFILE } from '../data/seedData';
import { MS_QUICK_REACTIONS } from '../data/msImeEmojis';
import { exportSolitaireCsv, formatBytes, playTone } from '../utils/qr';
import { playSoundEffect } from '../utils/soundEngine';
import { getContactLevelInfo } from '../utils/qqLevel';
import {
  BUBBLE_PRESETS,
  FONT_PRESETS,
  TYPING_DECOR_PRESETS,
  getBubbleVisualProps,
  getFontClass,
  resolveEffectiveDressUp,
} from '../utils/dressUpCatalog';

interface ChatWorkspaceProps {
  conversations: Conversation[];
  activeConvId: string;
  onSelectConv: (id: string) => void;
  messagesByConv: Record<string, ChatMessage[]>;
  contacts: Contact[];
  dressUp: DressUpConfig;
  perConversationDressUp?: Record<string, Partial<DressUpConfig>>;
  onUpdateConvDressUp?: (convId: string, patch: Partial<DressUpConfig> | null) => void;
  onOpenDressUpStudio?: () => void;
  minimalMode: boolean;
  careMode: boolean;
  highlightedMessageId: string | null;
  onClearHighlight: () => void;
  onSendMessage: (convId: string, msg: Partial<ChatMessage> & { type: ChatMessage['type']; content: string }) => void;
  onRecallMessage: (convId: string, msgId: string) => void;
  onTranslateMessage: (convId: string, msgId: string) => void;
  onFavoriteMessage: (msg: ChatMessage, convTitle: string) => void;
  onToggleEssence: (convId: string, msgId: string) => void;
  onDeleteMessages: (convId: string, msgIds: string[]) => void;
  onVotePoll: (convId: string, msgId: string, optionId: string) => void;
  onAppendSolitaire: (convId: string, msgId: string, value: string) => void;
  onToggleHomeworkSubmit: (convId: string, msgId: string) => void;
  onUpdateConversation: (convId: string, patch: Partial<Conversation>) => void;
  onOpenCreateGroup: () => void;
  onOpenPartialCopy: (msg: ChatMessage) => void;
  onOpenForwardMessages: (msgs: ChatMessage[]) => void;
  onOpenScreenshot: () => void;
  onOpenDoodle?: () => void;
  onStartOrJoinCall: (conv: Conversation, mode: 'audio' | 'video') => void;
  onToggleP2pPause: (fileId: string) => void;
  onJumpToContact: (qqNumber: string) => void;
  onToggleReaction: (convId: string, msgId: string, emoji: string) => void;
  onTranscribeVoice: (convId: string, msgId: string) => void;
  onClaimRedPacket: (convId: string, msgId: string, passwordInput?: string) => string | null;
  onSendRedPacket: (convId: string, kind: 'lucky' | 'password', title: string, amount: number, count: number, password?: string) => void;
  onOpenChannelsTab: () => void;
  onBurnMessage: (convId: string, msgId: string, action: 'reveal' | 'expire') => void;
  onTogglePomodoroJoin: (convId: string, msgId: string) => void;
  walletBalance: number;
  uiLayout?: UiLayoutStyle;
  profile?: UserProfile;
  onNavigateSection?: (sec: AppSection) => void;
  notifications: NotificationSettings;
  onUpdateNotifications: (patch: Partial<NotificationSettings>) => void;
  onOpenFullSoundSettings?: () => void;
  onOpenFullVisualSettings?: () => void;
  onOpenUserProfile?: (target: { id?: string; name: string; avatar?: string }) => void;
  onOpenLevelCenter?: () => void;
  chatFolders: ChatFolder[];
  onCreateChatFolder: (
    name: string,
    color: string,
    conversationIds: string[],
    initialArchive?: ArchivedMessageItem
  ) => void;
  onDeleteChatFolder: (folderId: string) => void;
  onToggleConversationInFolder: (folderId: string, convId: string) => void;
  onAssignConversationToFolder: (folderId: string, convId: string) => void;
  onArchiveMessageToFolder?: (
    folderId: string,
    msg: ChatMessage,
    conversationId: string,
    conversationTitle: string
  ) => void;
  onRemoveArchivedMessage?: (folderId: string, messageId: string) => void;
  onJumpToMessage?: (conversationId: string, messageId: string) => void;
  chatBackgrounds: {
    defaultBg: ChatBackgroundSetting;
    perConversation: Record<string, ChatBackgroundSetting>;
  };
  onUpdateChatBackground: (convId: string | 'all' | 'reset_conv', next?: ChatBackgroundSetting) => void;
  moodBeacon?: { id: string; emoji: string; label: string; accent: string };
  moodOptions?: Array<{ id: string; emoji: string; label: string; accent: string }>;
  onSelectMoodBeacon?: (m: { id: string; emoji: string; label: string; accent: string }) => void;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  conversations,
  activeConvId,
  onSelectConv,
  messagesByConv,
  contacts,
  dressUp,
  perConversationDressUp,
  onUpdateConvDressUp,
  onOpenDressUpStudio,
  minimalMode,
  careMode,
  highlightedMessageId,
  onClearHighlight,
  onSendMessage,
  onRecallMessage,
  onTranslateMessage,
  onFavoriteMessage,
  onToggleEssence,
  onDeleteMessages,
  onVotePoll,
  onAppendSolitaire,
  onToggleHomeworkSubmit,
  onUpdateConversation,
  onOpenCreateGroup,
  onOpenPartialCopy,
  onOpenForwardMessages,
  onOpenScreenshot,
  onOpenDoodle,
  onStartOrJoinCall,
  onToggleP2pPause,
  onJumpToContact,
  onToggleReaction,
  onTranscribeVoice,
  onClaimRedPacket,
  onSendRedPacket,
  onOpenChannelsTab,
  onBurnMessage,
  onTogglePomodoroJoin,
  walletBalance,
  uiLayout = 'modern',
  profile,
  onNavigateSection,
  notifications,
  onUpdateNotifications,
  onOpenFullSoundSettings,
  onOpenFullVisualSettings,
  onOpenUserProfile,
  onOpenLevelCenter,
  chatFolders,
  onCreateChatFolder,
  onDeleteChatFolder,
  onToggleConversationInFolder,
  onAssignConversationToFolder,
  onArchiveMessageToFolder,
  onRemoveArchivedMessage,
  onJumpToMessage,
  chatBackgrounds,
  onUpdateChatBackground,
  moodBeacon,
  moodOptions,
  onSelectMoodBeacon,
}) => {
  const [moodPickerOpen, setMoodPickerOpen] = useState(false);
  const [convSearch, setConvSearch] = useState('');
  const [convFilter, setConvFilter] = useState<string>('all');
  const [convViewMode, setConvViewMode] = useState<'tabs' | 'grouped'>('tabs');
  const [collapsedConvSections, setCollapsedConvSections] = useState<Record<string, boolean>>({});
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderModalPreselectConvId, setFolderModalPreselectConvId] = useState<string | null>(null);
  const [folderModalPreselectArchiveMsg, setFolderModalPreselectArchiveMsg] = useState<{
    msg: ChatMessage;
    conversationId: string;
    conversationTitle: string;
  } | null>(null);
  const [convContextMenu, setConvContextMenu] = useState<{
    convId: string;
    x: number;
    y: number;
  } | null>(null);
  const [draggingConv, setDraggingConv] = useState<{
    convId: string;
    title: string;
    mode: 'right' | 'left';
    x: number;
    y: number;
    hoverFolderId: string | null;
  } | null>(null);
  const [longPressHoldMsgId, setLongPressHoldMsgId] = useState<string | null>(null);
  const [draggingMsg, setDraggingMsg] = useState<{
    msg: ChatMessage;
    convId: string;
    convTitle: string;
    mode: 'longpress' | 'html5';
    x: number;
    y: number;
    hoverFolderId: string | null;
  } | null>(null);
  const [archiveDrawerFolderId, setArchiveDrawerFolderId] = useState<string | null>(null);
  const [quickArchivePopoverMsgId, setQuickArchivePopoverMsgId] = useState<string | null>(null);
  const [dropHintBanner, setDropHintBanner] = useState<string | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const [workspaceWidth, setWorkspaceWidth] = useState<number>(1100);
  const [narrowPane, setNarrowPane] = useState<'list' | 'chat'>('list');

  useEffect(() => {
    const el = workspaceRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWorkspaceWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setWorkspaceWidth(el.clientWidth || 1100);
    return () => observer.disconnect();
  }, []);

  const isNarrowSinglePane = workspaceWidth > 0 && workspaceWidth < 640;
  const isCompactSplitPane = workspaceWidth >= 640 && workspaceWidth < 880;
  const pendingRightDragRef = useRef<{
    convId: string;
    title: string;
    startX: number;
    startY: number;
    activated: boolean;
  } | null>(null);
  const pendingMsgLongPressRef = useRef<{
    msg: ChatMessage;
    convId: string;
    convTitle: string;
    startX: number;
    startY: number;
    timerId: number;
    activated: boolean;
  } | null>(null);
  const suppressContextMenuUntilRef = useRef<number>(0);
  const assignFolderLatestRef = useRef(onAssignConversationToFolder);
  const archiveMsgLatestRef = useRef(onArchiveMessageToFolder);
  const chatFoldersLatestRef = useRef(chatFolders);
  const draggingMsgRef = useRef(draggingMsg);
  assignFolderLatestRef.current = onAssignConversationToFolder;
  archiveMsgLatestRef.current = onArchiveMessageToFolder;
  chatFoldersLatestRef.current = chatFolders;
  draggingMsgRef.current = draggingMsg;

  const [inChatSearchOpen, setInChatSearchOpen] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [draftsByConv, setDraftsByConv] = useState<Record<string, string>>({});
  const [quote, setQuote] = useState<MessageQuote | null>(null);

  const [quickPhrasesOpen, setQuickPhrasesOpen] = useState(false);
  const [phrases, setPhrases] = useState<string[]>([
    '收到，我马上处理 👍',
    '请稍等，正在核对最新进度',
    '文件已上传至群文件，请查收',
    '好的，今天下班前同步给你',
    '辛苦啦，先去喝杯咖啡休息下 ☕',
  ]);
  const [newPhraseInput, setNewPhraseInput] = useState('');
  const [memoInputOpen, setMemoInputOpen] = useState(false);
  const [memoInputText, setMemoInputText] = useState('');
  const [memosExpanded, setMemosExpanded] = useState(true);

  // Pickers & Composer Tools
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [showGroupToolsMenu, setShowGroupToolsMenu] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Multi-select mode
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([]);

  // Solitaire & Poll creators / inputs
  const [solitaireInputs, setSolitaireInputs] = useState<Record<string, string>>({});
  const [createPollOpen, setCreatePollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOpts, setPollOpts] = useState('方案 A：周六上午\n方案 B：周日下午');

  // AI Group Summary Drawer
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState('');
  const [aiSummaryError, setAiSummaryError] = useState('');

  // Right Group Panel (Features & Management)
  const [groupDrawerTab, setGroupDrawerTab] = useState<
    null | 'notices' | 'toolbox' | 'directory' | 'docs' | 'channel' | 'manage'
  >(null);
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [classroomRaisedHand, setClassroomRaisedHand] = useState(false);
  const [livestreamActive, setLivestreamActive] = useState(false);

  // New Feature States: Shake Nudge, Red Packets, AI Smart Reply/Polish, Super Emoji, Burn, Scheduled, TTS
  const [shaking, setShaking] = useState(false);
  const [sendRpOpen, setSendRpOpen] = useState(false);
  const [rpKind, setRpKind] = useState<'lucky' | 'password'>('lucky');
  const [rpTitle, setRpTitle] = useState('恭喜发财，大吉大利！');
  const [rpAmount, setRpAmount] = useState('20');
  const [rpCount, setRpCount] = useState('5');
  const [rpPassword, setRpPassword] = useState('LUCKY888');
  const [viewingRpMsgId, setViewingRpMsgId] = useState<string | null>(null);
  const [rpClaimPassword, setRpClaimPassword] = useState('');
  const [rpClaimError, setRpClaimError] = useState('');

  const [aiReplyLoading, setAiReplyLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ style: string; text: string }>>([]);
  const [aiReplyError, setAiReplyError] = useState('');

  const [burnMode, setBurnMode] = useState(false);
  const [schedulePopoverOpen, setSchedulePopoverOpen] = useState(false);
  const [scheduledQueue, setScheduledQueue] = useState<
    Array<{ id: string; convId: string; convTitle: string; content: string; sendAt: number }>
  >([]);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [activeVisualEffect, setActiveVisualEffect] = useState<{
    id: number;
    effect: MessageEffectType;
    customEmoji?: string;
  } | null>(null);
  const [sparklingMsgId, setSparklingMsgId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [chatSettingsOpen, setChatSettingsOpen] = useState(false);
  const [vibrateNextMsg, setVibrateNextMsg] = useState(false);
  const [vibratingMsgIds, setVibratingMsgIds] = useState<Record<string, boolean>>({});
  const [groupOnlineFilter, setGroupOnlineFilter] = useState<'all' | 'online' | 'offline'>('all');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastTypingSoundAtRef = useRef<number>(0);
  const avatarClickTimerRef = useRef<number | null>(null);
  const lastObservedMsgIdRef = useRef<string | null>(null);

  const activeConv =
    conversations.find((c) => c.id === activeConvId) || conversations[0];
  const rawMessages = messagesByConv[activeConv?.id] || [];
  const draft = draftsByConv[activeConv?.id || ''] || '';
  const setDraft = (valOrUpdater: React.SetStateAction<string>) => {
    if (!activeConv) return;
    setDraftsByConv((prev) => {
      const current = prev[activeConv.id] || '';
      const next =
        typeof valOrUpdater === 'function' ? valOrUpdater(current) : valOrUpdater;
      return { ...prev, [activeConv.id]: next };
    });
  };
  const activeBg: ChatBackgroundSetting =
    (activeConv && chatBackgrounds.perConversation[activeConv.id]) ||
    chatBackgrounds.defaultBg;

  const targetContact = activeConv?.targetContactId
    ? contacts.find((c) => c.id === activeConv.targetContactId)
    : undefined;

  // Global 1-second ticker for Scheduled Send, Burn-after-reading countdown & Pomodoro timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setNowTick(now);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global right-mouse-button drag & drop tracking onto custom category tags
  useEffect(() => {
    const findDropTargetFolderId = (clientX: number, clientY: number): string | null => {
      const nodes = document.querySelectorAll<HTMLElement>('[data-drop-folder-id]');
      for (let i = 0; i < nodes.length; i += 1) {
        const el = nodes[i];
        const rect = el.getBoundingClientRect();
        if (
          clientX >= rect.left - 4 &&
          clientX <= rect.right + 4 &&
          clientY >= rect.top - 4 &&
          clientY <= rect.bottom + 4
        ) {
          return el.dataset.dropFolderId || null;
        }
      }
      return null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const pending = pendingRightDragRef.current;
      if (!pending) return;
      const dist = Math.hypot(e.clientX - pending.startX, e.clientY - pending.startY);
      if (!pending.activated && dist > 6) {
        pending.activated = true;
      }
      if (pending.activated) {
        const hoverFolderId = findDropTargetFolderId(e.clientX, e.clientY);
        setDraggingConv({
          convId: pending.convId,
          title: pending.title,
          mode: 'right',
          x: e.clientX,
          y: e.clientY,
          hoverFolderId,
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button !== 2 && pendingRightDragRef.current?.activated !== true) {
        return;
      }
      const pending = pendingRightDragRef.current;
      if (!pending) return;
      if (pending.activated) {
        suppressContextMenuUntilRef.current = Date.now() + 300;
        const targetFolderId = findDropTargetFolderId(e.clientX, e.clientY);
        if (targetFolderId === '__new__') {
          setFolderModalPreselectConvId(pending.convId);
          setFolderModalOpen(true);
        } else if (targetFolderId) {
          assignFolderLatestRef.current(targetFolderId, pending.convId);
          const folder = chatFoldersLatestRef.current.find((f) => f.id === targetFolderId);
          if (folder) {
            setDropHintBanner(`已将「${pending.title}」归入标签「${folder.name}」`);
            setTimeout(() => setDropHintBanner(null), 2600);
          }
        }
      }
      pendingRightDragRef.current = null;
      setDraggingConv(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Global long-press pointer drag tracking for non-system messages -> folder archiving
  const findFolderDropTarget = (clientX: number, clientY: number): string | null => {
    const nodes = document.querySelectorAll<HTMLElement>('[data-drop-folder-id]');
    for (let i = 0; i < nodes.length; i += 1) {
      const el = nodes[i];
      const rect = el.getBoundingClientRect();
      if (
        clientX >= rect.left - 6 &&
        clientX <= rect.right + 6 &&
        clientY >= rect.top - 6 &&
        clientY <= rect.bottom + 6
      ) {
        return el.dataset.dropFolderId || null;
      }
    }
    return null;
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const pending = pendingMsgLongPressRef.current;
      if (pending && !pending.activated) {
        const dist = Math.hypot(e.clientX - pending.startX, e.clientY - pending.startY);
        if (dist > 10) {
          window.clearTimeout(pending.timerId);
          pendingMsgLongPressRef.current = null;
          setLongPressHoldMsgId(null);
        }
      }
      const activeDrag = draggingMsgRef.current;
      if (activeDrag && activeDrag.mode === 'longpress') {
        const hoverFolderId = findFolderDropTarget(e.clientX, e.clientY);
        setDraggingMsg((curr) =>
          curr && curr.mode === 'longpress'
            ? {
                ...curr,
                x: e.clientX,
                y: e.clientY,
                hoverFolderId,
              }
            : curr
        );
      }
    };

    const finishMessageLongPress = (clientX?: number, clientY?: number) => {
      const pending = pendingMsgLongPressRef.current;
      if (pending && !pending.activated) {
        window.clearTimeout(pending.timerId);
        pendingMsgLongPressRef.current = null;
        setLongPressHoldMsgId(null);
      } else if (pending && pending.activated) {
        pendingMsgLongPressRef.current = null;
      }

      const activeDrag = draggingMsgRef.current;
      if (activeDrag && activeDrag.mode === 'longpress') {
        const targetFolderId =
          clientX !== undefined && clientY !== undefined
            ? findFolderDropTarget(clientX, clientY) ?? activeDrag.hoverFolderId
            : activeDrag.hoverFolderId;

        if (targetFolderId === '__new__') {
          setFolderModalPreselectArchiveMsg({
            msg: activeDrag.msg,
            conversationId: activeDrag.convId,
            conversationTitle: activeDrag.convTitle,
          });
          setFolderModalOpen(true);
        } else if (targetFolderId) {
          archiveMsgLatestRef.current?.(
            targetFolderId,
            activeDrag.msg,
            activeDrag.convId,
            activeDrag.convTitle
          );
          const folder = chatFoldersLatestRef.current.find(
            (f) => f.id === targetFolderId
          );
          if (folder) {
            setDropHintBanner(
              `已将「${activeDrag.msg.senderName}」的消息归档至「${folder.name}」`
            );
            setTimeout(() => setDropHintBanner(null), 2600);
          }
        }
        setDraggingMsg(null);
        setLongPressHoldMsgId(null);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      finishMessageLongPress(e.clientX, e.clientY);
    };
    const handlePointerCancel = () => {
      finishMessageLongPress();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, []);

  // Process due scheduled messages
  useEffect(() => {
    if (scheduledQueue.length === 0) return;
    const due = scheduledQueue.filter((item) => item.sendAt <= nowTick);
    if (due.length === 0) return;
    due.forEach((item) => {
      onSendMessage(item.convId, {
        type: 'text',
        content: `[定时发送] ${item.content}`,
      });
    });
    setScheduledQueue((prev) => prev.filter((item) => item.sendAt > nowTick));
  }, [nowTick, scheduledQueue]);

  // Auto-expire revealed burn-after-reading messages
  useEffect(() => {
    if (!activeConv) return;
    rawMessages.forEach((m) => {
      if (m.burnAfterSeconds && m.burnRevealedAt && !m.burned) {
        const elapsed = (nowTick - m.burnRevealedAt) / 1000;
        if (elapsed >= m.burnAfterSeconds) {
          onBurnMessage(activeConv.id, m.id, 'expire');
        }
      }
    });
  }, [nowTick, rawMessages, activeConv]);

  // Voice recording timer
  useEffect(() => {
    if (!recordingVoice) {
      setRecordSeconds(0);
      return;
    }
    const t = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recordingVoice]);

  // Auto-stop voice playback after duration
  useEffect(() => {
    if (!playingVoiceId) return;
    const msg = rawMessages.find((m) => m.id === playingVoiceId);
    const durMs = ((msg?.voiceDurationSec || 6) + 0.3) * 1000;
    const t = setTimeout(() => setPlayingVoiceId(null), durMs);
    return () => clearTimeout(t);
  }, [playingVoiceId, rawMessages]);

  // Trigger configured per-contact / per-group visual effect when sending a new message
  useEffect(() => {
    const latest = rawMessages[rawMessages.length - 1];
    if (!latest) return;
    if (lastObservedMsgIdRef.current === null) {
      lastObservedMsgIdRef.current = latest.id;
      return;
    }
    if (latest.id === lastObservedMsgIdRef.current) return;
    lastObservedMsgIdRef.current = latest.id;

    if (latest.vibrating && Date.now() - latest.createdAt < 4000) {
      setVibratingMsgIds((prev) => ({ ...prev, [latest.id]: true }));
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([35, 25, 35]);
      }
      setTimeout(() => {
        setVibratingMsgIds((prev) => {
          const next = { ...prev };
          delete next[latest.id];
          return next;
        });
      }, 600);
    }

    if (
      latest.senderId === 'me' &&
      Date.now() - latest.createdAt < 4000 &&
      activeConv &&
      notifications.visualEffects.enabled &&
      !minimalMode
    ) {
      const configuredEffect =
        notifications.visualEffects.perConversation[activeConv.id] ||
        notifications.visualEffects.defaultEffect;
      if (configuredEffect && configuredEffect !== 'none') {
        const eid = Date.now();
        setActiveVisualEffect({ id: eid, effect: configuredEffect });
        setSparklingMsgId(latest.id);
        setTimeout(() => {
          setActiveVisualEffect((curr) => (curr?.id === eid ? null : curr));
        }, 2500);
        setTimeout(() => {
          setSparklingMsgId((curr) => (curr === latest.id ? null : curr));
        }, 1500);
      }
    }
  }, [rawMessages, activeConv, notifications.visualEffects, minimalMode]);

  // Scroll to highlighted message when locating from File Manager
  useEffect(() => {
    if (highlightedMessageId && messageRefs.current[highlightedMessageId]) {
      messageRefs.current[highlightedMessageId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      const timer = setTimeout(onClearHighlight, 3500);
      return () => clearTimeout(timer);
    }
  }, [highlightedMessageId, activeConvId]);

  const isServiceConversation = (c: Conversation) => {
    if (c.kind === 'service' || c.kind === 'device') return true;
    const tgt = c.targetContactId
      ? contacts.find((ct) => ct.id === c.targetContactId)
      : undefined;
    return Boolean(tgt?.isBot);
  };

  const sortedConversations = useMemo(() => {
    const activeFolder = chatFolders.find((f) => f.id === convFilter);
    return [...conversations]
      .filter((c) => {
        const tgt = c.targetContactId
          ? contacts.find((ct) => ct.id === c.targetContactId)
          : undefined;
        const isService = c.kind === 'service' || c.kind === 'device' || Boolean(tgt?.isBot);
        if (activeFolder) {
          if (!activeFolder.conversationIds.includes(c.id)) return false;
        } else if (convFilter === 'unread' && c.unreadCount <= 0) {
          return false;
        } else if (convFilter === 'group' && c.kind !== 'group') {
          return false;
        } else if (convFilter === 'friend' && (c.kind !== 'single' || isService)) {
          return false;
        } else if (convFilter === 'service' && !isService) {
          return false;
        } else if (convFilter === 'starred') {
          if (!tgt?.starred && !c.pinned) return false;
        }
        return (
          !convSearch ||
          c.title.toLowerCase().includes(convSearch.toLowerCase()) ||
          c.lastMessagePreview.toLowerCase().includes(convSearch.toLowerCase())
        );
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [conversations, convSearch, convFilter, contacts, chatFolders]);

  const groupedSections = useMemo(() => {
    const sections: Array<{
      id: string;
      title: string;
      color: string;
      items: Conversation[];
    }> = [];
    const baseList = sortedConversations;
    const pinnedItems = baseList.filter((c) => c.pinned);
    if (pinnedItems.length > 0) {
      sections.push({
        id: 'sec-pinned',
        title: '置顶重要会话',
        color: '#F59E0B',
        items: pinnedItems,
      });
    }
    const assignedIds = new Set<string>();
    chatFolders.forEach((folder) => {
      const folderItems = baseList.filter((c) =>
        folder.conversationIds.includes(c.id)
      );
      folderItems.forEach((c) => assignedIds.add(c.id));
      if (folderItems.length > 0) {
        sections.push({
          id: folder.id,
          title: folder.name,
          color: folder.color,
          items: folderItems,
        });
      }
    });
    const remaining = baseList.filter((c) => !assignedIds.has(c.id) && !c.pinned);
    const otherGroups = remaining.filter((c) => c.kind === 'group');
    const otherSingles = remaining.filter((c) => c.kind !== 'group');
    if (otherGroups.length > 0) {
      sections.push({
        id: 'sec-other-groups',
        title: '其他群聊',
        color: '#6366F1',
        items: otherGroups,
      });
    }
    if (otherSingles.length > 0) {
      sections.push({
        id: 'sec-other-singles',
        title: '其他好友与设备',
        color: '#64748B',
        items: otherSingles,
      });
    }
    return sections;
  }, [sortedConversations, chatFolders]);

  const filteredMessages = useMemo(() => {
    if (!inChatSearchQuery.trim()) return rawMessages;
    return rawMessages.filter((m) =>
      m.content.toLowerCase().includes(inChatSearchQuery.toLowerCase())
    );
  }, [rawMessages, inChatSearchQuery]);

  const triggerSuperEffect = (
    emoji: string,
    effect: 'confetti' | 'hearts' | 'fire' | 'stars'
  ) => {
    const mapped: MessageEffectType =
      effect === 'hearts'
        ? 'hearts'
        : effect === 'stars'
        ? 'sparkle'
        : 'fireworks';
    const eid = Date.now();
    setActiveVisualEffect({ id: eid, effect: mapped, customEmoji: emoji });
    setTimeout(() => {
      setActiveVisualEffect((curr) => (curr?.id === eid ? null : curr));
    }, 2400);
  };

  const handleSendDice = () => {
    if (!activeConv) return;
    const roll = Math.floor(Math.random() * 6) + 1;
    onSendMessage(activeConv.id, {
      type: 'game_dice',
      content: `🎲 掷出了 ${roll} 点`,
      gameResult: {
        kind: 'dice',
        value: String(roll),
        label: `随机掷骰子：${roll} 点`,
        emoji: '🎲',
      },
    });
  };

  const handleSendRps = () => {
    if (!activeConv) return;
    const opts = [
      { emoji: '✊', label: '石头' },
      { emoji: '✌️', label: '剪刀' },
      { emoji: '✋', label: '布' },
    ];
    const pick = opts[Math.floor(Math.random() * opts.length)];
    onSendMessage(activeConv.id, {
      type: 'game_rps',
      content: `${pick.emoji} 猜拳出了「${pick.label}」`,
      gameResult: {
        kind: 'rps',
        value: pick.label,
        label: `猜拳出招：${pick.label}`,
        emoji: pick.emoji,
      },
    });
  };

  const handleStartPomodoro = () => {
    if (!activeConv) return;
    onSendMessage(activeConv.id, {
      type: 'pomodoro',
      content: '⏳ 发起了 25 分钟番茄专注自习室',
      pomodoro: {
        id: `pomo-${Date.now()}`,
        title: `${activeConv.title} · 专注自习 25 分钟`,
        durationMin: 25,
        startedAt: Date.now(),
        joinedUserIds: ['me'],
      },
    });
  };

  const handleSpeakMessage = (msg: ChatMessage) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingMsgId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(msg.content);
    utter.lang = 'zh-CN';
    utter.rate = 1;
    utter.onend = () => setSpeakingMsgId(null);
    utter.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msg.id);
    window.speechSynthesis.speak(utter);
  };

  const handleSendText = () => {
    const text = draft.trim();
    if (!text || !activeConv) return;
    onSendMessage(activeConv.id, {
      type: 'text',
      content: text,
      quote: quote || undefined,
      burnAfterSeconds: burnMode ? 10 : undefined,
      vibrating: vibrateNextMsg || undefined,
    });
    setDraft('');
    setQuote(null);
    setBurnMode(false);
    setVibrateNextMsg(false);
    setShowEmojiPicker(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConv) return;
    const reader = new FileReader();
    reader.onload = () => {
      onSendMessage(activeConv.id, {
        type: 'image',
        content: file.name,
        mediaUrl: String(reader.result),
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConv) return;
    const fileType = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
      ? 'video'
      : file.name.endsWith('.zip')
      ? 'archive'
      : 'document';
    onSendMessage(activeConv.id, {
      type: 'file',
      content: `发送文件 ${file.name}`,
      file: {
        id: `file-${Date.now()}`,
        name: file.name,
        sizeBytes: file.size || 1048576,
        fileType,
        progress: 100,
      },
    });
  };

  const handleAiSummarize = async () => {
    if (!activeConv) return;
    setAiSummaryOpen(true);
    setAiSummaryLoading(true);
    setAiSummaryError('');
    try {
      const payloadMsgs = rawMessages.slice(-20).map((m) => ({
        senderName: m.senderName,
        content: m.content,
        timestamp: m.timestamp,
      }));
      const res = await authedAiPost<{ summary?: string }>('/api/ai/summarize', {
        groupTitle: activeConv.title,
        messages: payloadMsgs,
      });
      if (!res.ok) {
        setAiSummaryError(res.data.error || 'AI 群总结服务暂不可用');
      } else {
        setAiSummaryText(res.data.summary || '');
      }
    } catch {
      setAiSummaryError('网络请求失败，请检查服务运行状态');
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const pinnedMsg = activeConv?.pinnedMessageId
    ? rawMessages.find((m) => m.id === activeConv.pinnedMessageId)
    : undefined;

  const triggerBubbleVibrate = (msgId: string) => {
    setVibratingMsgIds((prev) => ({ ...prev, [msgId]: true }));
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([35, 25, 35]);
    }
    playTone('nudge', 50);
    setTimeout(() => {
      setVibratingMsgIds((prev) => {
        const next = { ...prev };
        delete next[msgId];
        return next;
      });
    }, 600);
  };

  const effectiveDressUp = resolveEffectiveDressUp(
    dressUp,
    perConversationDressUp,
    activeConv?.id
  );
  const hasExclusiveDressUp = Boolean(
    activeConv && perConversationDressUp?.[activeConv.id]
  );

  const enrichedGroupMembers = useMemo(() => {
    if (!activeConv || activeConv.kind !== 'group') return [];
    return (activeConv.members || []).map((m) => {
      const contactMatch = contacts.find((c) => c.id === m.id);
      const isOnline =
        m.online !== undefined
          ? m.online
          : m.id === 'me'
          ? true
          : contactMatch
          ? contactMatch.online
          : true;
      const status =
        m.status ||
        (isOnline ? ('online' as const) : ('invisible' as const));
      const platform =
        m.platform ||
        (m.id === 'me' ? 'Windows' : contactMatch?.platform || 'Web');
      const moodText =
        m.moodText ||
        contactMatch?.typingStatus ||
        contactMatch?.signature ||
        (m.role === 'bot' ? '全天候智能响应中' : '在线协同中');
      return {
        ...m,
        online: isOnline,
        status,
        platform,
        moodText,
      };
    });
  }, [activeConv, contacts]);

  const groupOnlineCount = enrichedGroupMembers.filter((m) => m.online).length;

  const fontClass = getFontClass(effectiveDressUp.fontId, minimalMode);
  const bubbleVisual = getBubbleVisualProps(effectiveDressUp, minimalMode);
  const myBubbleStyle = bubbleVisual.className;

  const triggerNudge = (targetName?: string) => {
    if (!activeConv) return;
    setShaking(true);
    playTone('nudge');
    setTimeout(() => setShaking(false), 450);
    onSendMessage(activeConv.id, {
      type: 'system',
      content: targetName
        ? `${ME_PROFILE.name} 拍了拍 ${targetName} 的肩膀`
        : `${ME_PROFILE.name} 发送了一个窗口抖动`,
    });
  };

  const handleFetchSmartReply = async () => {
    if (!activeConv) return;
    setAiReplyLoading(true);
    setAiReplyError('');
    try {
      const res = await authedAiPost<{
        suggestions?: Array<{ style: string; text: string }>;
      }>('/api/ai/smart-reply', {
        draft,
        chatTitle: activeConv.title,
        recentMessages: rawMessages.slice(-6).map((m) => ({
          senderName: m.senderName,
          content: m.content,
        })),
      });
      if (!res.ok) {
        setAiReplyError(res.data.error || 'AI 建议生成失败');
      } else {
        setAiSuggestions(res.data.suggestions || []);
      }
    } catch {
      setAiReplyError('网络异常，请稍后再试');
    } finally {
      setAiReplyLoading(false);
    }
  };

  const essenceMessages = rawMessages.filter((m) => m.isEssence);
  const viewingRpMsg = viewingRpMsgId
    ? rawMessages.find((m) => m.id === viewingRpMsgId)
    : undefined;

  return (
    <div
      ref={workspaceRef}
      className={`flex h-full w-full overflow-hidden sr-aurora-canvas ${fontClass} ${
        shaking ? 'animate-sr-shake' : ''
      }`}
    >
      {/* 1. Conversation List Pane */}
      <aside
        className={`${
          isNarrowSinglePane
            ? narrowPane === 'list'
              ? 'w-full'
              : 'hidden'
            : isCompactSplitPane
            ? 'w-[236px] shrink-0'
            : 'w-[292px] shrink-0'
        } border-r border-slate-200/80 dark:border-slate-800/90 flex flex-col bg-slate-50/90 dark:bg-[#121621]/95 backdrop-blur-md`}
      >
        {uiLayout === 'compact' && (
          <div className="bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#0D9488] text-white p-3.5 space-y-3 shrink-0">
            {/* Compact Top Mini Bar */}
            <div className="flex items-center justify-between text-[11px] text-sky-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">星涟紧凑版</span>
                <button
                  onClick={() => onNavigateSection?.('office')}
                  className="hover:text-white"
                  title="云端邮局"
                >
                  邮局
                </button>
                <button
                  onClick={() => onNavigateSection?.('dressup')}
                  className="hover:text-white"
                  title="个性主题"
                >
                  主题
                </button>
              </div>
              <span className="font-mono-tabular">✦ 杭州 18°C</span>
            </div>

            {/* Compact Identity Strip */}
            <div className="flex items-center gap-3">
              <button onClick={() => onNavigateSection?.('profile')}>
                <AvatarView
                  name={profile?.name || ME_PROFILE.name}
                  src={profile?.avatar || ME_PROFILE.avatar}
                  size="md"
                  online
                />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold truncate">
                    {profile?.name || ME_PROFILE.name}
                  </span>
                  <button
                    type="button"
                    onClick={onOpenLevelCenter}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/20 hover:bg-black/30 text-amber-200 text-[10px] font-bold shrink-0"
                    title="点击查看星阶成长中心"
                  >
                    <QqLevelIcons level={profile?.level || ME_PROFILE.level} size="xs" />
                    <span>LV{profile?.level || ME_PROFILE.level}</span>
                  </button>
                  <span className="px-1 py-0.2 rounded bg-teal-500/90 text-white text-[9px] font-bold">
                    PRO
                  </span>
                </div>
                <div className="text-[11px] text-sky-100 truncate mt-0.5">
                  {profile?.signature || ME_PROFILE.signature}
                </div>
              </div>
            </div>

            {/* Translucent Search Input */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-white/80 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={convSearch}
                  onChange={(e) => setConvSearch(e.target.value)}
                  placeholder="搜索：联系人、群聊、消息"
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded bg-white/20 placeholder:text-white/80 text-white focus:outline-none"
                />
              </div>
              <button
                onClick={onOpenCreateGroup}
                className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white shrink-0"
                title="发起群聊"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 3 Tabs: 消息 / 联系人 / 空间 */}
            <div className="grid grid-cols-3 text-center text-xs font-medium pt-1 border-t border-white/15">
              <button className="py-1 border-b-2 border-white text-white font-semibold">
                消息
              </button>
              <button
                onClick={() => onNavigateSection?.('contacts')}
                className="py-1 text-sky-100 hover:text-white"
              >
                联系人
              </button>
              <button
                onClick={() => onNavigateSection?.('qzone')}
                className="py-1 text-sky-100 hover:text-white"
              >
                空间
              </button>
            </div>
          </div>
        )}

        {uiLayout !== 'compact' && (
          <div className="px-3.5 pt-3.5 pb-2.5 border-b border-slate-200/70 dark:border-slate-800/80 space-y-2.5">
            {/* Sidebar Brand Header & Interactive Live Mood Beacon */}
            <div className="flex items-center justify-between gap-2 relative">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  星涟 · 消息
                </h1>
                {conversations.reduce((s, c) => s + c.unreadCount, 0) > 0 && (
                  <span className="text-[11px] font-mono-tabular font-semibold text-[#2563EB] dark:text-sky-400">
                    {conversations.reduce((s, c) => s + c.unreadCount, 0)} 未读
                  </span>
                )}
              </div>

              {moodBeacon && (
                <button
                  type="button"
                  onClick={() => setMoodPickerOpen((v) => !v)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-white bg-gradient-to-r ${moodBeacon.accent} shadow-sm hover:opacity-95 transition-opacity shrink-0`}
                  title="切换今日星语状态"
                >
                  <span>{moodBeacon.emoji}</span>
                  <span>{moodBeacon.label}</span>
                </button>
              )}

              {moodPickerOpen && moodOptions && onSelectMoodBeacon && (
                <div className="absolute right-0 top-8 z-40 w-56 rounded-xl bg-white dark:bg-[#191f2d] border border-slate-200 dark:border-slate-700 shadow-xl p-2 space-y-1.5">
                  <div className="px-1.5 text-[10px] font-semibold text-slate-400">
                    点亮今日星语状态
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {moodOptions.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          onSelectMoodBeacon(m);
                          setMoodPickerOpen(false);
                        }}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                          moodBeacon?.id === m.id
                            ? `bg-gradient-to-r ${m.accent} text-white border-transparent`
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#2563EB]'
                        }`}
                      >
                        {m.emoji} {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={convSearch}
                  onChange={(e) => setConvSearch(e.target.value)}
                  placeholder="搜索聊天、群聊或文件"
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.03)] focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <button
                onClick={() =>
                  setConvViewMode((m) => (m === 'tabs' ? 'grouped' : 'tabs'))
                }
                className={`p-2 rounded-xl border shrink-0 transition-colors ${
                  convViewMode === 'grouped'
                    ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm'
                    : 'bg-white dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:border-[#2563EB] hover:text-[#2563EB]'
                }`}
                title={
                  convViewMode === 'grouped'
                    ? '切换回智能标签列表'
                    : '切换为消息分组折叠视图'
                }
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setFolderModalPreselectConvId(null);
                  setFolderModalOpen(true);
                }}
                className="p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:border-[#2563EB] hover:text-[#2563EB] shrink-0"
                title="管理或新建自定义分类标签"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onOpenCreateGroup}
                className="p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:border-[#2563EB] hover:text-[#2563EB] shrink-0"
                title="发起群聊（支持2000人）"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Smart Filter Tab Bar + Droppable Custom Category Tags (Visible in both Modern & Classic PC modes) */}
        <div className="px-2.5 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 space-y-1.5 shrink-0">
          {/* Row 1: Smart Filter Bar (全部 / 未读 / 群聊 / 好友 / 服务通知) */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: '全部', badge: 0 },
              {
                id: 'unread',
                label: '未读',
                badge: conversations.filter((c) => c.unreadCount > 0).length,
              },
              {
                id: 'group',
                label: '群聊',
                badge: conversations
                  .filter((c) => c.kind === 'group')
                  .reduce((s, c) => s + c.unreadCount, 0),
              },
              {
                id: 'friend',
                label: '好友',
                badge: conversations
                  .filter((c) => c.kind === 'single' && !isServiceConversation(c))
                  .reduce((s, c) => s + c.unreadCount, 0),
              },
              {
                id: 'service',
                label: '服务通知',
                badge: conversations
                  .filter((c) => isServiceConversation(c))
                  .reduce((s, c) => s + c.unreadCount, 0),
              },
            ].map((tab) => {
              const activeTab = convViewMode === 'tabs' && convFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setConvViewMode('tabs');
                    setConvFilter(tab.id);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors inline-flex items-center gap-1 shrink-0 ${
                    activeTab
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span
                      className={`text-[10px] font-mono-tabular px-1 rounded ${
                        activeTab
                          ? 'bg-white/20 text-white'
                          : 'bg-rose-500/10 text-rose-500 font-semibold'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Row 2: Custom Category Tags Drop Zone (Right-drag conversations OR Long-press messages here) */}
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            <span
              className="text-[10px] text-slate-400 inline-flex items-center gap-0.5 mr-0.5 shrink-0"
              title="支持拖拽会话或长按消息拖拽至下方分组文件夹归档"
            >
              <Tag className="w-3 h-3" />
              分类:
            </span>
            {chatFolders.map((folder) => {
              const activeTag = convViewMode === 'tabs' && convFilter === folder.id;
              const isDropHover =
                draggingConv?.hoverFolderId === folder.id ||
                draggingMsg?.hoverFolderId === folder.id;
              const isAnyDragging = Boolean(draggingConv || draggingMsg);
              const folderUnread = conversations
                .filter((c) => folder.conversationIds.includes(c.id))
                .reduce((s, c) => s + c.unreadCount, 0);
              const archivedCount = (folder.archivedMessages || []).length;
              return (
                <button
                  key={folder.id}
                  type="button"
                  data-drop-folder-id={folder.id}
                  onClick={() => {
                    setConvViewMode('tabs');
                    setConvFilter((prev) => (prev === folder.id ? 'all' : folder.id));
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDraggingConv((curr) =>
                      curr && curr.hoverFolderId !== folder.id
                        ? { ...curr, hoverFolderId: folder.id }
                        : curr
                    );
                    setDraggingMsg((curr) =>
                      curr && curr.hoverFolderId !== folder.id
                        ? { ...curr, hoverFolderId: folder.id }
                        : curr
                    );
                  }}
                  onDragLeave={() => {
                    setDraggingConv((curr) =>
                      curr && curr.hoverFolderId === folder.id
                        ? { ...curr, hoverFolderId: null }
                        : curr
                    );
                    setDraggingMsg((curr) =>
                      curr && curr.hoverFolderId === folder.id
                        ? { ...curr, hoverFolderId: null }
                        : curr
                    );
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const convId =
                      e.dataTransfer.getData('text/sr-conv-id') || draggingConv?.convId;
                    const draggedMsgId = e.dataTransfer.getData('text/sr-msg-id');
                    if (convId) {
                      onAssignConversationToFolder(folder.id, convId);
                      const convObj = conversations.find((c) => c.id === convId);
                      if (convObj) {
                        setDropHintBanner(`已将「${convObj.title}」归入标签「${folder.name}」`);
                        setTimeout(() => setDropHintBanner(null), 2600);
                      }
                      setDraggingConv(null);
                      return;
                    }
                    const targetMsgObj =
                      draggingMsg?.msg ||
                      (draggedMsgId
                        ? rawMessages.find((m) => m.id === draggedMsgId)
                        : undefined);
                    if (targetMsgObj && activeConv) {
                      onArchiveMessageToFolder?.(
                        folder.id,
                        targetMsgObj,
                        draggingMsg?.convId || activeConv.id,
                        draggingMsg?.convTitle || activeConv.title
                      );
                      setDropHintBanner(
                        `已将「${targetMsgObj.senderName}」的消息归档至「${folder.name}」`
                      );
                      setTimeout(() => setDropHintBanner(null), 2600);
                    }
                    setDraggingMsg(null);
                    setLongPressHoldMsgId(null);
                  }}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all inline-flex items-center gap-1 shrink-0 border ${
                    isDropHover
                      ? 'bg-[#2563EB] text-white border-[#2563EB] ring-2 ring-[#2563EB]/35 scale-105 shadow-sm'
                      : isAnyDragging
                      ? 'border-dashed border-[#2563EB]/70 bg-[#2563EB]/5 text-[#2563EB]'
                      : activeTag
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-[#2563EB]'
                  }`}
                  title={`点击筛选「${folder.name}」；拖拽会话或长按消息至此可归类/归档`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: isDropHover
                        ? '#ffffff'
                        : activeTag
                        ? '#38bdf8'
                        : folder.color,
                    }}
                  />
                  <span>{folder.name}</span>
                  <span className="text-[10px] font-mono-tabular opacity-70">
                    {folder.conversationIds.length}
                  </span>
                  {archivedCount > 0 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setArchiveDrawerFolderId(folder.id);
                        setChatSettingsOpen(false);
                        setGroupDrawerTab(null);
                      }}
                      className={`inline-flex items-center gap-0.5 text-[10px] font-mono-tabular px-1 rounded ${
                        isDropHover
                          ? 'bg-white/20 text-white'
                          : 'bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20'
                      }`}
                      title={`查看「${folder.name}」中的 ${archivedCount} 条归档消息`}
                    >
                      <Archive className="w-2.5 h-2.5" />
                      {archivedCount}
                    </span>
                  )}
                  {folderUnread > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  )}
                </button>
              );
            })}

            <button
              type="button"
              data-drop-folder-id="__new__"
              onClick={() => {
                setFolderModalPreselectConvId(null);
                setFolderModalPreselectArchiveMsg(null);
                setFolderModalOpen(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDraggingConv((curr) =>
                  curr && curr.hoverFolderId !== '__new__'
                    ? { ...curr, hoverFolderId: '__new__' }
                    : curr
                );
                setDraggingMsg((curr) =>
                  curr && curr.hoverFolderId !== '__new__'
                    ? { ...curr, hoverFolderId: '__new__' }
                    : curr
                );
              }}
              onDrop={(e) => {
                e.preventDefault();
                const convId =
                  e.dataTransfer.getData('text/sr-conv-id') || draggingConv?.convId;
                const draggedMsgId = e.dataTransfer.getData('text/sr-msg-id');
                setDraggingConv(null);
                if (convId) {
                  setFolderModalPreselectConvId(convId);
                  setFolderModalOpen(true);
                  return;
                }
                const targetMsgObj =
                  draggingMsg?.msg ||
                  (draggedMsgId ? rawMessages.find((m) => m.id === draggedMsgId) : undefined);
                if (targetMsgObj && activeConv) {
                  setFolderModalPreselectArchiveMsg({
                    msg: targetMsgObj,
                    conversationId: draggingMsg?.convId || activeConv.id,
                    conversationTitle: draggingMsg?.convTitle || activeConv.title,
                  });
                  setFolderModalOpen(true);
                }
                setDraggingMsg(null);
                setLongPressHoldMsgId(null);
              }}
              className={`px-1.5 py-0.5 rounded-md text-[11px] inline-flex items-center gap-0.5 transition-all shrink-0 border ${
                draggingConv?.hoverFolderId === '__new__' ||
                draggingMsg?.hoverFolderId === '__new__'
                  ? 'bg-emerald-500 text-white border-emerald-500 ring-2 ring-emerald-400/40 scale-105'
                  : draggingConv || draggingMsg
                  ? 'border-dashed border-emerald-500 text-emerald-600 bg-emerald-500/10'
                  : 'border-dashed border-slate-300 dark:border-slate-700 text-slate-400 hover:text-[#2563EB] hover:border-[#2563EB]'
              }`}
              title="新建自定义分类标签（拖拽会话或消息至此可直接创建并归入）"
            >
              <Plus className="w-3 h-3" />
              <span>{draggingConv || draggingMsg ? '拖至此新建分类' : '自定义'}</span>
            </button>
          </div>

          {dropHintBanner ? (
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-md px-2 py-1 flex items-center justify-between">
              <span className="truncate">{dropHintBanner}</span>
              <Check className="w-3 h-3 shrink-0" />
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 truncate">
              提示：右键拖会话可分类 · 长按消息可拖入分组归档
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
          {(() => {
            const renderConvRow = (conv: Conversation) => {
              const active = conv.id === activeConv?.id;
              const cTarget = conv.targetContactId
                ? contacts.find((c) => c.id === conv.targetContactId)
                : undefined;
              const convDraft =
                conv.id !== activeConv?.id ? draftsByConv[conv.id] : '';
              const memberFolders = chatFolders.filter((f) =>
                f.conversationIds.includes(conv.id)
              );
              const isBeingDragged = draggingConv?.convId === conv.id;
              return (
                <div
                  key={conv.id}
                  draggable
                  onDragStart={(e) => {
                    if ((e.target as HTMLElement | null)?.closest('[data-unread-badge]')) {
                      e.preventDefault();
                      return;
                    }
                    e.dataTransfer.setData('text/sr-conv-id', conv.id);
                    e.dataTransfer.effectAllowed = 'copyMove';
                    setDraggingConv({
                      convId: conv.id,
                      title: conv.title,
                      mode: 'left',
                      x: e.clientX,
                      y: e.clientY,
                      hoverFolderId: null,
                    });
                  }}
                  onDragEnd={() => setDraggingConv(null)}
                  onMouseDown={(e) => {
                    if (e.button === 2) {
                      pendingRightDragRef.current = {
                        convId: conv.id,
                        title: conv.title,
                        startX: e.clientX,
                        startY: e.clientY,
                        activated: false,
                      };
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (Date.now() < suppressContextMenuUntilRef.current) {
                      return;
                    }
                    setConvContextMenu({
                      convId: conv.id,
                      x: Math.min(e.clientX, window.innerWidth - 220),
                      y: Math.min(e.clientY, window.innerHeight - 320),
                    });
                  }}
                  className={`group/row relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all duration-150 cursor-pointer select-none ${
                    isBeingDragged
                      ? 'opacity-50 ring-1 ring-[#2563EB] bg-[#2563EB]/5'
                      : active
                      ? 'bg-white dark:bg-[#1e2638] shadow-[0_6px_18px_-6px_rgba(37,99,235,0.22)] ring-1 ring-[#2563EB]/25'
                      : conv.pinned
                      ? 'bg-slate-200/45 dark:bg-slate-800/45 hover:bg-white/75 dark:hover:bg-slate-800/75'
                      : 'hover:bg-white/70 dark:hover:bg-slate-800/50'
                  }`}
                  onClick={() => {
                    onSelectConv(conv.id);
                    setGroupDrawerTab(null);
                    setMultiSelectMode(false);
                    setSelectedMsgIds([]);
                    if (isNarrowSinglePane) {
                      setNarrowPane('chat');
                    }
                  }}
                >
                  <AvatarView
                    name={conv.title}
                    src={conv.avatar}
                    size="md"
                    isGroup={conv.kind === 'group'}
                    isBot={cTarget?.isBot}
                    isService={conv.kind === 'service' || conv.kind === 'device'}
                    online={cTarget?.online}
                    minimalMode={minimalMode}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <span
                          className={`text-sm font-medium truncate ${
                            active
                              ? 'text-[#2563EB]'
                              : 'text-slate-900 dark:text-slate-100'
                          } ${careMode ? 'care-text-base' : ''}`}
                        >
                          {conv.title}
                        </span>
                        {memberFolders.length > 0 && (
                          <span className="inline-flex items-center gap-0.5 shrink-0">
                            {memberFolders.slice(0, 2).map((mf) => (
                              <span
                                key={mf.id}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: mf.color }}
                                title={`所属分类：${mf.name}`}
                              />
                            ))}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono-tabular shrink-0 group-hover/row:hidden">
                        {conv.lastMessageTime}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setConvContextMenu({
                            convId: conv.id,
                            x: Math.min(rect.right, window.innerWidth - 220),
                            y: Math.min(rect.bottom + 4, window.innerHeight - 320),
                          });
                        }}
                        className="hidden group-hover/row:flex p-0.5 rounded text-slate-400 hover:text-[#2563EB] hover:bg-white dark:hover:bg-slate-800"
                        title="会话分组与快捷管理"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {conv.activeCall ? (
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate flex items-center gap-1">
                          <Phone className="w-3 h-3 shrink-0" />
                          {conv.activeCall.mode === 'video' ? '视频通话中' : '语音通话中'} ·{' '}
                          {conv.activeCall.participants.length + 1}人
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="text-xs text-slate-500 truncate">
                          {convDraft ? (
                            <>
                              <span className="text-rose-500 font-medium mr-1">
                                [草稿]
                              </span>
                              {convDraft}
                            </>
                          ) : (
                            conv.lastMessagePreview
                          )}
                        </span>
                        <DraggableUnreadBadge
                          count={conv.unreadCount}
                          muted={conv.muted}
                          soundEnabled={notifications.chatSounds.enabled}
                          onDismiss={() =>
                            onUpdateConversation(conv.id, { unreadCount: 0 })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            };

            if (convViewMode === 'grouped' && uiLayout !== 'compact') {
              return groupedSections.map((sec) => {
                const collapsed = Boolean(collapsedConvSections[sec.id]);
                const secUnread = sec.items.reduce((s, c) => s + c.unreadCount, 0);
                return (
                  <div key={sec.id} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedConvSections((prev) => ({
                          ...prev,
                          [sec.id]: !prev[sec.id],
                        }))
                      }
                      className="w-full px-2 py-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/40 dark:hover:bg-slate-800/40"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {collapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: sec.color }}
                        />
                        <span className="truncate">{sec.title}</span>
                      </span>
                      <span className="flex items-center gap-1.5 font-mono-tabular shrink-0">
                        <DraggableUnreadBadge
                          count={secUnread}
                          soundEnabled={notifications.chatSounds.enabled}
                          className="!min-w-[16px] !h-[16px] px-1.5"
                          title="拖拽可清除本分组所有未读红点"
                          onDismiss={() => {
                            sec.items.forEach((c) => {
                              if (c.unreadCount > 0) {
                                onUpdateConversation(c.id, { unreadCount: 0 });
                              }
                            });
                          }}
                        />
                        <span className="text-slate-400">{sec.items.length}</span>
                      </span>
                    </button>
                    {!collapsed && sec.items.map((c) => renderConvRow(c))}
                  </div>
                );
              });
            }

            return sortedConversations.map((c) => renderConvRow(c));
          })()}
        </div>

        {uiLayout === 'compact' && (
          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#191c24] flex items-center justify-between text-[11px] text-slate-500">
            <button onClick={() => onNavigateSection?.('profile')} className="hover:text-[#2563EB]">
              ≡ 个人中心
            </button>
            <button onClick={() => onNavigateSection?.('files')} className="hover:text-[#2563EB]">
              快传云盘
            </button>
            <button onClick={() => onNavigateSection?.('channels')} className="hover:text-[#2563EB]">
              频道
            </button>
            <button onClick={() => onNavigateSection?.('security')} className="hover:text-[#2563EB]">
              安全
            </button>
          </div>
        )}
      </aside>

      {/* 2. Center Chat Stage */}
      {activeConv && (!isNarrowSinglePane || narrowPane === 'chat') && (
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden sr-aurora-canvas">
          {/* Chat Header */}
          <header
            className={`px-4 sm:px-5 py-3 flex items-center justify-between gap-3 shrink-0 z-20 ${
              uiLayout === 'compact'
                ? 'bg-gradient-to-r from-[#2563EB] to-[#0D9488] text-white shadow-sm'
                : 'bg-white/82 dark:bg-[#151a25]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80'
            }`}
          >
            <div className="min-w-0 flex items-center gap-2">
              {isNarrowSinglePane && (
                <button
                  type="button"
                  onClick={() => setNarrowPane('list')}
                  className={`p-1.5 -ml-1 rounded-lg shrink-0 transition-colors ${
                    uiLayout === 'compact'
                      ? 'bg-white/15 hover:bg-white/25 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200'
                  }`}
                  title="返回会话列表"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {targetContact ? (
                  <button
                    onClick={() =>
                      onOpenUserProfile?.({
                        id: targetContact.id,
                        name: targetContact.name,
                        avatar: targetContact.avatar,
                      })
                    }
                    className={`text-base font-semibold truncate hover:underline text-left ${
                      uiLayout === 'compact'
                        ? 'text-white'
                        : 'text-slate-900 dark:text-slate-100 hover:text-[#2563EB]'
                    }`}
                    title="点击查看 TA 的个人资料与星涟空间"
                  >
                    {activeConv.title}
                  </button>
                ) : (
                  <h2
                    className={`text-base font-semibold truncate ${
                      uiLayout === 'compact'
                        ? 'text-white'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {activeConv.title}
                  </h2>
                )}
                {activeConv.kind === 'group' && (
                  <button
                    type="button"
                    onClick={() => {
                      setGroupDrawerTab('directory');
                      setChatSettingsOpen(false);
                      setArchiveDrawerFolderId(null);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium transition-colors shrink-0 ${
                      uiLayout === 'compact'
                        ? 'bg-white/15 border-white/25 text-white hover:bg-white/25'
                        : 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-200/80 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-300 hover:border-emerald-400'
                    }`}
                    title="点击展开群成员在线状态可视化看板"
                  >
                    <span className="flex -space-x-1.5">
                      {enrichedGroupMembers
                        .filter((m) => m.online)
                        .slice(0, 4)
                        .map((m) => (
                          <span
                            key={`hd-av-${m.id}`}
                            className="relative inline-flex w-4 h-4 rounded-full ring-1 ring-white dark:ring-slate-900 overflow-hidden bg-[#2563EB] text-[8px] text-white items-center justify-center font-bold"
                          >
                            {m.avatar ? (
                              <img
                                src={m.avatar}
                                alt={m.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              m.name.slice(0, 1)
                            )}
                          </span>
                        ))}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-mono-tabular">
                      {groupOnlineCount}/{enrichedGroupMembers.length} 在线
                    </span>
                  </button>
                )}
                {hasExclusiveDressUp && !minimalMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setChatSettingsOpen(true);
                      setGroupDrawerTab(null);
                      setArchiveDrawerFolderId(null);
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                      uiLayout === 'compact'
                        ? 'bg-white/20 text-white'
                        : 'bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20'
                    }`}
                    title="已开启本会话专属聊天装扮，点击管理"
                  >
                    <Palette className="w-3 h-3" />
                    <span>专属装扮</span>
                  </button>
                )}
                {!minimalMode && targetContact && (
                  <span className="inline-flex items-center gap-1 shrink-0">
                    <QqLevelIcons
                      level={getContactLevelInfo(targetContact).level}
                      size="xs"
                      onClick={onOpenLevelCenter}
                    />
                  </span>
                )}
                {!minimalMode && targetContact && targetContact.sparkDays > 0 && (
                  <span
                    className={`text-xs font-mono-tabular flex items-center gap-0.5 shrink-0 ${
                      uiLayout === 'compact' ? 'text-amber-200' : 'text-amber-600'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {targetContact.sparkDays}
                  </span>
                )}
              </div>
              <div
                className={`text-xs truncate ${
                  uiLayout === 'compact' ? 'text-sky-100' : 'text-slate-500'
                }`}
              >
                {activeConv.kind === 'group'
                  ? activeConv.muteAll
                    ? '全体禁言中 · 仅群主与管理员可发言'
                    : activeConv.scheduledMute?.enabled
                    ? `定时禁言 (${activeConv.scheduledMute.startHour}-${activeConv.scheduledMute.endHour}) · 群内 ${groupOnlineCount} 人在线`
                    : `群规模 ${activeConv.memberCount || enrichedGroupMembers.length}/${activeConv.maxMembers || 2000} · ${groupOnlineCount} 人实时在线`
                  : targetContact
                  ? targetContact.online
                    ? `${targetContact.platform} 在线 · ${
                        minimalMode
                          ? '在线'
                          : targetContact.typingStatus || targetContact.signature
                      }`
                    : '离线'
                  : '多端文件与消息实时互通助手'}
              </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {activeConv.kind === 'group' && (
                <button
                  onClick={handleAiSummarize}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${
                    uiLayout === 'compact'
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI 群总结
                </button>
              )}
              <button
                onClick={() => onStartOrJoinCall(activeConv, 'audio')}
                className={`p-2 rounded-lg ${
                  uiLayout === 'compact'
                    ? 'text-white hover:bg-white/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="语音通话"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => onStartOrJoinCall(activeConv, 'video')}
                className={`p-2 rounded-lg ${
                  uiLayout === 'compact'
                    ? 'text-white hover:bg-white/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="视频通话"
              >
                <Video className="w-4 h-4" />
              </button>
              <button
                onClick={() => setInChatSearchOpen(!inChatSearchOpen)}
                className={`p-2 rounded-lg ${
                  uiLayout === 'compact'
                    ? 'text-white hover:bg-white/20'
                    : inChatSearchOpen
                    ? 'bg-[#2563EB]/10 text-[#2563EB]'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="搜索聊天记录"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  onUpdateConversation(activeConv.id, { pinned: !activeConv.pinned })
                }
                className={`p-2 rounded-lg ${
                  uiLayout === 'compact'
                    ? 'text-white hover:bg-white/20'
                    : activeConv.pinned
                    ? 'text-[#2563EB] bg-[#2563EB]/10'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={activeConv.pinned ? '取消置顶会话' : '置顶会话'}
              >
                {activeConv.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  if (archiveDrawerFolderId) {
                    setArchiveDrawerFolderId(null);
                  } else {
                    setArchiveDrawerFolderId(chatFolders[0]?.id || '__empty__');
                    setChatSettingsOpen(false);
                    setGroupDrawerTab(null);
                  }
                }}
                className={`p-2 rounded-lg flex items-center gap-1 text-xs ${
                  uiLayout === 'compact'
                    ? archiveDrawerFolderId
                      ? 'bg-white text-[#2563EB] font-semibold'
                      : 'text-white hover:bg-white/20'
                    : archiveDrawerFolderId
                    ? 'bg-[#2563EB]/10 text-[#2563EB] font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="查看各消息分组归档箱（长按消息可拖拽归档）"
              >
                <Archive className="w-4 h-4" />
                <span className="hidden xl:inline">归档箱</span>
                {chatFolders.reduce(
                  (sum, f) => sum + (f.archivedMessages?.length || 0),
                  0
                ) > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#2563EB] text-white text-[10px] font-mono-tabular leading-none">
                    {chatFolders.reduce(
                      (sum, f) => sum + (f.archivedMessages?.length || 0),
                      0
                    )}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  const next = !chatSettingsOpen;
                  setChatSettingsOpen(next);
                  if (next) {
                    setGroupDrawerTab(null);
                    setArchiveDrawerFolderId(null);
                  }
                }}
                className={`p-2 rounded-lg flex items-center gap-1 text-xs ${
                  uiLayout === 'compact'
                    ? chatSettingsOpen
                      ? 'bg-white text-[#2563EB] font-semibold'
                      : 'text-white hover:bg-white/20'
                    : chatSettingsOpen
                    ? 'bg-[#2563EB]/10 text-[#2563EB] font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="聊天设置与背景音效管理"
              >
                <Settings2 className="w-4 h-4" />
                <span className="hidden xl:inline">聊天设置</span>
              </button>
              {activeConv.kind === 'group' && (
                <button
                  onClick={() => {
                    const next = groupDrawerTab ? null : 'manage';
                    setGroupDrawerTab(next);
                    if (next) {
                      setChatSettingsOpen(false);
                      setArchiveDrawerFolderId(null);
                    }
                  }}
                  className={`p-2 rounded-lg ${
                    uiLayout === 'compact'
                      ? 'text-white hover:bg-white/20'
                      : groupDrawerTab
                      ? 'bg-[#2563EB]/10 text-[#2563EB]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="群设置与群管理"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              )}
            </div>
          </header>

          {/* In-chat Search Bar */}
          {inChatSearchOpen && (
            <div className="px-5 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                value={inChatSearchQuery}
                onChange={(e) => setInChatSearchQuery(e.target.value)}
                placeholder="输入关键词筛选本会话历史消息..."
                className="flex-1 bg-transparent text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              />
              {inChatSearchQuery && (
                <span className="text-xs text-slate-500 font-mono-tabular">
                  匹配 {filteredMessages.length} 条
                </span>
              )}
              <button
                onClick={() => {
                  setInChatSearchOpen(false);
                  setInChatSearchQuery('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Persistent Call Status Banner inside Chat Window */}
          {activeConv.activeCall && (
            <div className="px-5 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>
                  {activeConv.activeCall.participants.map((p) => p.name).join('、')} 正在进行
                  {activeConv.activeCall.mode === 'video' ? '视频通话' : '语音通话'}（
                  {activeConv.activeCall.participants.length + 1}人）
                </span>
              </div>
              <button
                onClick={() =>
                  onStartOrJoinCall(activeConv, activeConv.activeCall?.mode || 'audio')
                }
                className="px-3 py-1 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-500 whitespace-nowrap"
              >
                点击加入通话
              </button>
            </div>
          )}

          {/* Pinned Message Banner */}
          {pinnedMsg && (
            <div className="px-5 py-2 bg-[#f8fafc] dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
              <button
                onClick={() =>
                  messageRefs.current[pinnedMsg.id]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  })
                }
                className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate text-left"
              >
                <Pin className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                <span className="font-medium text-[#2563EB] shrink-0">置顶消息：</span>
                <span className="truncate">{pinnedMsg.senderName}: {pinnedMsg.content}</span>
              </button>
              <button
                onClick={() => onUpdateConversation(activeConv.id, { pinnedMessageId: undefined })}
                className="text-slate-400 hover:text-slate-600 shrink-0"
              >
                取消置顶
              </button>
            </div>
          )}

          {/* Sticky Chat Memo / Todo Bar */}
          {((activeConv.memos && activeConv.memos.length > 0) || memoInputOpen) && (
            <div className="px-5 py-2 bg-amber-50/75 dark:bg-amber-950/25 border-b border-amber-200/70 dark:border-amber-900/50 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setMemosExpanded((v) => !v)}
                  className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300"
                >
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>
                    会话待办备忘 ({(activeConv.memos || []).filter((m) => !m.done).length}/
                    {(activeConv.memos || []).length})
                  </span>
                  {memosExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMemoInputOpen((v) => !v)}
                  className="text-[11px] text-[#2563EB] hover:underline font-medium"
                >
                  + 添加备忘
                </button>
              </div>

              {memoInputOpen && (
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    value={memoInputText}
                    onChange={(e) => setMemoInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && memoInputText.trim()) {
                        const nextMemo: ChatMemoItem = {
                          id: `memo-${Date.now()}`,
                          text: memoInputText.trim(),
                          done: false,
                          createdAt: new Date().toTimeString().slice(0, 5),
                        };
                        onUpdateConversation(activeConv.id, {
                          memos: [nextMemo, ...(activeConv.memos || [])],
                        });
                        setMemoInputText('');
                        setMemoInputOpen(false);
                      }
                    }}
                    placeholder="输入本会话待办备忘事项，按 Enter 添加..."
                    className="flex-1 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!memoInputText.trim()) return;
                      const nextMemo: ChatMemoItem = {
                        id: `memo-${Date.now()}`,
                        text: memoInputText.trim(),
                        done: false,
                        createdAt: new Date().toTimeString().slice(0, 5),
                      };
                      onUpdateConversation(activeConv.id, {
                        memos: [nextMemo, ...(activeConv.memos || [])],
                      });
                      setMemoInputText('');
                      setMemoInputOpen(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#2563EB] text-white text-[11px] font-medium"
                  >
                    保存
                  </button>
                </div>
              )}

              {memosExpanded && activeConv.memos && activeConv.memos.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {activeConv.memos.map((memo) => (
                    <div
                      key={memo.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] ${
                        memo.done
                          ? 'bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 line-through'
                          : 'bg-white dark:bg-slate-900 border-amber-300/80 dark:border-amber-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={memo.done}
                        onChange={() =>
                          onUpdateConversation(activeConv.id, {
                            memos: (activeConv.memos || []).map((x) =>
                              x.id === memo.id ? { ...x, done: !x.done } : x
                            ),
                          })
                        }
                        className="accent-[#2563EB] cursor-pointer"
                      />
                      <span className="max-w-[220px] truncate">{memo.text}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateConversation(activeConv.id, {
                            memos: (activeConv.memos || []).filter(
                              (x) => x.id !== memo.id
                            ),
                          })
                        }
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contextual Message Drag-to-Folder Archive Drop Dock */}
          {draggingMsg && (
            <div className="px-4 py-2.5 bg-gradient-to-r from-[#2563EB]/10 via-[#0D9488]/10 to-[#2563EB]/10 border-b border-[#2563EB]/30 flex flex-wrap items-center gap-2 z-20">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] dark:text-indigo-300 mr-1">
                <Archive className="w-4 h-4 shrink-0" />
                <span>拖放至分组文件夹进行归档：</span>
              </div>
              {chatFolders.map((folder) => {
                const isHover = draggingMsg.hoverFolderId === folder.id;
                const count = (folder.archivedMessages || []).length;
                return (
                  <div
                    key={`dock-${folder.id}`}
                    data-drop-folder-id={folder.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDraggingMsg((curr) =>
                        curr && curr.hoverFolderId !== folder.id
                          ? { ...curr, hoverFolderId: folder.id }
                          : curr
                      );
                    }}
                    onDragLeave={() => {
                      setDraggingMsg((curr) =>
                        curr && curr.hoverFolderId === folder.id
                          ? { ...curr, hoverFolderId: null }
                          : curr
                      );
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      onArchiveMessageToFolder?.(
                        folder.id,
                        draggingMsg.msg,
                        draggingMsg.convId,
                        draggingMsg.convTitle
                      );
                      setDropHintBanner(
                        `已将「${draggingMsg.msg.senderName}」的消息归档至「${folder.name}」`
                      );
                      setTimeout(() => setDropHintBanner(null), 2600);
                      setDraggingMsg(null);
                      setLongPressHoldMsgId(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all inline-flex items-center gap-1.5 select-none ${
                      isHover
                        ? 'bg-[#2563EB] text-white border-[#2563EB] scale-105 shadow-md'
                        : 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-dashed border-[#2563EB]/50 hover:border-[#2563EB]'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isHover ? '#ffffff' : folder.color }}
                    />
                    <span>{folder.name}</span>
                    <span
                      className={`text-[10px] font-mono-tabular px-1.5 py-0.5 rounded-full ${
                        isHover
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
              <div
                data-drop-folder-id="__new__"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDraggingMsg((curr) =>
                    curr && curr.hoverFolderId !== '__new__'
                      ? { ...curr, hoverFolderId: '__new__' }
                      : curr
                  );
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setFolderModalPreselectArchiveMsg({
                    msg: draggingMsg.msg,
                    conversationId: draggingMsg.convId,
                    conversationTitle: draggingMsg.convTitle,
                  });
                  setFolderModalOpen(true);
                  setDraggingMsg(null);
                  setLongPressHoldMsgId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all inline-flex items-center gap-1 select-none ${
                  draggingMsg.hoverFolderId === '__new__'
                    ? 'bg-emerald-500 text-white border-emerald-500 scale-105 shadow-md'
                    : 'bg-white/90 dark:bg-slate-900/90 text-emerald-600 dark:text-emerald-400 border-dashed border-emerald-500/60'
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>新建分组并归档</span>
              </div>
            </div>
          )}

          {/* Message Feed with Custom Chat Background Backdrop */}
          <div className="relative flex-1 overflow-hidden flex flex-col bg-transparent">
            <ChatFeedBackdrop bg={activeBg} minimalMode={minimalMode} />
            <div className="relative z-10 flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {filteredMessages.map((msg) => {
              const isMe = msg.senderId === 'me';
              const isHighlighted = highlightedMessageId === msg.id;
              const isSelected = selectedMsgIds.includes(msg.id);

              if (msg.type === 'system') {
                return (
                  <div
                    key={msg.id}
                    className="flex items-center justify-center text-xs text-slate-400 py-1"
                  >
                    <span>{msg.content}</span>
                  </div>
                );
              }

              if (msg.recalled) {
                return (
                  <div
                    key={msg.id}
                    className="flex items-center justify-center gap-2 text-xs text-slate-400 py-1"
                  >
                    <span>{isMe ? '你撤回了一条消息' : `${msg.senderName} 撤回了一条消息`}</span>
                    {isMe && msg.originalTextForEdit && (
                      <button
                        onClick={() => setDraft(msg.originalTextForEdit || '')}
                        className="text-[#2563EB] hover:underline flex items-center gap-0.5"
                      >
                        <RotateCcw className="w-3 h-3" />
                        重新编辑
                      </button>
                    )}
                  </div>
                );
              }

              const archivedInFolder = chatFolders.find((f) =>
                (f.archivedMessages || []).some((a) => a.messageId === msg.id)
              );
              const isHoldingThis = longPressHoldMsgId === msg.id;
              const isDraggingThis = draggingMsg?.msg.id === msg.id;

              return (
                <div
                  key={msg.id}
                  ref={(el) => {
                    messageRefs.current[msg.id] = el;
                  }}
                  data-msg-draggable="true"
                  onPointerDown={(e) => {
                    if (multiSelectMode) return;
                    if (e.pointerType === 'mouse' && e.button !== 0) return;
                    const targetEl = e.target as HTMLElement | null;
                    if (
                      targetEl?.closest(
                        'button, a, input, textarea, select, [data-no-longpress]'
                      )
                    ) {
                      return;
                    }
                    const startX = e.clientX;
                    const startY = e.clientY;
                    if (pendingMsgLongPressRef.current) {
                      window.clearTimeout(pendingMsgLongPressRef.current.timerId);
                    }
                    setLongPressHoldMsgId(msg.id);
                    const timerId = window.setTimeout(() => {
                      if (!pendingMsgLongPressRef.current) return;
                      pendingMsgLongPressRef.current.activated = true;
                      window.getSelection()?.removeAllRanges();
                      setDraggingMsg({
                        msg,
                        convId: activeConv.id,
                        convTitle: activeConv.title,
                        mode: 'longpress',
                        x: startX,
                        y: startY,
                        hoverFolderId: findFolderDropTarget(startX, startY),
                      });
                    }, 280);
                    pendingMsgLongPressRef.current = {
                      msg,
                      convId: activeConv.id,
                      convTitle: activeConv.title,
                      startX,
                      startY,
                      timerId,
                      activated: false,
                    };
                  }}
                  className={`group relative flex items-start gap-3 rounded-xl p-1.5 transition-all ${
                    isMe ? 'flex-row-reverse' : ''
                  } ${
                    isDraggingThis
                      ? 'opacity-45 ring-2 ring-[#2563EB] bg-[#2563EB]/10 scale-[0.99] select-none'
                      : isHoldingThis
                      ? 'ring-2 ring-[#2563EB]/45 bg-[#2563EB]/5'
                      : isHighlighted
                      ? 'bg-amber-200/40 dark:bg-amber-900/30'
                      : ''
                  }`}
                >
                  {multiSelectMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        setSelectedMsgIds((prev) =>
                          prev.includes(msg.id)
                            ? prev.filter((x) => x !== msg.id)
                            : [...prev, msg.id]
                        )
                      }
                      className="mt-2.5 w-4 h-4 accent-[#2563EB] shrink-0"
                    />
                  )}

                  <div
                    data-no-longpress
                    onClick={() => {
                      if (avatarClickTimerRef.current) {
                        window.clearTimeout(avatarClickTimerRef.current);
                      }
                      avatarClickTimerRef.current = window.setTimeout(() => {
                        onOpenUserProfile?.({
                          id: msg.senderId,
                          name: msg.senderName,
                          avatar: msg.senderAvatar,
                        });
                        avatarClickTimerRef.current = null;
                      }, 220);
                    }}
                    onDoubleClick={() => {
                      if (avatarClickTimerRef.current) {
                        window.clearTimeout(avatarClickTimerRef.current);
                        avatarClickTimerRef.current = null;
                      }
                      if (!isMe) triggerNudge(msg.senderName);
                    }}
                    title={isMe ? '点击查看我的个人中心' : '单击查看 TA 的资料与空间 · 双击拍一拍'}
                    className="cursor-pointer hover:opacity-85 transition-opacity"
                  >
                    <AvatarView
                      name={msg.senderName}
                      src={msg.senderAvatar}
                      size="sm"
                      frameId={isMe ? effectiveDressUp.frameId : 'none'}
                      pendantId={isMe ? effectiveDressUp.pendantId : 'none'}
                      minimalMode={minimalMode}
                    />
                  </div>

                  <div className={`max-w-[74%] space-y-1 ${isMe ? 'items-end flex flex-col' : ''}`}>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                      <button
                        onClick={() =>
                          onOpenUserProfile?.({
                            id: msg.senderId,
                            name: msg.senderName,
                            avatar: msg.senderAvatar,
                          })
                        }
                        className="font-medium text-slate-600 dark:text-slate-300 hover:text-[#2563EB]"
                      >
                        {msg.senderName}
                      </button>
                      {msg.senderRole === 'owner' && <span className="text-amber-600">群主</span>}
                      {msg.senderRole === 'admin' && <span className="text-[#2563EB]">管理员</span>}
                      {msg.isEssence && <span className="text-amber-600 font-medium">· 群精华</span>}
                      <span className="font-mono-tabular">{msg.timestamp}</span>
                      {archivedInFolder && (
                        <button
                          type="button"
                          data-no-longpress
                          onClick={() => {
                            setArchiveDrawerFolderId(archivedInFolder.id);
                            setChatSettingsOpen(false);
                            setGroupDrawerTab(null);
                          }}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-[#2563EB]"
                          title="点击打开归档分组抽屉，可跨分组移动或移出归档"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: archivedInFolder.color }}
                          />
                          <span>已归档 · {archivedInFolder.name}</span>
                        </button>
                      )}
                      <span
                        draggable
                        data-no-longpress
                        onDragStart={(e) => {
                          e.stopPropagation();
                          e.dataTransfer.setData('text/sr-msg-id', msg.id);
                          e.dataTransfer.effectAllowed = 'copyMove';
                          setDraggingMsg({
                            msg,
                            convId: activeConv.id,
                            convTitle: activeConv.title,
                            mode: 'html5',
                            x: e.clientX,
                            y: e.clientY,
                            hoverFolderId: null,
                          });
                        }}
                        onDragEnd={() => {
                          setDraggingMsg(null);
                          setLongPressHoldMsgId(null);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-0.5 px-1 py-0.5 rounded cursor-grab active:cursor-grabbing text-slate-400 hover:text-[#2563EB] hover:bg-slate-200/60 dark:hover:bg-slate-800"
                        title="拖拽此手柄或长按消息体，移入消息分组文件夹归档"
                      >
                        <GripVertical className="w-3 h-3" />
                        <span className="text-[10px]">长按拖拽归档</span>
                      </span>
                    </div>

                    {/* Quote Header */}
                    {msg.quote && (
                      <div className="rounded-lg bg-slate-200/70 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 max-w-full">
                        引用 {msg.quote.senderName}：{msg.quote.preview}
                      </div>
                    )}

                    {/* Message Body by Type */}
                    {msg.type === 'text' && (
                      msg.burned ? (
                        <div className="rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs text-slate-400 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span>该限时消息已阅后即焚并销毁</span>
                        </div>
                      ) : msg.burnAfterSeconds && !msg.burnRevealedAt && !isMe ? (
                        <button
                          onClick={() => onBurnMessage(activeConv.id, msg.id, 'reveal')}
                          className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 px-4 py-2.5 text-xs font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2 hover:bg-amber-100"
                        >
                          <Eye className="w-4 h-4 text-amber-600" />
                          <span>点击查看阅后即焚消息（{msg.burnAfterSeconds}秒后销毁）</span>
                        </button>
                      ) : (
                        <div
                          style={isMe ? bubbleVisual.style : undefined}
                          className={`px-4 py-2.5 text-sm leading-relaxed break-words transition-transform ${
                            careMode ? 'care-text-base' : ''
                          } ${sparklingMsgId === msg.id ? 'animate-sr-msg-sparkle' : ''} ${
                            vibratingMsgIds[msg.id] ? 'animate-sr-bubble-vibrate' : ''
                          } ${
                            isMe
                              ? myBubbleStyle
                              : 'bg-white/95 dark:bg-[#1a202e]/95 backdrop-blur-sm text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/70 rounded-2xl rounded-tl-sm shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)]'
                          }`}
                        >
                          {msg.burnAfterSeconds && (
                            <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-mono-tabular opacity-90 border-b border-current/15 pb-1">
                              <span className="flex items-center gap-1">
                                <Flame className="w-3 h-3" />
                                阅后即焚
                              </span>
                              {msg.burnRevealedAt ? (
                                <span>
                                  {Math.max(
                                    0,
                                    Math.ceil(
                                      msg.burnAfterSeconds - (nowTick - msg.burnRevealedAt) / 1000
                                    )
                                  )}
                                  s 后销毁
                                </span>
                              ) : (
                                <button
                                  onClick={() => onBurnMessage(activeConv.id, msg.id, 'reveal')}
                                  className="underline"
                                >
                                  立即开始{msg.burnAfterSeconds}s倒计时
                                </button>
                              )}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap select-text flex items-start gap-1">
                            {isMe && bubbleVisual.cornerIcon && !minimalMode && (
                              <span className="text-xs opacity-90 shrink-0 mt-0.5">
                                {bubbleVisual.cornerIcon}
                              </span>
                            )}
                            <span>{msg.content}</span>
                          </div>
                          {msg.vibrating && (
                            <button
                              type="button"
                              data-no-longpress
                              onClick={() => triggerBubbleVibrate(msg.id)}
                              className="mt-1.5 inline-flex items-center gap-1 text-[10px] opacity-85 hover:opacity-100 underline"
                            >
                              <Waves className="w-3 h-3" />
                              振动消息 · 点击重振气泡
                            </button>
                          )}
                          {msg.translatedText && (
                            <div className="mt-2 pt-2 border-t border-current/20 text-xs opacity-90">
                              [译文] {msg.translatedText}
                            </div>
                          )}
                        </div>
                      )
                    )}

                    {msg.type === 'voice' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            style={isMe ? bubbleVisual.style : undefined}
                            onClick={() =>
                              setPlayingVoiceId(playingVoiceId === msg.id ? null : msg.id)
                            }
                            className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm ${
                              sparklingMsgId === msg.id ? 'animate-sr-msg-sparkle' : ''
                            } ${
                              vibratingMsgIds[msg.id] ? 'animate-sr-bubble-vibrate' : ''
                            } ${
                              isMe
                                ? myBubbleStyle
                                : 'bg-white dark:bg-[#191c24] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {playingVoiceId === msg.id ? (
                              <Pause className="w-4 h-4 shrink-0" />
                            ) : (
                              <Play className="w-4 h-4 shrink-0" />
                            )}
                            <VoiceBubbleWaveform
                              messageId={msg.id}
                              playing={playingVoiceId === msg.id}
                              waveformEnabled={
                                notifications.visualEffects.voiceWaveformEnabled
                              }
                            />
                            <span className="font-mono-tabular text-xs">
                              {msg.voiceDurationSec || 6}"
                            </span>
                          </button>
                          <button
                            onClick={() => onTranscribeVoice(activeConv.id, msg.id)}
                            className="px-2 py-1 text-[11px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-[#2563EB] hover:text-[#2563EB] whitespace-nowrap"
                          >
                            {msg.voiceTranscript ? '隐藏文字' : '转文字'}
                          </button>
                        </div>
                        {msg.voiceTranscript && (
                          <div className="rounded-lg bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300">
                            [语音转文字] {msg.voiceTranscript}
                          </div>
                        )}
                      </div>
                    )}

                    {msg.type === 'image' && msg.mediaUrl && (
                      <button
                        onClick={() => setPreviewImageUrl(msg.mediaUrl!)}
                        className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 block"
                      >
                        <img
                          src={msg.mediaUrl}
                          alt={msg.content}
                          referrerPolicy="no-referrer"
                          className="max-w-xs max-h-60 object-cover"
                        />
                      </button>
                    )}

                    {msg.type === 'video' && (
                      <div className="w-64 rounded-xl bg-slate-900 text-white p-3.5 space-y-2 border border-slate-700">
                        <div className="h-28 rounded-lg bg-slate-800 flex items-center justify-center">
                          <Film className="w-8 h-8 text-[#2563EB]" />
                        </div>
                        <div className="text-xs font-medium truncate">{msg.content}</div>
                      </div>
                    )}

                    {msg.type === 'sticker' && (
                      <div
                        className={`rounded-2xl bg-white dark:bg-[#191c24] border px-5 py-3 text-center ${
                          msg.isSuperEmoji
                            ? 'border-amber-300 dark:border-amber-700 shadow-md'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div
                          className={`${
                            msg.isSuperEmoji ? 'text-6xl animate-sr-super-pop' : 'text-4xl'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-center gap-1.5">
                          <span>{msg.stickerLabel}</span>
                          {msg.isSuperEmoji && msg.superEmojiEffect && (
                            <button
                              onClick={() =>
                                triggerSuperEffect(msg.content, msg.superEmojiEffect!)
                              }
                              className="text-[#2563EB] hover:underline"
                            >
                              重放特效
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {(msg.type === 'game_dice' || msg.type === 'game_rps') && msg.gameResult && (
                      <div className="rounded-2xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
                        <div className="text-4xl animate-sr-super-pop">{msg.gameResult.emoji}</div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {msg.gameResult.label}
                          </div>
                          <button
                            onClick={() =>
                              msg.gameResult!.kind === 'dice' ? handleSendDice() : handleSendRps()
                            }
                            className="text-[11px] text-[#2563EB] hover:underline"
                          >
                            再来一局
                          </button>
                        </div>
                      </div>
                    )}

                    {msg.type === 'pomodoro' && msg.pomodoro && (() => {
                      const totalSec = msg.pomodoro.durationMin * 60;
                      const elapsed = Math.floor((nowTick - msg.pomodoro.startedAt) / 1000);
                      const remain = Math.max(0, totalSec - elapsed);
                      const mm = String(Math.floor(remain / 60)).padStart(2, '0');
                      const ss = String(remain % 60).padStart(2, '0');
                      const joined = msg.pomodoro.joinedUserIds.includes('me');
                      return (
                        <div className="w-72 rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#2563EB] flex items-center gap-1">
                              <Timer className="w-3.5 h-3.5" />
                              星涟专注自习室
                            </span>
                            <span className="font-mono-tabular text-emerald-600 font-bold">
                              {mm}:{ss}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {msg.pomodoro.title}
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-slate-500 font-mono-tabular">
                              {msg.pomodoro.joinedUserIds.length} 人正在专注
                            </span>
                            <button
                              onClick={() => onTogglePomodoroJoin(activeConv.id, msg.id)}
                              className={`px-3 py-1 text-xs font-medium rounded-lg ${
                                joined
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-[#2563EB] text-white'
                              }`}
                            >
                              {joined ? '专注中（点击退出）' : '加入自习'}
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {msg.type === 'contact_card' && msg.contactCard && (
                      <button
                        onClick={() => onJumpToContact(msg.contactCard!.qqNumber)}
                        className="w-60 rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-3.5 text-left hover:border-[#2563EB] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <AvatarView
                            name={msg.contactCard.name}
                            src={msg.contactCard.avatar}
                            size="md"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {msg.contactCard.name}
                            </div>
                            <div className="text-xs text-slate-500 font-mono-tabular">
                              星涟号 {msg.contactCard.qqNumber}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                          [推荐名片] 点击查看好友资料
                        </div>
                      </button>
                    )}

                    {msg.type === 'file' && msg.file && (
                      <div className="w-72 rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="w-5 h-5 text-[#2563EB] shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {msg.file.name}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono-tabular">
                                {formatBytes(msg.file.sizeBytes)} ·{' '}
                                {(msg.file.progress ?? 100) >= 100
                                  ? '传输完成'
                                  : msg.file.paused
                                  ? `断点暂停 ${msg.file.progress}%`
                                  : `传输中 ${msg.file.progress}%`}
                              </div>
                            </div>
                          </div>
                          {(msg.file.progress ?? 100) < 100 ? (
                            <button
                              onClick={() => onToggleP2pPause(msg.file!.id)}
                              className="px-2 py-1 text-[11px] rounded bg-[#2563EB]/10 text-[#2563EB]"
                            >
                              {msg.file.paused ? '续传' : '暂停'}
                            </button>
                          ) : (
                            <Download className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </div>
                        {(msg.file.progress ?? 100) < 100 && (
                          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-[#2563EB]"
                              style={{ width: `${msg.file.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {msg.type === 'announcement' && (
                      <div className="w-80 sm:w-96 rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-4 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB]">
                          <Megaphone className="w-3.5 h-3.5" />
                          群公告通知
                        </div>
                        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                    )}

                    {msg.type === 'poll' && msg.poll && (
                      <div className="w-80 sm:w-96 rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold text-[#2563EB] flex items-center gap-1">
                            <Vote className="w-3.5 h-3.5" />
                            群投票
                          </span>
                          <span className="font-mono-tabular">{msg.poll.deadline}</span>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {msg.poll.question}
                        </div>
                        <div className="space-y-2">
                          {msg.poll.options.map((opt) => {
                            const totalVotes = msg.poll!.options.reduce(
                              (s, o) => s + o.voterIds.length,
                              0
                            );
                            const votedByMe = opt.voterIds.includes('me');
                            const pct = totalVotes
                              ? Math.round((opt.voterIds.length / totalVotes) * 100)
                              : 0;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => onVotePoll(activeConv.id, msg.id, opt.id)}
                                className={`w-full text-left rounded-lg border p-2.5 text-xs transition-colors ${
                                  votedByMe
                                    ? 'border-[#2563EB] bg-[#2563EB]/5'
                                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                              >
                                <div className="flex items-center justify-between font-medium text-slate-800 dark:text-slate-200">
                                  <span>{opt.text}</span>
                                  <span className="font-mono-tabular">
                                    {opt.voterIds.length}票 ({pct}%)
                                  </span>
                                </div>
                                <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full bg-[#2563EB]"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {msg.type === 'solitaire' && msg.solitaire && (
                      <div className="w-80 sm:w-96 rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#2563EB] flex items-center gap-1">
                            <ListChecks className="w-3.5 h-3.5" />
                            群接龙 · {msg.solitaire.entries.length} 人已参与
                          </span>
                          <button
                            onClick={() =>
                              exportSolitaireCsv(
                                msg.solitaire!.title,
                                msg.solitaire!.entries
                              )
                            }
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                          >
                            <FileSpreadsheet className="w-3 h-3" />
                            导出表格
                          </button>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {msg.solitaire.title}
                        </div>
                        <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300 max-h-36 overflow-y-auto">
                          {msg.solitaire.entries.map((ent) => (
                            <div key={ent.index} className="font-mono-tabular">
                              {ent.index}. {ent.value}{' '}
                              <span className="text-slate-400">({ent.time})</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-1.5 pt-1">
                          <input
                            value={solitaireInputs[msg.id] || ''}
                            onChange={(e) =>
                              setSolitaireInputs((p) => ({ ...p, [msg.id]: e.target.value }))
                            }
                            placeholder={msg.solitaire.formatHint}
                            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                          />
                          <button
                            onClick={() => {
                              const v = (solitaireInputs[msg.id] || '').trim();
                              if (!v) return;
                              onAppendSolitaire(activeConv.id, msg.id, v);
                              setSolitaireInputs((p) => ({ ...p, [msg.id]: '' }));
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#2563EB] text-white"
                          >
                            +1 接龙
                          </button>
                        </div>
                      </div>
                    )}

                    {msg.type === 'homework' && msg.homework && (
                      <div className="w-80 sm:w-96 rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-indigo-600 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            群作业 · {msg.homework.subject}
                          </span>
                          <span className="text-slate-400 font-mono-tabular">
                            {msg.homework.deadline}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {msg.homework.title}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-slate-500 font-mono-tabular">
                            已提交 {msg.homework.submittedUserIds.length} 人
                          </span>
                          <button
                            onClick={() => onToggleHomeworkSubmit(activeConv.id, msg.id)}
                            className={`px-3 py-1 text-xs font-medium rounded-lg ${
                              msg.homework.submittedUserIds.includes('me')
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#2563EB] text-white'
                            }`}
                          >
                            {msg.homework.submittedUserIds.includes('me') ? '已提交作业' : '立即提交'}
                          </button>
                        </div>
                      </div>
                    )}

                    {msg.type === 'red_packet' && msg.redPacket && (() => {
                      const claimed = msg.redPacket.claims.some((c) => c.userId === 'me');
                      const finished = msg.redPacket.claims.length >= msg.redPacket.totalCount;
                      return (
                        <button
                          onClick={() => {
                            setViewingRpMsgId(msg.id);
                            setRpClaimPassword(msg.redPacket?.password || '');
                            setRpClaimError('');
                          }}
                          className={`w-64 rounded-xl overflow-hidden text-left border transition-opacity ${
                            claimed || finished ? 'opacity-80 border-amber-300' : 'border-rose-500'
                          }`}
                        >
                          <div className="bg-gradient-to-r from-rose-600 to-amber-600 p-3.5 text-white flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-amber-300/20 border border-amber-200/40 flex items-center justify-center shrink-0">
                              <Gift className="w-5 h-5 text-amber-200" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold truncate">
                                {msg.redPacket.title}
                              </div>
                              <div className="text-[11px] text-amber-100">
                                {claimed
                                  ? '已领取 · 点击查看手气'
                                  : finished
                                  ? '已被领完'
                                  : msg.redPacket.kind === 'password'
                                  ? `口令红包 · 点击输入口令领取`
                                  : '拼手气红包 · 点击领取'}
                              </div>
                            </div>
                          </div>
                          <div className="px-3.5 py-1.5 bg-white dark:bg-[#191c24] text-[11px] text-slate-500 flex items-center justify-between font-mono-tabular">
                            <span>心意红包</span>
                            <span>
                              {msg.redPacket.claims.length}/{msg.redPacket.totalCount} 个
                            </span>
                          </div>
                        </button>
                      );
                    })()}

                    {/* Message Emoji Reactions Row */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {msg.reactions.map((rx) => {
                          const reactedByMe = rx.userIds.includes('me');
                          return (
                            <button
                              key={rx.emoji}
                              onClick={() => onToggleReaction(activeConv.id, msg.id, rx.emoji)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border font-mono-tabular ${
                                reactedByMe
                                  ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              <span>{rx.emoji}</span>
                              <span>{rx.userIds.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Per-Message Action Row (Hover Reveal or stays visible when Microsoft IME Reaction Picker is open) */}
                    <div
                      className={`relative flex flex-wrap items-center gap-1 transition-opacity text-[11px] text-slate-500 ${
                        reactionPickerMsgId === msg.id
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100'
                      } ${isMe ? 'justify-end' : ''}`}
                    >
                      {MS_QUICK_REACTIONS.map((em) => (
                        <button
                          key={em}
                          onClick={() => onToggleReaction(activeConv.id, msg.id, em)}
                          className="px-1 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-sm"
                          title={`快捷回应 ${em}`}
                        >
                          {em}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setReactionPickerMsgId(
                            reactionPickerMsgId === msg.id ? null : msg.id
                          )
                        }
                        className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 border ${
                          reactionPickerMsgId === msg.id
                            ? 'bg-[#2563EB] text-white border-[#2563EB]'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[#2563EB] hover:text-[#2563EB]'
                        }`}
                        title="展开全量表情回应"
                      >
                        <SmilePlus className="w-3.5 h-3.5" />
                        <span>更多表情</span>
                      </button>

                      {reactionPickerMsgId === msg.id && (
                        <div
                          className={`absolute bottom-full mb-2 z-30 ${
                            isMe ? 'right-0' : 'left-0'
                          }`}
                        >
                          <MsImeEmojiPicker
                            compact
                            onSelectEmoji={(em) => {
                              onToggleReaction(activeConv.id, msg.id, em);
                              setReactionPickerMsgId(null);
                            }}
                            onClose={() => setReactionPickerMsgId(null)}
                          />
                        </div>
                      )}

                      <button
                        onClick={() =>
                          setQuote({
                            id: msg.id,
                            senderName: msg.senderName,
                            preview: msg.content.slice(0, 36),
                          })
                        }
                        className="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-0.5"
                        title="引用回复"
                      >
                        <Reply className="w-3 h-3" />
                        引用
                      </button>
                      {(msg.type === 'text' || msg.type === 'voice') && !msg.burned && (
                        <button
                          onClick={() => triggerBubbleVibrate(msg.id)}
                          className="px-1.5 py-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center gap-0.5"
                          title="触发气泡振动提醒"
                        >
                          <Waves className="w-3 h-3" />
                          震一下
                        </button>
                      )}
                      {msg.type === 'text' && !msg.burned && (
                        <>
                          <button
                            onClick={() => onTranslateMessage(activeConv.id, msg.id)}
                            className="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-0.5"
                            title="AI 翻译"
                          >
                            <Languages className="w-3 h-3" />
                            {msg.translating ? '翻译中...' : '翻译'}
                          </button>
                          <button
                            onClick={() => handleSpeakMessage(msg)}
                            className={`px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-0.5 ${
                              speakingMsgId === msg.id ? 'text-[#2563EB] font-medium' : ''
                            }`}
                            title="语音朗读此消息"
                          >
                            <Volume2 className="w-3 h-3" />
                            {speakingMsgId === msg.id ? '停止朗读' : '朗读'}
                          </button>
                          <button
                            onClick={() => onOpenPartialCopy(msg)}
                            className="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-0.5"
                            title="部分选中复制"
                          >
                            <Copy className="w-3 h-3" />
                            部分复制
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => onFavoriteMessage(msg, activeConv.title)}
                        className="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-0.5"
                      >
                        <Bookmark className="w-3 h-3" />
                        收藏
                      </button>
                      <button
                        onClick={() =>
                          onUpdateConversation(activeConv.id, { pinnedMessageId: msg.id })
                        }
                        className="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-0.5"
                      >
                        <Pin className="w-3 h-3" />
                        置顶
                      </button>
                      <button
                        onClick={() => {
                          const newMemo: ChatMemoItem = {
                            id: `memo-${Date.now()}`,
                            text: `${msg.senderName}: ${msg.content.slice(0, 48)}`,
                            done: false,
                            createdAt: msg.timestamp,
                          };
                          onUpdateConversation(activeConv.id, {
                            memos: [newMemo, ...(activeConv.memos || [])],
                          });
                        }}
                        className="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-0.5"
                        title="转为会话待办备忘"
                      >
                        <ListTodo className="w-3 h-3" />
                        待办
                      </button>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setQuickArchivePopoverMsgId(
                              quickArchivePopoverMsgId === msg.id ? null : msg.id
                            )
                          }
                          className={`px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-0.5 ${
                            archivedInFolder ? 'text-[#2563EB] font-medium' : ''
                          }`}
                          title="归档或移动到消息分组文件夹（也可长按消息拖拽归档）"
                        >
                          <FolderInput className="w-3 h-3" />
                          {archivedInFolder ? '改分组' : '归档'}
                        </button>
                        {quickArchivePopoverMsgId === msg.id && (
                          <div
                            className={`absolute bottom-full mb-1.5 z-30 w-44 rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-xs ${
                              isMe ? 'right-0' : 'left-0'
                            }`}
                          >
                            <div className="px-2.5 py-1 text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                              归档到分组文件夹
                            </div>
                            {chatFolders.map((folder) => {
                              const inside = (folder.archivedMessages || []).some(
                                (a) => a.messageId === msg.id
                              );
                              return (
                                <button
                                  key={`qa-${folder.id}`}
                                  type="button"
                                  onClick={() => {
                                    onArchiveMessageToFolder?.(
                                      folder.id,
                                      msg,
                                      activeConv.id,
                                      activeConv.title
                                    );
                                    setQuickArchivePopoverMsgId(null);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between gap-2"
                                >
                                  <span className="flex items-center gap-1.5 truncate">
                                    <span
                                      className="w-2 h-2 rounded-full shrink-0"
                                      style={{ backgroundColor: folder.color }}
                                    />
                                    <span className="truncate">{folder.name}</span>
                                  </span>
                                  {inside && <Check className="w-3 h-3 text-[#2563EB] shrink-0" />}
                                </button>
                              );
                            })}
                            {archivedInFolder && (
                              <button
                                type="button"
                                onClick={() => {
                                  onRemoveArchivedMessage?.(archivedInFolder.id, msg.id);
                                  setQuickArchivePopoverMsgId(null);
                                }}
                                className="w-full px-2.5 py-1.5 text-left text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-t border-slate-100 dark:border-slate-800"
                              >
                                移出归档
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setQuickArchivePopoverMsgId(null);
                                setFolderModalPreselectArchiveMsg({
                                  msg,
                                  conversationId: activeConv.id,
                                  conversationTitle: activeConv.title,
                                });
                                setFolderModalOpen(true);
                              }}
                              className="w-full px-2.5 py-1.5 text-left text-[#2563EB] hover:bg-[#2563EB]/5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1"
                            >
                              <FolderPlus className="w-3 h-3" />
                              新建分组并归档...
                            </button>
                          </div>
                        )}
                      </div>
                      {activeConv.kind === 'group' && (
                        <button
                          onClick={() => onToggleEssence(activeConv.id, msg.id)}
                          className="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-0.5"
                        >
                          <Star className="w-3 h-3" />
                          {msg.isEssence ? '取消精华' : '设精华'}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setMultiSelectMode(true);
                          setSelectedMsgIds([msg.id]);
                        }}
                        className="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-0.5"
                      >
                        <CheckSquare className="w-3 h-3" />
                        多选
                      </button>
                      {isMe && (
                        <button
                          onClick={() => onRecallMessage(activeConv.id, msg.id)}
                          className="px-1.5 py-0.5 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 flex items-center gap-0.5"
                        >
                          <RotateCcw className="w-3 h-3" />
                          撤回
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Multi-Select Bottom Bar */}
          {multiSelectMode ? (
            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#191c24] flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 font-mono-tabular">
                已选中 {selectedMsgIds.length} 条消息
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={selectedMsgIds.length === 0}
                  onClick={() => {
                    const picked = rawMessages.filter((m) => selectedMsgIds.includes(m.id));
                    onOpenForwardMessages(picked);
                    setMultiSelectMode(false);
                    setSelectedMsgIds([]);
                  }}
                  className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-[#2563EB] text-white disabled:opacity-40"
                >
                  <Forward className="w-3.5 h-3.5" />
                  多选转发
                </button>
                <button
                  disabled={selectedMsgIds.length === 0}
                  onClick={() => {
                    onDeleteMessages(activeConv.id, selectedMsgIds);
                    setMultiSelectMode(false);
                    setSelectedMsgIds([]);
                  }}
                  className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-rose-600 text-white disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  删除
                </button>
                <button
                  onClick={() => {
                    setMultiSelectMode(false);
                    setSelectedMsgIds([]);
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  取消多选
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-4 mb-3.5 mt-1 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white/92 dark:bg-[#161b26]/92 backdrop-blur-xl shadow-[0_12px_32px_-12px_rgba(15,23,42,0.16)] focus-within:ring-2 focus-within:ring-[#2563EB]/25 focus-within:border-[#2563EB]/50 transition-all shrink-0 relative z-20">
              {/* Group Quick Bar (群快捷栏: 通知、工具箱、通讯录、文档、频道) */}
              {activeConv.kind === 'group' && activeConv.quickBar && (
                <div className="px-4 py-1.5 rounded-t-2xl border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto bg-slate-50/80 dark:bg-[#151a24]/80">
                  <span className="text-[11px] text-slate-400 mr-1 shrink-0">群快捷栏:</span>
                  {activeConv.quickBar
                    .filter((q) => q.enabled)
                    .map((q) => {
                      const iconMap: Record<GroupQuickBarItem['id'], React.ReactNode> = {
                        notices: <Bell className="w-3 h-3" />,
                        toolbox: <Wrench className="w-3 h-3" />,
                        directory: <Users className="w-3 h-3" />,
                        docs: <FolderOpen className="w-3 h-3" />,
                        channel: <Radio className="w-3 h-3" />,
                      };
                      return (
                        <button
                          key={q.id}
                          onClick={() => {
                            if (q.id === 'channel') {
                              onOpenChannelsTab();
                            } else {
                              setGroupDrawerTab(groupDrawerTab === q.id ? null : q.id);
                            }
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                            groupDrawerTab === q.id
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#2563EB]'
                          }`}
                        >
                          {iconMap[q.id]}
                          {q.label}
                        </button>
                      );
                    })}
                </div>
              )}

              {/* AI Smart Reply & Polish Suggestion Bar */}
              {(aiSuggestions.length > 0 || aiReplyError) && (
                <div className="px-4 py-2 bg-sky-50/70 dark:bg-sky-950/20 border-b border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{draft.trim() ? 'AI 润色建议（点击采用）：' : 'AI 快捷回复建议（点击填入）：'}</span>
                    <button
                      onClick={() => {
                        setAiSuggestions([]);
                        setAiReplyError('');
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      关闭
                    </button>
                  </div>
                  {aiReplyError ? (
                    <div className="text-xs text-rose-600">{aiReplyError}</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {aiSuggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setDraft(s.text);
                            setAiSuggestions([]);
                          }}
                          className="text-left px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] text-xs text-slate-800 dark:text-slate-200"
                        >
                          <span className="text-[#2563EB] font-medium mr-1">{s.style}:</span>
                          {s.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Scheduled Messages Queue Banner */}
              {scheduledQueue.length > 0 && (
                <div className="px-4 py-1.5 bg-indigo-50/80 dark:bg-indigo-950/30 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-medium text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    待定时发送 ({scheduledQueue.length})：
                  </span>
                  {scheduledQueue.map((item) => {
                    const remainSec = Math.max(0, Math.ceil((item.sendAt - nowTick) / 1000));
                    return (
                      <div
                        key={item.id}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-[11px]"
                      >
                        <span className="truncate max-w-[140px]">{item.content}</span>
                        <span className="font-mono-tabular text-indigo-600">{remainSec}s</span>
                        <button
                          onClick={() =>
                            setScheduledQueue((prev) => prev.filter((x) => x.id !== item.id))
                          }
                          className="text-slate-400 hover:text-rose-500"
                          title="取消定时发送"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Burn-After-Reading Active Notice */}
              {burnMode && (
                <div className="px-4 py-1.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    已开启「阅后即焚模式」：下条发送的消息将在对方点击查看 10 秒后自动销毁
                  </span>
                  <button onClick={() => setBurnMode(false)} className="underline">
                    关闭
                  </button>
                </div>
              )}

              {/* Slash Command Palette when typing '/' */}
              {draft.startsWith('/') && (
                <div className="absolute bottom-full left-4 mb-2 w-80 rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-700 shadow-2xl p-2 space-y-1 z-30 text-xs">
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400">
                    星涟快捷斜杠指令
                  </div>
                  {[
                    {
                      cmd: '/dice',
                      desc: '掷骰子随机比拼点数',
                      action: () => {
                        setDraft('');
                        handleSendDice();
                      },
                    },
                    {
                      cmd: '/rps',
                      desc: '随机猜拳（石头/剪刀/布）',
                      action: () => {
                        setDraft('');
                        handleSendRps();
                      },
                    },
                    {
                      cmd: '/nudge',
                      desc: '发送窗口抖动 / 拍一拍',
                      action: () => {
                        setDraft('');
                        triggerNudge(targetContact?.name);
                      },
                    },
                    {
                      cmd: '/burn',
                      desc: '切换阅后即焚（10秒自动销毁）',
                      action: () => {
                        setDraft('');
                        setBurnMode((v) => !v);
                      },
                    },
                    {
                      cmd: '/pomodoro',
                      desc: '发起 25 分钟群专注自习室',
                      action: () => {
                        setDraft('');
                        handleStartPomodoro();
                      },
                    },
                    {
                      cmd: '/redpacket',
                      desc: '打开心意红包面板',
                      action: () => {
                        setDraft('');
                        setSendRpOpen(true);
                      },
                    },
                  ]
                    .filter((item) => item.cmd.includes(draft.trim().toLowerCase()))
                    .map((item) => (
                      <button
                        key={item.cmd}
                        onClick={item.action}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-[#2563EB]/10 text-left"
                      >
                        <span className="font-mono-tabular font-semibold text-[#2563EB]">
                          {item.cmd}
                        </span>
                        <span className="text-slate-500">{item.desc}</span>
                      </button>
                    ))}
                </div>
              )}

              {/* Quote Preview */}
              {quote && (
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span className="truncate">
                    回复 {quote.senderName}：{quote.preview}
                  </span>
                  <button onClick={() => setQuote(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Full Emoji, Kaomoji & Super Sticker Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-full left-4 mb-2 z-20">
                  <MsImeEmojiPicker
                    onSelectEmoji={(em) => setDraft((d) => d + em)}
                    onSelectKaomoji={(txt) => setDraft((d) => d + txt)}
                    onSendSticker={(emoji, label, superEffect) => {
                      onSendMessage(activeConv.id, {
                        type: 'sticker',
                        content: emoji,
                        stickerLabel: label,
                        isSuperEmoji: Boolean(superEffect),
                        superEmojiEffect: superEffect,
                      });
                      if (superEffect) {
                        triggerSuperEffect(emoji, superEffect);
                      }
                      setShowEmojiPicker(false);
                    }}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              )}

              {/* Scheduled Send Delay Picker */}
              {schedulePopoverOpen && (
                <div className="absolute bottom-full left-72 mb-2 w-60 rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-700 shadow-xl p-3 space-y-2 z-20 text-xs">
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    定时发送当前草稿
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {draft.trim() ? `内容：${draft.trim()}` : '请先在下方输入框输入消息内容'}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: '10 秒后', sec: 10 },
                      { label: '30 秒后', sec: 30 },
                      { label: '1 分钟后', sec: 60 },
                    ].map((opt) => (
                      <button
                        key={opt.sec}
                        disabled={!draft.trim()}
                        onClick={() => {
                          if (!draft.trim()) return;
                          setScheduledQueue((prev) => [
                            ...prev,
                            {
                              id: `schm-${Date.now()}`,
                              convId: activeConv.id,
                              convTitle: activeConv.title,
                              content: draft.trim(),
                              sendAt: Date.now() + opt.sec * 1000,
                            },
                          ]);
                          setDraft('');
                          setSchedulePopoverOpen(false);
                        }}
                        className="py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#2563EB] hover:text-white disabled:opacity-40 font-medium"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Card Picker Popover */}
              {showCardPicker && (
                <div className="absolute bottom-full left-24 mb-2 w-64 rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-700 shadow-xl p-2 z-20">
                  <div className="px-2 py-1 text-xs font-semibold text-slate-500">
                    发送好友名片到聊天
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {contacts
                      .filter((c) => !c.blocked)
                      .map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            onSendMessage(activeConv.id, {
                              type: 'contact_card',
                              content: `[名片] ${c.name}`,
                              contactCard: {
                                qqNumber: c.qqNumber,
                                name: c.name,
                                signature: c.signature,
                                avatar: c.avatar,
                              },
                            });
                            setShowCardPicker(false);
                          }}
                          className="w-full flex items-center gap-2.5 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left rounded-lg"
                        >
                          <AvatarView name={c.name} src={c.avatar} size="xs" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                              {c.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono-tabular">
                              星涟号 {c.qqNumber}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Group Interactive Tools Popover */}
              {showGroupToolsMenu && activeConv.kind === 'group' && (
                <div className="absolute bottom-full left-44 mb-2 w-60 rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-700 shadow-xl p-2 space-y-1 z-20 text-xs">
                  <button
                    onClick={() => {
                      setCreatePollOpen(true);
                      setShowGroupToolsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-slate-800 dark:text-slate-200"
                  >
                    <Vote className="w-4 h-4 text-[#2563EB]" />
                    发起群投票
                  </button>
                  <button
                    onClick={() => {
                      onSendMessage(activeConv.id, {
                        type: 'solitaire',
                        content: '#接龙 活动报名统计',
                        solitaire: {
                          id: `sol-${Date.now()}`,
                          title: '周六技术沙龙线下参会统计',
                          formatHint: '姓名 - 参会人数',
                          entries: [
                            {
                              index: 1,
                              authorId: 'me',
                              authorName: ME_PROFILE.name,
                              value: '苏明远 - 1人参加',
                              time: new Date().toTimeString().slice(0, 5),
                            },
                          ],
                        },
                      });
                      setShowGroupToolsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-slate-800 dark:text-slate-200"
                  >
                    <ListChecks className="w-4 h-4 text-emerald-600" />
                    发起群接龙（支持导出表格）
                  </button>
                  <button
                    onClick={() => {
                      onSendMessage(activeConv.id, {
                        type: 'homework',
                        content: '群作业：提交接口联调文档',
                        homework: {
                          id: `hw-${Date.now()}`,
                          subject: '工程实践',
                          title: '请各位同学提交本周联调验收文档',
                          deadline: '周日 20:00 截止',
                          submittedUserIds: [],
                        },
                      });
                      setShowGroupToolsMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-slate-800 dark:text-slate-200"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    布置群作业
                  </button>
                </div>
              )}

              {/* Live Voice Recording Soundwave Visualizer */}
              {recordingVoice && (
                <VoiceRecorderWaveformBar
                  seconds={recordSeconds}
                  waveformEnabled={notifications.visualEffects.voiceWaveformEnabled}
                  onCancel={() => setRecordingVoice(false)}
                  onSend={() => {
                    onSendMessage(activeConv.id, {
                      type: 'voice',
                      content: `[语音消息 ${Math.max(1, recordSeconds)}秒]`,
                      voiceDurationSec: Math.max(1, recordSeconds),
                    });
                    setRecordingVoice(false);
                  }}
                />
              )}

              {/* Composer Toolbar */}
              <div className="px-4 pt-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800"
                    title="表情与表情包"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                  <label
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 cursor-pointer"
                    title="发送图片"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
                  </label>
                  <button
                    onClick={() =>
                      onSendMessage(activeConv.id, {
                        type: 'video',
                        content: '产品功能演示片段_1080P.mp4',
                      })
                    }
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800"
                    title="发送视频"
                  >
                    <Film className="w-4 h-4" />
                  </button>
                  <label
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 cursor-pointer"
                    title="发送文件"
                  >
                    <Paperclip className="w-4 h-4" />
                    <input type="file" onChange={handleUploadFile} className="hidden" />
                  </label>
                  <button
                    onClick={() => setShowCardPicker(!showCardPicker)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800"
                    title="发送好友名片"
                  >
                    <UserSquare2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onOpenScreenshot}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800"
                    title="全能截图工作台（框选裁剪/打码/AI识图/桌面贴图）"
                  >
                    <Scissors className="w-4 h-4" />
                  </button>
                  {onOpenDoodle && (
                    <button
                      onClick={onOpenDoodle}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#2563EB]"
                      title="快捷涂鸦画板（随手涂鸦/气泡标注/贴纸）"
                    >
                      <Brush className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (recordingVoice) {
                        onSendMessage(activeConv.id, {
                          type: 'voice',
                          content: `[语音消息 ${Math.max(1, recordSeconds)}秒]`,
                          voiceDurationSec: Math.max(1, recordSeconds),
                        });
                        setRecordingVoice(false);
                      } else {
                        setRecordingVoice(true);
                      }
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                      recordingVoice
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="录制语音消息"
                  >
                    <Mic className="w-4 h-4" />
                    {recordingVoice && (
                      <span className="font-mono-tabular">点击发送 {recordSeconds}s</span>
                    )}
                  </button>
                  <button
                    onClick={() => triggerNudge(targetContact?.name)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-600"
                    title="窗口抖动 / 拍一拍"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setVibrateNextMsg((v) => !v)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                      vibrateNextMsg
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-600'
                    }`}
                    title="开启后，下一条发送的消息将附带「气泡振动」动效"
                  >
                    <Waves className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">气泡振动</span>
                  </button>
                  <button
                    onClick={() => setSendRpOpen(true)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-500"
                    title="发送心意红包"
                  >
                    <Gift className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSendDice}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-500"
                    title="掷骰子"
                  >
                    <Dices className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSendRps}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-500"
                    title="猜拳小游戏"
                  >
                    <Hand className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setBurnMode((v) => !v)}
                    className={`p-1.5 rounded-lg ${
                      burnMode
                        ? 'bg-amber-500 text-white'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-600'
                    }`}
                    title="阅后即焚模式（10秒销毁）"
                  >
                    <Flame className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSchedulePopoverOpen((v) => !v)}
                    className={`p-1.5 rounded-lg ${
                      schedulePopoverOpen
                        ? 'bg-[#2563EB]/15 text-[#2563EB]'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#2563EB]'
                    }`}
                    title="定时发送消息"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleStartPomodoro}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600"
                    title="发起 25 分钟专注自习室"
                  >
                    <Timer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setQuickPhrasesOpen((v) => !v)}
                    className={`p-1.5 rounded-lg ${
                      quickPhrasesOpen
                        ? 'bg-[#2563EB]/15 text-[#2563EB]'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#2563EB]'
                    }`}
                    title="快捷常用语与话术模板"
                  >
                    <MessageSquareQuote className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMemoInputOpen((v) => !v)}
                    className={`p-1.5 rounded-lg ${
                      memoInputOpen
                        ? 'bg-amber-500/15 text-amber-600'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-600'
                    }`}
                    title="添加本会话待办备忘"
                  >
                    <ListTodo className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleFetchSmartReply}
                    disabled={aiReplyLoading}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[#2563EB] hover:bg-[#2563EB]/10 disabled:opacity-50"
                    title="AI 智能回复或润色当前文案"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    {aiReplyLoading ? '生成中...' : draft.trim() ? 'AI润色' : 'AI回复'}
                  </button>
                  {activeConv.kind === 'group' && (
                    <button
                      onClick={() => setShowGroupToolsMenu(!showGroupToolsMenu)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ClipboardList className="w-4 h-4 text-[#2563EB]" />
                      投票/接龙/作业
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Phrases Popover */}
              {quickPhrasesOpen && (
                <div className="absolute bottom-full left-16 mb-2 w-80 rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-700 shadow-2xl p-3 space-y-2 z-30 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <MessageSquareQuote className="w-3.5 h-3.5 text-[#2563EB]" />
                      快捷常用语（点击填入）
                    </span>
                    <button
                      onClick={() => setQuickPhrasesOpen(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {phrases.map((ph, idx) => (
                      <div
                        key={`${ph}-${idx}`}
                        className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setDraft(draft ? `${draft} ${ph}` : ph);
                            setQuickPhrasesOpen(false);
                          }}
                          className="flex-1 text-left text-slate-700 dark:text-slate-200 truncate"
                        >
                          {ph}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSendMessage(activeConv.id, { type: 'text', content: ph });
                            setQuickPhrasesOpen(false);
                          }}
                          className="px-2 py-0.5 rounded bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-medium hover:bg-[#2563EB] hover:text-white shrink-0"
                        >
                          直发
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <input
                      value={newPhraseInput}
                      onChange={(e) => setNewPhraseInput(e.target.value)}
                      placeholder="新增常用语..."
                      className="flex-1 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newPhraseInput.trim()) return;
                        setPhrases((prev) => [newPhraseInput.trim(), ...prev]);
                        setNewPhraseInput('');
                      }}
                      className="px-2.5 py-1 rounded bg-[#2563EB] text-white text-[11px] font-medium"
                    >
                      添加
                    </button>
                  </div>
                </div>
              )}

              {/* Composer Status Strip (Typing Decor & Bubble Vibrate Hint) */}
              {(vibrateNextMsg || draft.trim().length > 0) && (
                <div className="px-4 pt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 truncate">
                    {draft.trim().length > 0 && !minimalMode
                      ? `对方可见输入状态：${effectiveDressUp.typingDecor}`
                      : ''}
                  </span>
                  {vibrateNextMsg && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1 shrink-0">
                      <Waves className="w-3 h-3" />
                      本条消息发送时将触发气泡振动
                    </span>
                  )}
                </div>
              )}

              {/* Input Textarea */}
              <div className="px-4 pb-3 pt-1 flex items-end gap-3">
                <textarea
                  rows={2}
                  value={draft}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (
                      val.length !== draft.length &&
                      notifications.chatSounds.enabled &&
                      notifications.chatSounds.typingFeedbackEnabled &&
                      !notifications.dndEnabled &&
                      !activeConv.muted
                    ) {
                      const now = Date.now();
                      if (now - lastTypingSoundAtRef.current >= 45) {
                        lastTypingSoundAtRef.current = now;
                        playSoundEffect(
                          notifications.chatSounds.perMessageType.typing,
                          notifications.chatSounds.masterVolume
                        );
                      }
                    }
                    setDraft(val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendText();
                    }
                  }}
                  placeholder={`发消息给 ${activeConv.title}（输入 / 呼出快捷指令 · Enter 发送）`}
                  className={`flex-1 resize-none bg-transparent text-sm text-slate-900 dark:text-slate-100 focus:outline-none ${
                    careMode ? 'care-text-base' : ''
                  }`}
                />
                <div className="flex items-center gap-2 shrink-0">
                  {uiLayout === 'compact' && (
                    <button
                      onClick={() => setDraft('')}
                      className="px-3.5 py-2 text-xs font-medium rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      清空(C)
                    </button>
                  )}
                  <button
                    onClick={handleSendText}
                    disabled={!draft.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0D9488] text-white shadow-[0_4px_14px_-4px_rgba(37,99,235,0.55)] hover:opacity-95 disabled:opacity-40 disabled:shadow-none transition-all whitespace-nowrap shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {uiLayout === 'compact' ? '发送(S)' : '发送'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message Visual Effects & Super Emoji Overlay */}
          <MessageVisualEffectsOverlay activeEffect={activeVisualEffect} />
        </div>
      )}

      {/* 3. Right Chat Settings & Sound Effects Drawer */}
      {activeConv && chatSettingsOpen && !groupDrawerTab && (
        <aside className="w-96 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-[#f7f9fc] dark:bg-[#14171f] flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#191c24]">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-[#2563EB]" />
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                聊天设置 · {activeConv.title}
              </span>
            </div>
            <button
              onClick={() => setChatSettingsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {/* Conversation Quick Toggles */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#191c24] divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <label className="px-3.5 py-2.5 flex items-center justify-between cursor-pointer">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  置顶当前会话
                </span>
                <input
                  type="checkbox"
                  checked={activeConv.pinned}
                  onChange={(e) =>
                    onUpdateConversation(activeConv.id, { pinned: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#2563EB]"
                />
              </label>
              <label className="px-3.5 py-2.5 flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    消息免打扰
                  </div>
                  <div className="text-[11px] text-slate-400">
                    开启后本会话不再播放收发与打字音效
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={activeConv.muted}
                  onChange={(e) =>
                    onUpdateConversation(activeConv.id, { muted: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#2563EB]"
                />
              </label>
              {onOpenFullVisualSettings && (
                <button
                  onClick={() => {
                    setChatSettingsOpen(false);
                    onOpenFullVisualSettings();
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-[#2563EB] hover:bg-[#2563EB]/5 font-medium"
                >
                  <span>管理全部联系人/群聊视觉特效</span>
                  <span>→</span>
                </button>
              )}
              {onOpenFullSoundSettings && (
                <button
                  onClick={() => {
                    setChatSettingsOpen(false);
                    onOpenFullSoundSettings();
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-[#2563EB] hover:bg-[#2563EB]/5 font-medium"
                >
                  <span>打开完整系统通知与音效中心</span>
                  <span>→</span>
                </button>
              )}
            </div>

            {/* Per-Conversation Exclusive Dress-Up Card (新增专属聊天装扮) */}
            {onUpdateConvDressUp && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#191c24] p-3.5 space-y-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                    <Palette className="w-4 h-4 text-[#2563EB]" />
                    <span>专属聊天装扮</span>
                  </div>
                  {hasExclusiveDressUp ? (
                    <button
                      type="button"
                      onClick={() => onUpdateConvDressUp(activeConv.id, null)}
                      className="text-[11px] text-rose-500 hover:underline inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      恢复全局
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">跟随全局</span>
                  )}
                </div>

                {/* Quick Exclusive Bubble Selector */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-500">本会话专属气泡</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {BUBBLE_PRESETS.slice(0, 6).map((bp) => {
                      const active = effectiveDressUp.bubbleId === bp.id;
                      return (
                        <button
                          key={`conv-bp-${bp.id}`}
                          type="button"
                          onClick={() =>
                            onUpdateConvDressUp(activeConv.id, { bubbleId: bp.id })
                          }
                          className={`px-2 py-1.5 rounded-lg border text-left text-[11px] truncate transition-colors ${
                            active
                              ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB] font-semibold'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#2563EB]'
                          }`}
                        >
                          {bp.cornerBadge ? `${bp.cornerBadge} ` : ''}
                          {bp.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Exclusive Font & Typing Status */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[11px] text-slate-500 mb-1">专属字体</div>
                    <select
                      value={effectiveDressUp.fontId}
                      onChange={(e) =>
                        onUpdateConvDressUp(activeConv.id, {
                          fontId: e.target.value as DressUpConfig['fontId'],
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[11px]"
                    >
                      {FONT_PRESETS.map((ft) => (
                        <option key={`conv-ft-${ft.id}`} value={ft.id}>
                          {ft.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 mb-1">专属输入状态</div>
                    <select
                      value={effectiveDressUp.typingDecor}
                      onChange={(e) =>
                        onUpdateConvDressUp(activeConv.id, {
                          typingDecor: e.target.value,
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[11px]"
                    >
                      {TYPING_DECOR_PRESETS.map((td) => (
                        <option key={`conv-td-${td}`} value={td}>
                          {td}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {onOpenDressUpStudio && (
                  <button
                    type="button"
                    onClick={() => {
                      setChatSettingsOpen(false);
                      onOpenDressUpStudio();
                    }}
                    className="w-full py-2 rounded-lg bg-[#2563EB]/10 hover:bg-[#2563EB]/20 text-[#2563EB] font-semibold text-xs transition-colors"
                  >
                    前往装扮中心自定义气泡 / 头像框 / 彩铃 →
                  </button>
                )}
              </div>
            )}

            {/* Chat Background Customizer */}
            <ChatBackgroundPicker
              currentBg={activeBg}
              conversationTitle={activeConv.title}
              hasCustomOverride={Boolean(chatBackgrounds.perConversation[activeConv.id])}
              onChangeCurrentBg={(next) => onUpdateChatBackground(activeConv.id, next)}
              onApplyToAll={(next) => onUpdateChatBackground('all', next)}
              onResetCurrent={() => onUpdateChatBackground('reset_conv')}
            />

            {/* Per-Conversation Visual Effects Configurator */}
            <MessageVisualEffectsManager
              notifications={notifications}
              onUpdateNotifications={onUpdateNotifications}
              conversations={conversations}
              activeConversation={activeConv}
              compact
            />

            {/* Sound Effects Manager Module */}
            <SoundEffectsManager
              notifications={notifications}
              onUpdateNotifications={onUpdateNotifications}
              compact
            />
          </div>
        </aside>
      )}

      {/* 3.5 Right Message Archive Folders Drawer */}
      {activeConv && archiveDrawerFolderId && !chatSettingsOpen && !groupDrawerTab && (
        <aside className="w-80 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-[#f7f9fc] dark:bg-[#14171f] flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#191c24]">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-[#2563EB]" />
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                消息分组归档箱
              </span>
            </div>
            <button
              onClick={() => setArchiveDrawerFolderId(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5 bg-white/70 dark:bg-[#191c24]/60">
            {chatFolders.map((folder) => {
              const selected = archiveDrawerFolderId === folder.id;
              const count = (folder.archivedMessages || []).length;
              return (
                <button
                  key={`drawer-tab-${folder.id}`}
                  type="button"
                  data-drop-folder-id={folder.id}
                  onClick={() => setArchiveDrawerFolderId(folder.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const archMsgId = e.dataTransfer.getData('text/sr-arch-msg-id');
                    if (archMsgId) {
                      for (const srcFolder of chatFolders) {
                        const found = (srcFolder.archivedMessages || []).find(
                          (a) => a.messageId === archMsgId
                        );
                        if (found) {
                          const syntheticMsg: ChatMessage = {
                            id: found.messageId,
                            conversationId: found.conversationId,
                            senderId: 'other',
                            senderName: found.senderName,
                            senderAvatar: found.senderAvatar,
                            type: found.type,
                            content: found.content,
                            timestamp: found.timestamp,
                            createdAt: Date.now(),
                          };
                          onArchiveMessageToFolder?.(
                            folder.id,
                            syntheticMsg,
                            found.conversationId,
                            found.conversationTitle
                          );
                          setArchiveDrawerFolderId(folder.id);
                          break;
                        }
                      }
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium inline-flex items-center gap-1.5 border transition-colors ${
                    selected
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#2563EB]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: selected ? '#ffffff' : folder.color }}
                  />
                  <span>{folder.name}</span>
                  <span className="text-[10px] font-mono-tabular opacity-80">({count})</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setFolderModalPreselectArchiveMsg(null);
                setFolderModalOpen(true);
              }}
              className="px-2 py-1 rounded-lg text-[11px] border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-[#2563EB] hover:border-[#2563EB] inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              新建
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
            {(() => {
              const currentFolder =
                chatFolders.find((f) => f.id === archiveDrawerFolderId) || chatFolders[0];
              if (!currentFolder) {
                return (
                  <div className="py-12 text-center text-slate-400">
                    暂无分组文件夹，请先创建一个消息分组。
                  </div>
                );
              }
              const items = currentFolder.archivedMessages || [];
              if (items.length === 0) {
                return (
                  <div className="py-10 px-4 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/40">
                    <Archive className="w-6 h-6 mx-auto opacity-50" />
                    <p>「{currentFolder.name}」暂无归档消息</p>
                    <p className="text-[11px] leading-relaxed">
                      在左侧聊天记录中长按任意非系统消息，即可将其拖拽至顶部或左侧分组文件夹中归档。
                    </p>
                  </div>
                );
              }
              return items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/sr-arch-msg-id', item.messageId);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#191c24] p-3 space-y-2 shadow-2xs cursor-grab active:cursor-grabbing hover:border-[#2563EB]/50 transition-colors"
                  title="可拖动此卡片至上方其他分组标签以重新归档"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {item.senderName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono-tabular shrink-0">
                      {item.timestamp} · 归档于 {item.archivedAt}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#2563EB] truncate">
                    来自会话：{item.conversationTitle}
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/70 rounded-lg px-2.5 py-2 break-words line-clamp-3">
                    {item.content}
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (onJumpToMessage) {
                            onJumpToMessage(item.conversationId, item.messageId);
                          } else {
                            onSelectConv(item.conversationId);
                          }
                        }}
                        className="px-2 py-1 rounded-md bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 inline-flex items-center gap-1 text-[11px] font-medium"
                      >
                        <MapPin className="w-3 h-3" />
                        定位
                      </button>
                      {chatFolders.length > 1 && (
                        <div className="inline-flex items-center gap-1">
                          <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                          <select
                            value=""
                            onChange={(e) => {
                              const destId = e.target.value;
                              if (!destId) return;
                              const syntheticMsg: ChatMessage = {
                                id: item.messageId,
                                conversationId: item.conversationId,
                                senderId: 'other',
                                senderName: item.senderName,
                                senderAvatar: item.senderAvatar,
                                type: item.type,
                                content: item.content,
                                timestamp: item.timestamp,
                                createdAt: Date.now(),
                              };
                              onArchiveMessageToFolder?.(
                                destId,
                                syntheticMsg,
                                item.conversationId,
                                item.conversationTitle
                              );
                              setArchiveDrawerFolderId(destId);
                            }}
                            className="text-[11px] px-1.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                          >
                            <option value="">移至其他分组...</option>
                            {chatFolders
                              .filter((f) => f.id !== currentFolder.id)
                              .map((f) => (
                                <option key={`mv-${f.id}`} value={f.id}>
                                  {f.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onRemoveArchivedMessage?.(currentFolder.id, item.messageId)
                      }
                      className="text-[11px] text-rose-500 hover:underline"
                    >
                      移出
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
        </aside>
      )}

      {/* 4. Right Group Features & Management Drawer */}
      {activeConv && activeConv.kind === 'group' && groupDrawerTab && (
        <aside className="w-80 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-[#f7f9fc] dark:bg-[#14171f] flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {groupDrawerTab === 'notices'
                ? '群公告'
                : groupDrawerTab === 'toolbox'
                ? '群工具箱（签到/课堂/直播）'
                : groupDrawerTab === 'directory'
                ? '群成员与禁言管理'
                : groupDrawerTab === 'docs'
                ? '群文件与群相册'
                : groupDrawerTab === 'channel'
                ? '群精华消息'
                : '群管理与快捷栏配置'}
            </span>
            <button
              onClick={() => setGroupDrawerTab(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Quick switcher */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-200/60 dark:bg-slate-800">
              {[
                { id: 'notices', label: '公告' },
                { id: 'toolbox', label: '工具箱' },
                { id: 'directory', label: '成员' },
                { id: 'docs', label: '文件相册' },
                { id: 'channel', label: '群精华' },
                { id: 'manage', label: '群管理' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setGroupDrawerTab(t.id as typeof groupDrawerTab)}
                  className={`py-1 rounded font-medium ${
                    groupDrawerTab === t.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {groupDrawerTab === 'notices' && (
              <div className="space-y-3">
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">当前群公告</div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeConv.announcement}
                  </p>
                </div>
                <textarea
                  rows={3}
                  value={announcementDraft}
                  onChange={(e) => setAnnouncementDraft(e.target.value)}
                  placeholder="发布新群公告并推送给全群成员..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs"
                />
                <button
                  onClick={() => {
                    if (!announcementDraft.trim()) return;
                    onUpdateConversation(activeConv.id, { announcement: announcementDraft.trim() });
                    onSendMessage(activeConv.id, {
                      type: 'announcement',
                      content: announcementDraft.trim(),
                    });
                    setAnnouncementDraft('');
                  }}
                  className="w-full py-2 rounded-lg bg-[#2563EB] text-white font-medium"
                >
                  发布群公告
                </button>
              </div>
            )}

            {groupDrawerTab === 'toolbox' && (
              <div className="space-y-4">
                {/* 群签到 */}
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      群签到打卡
                    </span>
                    <button
                      onClick={() => {
                        const already = (activeConv.checkIns || []).some(
                          (c) => c.userId === 'me'
                        );
                        if (already) return;
                        onUpdateConversation(activeConv.id, {
                          checkIns: [
                            {
                              userId: 'me',
                              name: ME_PROFILE.name,
                              time: new Date().toTimeString().slice(0, 5),
                              streak: 15,
                            },
                            ...(activeConv.checkIns || []),
                          ],
                        });
                      }}
                      className="px-2.5 py-1 rounded bg-[#2563EB] text-white font-medium"
                    >
                      {(activeConv.checkIns || []).some((c) => c.userId === 'me')
                        ? '今日已签到'
                        : '立即签到'}
                    </button>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-500">
                    {(activeConv.checkIns || []).map((ci) => (
                      <div key={ci.userId} className="flex justify-between font-mono-tabular">
                        <span>{ci.name}</span>
                        <span>{ci.time} · 连签 {ci.streak}天</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 群课堂 */}
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                    <GraduationCap className="w-4 h-4 text-indigo-500" />
                    群课堂 · 实时在线公开课
                  </div>
                  <p className="text-slate-500">
                    当前讲师：陈子昂《大型即时通讯架构演进》
                  </p>
                  <button
                    onClick={() => setClassroomRaisedHand(!classroomRaisedHand)}
                    className={`w-full py-1.5 rounded-lg font-medium ${
                      classroomRaisedHand
                        ? 'bg-amber-500 text-white'
                        : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300'
                    }`}
                  >
                    {classroomRaisedHand ? '已举手排队提问（点击取消）' : '进入群课堂并举手'}
                  </button>
                </div>

                {/* 群直播 */}
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-rose-500" />
                      群直播间
                    </span>
                    {livestreamActive && <span className="text-rose-500 font-mono-tabular">直播中 · 42人观看</span>}
                  </div>
                  <button
                    onClick={() => setLivestreamActive(!livestreamActive)}
                    className={`w-full py-1.5 rounded-lg font-medium ${
                      livestreamActive
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-900 dark:bg-slate-700 text-white'
                    }`}
                  >
                    {livestreamActive ? '结束群直播' : '开启群直播'}
                  </button>
                </div>
              </div>
            )}

            {groupDrawerTab === 'directory' && (() => {
              const totalCount = enrichedGroupMembers.length;
              const onlinePercent =
                totalCount > 0 ? Math.round((groupOnlineCount / totalCount) * 100) : 0;
              const platformCounts = enrichedGroupMembers
                .filter((m) => m.online)
                .reduce<Record<string, number>>((acc, m) => {
                  const key = m.platform || 'Web';
                  acc[key] = (acc[key] || 0) + 1;
                  return acc;
                }, {});
              const visibleMembers = enrichedGroupMembers.filter((m) =>
                groupOnlineFilter === 'all'
                  ? true
                  : groupOnlineFilter === 'online'
                  ? m.online
                  : !m.online
              );

              return (
                <div className="space-y-3">
                  {/* Group Member Online Status Visualization Dashboard */}
                  <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        群成员在线状态可视化
                      </span>
                      <span className="text-[11px] font-mono-tabular font-semibold text-emerald-600 dark:text-emerald-400">
                        {groupOnlineCount} / {totalCount} 在线 ({onlinePercent}%)
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                        style={{ width: `${onlinePercent}%` }}
                      />
                    </div>

                    {/* Platform Distribution */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-300">
                      {Object.entries(platformCounts).map(([plat, cnt]) => (
                        <span
                          key={`plat-${plat}`}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono-tabular"
                        >
                          {plat} {cnt}
                        </span>
                      ))}
                    </div>

                    {/* Filter Switcher */}
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px]">
                      {[
                        { id: 'all', label: `全部 (${totalCount})` },
                        { id: 'online', label: `在线 (${groupOnlineCount})` },
                        { id: 'offline', label: `离线 (${totalCount - groupOnlineCount})` },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() =>
                            setGroupOnlineFilter(tab.id as 'all' | 'online' | 'offline')
                          }
                          className={`py-1 rounded font-medium transition-colors ${
                            groupOnlineFilter === tab.id
                              ? 'bg-white dark:bg-slate-900 text-[#2563EB] shadow-sm'
                              : 'text-slate-500'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono-tabular flex justify-between">
                      <span>群容量上限：{activeConv.memberCount} / {activeConv.maxMembers} 人</span>
                      <span>实时同步</span>
                    </div>
                  </div>

                  {/* Enriched Member Cards */}
                  <div className="space-y-2">
                    {visibleMembers.map((m) => {
                      const isMuted = m.mutedUntil && m.mutedUntil > Date.now();
                      const statusLabel =
                        !m.online || m.status === 'invisible'
                          ? '离线'
                          : m.status === 'busy'
                          ? '忙碌'
                          : m.status === 'away'
                          ? '离开'
                          : m.status === 'qme'
                          ? 'Q我吧'
                          : '在线';
                      const statusTextColor =
                        !m.online || m.status === 'invisible'
                          ? 'text-slate-400'
                          : m.status === 'busy'
                          ? 'text-rose-500'
                          : m.status === 'away'
                          ? 'text-amber-500'
                          : m.status === 'qme'
                          ? 'text-sky-500'
                          : 'text-emerald-600 dark:text-emerald-400';

                      return (
                        <div
                          key={m.id}
                          className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              onClick={() =>
                                onOpenUserProfile?.({
                                  id: m.id,
                                  name: m.name,
                                  avatar: m.avatar,
                                })
                              }
                              className="flex items-center gap-2.5 text-left hover:opacity-85 group min-w-0 flex-1"
                              title={`查看 ${m.name} 的资料与空间`}
                            >
                              <AvatarView
                                name={m.name}
                                src={m.avatar}
                                size="xs"
                                online={m.online}
                                onlineStatus={m.status}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-[#2563EB] flex items-center gap-1 truncate">
                                  <span className="truncate">{m.name}</span>
                                  {m.role === 'owner' && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                                  {m.role === 'admin' && <Shield className="w-3 h-3 text-[#2563EB] shrink-0" />}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {m.role === 'owner'
                                    ? '群主'
                                    : m.role === 'admin'
                                    ? '管理员'
                                    : m.role === 'bot'
                                    ? '机器人'
                                    : '普通成员'}
                                  {' · '}
                                  <span className={`font-medium ${statusTextColor}`}>
                                    {statusLabel}
                                  </span>
                                  {m.online && m.platform ? ` (${m.platform})` : ''}
                                  {isMuted ? ' · 已被禁言' : ''}
                                </div>
                                {m.moodText && (
                                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                    {m.moodText}
                                  </div>
                                )}
                              </div>
                            </button>
                          </div>

                          {m.role !== 'owner' && (
                            <div className="flex items-center gap-1.5 pt-1">
                              <button
                                onClick={() => {
                                  const nextMembers = (activeConv.members || []).map((x) =>
                                    x.id === m.id
                                      ? {
                                          ...x,
                                          role:
                                            x.role === 'admin'
                                              ? ('member' as const)
                                              : ('admin' as const),
                                        }
                                      : x
                                  );
                                  onUpdateConversation(activeConv.id, { members: nextMembers });
                                }}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:border-[#2563EB]"
                              >
                                {m.role === 'admin' ? '撤销管理' : '设为管理员'}
                              </button>
                              <select
                                value={isMuted ? '60' : '0'}
                                onChange={(e) => {
                                  const mins = Number(e.target.value);
                                  const nextMembers = (activeConv.members || []).map((x) =>
                                    x.id === m.id
                                      ? {
                                          ...x,
                                          mutedUntil: mins > 0 ? Date.now() + mins * 60000 : null,
                                        }
                                      : x
                                  );
                                  onUpdateConversation(activeConv.id, { members: nextMembers });
                                }}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                              >
                                <option value="0">解除/未禁言</option>
                                <option value="10">单独禁言 10分钟</option>
                                <option value="60">单独禁言 1小时</option>
                                <option value="1440">单独禁言 1天</option>
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {groupDrawerTab === 'docs' && (
              <div className="space-y-4">
                <div className="font-semibold text-slate-900 dark:text-slate-100">群相册</div>
                <div className="grid grid-cols-2 gap-2">
                  {(activeConv.album || []).map((ph) => (
                    <div
                      key={ph.id}
                      className="rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                    >
                      <img
                        src={ph.url}
                        alt={ph.caption}
                        referrerPolicy="no-referrer"
                        className="w-full h-20 object-cover"
                      />
                      <div className="p-1.5 text-[11px] truncate text-slate-700 dark:text-slate-300">
                        {ph.caption}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="font-semibold text-slate-900 dark:text-slate-100 pt-2">
                  群文件快捷列表
                </div>
                <div className="space-y-1.5">
                  {rawMessages
                    .filter((m) => m.type === 'file' && m.file)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                      >
                        <span className="truncate">{m.file?.name}</span>
                        <span className="text-slate-400 font-mono-tabular">
                          {formatBytes(m.file?.sizeBytes || 0)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {groupDrawerTab === 'channel' && (
              <div className="space-y-2.5">
                <div className="text-slate-500">群内重要发言设为「群精华」后将永久归档于此：</div>
                {essenceMessages.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">暂无群精华消息</div>
                ) : (
                  essenceMessages.map((em) => (
                    <div
                      key={em.id}
                      className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 space-y-1"
                    >
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {em.senderName} · {em.timestamp}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {em.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {groupDrawerTab === 'manage' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">全体禁言</div>
                    <div className="text-[11px] text-slate-500">开启后仅群主和管理员可发言</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(activeConv.muteAll)}
                    onChange={(e) =>
                      onUpdateConversation(activeConv.id, { muteAll: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#2563EB]"
                  />
                </label>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                      <CalendarClock className="w-3.5 h-3.5 text-[#2563EB]" />
                      定时禁言
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(activeConv.scheduledMute?.enabled)}
                      onChange={(e) =>
                        onUpdateConversation(activeConv.id, {
                          scheduledMute: {
                            enabled: e.target.checked,
                            startHour: activeConv.scheduledMute?.startHour || '23:00',
                            endHour: activeConv.scheduledMute?.endHour || '07:00',
                          },
                        })
                      }
                      className="w-4 h-4 accent-[#2563EB]"
                    />
                  </label>
                  <div className="flex items-center gap-2 font-mono-tabular">
                    <input
                      type="time"
                      value={activeConv.scheduledMute?.startHour || '23:00'}
                      onChange={(e) =>
                        onUpdateConversation(activeConv.id, {
                          scheduledMute: {
                            enabled: Boolean(activeConv.scheduledMute?.enabled),
                            startHour: e.target.value,
                            endHour: activeConv.scheduledMute?.endHour || '07:00',
                          },
                        })
                      }
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                    <span>至</span>
                    <input
                      type="time"
                      value={activeConv.scheduledMute?.endHour || '07:00'}
                      onChange={(e) =>
                        onUpdateConversation(activeConv.id, {
                          scheduledMute: {
                            enabled: Boolean(activeConv.scheduledMute?.enabled),
                            startHour: activeConv.scheduledMute?.startHour || '23:00',
                            endHour: e.target.value,
                          },
                        })
                      }
                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                {/* Group Quick Bar Customization */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5 text-[#2563EB]" />
                    自定义群快捷栏入口
                  </div>
                  {(activeConv.quickBar || []).map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center justify-between py-1 cursor-pointer"
                    >
                      <span>{item.label}</span>
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) => {
                          const next = (activeConv.quickBar || []).map((q) =>
                            q.id === item.id ? { ...q, enabled: e.target.checked } : q
                          );
                          onUpdateConversation(activeConv.id, { quickBar: next });
                        }}
                        className="accent-[#2563EB]"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* AI Group Summary Modal */}
      {aiSummaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  AI 群聊总结 · {activeConv?.title}
                </h3>
              </div>
              <button
                onClick={() => setAiSummaryOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {aiSummaryLoading ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  正在提炼近期群聊重点与待办事项...
                </div>
              ) : aiSummaryError ? (
                <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-700 dark:text-rose-300">
                  {aiSummaryError}
                </div>
              ) : (
                <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  {aiSummaryText}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Poll Modal */}
      {createPollOpen && activeConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                发起群投票
              </h3>
              <button onClick={() => setCreatePollOpen(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="投票主题问题"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
            />
            <textarea
              rows={4}
              value={pollOpts}
              onChange={(e) => setPollOpts(e.target.value)}
              placeholder="每行一个选项"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-xs"
            />
            <button
              onClick={() => {
                const lines = pollOpts
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean);
                if (!pollQuestion.trim() || lines.length < 2) return;
                onSendMessage(activeConv.id, {
                  type: 'poll',
                  content: pollQuestion.trim(),
                  poll: {
                    id: `poll-${Date.now()}`,
                    question: pollQuestion.trim(),
                    multiSelect: false,
                    deadline: '3天后截止',
                    options: lines.map((text, idx) => ({
                      id: `opt-${idx}`,
                      text,
                      voterIds: [],
                    })),
                  },
                });
                setCreatePollOpen(false);
                setPollQuestion('');
              }}
              className="w-full py-2 text-xs font-medium rounded-lg bg-[#2563EB] text-white"
            >
              发送群投票
            </button>
          </div>
        </div>
      )}

      {/* Send Red Packet Modal */}
      {sendRpOpen && activeConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-rose-600 to-amber-600 px-5 py-4 text-white flex items-center justify-between">
              <span className="text-sm font-semibold">发心意红包（余额 ¥{walletBalance.toFixed(2)}）</span>
              <button onClick={() => setSendRpOpen(false)} className="p-1 text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                <button
                  onClick={() => setRpKind('lucky')}
                  className={`py-1.5 rounded-md font-medium ${
                    rpKind === 'lucky' ? 'bg-white dark:bg-slate-900 shadow-sm text-rose-600' : 'text-slate-500'
                  }`}
                >
                  拼手气红包
                </button>
                <button
                  onClick={() => setRpKind('password')}
                  className={`py-1.5 rounded-md font-medium ${
                    rpKind === 'password' ? 'bg-white dark:bg-slate-900 shadow-sm text-rose-600' : 'text-slate-500'
                  }`}
                >
                  口令红包
                </button>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">总金额 (元)</label>
                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={rpAmount}
                  onChange={(e) => setRpAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-mono-tabular"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">红包个数</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={rpCount}
                  onChange={(e) => setRpCount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-mono-tabular"
                />
              </div>
              {rpKind === 'password' && (
                <div>
                  <label className="block text-slate-500 mb-1">领取口令</label>
                  <input
                    value={rpPassword}
                    onChange={(e) => setRpPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-slate-500 mb-1">祝福语</label>
                <input
                  value={rpTitle}
                  onChange={(e) => setRpTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={() => {
                  const amt = Number(rpAmount);
                  const cnt = Number(rpCount);
                  if (!amt || amt <= 0 || !cnt || cnt <= 0) return;
                  onSendRedPacket(
                    activeConv.id,
                    rpKind,
                    rpTitle.trim() || '恭喜发财',
                    amt,
                    cnt,
                    rpKind === 'password' ? rpPassword.trim() : undefined
                  );
                  setSendRpOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-500"
              >
                塞钱进红包 (¥{Number(rpAmount || 0).toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open / Claim Red Packet Modal */}
      {viewingRpMsg && viewingRpMsg.redPacket && activeConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-b from-rose-600 to-rose-700 px-5 py-6 text-center text-white relative">
              <button
                onClick={() => setViewingRpMsgId(null)}
                className="absolute top-3 right-3 p-1 text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-sm font-semibold">{viewingRpMsg.senderName} 的红包</div>
              <div className="text-xs text-rose-100 mt-1">{viewingRpMsg.redPacket.title}</div>
              {(() => {
                const myClaim = viewingRpMsg.redPacket.claims.find((c) => c.userId === 'me');
                if (myClaim) {
                  return (
                    <div className="mt-4 text-3xl font-bold font-mono-tabular text-amber-300">
                      ¥{myClaim.amount.toFixed(2)}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div className="p-5 space-y-4">
              {!viewingRpMsg.redPacket.claims.some((c) => c.userId === 'me') &&
                viewingRpMsg.redPacket.claims.length < viewingRpMsg.redPacket.totalCount && (
                  <div className="space-y-2">
                    {viewingRpMsg.redPacket.kind === 'password' && (
                      <input
                        value={rpClaimPassword}
                        onChange={(e) => setRpClaimPassword(e.target.value)}
                        placeholder={`输入口令「${viewingRpMsg.redPacket.password}」`}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                      />
                    )}
                    {rpClaimError && <div className="text-xs text-rose-600">{rpClaimError}</div>}
                    <button
                      onClick={() => {
                        const err = onClaimRedPacket(
                          activeConv.id,
                          viewingRpMsg.id,
                          rpClaimPassword
                        );
                        if (err) setRpClaimError(err);
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-semibold text-sm hover:bg-amber-400"
                    >
                      {viewingRpMsg.redPacket.kind === 'password'
                        ? '发送口令并领取红包'
                        : '開 · 立即领取红包'}
                    </button>
                  </div>
                )}

              <div className="space-y-2 text-xs">
                <div className="text-slate-500 font-mono-tabular">
                  已领取 {viewingRpMsg.redPacket.claims.length}/{viewingRpMsg.redPacket.totalCount} 个 · 共 ¥
                  {viewingRpMsg.redPacket.totalAmount.toFixed(2)}
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-40 overflow-y-auto">
                  {viewingRpMsg.redPacket.claims.map((c) => (
                    <div key={c.userId} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {c.userName}
                        </span>
                        <span className="ml-2 text-slate-400 font-mono-tabular">{c.time}</span>
                      </div>
                      <span className="font-semibold font-mono-tabular text-slate-900 dark:text-slate-100">
                        ¥{c.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 cursor-zoom-out"
        >
          <img
            src={previewImageUrl}
            alt="预览大图"
            referrerPolicy="no-referrer"
            className="max-w-full max-h-full rounded-xl shadow-2xl"
          />
        </div>
      )}

      {/* Custom Chat Folders Manager Modal */}
      <ChatFoldersModal
        open={folderModalOpen}
        onClose={() => {
          setFolderModalOpen(false);
          setFolderModalPreselectConvId(null);
          setFolderModalPreselectArchiveMsg(null);
        }}
        folders={chatFolders}
        conversations={conversations}
        preselectConvId={folderModalPreselectConvId}
        preselectArchiveMessage={folderModalPreselectArchiveMsg}
        onCreateFolder={onCreateChatFolder}
        onDeleteFolder={onDeleteChatFolder}
        onToggleConversationInFolder={onToggleConversationInFolder}
        onRemoveArchivedMessage={onRemoveArchivedMessage}
        onMoveArchivedMessage={(targetFolderId, item) => {
          const syntheticMsg: ChatMessage = {
            id: item.messageId,
            conversationId: item.conversationId,
            senderId: 'other',
            senderName: item.senderName,
            senderAvatar: item.senderAvatar,
            type: item.type,
            content: item.content,
            timestamp: item.timestamp,
            createdAt: Date.now(),
          };
          onArchiveMessageToFolder?.(
            targetFolderId,
            syntheticMsg,
            item.conversationId,
            item.conversationTitle
          );
        }}
        onLocateArchivedMessage={(convId, msgId) => {
          if (onJumpToMessage) {
            onJumpToMessage(convId, msgId);
          } else {
            onSelectConv(convId);
          }
        }}
      />

      {/* Right-Mouse Drag Floating Ghost Preview */}
      {draggingConv && draggingConv.mode === 'right' && (
        <div
          style={{ left: draggingConv.x + 14, top: draggingConv.y + 14 }}
          className="fixed z-[80] pointer-events-none px-3 py-2 rounded-xl bg-slate-900/95 text-white shadow-2xl border border-[#2563EB]/60 text-xs max-w-[230px] space-y-0.5 backdrop-blur-sm"
        >
          <div className="font-semibold truncate flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
            <span className="truncate">{draggingConv.title}</span>
          </div>
          <div className="text-[11px] text-sky-200 truncate">
            {draggingConv.hoverFolderId === '__new__'
              ? '松开右键：新建自定义分类并归入'
              : draggingConv.hoverFolderId
              ? `松开右键归入「${
                  chatFolders.find((f) => f.id === draggingConv.hoverFolderId)?.name || ''
                }」`
              : '拖拽至消息列表上方的自定义分类标签'}
          </div>
        </div>
      )}

      {/* Long-Press Message Drag Floating Ghost Preview */}
      {draggingMsg && draggingMsg.mode === 'longpress' && (
        <div
          style={{ left: draggingMsg.x + 14, top: draggingMsg.y + 14 }}
          className="fixed z-[85] pointer-events-none px-3.5 py-2.5 rounded-xl bg-slate-900/95 text-white shadow-2xl border border-[#2563EB]/70 text-xs max-w-[260px] space-y-1 backdrop-blur-sm"
        >
          <div className="font-semibold truncate flex items-center gap-1.5">
            <Archive className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
            <span className="truncate">
              {draggingMsg.msg.senderName}：{draggingMsg.msg.content || `[${draggingMsg.msg.type}]`}
            </span>
          </div>
          <div className="text-[11px] text-sky-200 truncate">
            {draggingMsg.hoverFolderId === '__new__'
              ? '松手即可新建分组文件夹并归档'
              : draggingMsg.hoverFolderId
              ? `松手归档至「${
                  chatFolders.find((f) => f.id === draggingMsg.hoverFolderId)?.name || ''
                }」`
              : '拖入上方或左侧的消息分组文件夹进行归档'}
          </div>
        </div>
      )}

      {/* Conversation Right-Click / More Quick Menu */}
      {convContextMenu &&
        (() => {
          const targetConv = conversations.find((c) => c.id === convContextMenu.convId);
          if (!targetConv) return null;
          return (
            <div
              onClick={() => setConvContextMenu(null)}
              className="fixed inset-0 z-50"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ left: convContextMenu.x, top: convContextMenu.y }}
                className="fixed w-52 rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-700 shadow-2xl py-1.5 text-xs z-50"
              >
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 truncate border-b border-slate-100 dark:border-slate-800">
                  {targetConv.title}
                </div>
                <button
                  onClick={() => {
                    onUpdateConversation(targetConv.id, { pinned: !targetConv.pinned });
                    setConvContextMenu(null);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                >
                  <span>{targetConv.pinned ? '取消置顶' : '置顶此会话'}</span>
                  <Pin className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => {
                    onUpdateConversation(targetConv.id, {
                      unreadCount: targetConv.unreadCount > 0 ? 0 : 1,
                    });
                    setConvContextMenu(null);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                >
                  <span>
                    {targetConv.unreadCount > 0 ? '标为已读' : '标为未读'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    onUpdateConversation(targetConv.id, { muted: !targetConv.muted });
                    setConvContextMenu(null);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                >
                  <span>{targetConv.muted ? '开启消息提醒' : '设为免打扰'}</span>
                </button>
                <button
                  onClick={() => {
                    onSelectConv(targetConv.id);
                    setChatSettingsOpen(true);
                    setGroupDrawerTab(null);
                    setConvContextMenu(null);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-[#2563EB]"
                >
                  <span>定制聊天背景与特效</span>
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>

                <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                  <div className="px-3 py-1 text-[10px] text-slate-400">
                    移入 / 移出消息分组
                  </div>
                  {chatFolders.map((folder) => {
                    const inside = folder.conversationIds.includes(targetConv.id);
                    return (
                      <button
                        key={folder.id}
                        onClick={() =>
                          onToggleConversationInFolder(folder.id, targetConv.id)
                        }
                        className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: folder.color }}
                          />
                          <span className="truncate">{folder.name}</span>
                        </span>
                        {inside && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => {
                      setConvContextMenu(null);
                      setFolderModalOpen(true);
                    }}
                    className="w-full px-3 py-1.5 text-left text-[#2563EB] hover:bg-[#2563EB]/5 font-medium flex items-center gap-1.5"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    管理 / 新建分组...
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};
