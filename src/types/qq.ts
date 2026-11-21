export type AppSection =
  | 'chat'
  | 'contacts'
  | 'channels'
  | 'qzone'
  | 'profile'
  | 'files'
  | 'office'
  | 'dressup'
  | 'security'
  | 'sync';

export type AppMode = 'standard' | 'youth' | 'care' | 'minimal';

export type UiLayoutStyle = 'modern' | 'compact';

export type OnlinePlatform = 'Windows' | 'macOS' | 'iOS' | 'Android' | 'iPad' | 'Web';

export type OnlineStatusType =
  | 'online'
  | 'qme'
  | 'away'
  | 'busy'
  | 'dnd'
  | 'invisible';

export type MessageType =
  | 'text'
  | 'voice'
  | 'image'
  | 'video'
  | 'sticker'
  | 'contact_card'
  | 'file'
  | 'solitaire'
  | 'poll'
  | 'homework'
  | 'announcement'
  | 'red_packet'
  | 'game_dice'
  | 'game_rps'
  | 'pomodoro'
  | 'call_log'
  | 'system';

export interface MessageQuote {
  id: string;
  senderName: string;
  preview: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  sizeBytes: number;
  fileType: 'image' | 'document' | 'archive' | 'video' | 'other';
  url?: string;
  progress?: number; // 0-100 for resumable transfer
  paused?: boolean;
  speedMbps?: number;
}

export interface SolitaireData {
  id: string;
  title: string;
  formatHint: string;
  entries: Array<{
    index: number;
    authorId: string;
    authorName: string;
    value: string;
    time: string;
  }>;
}

export interface PollData {
  id: string;
  question: string;
  multiSelect: boolean;
  deadline: string;
  options: Array<{
    id: string;
    text: string;
    voterIds: string[];
  }>;
}

export interface HomeworkData {
  id: string;
  subject: string;
  title: string;
  deadline: string;
  submittedUserIds: string[];
}

export interface ContactCardData {
  qqNumber: string;
  name: string;
  signature: string;
  avatar?: string;
}

export interface RedPacketClaim {
  userId: string;
  userName: string;
  amount: number;
  time: string;
}

export interface RedPacketData {
  id: string;
  kind: 'lucky' | 'password';
  title: string;
  password?: string;
  totalAmount: number;
  totalCount: number;
  claims: RedPacketClaim[];
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole?: 'owner' | 'admin' | 'member' | 'bot';
  type: MessageType;
  content: string;
  timestamp: string;
  createdAt: number;
  recalled?: boolean;
  originalTextForEdit?: string;
  quote?: MessageQuote;
  translatedText?: string;
  translating?: boolean;
  voiceTranscript?: string;
  starred?: boolean;
  isEssence?: boolean; // 群精华
  voiceDurationSec?: number;
  mediaUrl?: string;
  stickerLabel?: string;
  isSuperEmoji?: boolean;
  superEmojiEffect?: 'confetti' | 'hearts' | 'fire' | 'stars';
  burnAfterSeconds?: number;
  burnRevealedAt?: number;
  burned?: boolean;
  gameResult?: {
    kind: 'dice' | 'rps';
    value: string;
    label: string;
    emoji: string;
  };
  pomodoro?: {
    id: string;
    title: string;
    durationMin: number;
    startedAt: number;
    joinedUserIds: string[];
  };
  file?: FileAttachment;
  contactCard?: ContactCardData;
  solitaire?: SolitaireData;
  poll?: PollData;
  homework?: HomeworkData;
  redPacket?: RedPacketData;
  reactions?: MessageReaction[];
  vibrating?: boolean;
}

export interface ChannelThread {
  id: string;
  subChannelId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  content: string;
  createdAt: string;
  likes: number;
  likedByMe?: boolean;
  replies: Array<{ id: string; authorName: string; text: string; time: string }>;
}

export interface QqSubChannel {
  id: string;
  name: string;
  kind: 'feed' | 'voice';
  description: string;
  voiceMembers?: Array<{ id: string; name: string; avatar?: string; speaking: boolean }>;
}

export interface QqChannel {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  joined: boolean;
  subChannels: QqSubChannel[];
  threads: ChannelThread[];
}

export type FriendGroupName = '特别关心' | '我的好友' | '同事伙伴' | '校园同学';

export interface Contact {
  id: string;
  qqNumber: string;
  name: string;
  remark?: string;
  avatar?: string;
  signature: string;
  online: boolean;
  platform: OnlinePlatform;
  groupName: FriendGroupName;
  starred: boolean;
  sparkDays: number; // 好友互动火花天数
  isOneWay?: boolean; // 单向好友
  blocked?: boolean; // 黑名单
  isBot?: boolean;
  typingStatus?: string; // 对方个性输入状态
  level?: number;
  activeDays?: number;
  vipLabel?: string;
}

export interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member' | 'bot';
  mutedUntil?: number | null; // timestamp ms
  title?: string;
  online?: boolean;
  status?: OnlineStatusType;
  platform?: OnlinePlatform;
  moodText?: string;
}

export interface GroupQuickBarItem {
  id: 'notices' | 'toolbox' | 'directory' | 'docs' | 'channel';
  label: string;
  enabled: boolean;
}

export interface GroupAlbumItem {
  id: string;
  url: string;
  caption: string;
  uploader: string;
  date: string;
}

export interface GroupCheckInRecord {
  userId: string;
  name: string;
  time: string;
  streak: number;
}

export interface Conversation {
  id: string;
  kind: 'single' | 'group' | 'device' | 'service';
  title: string;
  avatar?: string;
  targetContactId?: string;
  pinned: boolean;
  muted: boolean;
  unreadCount: number;
  lastMessagePreview: string;
  lastMessageTime: string;
  pinnedMessageId?: string;
  // Group specifics
  maxMembers?: number; // up to 2000
  memberCount?: number;
  members?: GroupMember[];
  announcement?: string;
  muteAll?: boolean;
  scheduledMute?: {
    enabled: boolean;
    startHour: string;
    endHour: string;
  };
  quickBar?: GroupQuickBarItem[];
  checkIns?: GroupCheckInRecord[];
  album?: GroupAlbumItem[];
  activeCall?: ActiveCallState | null;
  memos?: ChatMemoItem[];
}

export interface ChatMemoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

export interface ArchivedMessageItem {
  id: string;
  messageId: string;
  conversationId: string;
  conversationTitle: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: MessageType;
  timestamp: string;
  archivedAt: string;
}

export interface ChatFolder {
  id: string;
  name: string;
  color: string;
  conversationIds: string[];
  archivedMessages?: ArchivedMessageItem[];
}

export type ChatBackgroundPresetId =
  | 'default'
  | 'grid_blueprint'
  | 'aurora_blue'
  | 'sakura_mist'
  | 'night_stars'
  | 'westlake_photo'
  | 'travel_photo'
  | 'custom_image';

export interface ChatBackgroundSetting {
  presetId: ChatBackgroundPresetId;
  customImageUrl?: string;
  blurPx: number;
  overlayOpacity: number;
}

export interface ActiveCallState {
  id: string;
  conversationId: string;
  conversationTitle: string;
  mode: 'audio' | 'video';
  isGroup: boolean;
  startedAt: number;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    speaking: boolean;
    videoOn: boolean;
    muted: boolean;
  }>;
  screenSharing: boolean;
  docPresenting: boolean;
  docPage: number;
  watchTogether: boolean;
  watchPlaying: boolean;
  watchProgress: number;
  listenTogether: boolean;
  listenTrackIndex: number;
  listenPlaying: boolean;
  beautyFilter: 'none' | 'natural' | 'warm' | 'cool' | 'mono';
  virtualAvatar: boolean;
}

export interface FlashTransferFile {
  id: string;
  name: string;
  sizeBytes: number;
  fileType: 'image' | 'document' | 'archive' | 'video' | 'other';
  progress: number;
}

export interface FlashTransferBatch {
  id: string;
  title: string;
  shareCode: string;
  shareUrl: string;
  expiryDays: 90 | 180;
  createdAt: string;
  expiresAt: string;
  downloads: number;
  files: FlashTransferFile[];
}

export interface StoredFileItem {
  id: string;
  name: string;
  sizeBytes: number;
  fileType: 'image' | 'document' | 'archive' | 'video' | 'other';
  conversationId: string;
  conversationTitle: string;
  messageId: string;
  senderName: string;
  dateStr: string; // YYYY-MM-DD
  timeStr: string;
  previewUrl?: string;
}

export interface QzonePost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  kind: 'shuoshuo' | 'blog';
  title?: string;
  content: string;
  images: string[];
  tags: string[];
  mentions: string[];
  mood?: string;
  location?: string;
  visibility?: 'public' | 'friends' | 'private';
  isAiGenerated: boolean;
  autoDelete24h: boolean;
  expiresAt?: number;
  views: number;
  createdAt: string;
  likes: Array<{ userId: string; name: string }>;
  reactions?: Array<{ emoji: string; userIds: string[] }>;
  gifts: Array<{ fromName: string; giftName: string }>;
  poll?: {
    question: string;
    options: Array<{ id: string; text: string; voterIds: string[] }>;
  };
  repostFrom?: {
    authorName: string;
    content: string;
    image?: string;
  };
  bookmarkedByMe?: boolean;
  comments: Array<{
    id: string;
    authorName: string;
    replyTo?: string;
    content: string;
    time: string;
    likes?: string[];
  }>;
}

export interface QzonePhoto {
  id: string;
  url: string;
  caption: string;
  year: number;
  month: number;
  day: number;
  likes: string[];
  enhanced?: boolean;
  erasedSpots?: Array<{ x: number; y: number }>;
  aiNote?: string;
}

export interface GuestbookEntry {
  id: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  time: string;
}

export interface FavoriteItem {
  id: string;
  category: 'chat' | 'image' | 'link' | 'document';
  title: string;
  content: string;
  sourceName: string;
  savedAt: string;
  mediaUrl?: string;
}

export interface MailMessage {
  id: string;
  folder: 'inbox' | 'sent';
  from: string;
  to: string;
  subject: string;
  body: string;
  time: string;
  unread: boolean;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  dateStr: string;
  timeStr: string;
  participants: string;
  location: string;
  remindMinutes: number;
}

export type DressUpThemeId =
  | 'classic_blue'
  | 'midnight'
  | 'sakura'
  | 'forest'
  | 'cyber_neon'
  | 'amber_gold'
  | 'lavender'
  | 'aurora_teal';

export type DressUpBubbleId =
  | 'clean'
  | 'aurora'
  | 'retro_pixel'
  | 'paper'
  | 'sakura_bloom'
  | 'neon_cyber'
  | 'obsidian_gold'
  | 'mint_glass'
  | 'sunset_peach'
  | 'custom';

export type DressUpPendantId =
  | 'none'
  | 'crown'
  | 'headset'
  | 'blossom'
  | 'halo_star'
  | 'lightning'
  | 'cat_ears'
  | 'music_note'
  | 'crescent'
  | 'sprout';

export type DressUpFrameId =
  | 'none'
  | 'glow_blue'
  | 'gold_ring'
  | 'minimal_line'
  | 'cyber_neon'
  | 'sakura_petal'
  | 'aurora_prism'
  | 'emerald_flame'
  | 'obsidian_diamond';

export type DressUpCardBgId =
  | 'westlake'
  | 'geometric'
  | 'grid'
  | 'aurora_night'
  | 'sakura_sky'
  | 'cyber_matrix'
  | 'sunset_dunes'
  | 'starlight_velvet';

export type DressUpRingtoneId =
  | 'dual_chime'
  | 'chime'
  | 'lofi'
  | 'bubble_pop'
  | 'typewriter'
  | 'retro_dial'
  | 'woodblock'
  | 'pixel_coin'
  | 'red_packet_joy'
  | 'mute';

export type DressUpFontId =
  | 'sans'
  | 'serif'
  | 'mono'
  | 'rounded'
  | 'editorial'
  | 'pixel';

export interface CustomBubbleStyle {
  bgFrom: string;
  bgTo: string;
  textColor: string;
  borderColor: string;
  borderStyle: 'none' | 'solid' | 'dashed' | 'glow';
  radiusStyle: 'rounded' | 'pill' | 'sharp' | 'cyber';
  pattern: 'none' | 'dots' | 'grid' | 'shine';
  cornerIcon: string;
}

export interface DressUpConfig {
  themeId: DressUpThemeId;
  bubbleId: DressUpBubbleId;
  customBubble: CustomBubbleStyle;
  pendantId: DressUpPendantId;
  frameId: DressUpFrameId;
  cardBgId: DressUpCardBgId;
  ringtoneId: DressUpRingtoneId;
  fontId: DressUpFontId;
  typingDecor: string;
}

export interface LoggedDevice {
  id: string;
  name: string;
  platform: OnlinePlatform;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
  trusted: boolean;
}

export interface SecuritySettings {
  loginProtection: boolean;
  e2eEncryption: boolean;
  antiHarassment: boolean;
  strangerVerifyMode: 'verify' | 'question' | 'deny_all';
  allowGroupTempChat: boolean;
  allowStrangerQzone: boolean;
  authProviderLabel: string;
  boundEmail: string;
  accountFrozen: boolean;
  youthPin: string;
  youthDailyLimitMin: number;
  youthCurfewEnabled: boolean;
  youthHideQzone: boolean;
  youthBlockStrangers: boolean;
}

export type SoundEffectId =
  | 'dual_chime'
  | 'typewriter'
  | 'crisp_click'
  | 'retro_dial'
  | 'chime'
  | 'bubble_pop'
  | 'woodblock'
  | 'pixel_coin'
  | 'red_packet_joy'
  | 'lofi_warm'
  | 'silent';

export type SoundMessageCategory =
  | 'text'
  | 'incoming'
  | 'typing'
  | 'voice_media'
  | 'file'
  | 'red_packet'
  | 'mention_system'
  | 'game_sticker';

export interface ChatSoundConfig {
  enabled: boolean;
  masterVolume: number; // 0 - 100
  typingFeedbackEnabled: boolean;
  perMessageType: Record<SoundMessageCategory, SoundEffectId>;
}

export type MessageEffectType =
  | 'none'
  | 'fireworks'
  | 'snow'
  | 'sparkle'
  | 'hearts'
  | 'sakura';

export interface MessageVisualEffectsConfig {
  enabled: boolean;
  defaultEffect: MessageEffectType;
  perConversation: Record<string, MessageEffectType>;
  voiceWaveformEnabled: boolean;
}

export interface NotificationSettings {
  soundId: SoundEffectId;
  dndEnabled: boolean;
  dndRange: string;
  dmPopup: boolean;
  groupAlert: boolean;
  mentionStrongAlert: boolean;
  qzoneNotify: boolean;
  callRingtone: boolean;
  chatSounds: ChatSoundConfig;
  visualEffects: MessageVisualEffectsConfig;
}

export interface WalletTransaction {
  id: string;
  title: string;
  amount: number;
  kind: 'in' | 'out';
  time: string;
}

export interface UserProfile {
  id: string;
  qqNumber: string;
  name: string;
  avatar: string;
  signature: string;
  level: number;
  activeDays: number;
  continuousLoginDays: number;
  growthSpeedMultiplier: number;
  todayGrowthEarned: number;
  completedGrowthTaskIds: string[];
  vipLabel: string;
  likesCount: number;
  likedByMe: boolean;
  location: string;
  genderAge: string;
}

export interface TanbaishuoItem {
  id: string;
  fromHint: string;
  targetName: string;
  tag: string;
  time: string;
  liked: boolean;
}

export type WindowDisplayMode = 'fullscreen' | 'floating';
export type DockedEdge = 'right' | 'left' | 'top' | 'bottom' | null;
export type AllowedDockEdges = 'right_only' | 'horizontal' | 'vertical' | 'all';
export type EdgeIndicatorStyle = 'glow' | 'tab' | 'minimal';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowDockSettings {
  displayMode: WindowDisplayMode;
  autoHideEnabled: boolean;
  allowedEdges: AllowedDockEdges;
  hideDelayMs: number;
  revealDelayMs: number;
  peekWidthPx: number;
  snapThresholdPx: number;
  indicatorStyle: EdgeIndicatorStyle;
  autoRevealOnUnread: boolean;
}


