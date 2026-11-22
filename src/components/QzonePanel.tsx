import React, { useEffect, useRef, useState } from 'react';
import {
  AtSign,
  BarChart3,
  Bookmark,
  BookOpen,
  Calendar,
  Clock,
  Compass,
  Eraser,
  Eye,
  Film,
  Gamepad2,
  Gift,
  Heart,
  Image as ImageIcon,
  Lock,
  MapPin,
  MessageCircle,
  Mic,
  Music,
  Play,
  Pause,
  Plus,
  Radio,
  Repeat2,
  Reply,
  Search,
  Send,
  Share2,
  SmilePlus,
  Sparkles,
  Tag,
  ThumbsUp,
  Trophy,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import { authedAiPost } from '../utils/aiClient';
import {
  Contact,
  GuestbookEntry,
  QzonePhoto,
  QzonePost,
  TanbaishuoItem,
} from '../types/qq';
import { GENERATED_ASSETS, ME_PROFILE } from '../data/seedData';
import { AvatarView } from './AvatarView';

interface QzonePanelProps {
  posts: QzonePost[];
  photos: QzonePhoto[];
  guestbook: GuestbookEntry[];
  contacts: Contact[];
  youthHideQzone: boolean;
  onAddPost: (post: QzonePost) => void;
  onToggleLike: (postId: string) => void;
  onReactPost?: (postId: string, emoji: string) => void;
  onVotePostPoll?: (postId: string, optionId: string) => void;
  onAddComment: (postId: string, content: string, replyTo?: string) => void;
  onLikeComment?: (postId: string, commentId: string) => void;
  onSendGift: (postId: string, giftName: string) => void;
  onToggleBookmarkPost?: (postId: string) => void;
  onRepostToQzone?: (post: QzonePost) => void;
  onForwardPostToChat?: (post: QzonePost) => void;
  onAddGuestbook: (content: string) => void;
  onUpdatePhoto: (photoId: string, patch: Partial<QzonePhoto>) => void;
  onOpenChannels?: () => void;
  onOpenProfile?: () => void;
  viewingOwner?: Contact | null;
  onBackToMyQzone?: () => void;
  onOpenUserProfile?: (target: { id?: string; name: string; avatar?: string }) => void;
}

const SPACE_MOODS = ['😊 好心情', '🎧 沉浸创作', '☕ 午后摸鱼', '🚀 灵感冲刺', '🌙 深夜有感'];
const SPACE_GIFT_OPTIONS = [
  { name: '玫瑰花束', emoji: '🌹' },
  { name: '冰美式', emoji: '☕' },
  { name: '生日蛋糕', emoji: '🎂' },
  { name: '星际火箭', emoji: '🚀' },
  { name: '膜拜奖杯', emoji: '🏆' },
  { name: '好运四叶草', emoji: '🍀' },
];
const SPACE_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '🔥'];

export const QzonePanel: React.FC<QzonePanelProps> = ({
  posts,
  photos,
  guestbook,
  contacts,
  youthHideQzone,
  onAddPost,
  onToggleLike,
  onReactPost,
  onVotePostPoll,
  onAddComment,
  onLikeComment,
  onSendGift,
  onToggleBookmarkPost,
  onRepostToQzone,
  onForwardPostToChat,
  onAddGuestbook,
  onUpdatePhoto,
  onOpenChannels,
  onOpenProfile,
  viewingOwner = null,
  onBackToMyQzone,
  onOpenUserProfile,
}) => {
  const [tab, setTab] = useState<'feed' | 'discover' | 'album' | 'guestbook' | 'visitors' | 'related'>('feed');
  const [discoverApp, setDiscoverApp] = useState<
    'grid' | 'nearby' | 'games' | 'reading' | 'weishi' | 'ksong' | 'esports' | 'tanbaishuo'
  >('grid');
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [ksongPlayingId, setKsongPlayingId] = useState<string | null>(null);
  const [wheelPrize, setWheelPrize] = useState<string | null>(null);
  const [tanbaiList, setTanbaiList] = useState<TanbaishuoItem[]>([
    {
      id: 'tb-1',
      fromHint: '一位来自「杭州 · 同事伙伴」的女生',
      targetName: ME_PROFILE.name,
      tag: '写代码和做设计都超靠谱的宝藏队友 ✨',
      time: '今天 15:40',
      liked: false,
    },
    {
      id: 'tb-2',
      fromHint: '一位来自「2026 产品研发协同大群」的群友',
      targetName: ME_PROFILE.name,
      tag: '每次群里冷场只要发红包就能瞬间气氛拉满 🧧',
      time: '昨天 21:15',
      liked: true,
    },
  ]);
  const [tanbaiTarget, setTanbaiTarget] = useState(contacts[0]?.name || '林小雨');
  const [tanbaiTag, setTanbaiTag] = useState('认识你以后每天都很开心 🌟');
  const [postKind, setPostKind] = useState<'shuoshuo' | 'blog'>('shuoshuo');
  const [blogTitle, setBlogTitle] = useState('');
  const [postText, setPostText] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [postMood, setPostMood] = useState<string>('');
  const [postLocation, setPostLocation] = useState<string>('');
  const [postVisibility, setPostVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [showPollComposer, setShowPollComposer] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptionsDraft, setPollOptionsDraft] = useState<string[]>(['赞成，安排上！', '再考虑一下']);
  const [autoDelete24h, setAutoDelete24h] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  // Feed Filter & Interactive Popovers
  const [feedFilter, setFeedFilter] = useState<'all' | 'shuoshuo' | 'blog' | 'media' | 'bookmarked'>('all');
  const [feedSearch, setFeedSearch] = useState('');
  const [giftPickerPostId, setGiftPickerPostId] = useState<string | null>(null);
  const [replyTargets, setReplyTargets] = useState<Record<string, string | null>>({});

  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [guestDraft, setGuestDraft] = useState('');
  const [wechatSharePost, setWechatSharePost] = useState<QzonePost | null>(null);

  // Album filtering & AI editor
  const [filterYear, setFilterYear] = useState<number>(2026);
  const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
  const [editingPhoto, setEditingPhoto] = useState<QzonePhoto | null>(null);
  const [aiStatusText, setAiStatusText] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);
  const editorCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (viewingOwner) {
      setTab('feed');
    }
  }, [viewingOwner?.id]);

  useEffect(() => {
    if (!editingPhoto) return;
    const canvas = editorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.filter = editingPhoto.enhanced
        ? 'contrast(1.12) saturate(1.18) brightness(1.04)'
        : 'none';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
      (editingPhoto.erasedSpots || []).forEach((spot) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(241, 245, 249, 0.88)';
        ctx.fill();
        ctx.restore();
      });
    };
    img.src = editingPhoto.url;
  }, [editingPhoto]);

  if (youthHideQzone) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#191c24]">
        <div className="max-w-md space-y-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            青少年模式已开启 · 星涟空间已保护隐藏
          </h3>
          <p className="text-sm text-slate-500">
            当前处于青少年保护状态，已隐藏动态信息流与虚拟礼物功能。如需恢复访问，请前往「安全与模式」验证监护人密码后关闭限制。
          </p>
        </div>
      </div>
    );
  }

  const handleUploadPostImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachedImages((prev) => [...prev.slice(0, 3), reader.result as string]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePublish = () => {
    if (!postText.trim() && attachedImages.length === 0) return;
    const cleanedPollOpts = pollOptionsDraft.map((o) => o.trim()).filter(Boolean);
    const hasValidPoll = showPollComposer && cleanedPollOpts.length >= 2;

    const newPost: QzonePost = {
      id: `qz-${Date.now()}`,
      authorId: ME_PROFILE.id,
      authorName: ME_PROFILE.name,
      authorAvatar: ME_PROFILE.avatar,
      kind: postKind,
      title: postKind === 'blog' ? blogTitle.trim() || '我的空间日志' : undefined,
      content: postText.trim() || '分享图文瞬间',
      images: attachedImages,
      tags,
      mentions,
      mood: postMood || undefined,
      location: postLocation.trim() || undefined,
      visibility: postVisibility,
      isAiGenerated,
      autoDelete24h,
      expiresAt: autoDelete24h ? Date.now() + 24 * 3600 * 1000 : undefined,
      views: 1,
      createdAt: '刚刚',
      likes: [],
      reactions: [],
      gifts: [],
      poll: hasValidPoll
        ? {
            question: pollQuestion.trim() || '大家怎么看？',
            options: cleanedPollOpts.map((opt, idx) => ({
              id: `po-${Date.now()}-${idx}`,
              text: opt,
              voterIds: [],
            })),
          }
        : undefined,
      comments: [],
    };
    onAddPost(newPost);
    setPostText('');
    setBlogTitle('');
    setTags([]);
    setMentions([]);
    setPostMood('');
    setPostLocation('');
    setPostVisibility('public');
    setAttachedImages([]);
    setShowPollComposer(false);
    setPollQuestion('');
    setPollOptionsDraft(['赞成，安排上！', '再考虑一下']);
    setAutoDelete24h(false);
    setIsAiGenerated(false);
  };

  const runPhotoAi = async (action: 'repair' | 'erase') => {
    if (!editingPhoto) return;
    setAiBusy(true);
    setAiStatusText(action === 'repair' ? '正在执行 AI 画质增强...' : '正在执行 AI 纹理融合...');
    try {
      const res = await authedAiPost<{ note?: string }>('/api/ai/photo-enhance', {
        action,
        caption: editingPhoto.caption,
      });
      const note = res.ok
        ? res.data.note || '已完成画质增强'
        : res.authRequired
        ? '已完成本地画质优化（登录后可使用云端 AI 智能分析）'
        : res.data.error || '已完成本地画质优化';
      setAiStatusText(note);
      const updated: QzonePhoto = {
        ...editingPhoto,
        enhanced: action === 'repair' ? true : editingPhoto.enhanced,
        aiNote: note,
      };
      setEditingPhoto(updated);
      onUpdatePhoto(editingPhoto.id, updated);
    } catch {
      const updated = { ...editingPhoto, enhanced: true };
      setEditingPhoto(updated);
      onUpdatePhoto(editingPhoto.id, updated);
      setAiStatusText('已完成本地画质对比度与光影优化');
    } finally {
      setAiBusy(false);
    }
  };

  const handleCanvasEraseClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!eraseMode || !editingPhoto) return;
    const canvas = editorCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const nextSpots = [...(editingPhoto.erasedSpots || []), { x, y }];
    const updated = { ...editingPhoto, erasedSpots: nextSpots };
    setEditingPhoto(updated);
    onUpdatePhoto(editingPhoto.id, { erasedSpots: nextSpots });
  };

  const filteredPhotos = photos.filter(
    (p) => p.year === filterYear && (filterMonth === 'all' || p.month === filterMonth)
  );

  return (
    <div className="h-full w-full overflow-y-auto sr-aurora-canvas">
      <div className="max-w-4xl mx-auto pb-12">
        {/* Qzone Cover Header */}
        <div className="relative h-56 overflow-hidden bg-slate-900 sm:rounded-b-3xl shadow-lg">
          <img
            src={GENERATED_ASSETS.qzoneCover}
            alt="星涟空间封面"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090e1c]/85 via-[#0f172a]/30 to-transparent" />

          {viewingOwner && (
            <div className="absolute top-4 left-6 right-6 flex items-center justify-between gap-2">
              <button
                onClick={onBackToMyQzone}
                className="px-3 py-1.5 rounded-xl bg-black/45 hover:bg-black/65 backdrop-blur-sm text-white text-xs font-medium border border-white/20"
              >
                ← 返回我的空间
              </button>
              <button
                onClick={() =>
                  onOpenUserProfile?.({
                    id: viewingOwner.id,
                    name: viewingOwner.name,
                    avatar: viewingOwner.avatar,
                  })
                }
                className="px-3 py-1.5 rounded-xl bg-[#2563EB]/90 hover:bg-[#2563EB] text-white text-xs font-medium"
              >
                查看 TA 的资料名片
              </button>
            </div>
          )}

          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-white">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (viewingOwner) {
                    onOpenUserProfile?.({
                      id: viewingOwner.id,
                      name: viewingOwner.name,
                      avatar: viewingOwner.avatar,
                    });
                  } else {
                    onOpenProfile?.();
                  }
                }}
                title={viewingOwner ? `查看 ${viewingOwner.name} 的资料名片` : '进入个人中心'}
              >
                <AvatarView
                  name={viewingOwner ? viewingOwner.name : ME_PROFILE.name}
                  src={viewingOwner ? viewingOwner.avatar : ME_PROFILE.avatar}
                  size="xl"
                />
              </button>
              <div>
                <h2 className="text-xl font-bold">
                  {viewingOwner ? viewingOwner.name : ME_PROFILE.name}的星涟空间
                </h2>
                <p className="text-xs text-slate-200 mt-0.5">
                  {viewingOwner ? viewingOwner.signature : ME_PROFILE.signature}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 text-xs text-slate-200 font-mono-tabular">
              <button
                onClick={() => setTab('related')}
                className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white flex items-center gap-1.5"
              >
                <span>与我相关</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[10px] font-bold">
                  3
                </span>
              </button>
              <div>
                {viewingOwner
                  ? `${viewingOwner.online ? `${viewingOwner.platform} 在线` : '离线'} · 火花 ${viewingOwner.sparkDays} 天`
                  : '今日访客 28 · 总浏览 14,920'}
              </div>
            </div>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="sticky top-0 z-20 mx-0 sm:mx-4 sm:-mt-5 sm:rounded-2xl bg-white/88 dark:bg-[#161b26]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.1)] px-6 flex items-center gap-6 overflow-x-auto no-scrollbar">
          {[
            { id: 'feed', label: '好友动态 · 说说日志' },
            { id: 'discover', label: '动态空间 (九宫格)' },
            { id: 'album', label: '相册 (AI修复/消除)' },
            { id: 'guestbook', label: `留言板 (${guestbook.length})` },
            { id: 'visitors', label: '访客记录' },
            { id: 'related', label: '与我相关' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id as typeof tab);
                if (item.id === 'discover') setDiscoverApp('grid');
              }}
              className={`py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tab === item.id
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6">
          {/* TAB 1: Shuoshuo & Blog Feed */}
          {tab === 'feed' && (
            <>
              {/* Composer (only in own Qzone; when visiting a friend's Qzone show their space banner) */}
              {viewingOwner ? (
                <div className="rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      正在浏览 {viewingOwner.name} 的个人主页动态
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      你可以为 TA 的说说点赞、评论、送礼物，或去 TA 的留言板踩一踩
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTab('guestbook')}
                      className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-medium hover:bg-[#1D4ED8]"
                    >
                      去给 TA 留言
                    </button>
                    <button
                      onClick={onBackToMyQzone}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
                    >
                      回到全部好友动态
                    </button>
                  </div>
                </div>
              ) : (
              <div className="rounded-2xl bg-white/95 dark:bg-[#161b26]/95 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 shadow-[0_6px_22px_-8px_rgba(15,23,42,0.08)] p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <button
                      onClick={() => setPostKind('shuoshuo')}
                      className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                        postKind === 'shuoshuo'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500'
                      }`}
                    >
                      发说说
                    </button>
                    <button
                      onClick={() => setPostKind('blog')}
                      className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                        postKind === 'blog'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500'
                      }`}
                    >
                      写日志
                    </button>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <select
                      value={postVisibility}
                      onChange={(e) =>
                        setPostVisibility(e.target.value as 'public' | 'friends' | 'private')
                      }
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300"
                    >
                      <option value="public">公开可见</option>
                      <option value="friends">仅好友可见</option>
                      <option value="private">仅自己可见</option>
                    </select>

                    <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={autoDelete24h}
                        onChange={(e) => setAutoDelete24h(e.target.checked)}
                        className="accent-[#2563EB]"
                      />
                      <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                      24小时限时
                    </label>
                  </div>
                </div>

                {postKind === 'blog' && (
                  <input
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    placeholder="输入日志标题..."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100"
                  />
                )}

                <textarea
                  rows={3}
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="分享这一刻的想法、照片、投票或心情..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
                />

                {/* Attached Images Preview */}
                {attachedImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachedImages.map((src, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img src={src} alt="配图预览" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setAttachedImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/65 text-white flex items-center justify-center"
                          title="移除图片"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Optional Embedded Space Poll Composer */}
                {showPollComposer && (
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-[#2563EB]" />
                        发起空间互动投票
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPollComposer(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="投票问题（例如：周末团建去哪里？）"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <div className="space-y-1.5">
                      {pollOptionsDraft.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <input
                            value={opt}
                            onChange={(e) =>
                              setPollOptionsDraft((prev) =>
                                prev.map((item, i) => (i === idx ? e.target.value : item))
                              )
                            }
                            placeholder={`选项 ${idx + 1}`}
                            className="flex-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                          {pollOptionsDraft.length > 2 && (
                            <button
                              type="button"
                              onClick={() =>
                                setPollOptionsDraft((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="p-1 text-slate-400 hover:text-rose-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {pollOptionsDraft.length < 4 && (
                        <button
                          type="button"
                          onClick={() => setPollOptionsDraft((prev) => [...prev, ''])}
                          className="inline-flex items-center gap-1 text-[#2563EB] hover:underline font-medium"
                        >
                          <Plus className="w-3 h-3" />
                          添加选项
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Mood, Location, Tags, @Mentions, Image, Poll, AI Label */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer hover:border-[#2563EB]">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span>配图</span>
                      <input type="file" accept="image/*" onChange={handleUploadPostImage} className="hidden" />
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowPollComposer((v) => !v)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                        showPollComposer
                          ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-[#2563EB]'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>投票</span>
                    </button>

                    <select
                      value={postMood}
                      onChange={(e) => setPostMood(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <option value="">此刻心情</option>
                      {SPACE_MOODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <input
                        value={postLocation}
                        onChange={(e) => setPostLocation(e.target.value)}
                        placeholder="添加定位"
                        className="w-20 bg-transparent text-xs focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && tagInput.trim()) {
                            e.preventDefault();
                            setTags((p) => Array.from(new Set([...p, tagInput.trim()])));
                            setTagInput('');
                          }
                        }}
                        placeholder="标签回车"
                        className="w-20 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>

                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          setMentions((p) => Array.from(new Set([...p, e.target.value])));
                        }
                      }}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <option value="">@ 好友</option>
                      {contacts
                        .filter((c) => !c.blocked && !c.isBot)
                        .map((c) => (
                          <option key={c.id} value={c.name}>
                            @{c.name}
                          </option>
                        ))}
                    </select>

                    <label className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={isAiGenerated}
                        onChange={(e) => setIsAiGenerated(e.target.checked)}
                        className="accent-[#2563EB]"
                      />
                      AI 标注
                    </label>
                  </div>

                  <button
                    onClick={handlePublish}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] whitespace-nowrap shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    发表动态
                  </button>
                </div>

                {(tags.length > 0 || mentions.length > 0 || postMood || postLocation) && (
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2.5">
                    {postMood && <span className="text-amber-600 font-medium">{postMood}</span>}
                    {postLocation && (
                      <span className="inline-flex items-center gap-1 text-rose-500">
                        <MapPin className="w-3 h-3" />
                        {postLocation}
                      </span>
                    )}
                    {tags.map((t) => (
                      <span key={t} className="text-[#2563EB]">#{t}</span>
                    ))}
                    {mentions.map((m) => (
                      <span key={m} className="text-[#2563EB]">@{m}</span>
                    ))}
                  </div>
                )}
              </div>
              )}

              {/* Feed Filter Bar & Search */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/90 dark:bg-[#161b26] border border-slate-200 dark:border-slate-800 overflow-x-auto">
                  {[
                    { id: 'all', label: '全部动态' },
                    { id: 'shuoshuo', label: '说说' },
                    { id: 'blog', label: '日志' },
                    { id: 'media', label: '图文与投票' },
                    { id: 'bookmarked', label: '我的收藏' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFeedFilter(item.id as typeof feedFilter)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        feedFilter === item.id
                          ? 'bg-[#2563EB] text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={feedSearch}
                    onChange={(e) => setFeedSearch(e.target.value)}
                    placeholder="搜索动态内容或标签..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#161b26] text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Posts Stream */}
              <div className="space-y-4">
                {(() => {
                  const basePosts = viewingOwner
                    ? posts.filter(
                        (p) =>
                          p.authorId === viewingOwner.id ||
                          p.authorName === viewingOwner.name
                      )
                    : posts;

                  const visiblePosts = basePosts.filter((p) => {
                    if (feedFilter === 'shuoshuo' && p.kind !== 'shuoshuo') return false;
                    if (feedFilter === 'blog' && p.kind !== 'blog') return false;
                    if (feedFilter === 'media' && p.images.length === 0 && !p.poll) return false;
                    if (feedFilter === 'bookmarked' && !p.bookmarkedByMe) return false;
                    if (feedSearch.trim()) {
                      const q = feedSearch.trim().toLowerCase();
                      const hit =
                        p.content.toLowerCase().includes(q) ||
                        (p.title || '').toLowerCase().includes(q) ||
                        p.authorName.toLowerCase().includes(q) ||
                        p.tags.some((t) => t.toLowerCase().includes(q));
                      if (!hit) return false;
                    }
                    return true;
                  });

                  if (visiblePosts.length === 0) {
                    return (
                      <div className="rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {viewingOwner
                            ? `${viewingOwner.name} 近期暂无符合条件的说说动态`
                            : '暂无匹配的空间动态'}
                        </div>
                        <p className="text-xs text-slate-500">
                          切换筛选条件或发表一条新说说试试看吧
                        </p>
                      </div>
                    );
                  }

                  return visiblePosts.map((post) => {
                  const likedByMe = post.likes.some((l) => l.userId === 'me');
                  const totalPollVotes = post.poll
                    ? post.poll.options.reduce((s, o) => s + o.voterIds.length, 0)
                    : 0;
                  const replyTarget = replyTargets[post.id];

                  return (
                    <article
                      key={post.id}
                      className="rounded-2xl bg-white/95 dark:bg-[#161b26]/95 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800 hover:border-[#2563EB]/30 shadow-[0_6px_22px_-8px_rgba(15,23,42,0.08)] transition-colors p-5 space-y-3 relative"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              onOpenUserProfile?.({
                                id: post.authorId,
                                name: post.authorName,
                                avatar: post.authorAvatar,
                              })
                            }
                            className="shrink-0 hover:opacity-85 transition-opacity"
                            title={`查看 ${post.authorName} 的资料与空间`}
                          >
                            <AvatarView name={post.authorName} src={post.authorAvatar} size="md" />
                          </button>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() =>
                                  onOpenUserProfile?.({
                                    id: post.authorId,
                                    name: post.authorName,
                                    avatar: post.authorAvatar,
                                  })
                                }
                                className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-[#2563EB] text-left"
                              >
                                {post.authorName}
                              </button>
                              {post.mood && (
                                <span className="text-xs text-amber-600 dark:text-amber-400">
                                  · {post.mood}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-mono-tabular flex flex-wrap items-center gap-1.5">
                              <span>{post.createdAt}</span>
                              {post.location && (
                                <>
                                  <span>·</span>
                                  <span className="inline-flex items-center gap-0.5 text-rose-500">
                                    <MapPin className="w-3 h-3" />
                                    {post.location}
                                  </span>
                                </>
                              )}
                              {post.visibility && post.visibility !== 'public' && (
                                <>
                                  <span>·</span>
                                  <span className="inline-flex items-center gap-0.5 text-slate-500">
                                    {post.visibility === 'private' ? (
                                      <Lock className="w-3 h-3" />
                                    ) : (
                                      <Users className="w-3 h-3" />
                                    )}
                                    {post.visibility === 'private' ? '仅自己可见' : '仅好友可见'}
                                  </span>
                                </>
                              )}
                              <span>·</span>
                              <span className="inline-flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                浏览 {post.views}
                              </span>
                              {post.autoDelete24h && (
                                <>
                                  <span>·</span>
                                  <span className="text-amber-600">24小时限时可见</span>
                                </>
                              )}
                              {post.isAiGenerated && (
                                <>
                                  <span>·</span>
                                  <span className="text-sky-600">AI 辅助创作</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onToggleBookmarkPost && (
                            <button
                              type="button"
                              onClick={() => onToggleBookmarkPost(post.id)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                post.bookmarkedByMe
                                  ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                              title={post.bookmarkedByMe ? '已收藏' : '收藏这条动态'}
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${post.bookmarkedByMe ? 'fill-amber-500' : ''}`} />
                            </button>
                          )}
                          <button
                            onClick={() => setWechatSharePost(post)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            分享卡片
                          </button>
                        </div>
                      </div>

                      {post.title && (
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {post.title}
                        </h3>
                      )}

                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {post.content}
                      </p>

                      {post.repostFrom && (
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-3 space-y-2 text-xs">
                          <div className="font-semibold text-slate-700 dark:text-slate-200">
                            转发自 @{post.repostFrom.authorName}
                          </div>
                          <div className="text-slate-600 dark:text-slate-400 line-clamp-3">
                            {post.repostFrom.content}
                          </div>
                          {post.repostFrom.image && (
                            <img
                              src={post.repostFrom.image}
                              alt="转发配图"
                              referrerPolicy="no-referrer"
                              className="w-full max-h-40 object-cover rounded-lg"
                            />
                          )}
                        </div>
                      )}

                      {post.poll && (
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <BarChart3 className="w-3.5 h-3.5 text-[#2563EB]" />
                              {post.poll.question}
                            </span>
                            <span className="text-slate-400 font-mono-tabular">
                              共 {totalPollVotes} 票
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {post.poll.options.map((opt) => {
                              const voted = opt.voterIds.includes('me');
                              const pct =
                                totalPollVotes > 0
                                  ? Math.round((opt.voterIds.length / totalPollVotes) * 100)
                                  : 0;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => onVotePostPoll?.(post.id, opt.id)}
                                  className={`w-full relative overflow-hidden rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                                    voted
                                      ? 'border-[#2563EB] text-[#2563EB] font-semibold'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#2563EB]/60'
                                  }`}
                                >
                                  <span
                                    style={{ width: `${pct}%` }}
                                    className="absolute inset-y-0 left-0 bg-[#2563EB]/10 transition-all"
                                  />
                                  <span className="relative flex items-center justify-between">
                                    <span>
                                      {opt.text}
                                      {voted ? ' (已选)' : ''}
                                    </span>
                                    <span className="font-mono-tabular">
                                      {opt.voterIds.length} 票 · {pct}%
                                    </span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {(post.tags.length > 0 || post.mentions.length > 0) && (
                        <div className="text-xs text-[#2563EB] flex flex-wrap gap-3">
                          {post.tags.map((t) => (
                            <span key={t}>#{t}</span>
                          ))}
                          {post.mentions.map((m) => (
                            <span key={m} className="inline-flex items-center gap-0.5">
                              <AtSign className="w-3 h-3" />
                              {m}
                            </span>
                          ))}
                        </div>
                      )}

                      {post.images.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {post.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt="动态图片"
                              referrerPolicy="no-referrer"
                              className="w-full max-h-64 object-cover rounded-lg border border-slate-200 dark:border-slate-800"
                            />
                          ))}
                        </div>
                      )}

                      {/* Likes, Emoji Reactions & Gifts summary */}
                      {(post.likes.length > 0 ||
                        post.gifts.length > 0 ||
                        (post.reactions && post.reactions.length > 0)) && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                          {post.likes.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                              <span>{post.likes.map((l) => l.name).join('、')} 觉得很赞</span>
                            </div>
                          )}
                          {post.reactions && post.reactions.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {post.reactions
                                .filter((r) => r.userIds.length > 0)
                                .map((r) => {
                                  const reacted = r.userIds.includes('me');
                                  return (
                                    <button
                                      key={r.emoji}
                                      type="button"
                                      onClick={() => onReactPost?.(post.id, r.emoji)}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono-tabular ${
                                        reacted
                                          ? 'border-[#2563EB]/40 bg-[#2563EB]/10 text-[#2563EB]'
                                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                                      }`}
                                    >
                                      <span>{r.emoji}</span>
                                      <span>{r.userIds.length}</span>
                                    </button>
                                  );
                                })}
                            </div>
                          )}
                          {post.gifts.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Gift className="w-3.5 h-3.5 text-amber-500" />
                              <span>
                                收到礼物：
                                {post.gifts.map((g) => `${g.fromName}送出「${g.giftName}」`).join('；')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 relative">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => onToggleLike(post.id)}
                            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border whitespace-nowrap ${
                              likedByMe
                                ? 'border-rose-200 bg-rose-50 dark:bg-rose-950/30 text-rose-600'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${likedByMe ? 'fill-rose-500' : ''}`} />
                            赞 ({post.likes.length})
                          </button>

                          {/* Quick Emoji Reaction Bar */}
                          <div className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60">
                            <SmilePlus className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
                            {SPACE_REACTION_EMOJIS.map((em) => (
                              <button
                                key={em}
                                type="button"
                                onClick={() => onReactPost?.(post.id, em)}
                                className="px-1 py-0.5 rounded hover:bg-slate-200/80 dark:hover:bg-slate-700 text-xs transition-transform hover:scale-110"
                                title={`回应 ${em}`}
                              >
                                {em}
                              </button>
                            ))}
                          </div>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setGiftPickerPostId((cur) => (cur === post.id ? null : post.id))
                              }
                              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                            >
                              <Gift className="w-3.5 h-3.5 text-amber-500" />
                              送礼物
                            </button>

                            {giftPickerPostId === post.id && (
                              <div className="absolute left-0 bottom-full mb-2 z-30 w-56 rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-700 shadow-2xl p-2 grid grid-cols-2 gap-1.5 text-xs">
                                {SPACE_GIFT_OPTIONS.map((gf) => (
                                  <button
                                    key={gf.name}
                                    type="button"
                                    onClick={() => {
                                      onSendGift(post.id, gf.name);
                                      setGiftPickerPostId(null);
                                    }}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 text-left text-slate-700 dark:text-slate-200"
                                  >
                                    <span>{gf.emoji}</span>
                                    <span className="truncate">{gf.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {onRepostToQzone && (
                            <button
                              type="button"
                              onClick={() => onRepostToQzone(post)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                            >
                              <Repeat2 className="w-3.5 h-3.5 text-[#2563EB]" />
                              转发到空间
                            </button>
                          )}

                          {onForwardPostToChat && (
                            <button
                              type="button"
                              onClick={() => onForwardPostToChat(post)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-teal-600" />
                              发给好友
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Comments */}
                      {post.comments.length > 0 && (
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3 space-y-2 text-xs">
                          {post.comments.map((c) => {
                            const commentLiked = (c.likes || []).includes('me');
                            return (
                              <div key={c.id} className="flex items-start justify-between gap-2">
                                <div className="text-slate-700 dark:text-slate-300">
                                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {c.authorName}
                                  </span>
                                  {c.replyTo && (
                                    <span className="text-slate-400">
                                      {' '}
                                      回复 <span className="text-[#2563EB]">@{c.replyTo}</span>
                                    </span>
                                  )}
                                  <span>：</span>
                                  {c.content}
                                  <span className="ml-2 text-slate-400 font-mono-tabular">{c.time}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-400">
                                  {onLikeComment && (
                                    <button
                                      type="button"
                                      onClick={() => onLikeComment(post.id, c.id)}
                                      className={`inline-flex items-center gap-0.5 hover:text-rose-500 ${
                                        commentLiked ? 'text-rose-500 font-semibold' : ''
                                      }`}
                                    >
                                      <ThumbsUp className="w-3 h-3" />
                                      {(c.likes || []).length > 0 && (
                                        <span className="font-mono-tabular">{(c.likes || []).length}</span>
                                      )}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReplyTargets((prev) => ({
                                        ...prev,
                                        [post.id]: c.authorName,
                                      }))
                                    }
                                    className="inline-flex items-center gap-0.5 hover:text-[#2563EB]"
                                  >
                                    <Reply className="w-3 h-3" />
                                    回复
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        {replyTarget && (
                          <div className="flex items-center justify-between text-[11px] text-[#2563EB] px-2">
                            <span>正在回复 @{replyTarget}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setReplyTargets((prev) => ({ ...prev, [post.id]: null }))
                              }
                              className="text-slate-400 hover:text-slate-600"
                            >
                              取消回复
                            </button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            value={commentDrafts[post.id] || ''}
                            onChange={(e) =>
                              setCommentDrafts((p) => ({ ...p, [post.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const txt = (commentDrafts[post.id] || '').trim();
                                if (!txt) return;
                                onAddComment(post.id, txt, replyTarget || undefined);
                                setCommentDrafts((p) => ({ ...p, [post.id]: '' }));
                                setReplyTargets((prev) => ({ ...prev, [post.id]: null }));
                              }
                            }}
                            placeholder={replyTarget ? `回复 @${replyTarget}...` : '评论一句...'}
                            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                          />
                          <button
                            onClick={() => {
                              const txt = (commentDrafts[post.id] || '').trim();
                              if (!txt) return;
                              onAddComment(post.id, txt, replyTarget || undefined);
                              setCommentDrafts((p) => ({ ...p, [post.id]: '' }));
                              setReplyTargets((prev) => ({ ...prev, [post.id]: null }));
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 dark:bg-slate-700 text-white whitespace-nowrap"
                          >
                            评论
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                });
                })()}
              </div>
            </>
          )}

          {/* TAB 2: Album with Year/Month Filter, Synced Likes, AI Repair & AI Erase */}
          {tab === 'album' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#191c24] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-4 h-4 text-[#2563EB]" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">按年月筛选：</span>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono-tabular"
                  >
                    <option value={2026}>2026年</option>
                    <option value={2025}>2025年</option>
                  </select>
                  <select
                    value={filterMonth}
                    onChange={(e) =>
                      setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))
                    }
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono-tabular"
                  >
                    <option value="all">全年</option>
                    <option value={11}>11月</option>
                    <option value={10}>10月</option>
                  </select>
                </div>
                <span className="text-xs text-slate-500">
                  点击任意照片即可使用「AI 修复画质」与「AI 智能消除路人」
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 overflow-hidden"
                  >
                    <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-900 overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        referrerPolicy="no-referrer"
                        style={{
                          filter: photo.enhanced
                            ? 'contrast(1.12) saturate(1.18) brightness(1.04)'
                            : undefined,
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3.5 space-y-2">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {photo.caption}
                      </div>
                      <div className="text-xs text-slate-500 font-mono-tabular">
                        {photo.year}-{photo.month}-{photo.day} · 同步点赞 ({photo.likes.length})：
                        {photo.likes.join('、')}
                      </div>
                      <button
                        onClick={() => {
                          setEditingPhoto(photo);
                          setAiStatusText(photo.aiNote || '');
                          setEraseMode(false);
                        }}
                        className="w-full py-1.5 text-xs font-medium rounded-lg bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 flex items-center justify-center gap-1.5"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        AI 修复 / AI 消除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: StarRipple Discovery 3x3 Hub */}
          {tab === 'discover' && (
            <div className="space-y-5">
              {/* Indigo Discovery Header + Search */}
              <div className="rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#0D9488] p-4 text-white flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Compass className="w-5 h-5" />
                  <span>星涟动态空间</span>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-white/75 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={discoverSearch}
                    onChange={(e) => setDiscoverSearch(e.target.value)}
                    placeholder="搜索附近、部落、小游戏、K歌"
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/20 placeholder:text-white/75 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {discoverApp !== 'grid' && (
                <button
                  onClick={() => setDiscoverApp('grid')}
                  className="text-xs font-medium text-[#2563EB] hover:underline"
                >
                  ← 返回动态九宫格菜单
                </button>
              )}

              {discoverApp === 'grid' && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'nearby', label: '附近', desc: '发现同城在线动态', icon: MapPin, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30', onClick: () => setDiscoverApp('nearby') },
                    { id: 'tribe', label: '兴趣部落', desc: '进入灵感频道主题圈', icon: Compass, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30', onClick: () => onOpenChannels?.() },
                    { id: 'games', label: '游戏', desc: '每日幸运大转盘', icon: Gamepad2, color: 'text-[#2563EB] bg-sky-50 dark:bg-sky-950/30', onClick: () => setDiscoverApp('games') },
                    { id: 'voice', label: '语音房', desc: '频道连麦茶水间', icon: Radio, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/30', onClick: () => onOpenChannels?.() },
                    { id: 'reading', label: '阅读', desc: '精选产品与技术书单', icon: BookOpen, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/30', onClick: () => setDiscoverApp('reading') },
                    { id: 'weishi', label: '短片精选', desc: '高清横竖屏短视频', icon: Film, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30', onClick: () => setDiscoverApp('weishi') },
                    { id: 'ksong', label: '线上K歌房', desc: '好友翻唱作品榜单', icon: Music, color: 'text-red-500 bg-red-50 dark:bg-red-950/30', onClick: () => setDiscoverApp('ksong') },
                    { id: 'esports', label: '热门赛事直播', desc: '赛事直播间实时解说', icon: Trophy, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30', onClick: () => setDiscoverApp('esports') },
                    { id: 'tanbaishuo', label: '匿名心声卡', desc: '匿名夸夸好友印象', icon: Sparkles, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30', onClick: () => setDiscoverApp('tanbaishuo') },
                  ]
                    .filter((item) => !discoverSearch.trim() || item.label.includes(discoverSearch.trim()) || item.desc.includes(discoverSearch.trim()))
                    .map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={item.onClick}
                          className="rounded-2xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center justify-center gap-2 hover:border-[#2563EB] transition-colors"
                        >
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${item.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-slate-400">{item.desc}</div>
                        </button>
                      );
                    })}
                </div>
              )}

              {discoverApp === 'tanbaishuo' && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      匿名心声卡 · 发送匿名夸赞
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <select
                        value={tanbaiTarget}
                        onChange={(e) => setTanbaiTarget(e.target.value)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2"
                      >
                        {contacts.filter((c) => !c.blocked).map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <input
                        value={tanbaiTag}
                        onChange={(e) => setTanbaiTag(e.target.value)}
                        placeholder="写一句匿名印象..."
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!tanbaiTag.trim()) return;
                        setTanbaiList((prev) => [
                          {
                            id: `tb-${Date.now()}`,
                            fromHint: '一位神秘星涟好友',
                            targetName: tanbaiTarget,
                            tag: tanbaiTag.trim(),
                            time: '刚刚',
                            liked: false,
                          },
                          ...prev,
                        ]);
                        setTanbaiTag('');
                      }}
                      className="px-4 py-2 text-xs font-medium rounded-lg bg-[#2563EB] text-white"
                    >
                      匿名投递心声卡
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {tanbaiList.map((tb) => (
                      <div key={tb.id} className="rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-xs text-slate-400">
                            {tb.fromHint} → <span className="font-semibold text-[#2563EB]">{tb.targetName}</span> · {tb.time}
                          </div>
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            “{tb.tag}”
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setTanbaiList((prev) =>
                              prev.map((x) => (x.id === tb.id ? { ...x, liked: !x.liked } : x))
                            )
                          }
                          className={`px-3 py-1 rounded-lg text-xs border ${
                            tb.liked ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-slate-200 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          {tb.liked ? '已比心 ❤️' : '比心'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {discoverApp === 'ksong' && (
                <div className="rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { id: 'ks-1', title: '晴天（西湖清唱版）', singer: '林小雨', score: 'SSS 98分', likes: 36 },
                    { id: 'ks-2', title: '夜曲（深夜吉他弹唱）', singer: '陈子昂', score: 'SS 94分', likes: 24 },
                  ].map((song) => {
                    const playing = ksongPlayingId === song.id;
                    return (
                      <div key={song.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setKsongPlayingId(playing ? null : song.id)}
                            className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center"
                          >
                            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {song.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              演唱：{song.singer} · 评分 {song.score} · {song.likes} 朵鲜花
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-rose-500 font-medium">
                          {playing ? '正在试听...' : '线上K歌房'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {discoverApp === 'games' && (
                <div className="rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4">
                  <Gamepad2 className="w-10 h-10 text-[#2563EB] mx-auto" />
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    星涟空间每日幸运大转盘
                  </h4>
                  <p className="text-xs text-slate-500">
                    每天一次空间幸运抽奖，赢取星阶成长加速卡、气泡体验券与神秘徽章！
                  </p>
                  <button
                    onClick={() => {
                      const prizes = ['星阶成长 0.5 天加速卡 ⚡', '星河渐变气泡 7 天体验券 💬', '星耀空间挂件礼包 💎', '手气最佳好运签 ✨'];
                      setWheelPrize(prizes[Math.floor(Math.random() * prizes.length)]);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
                  >
                    立即转动转盘
                  </button>
                  {wheelPrize && (
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm font-semibold text-amber-700 dark:text-amber-300">
                      恭喜抽中：{wheelPrize}
                    </div>
                  )}
                </div>
              )}

              {(discoverApp === 'nearby' || discoverApp === 'reading' || discoverApp === 'weishi' || discoverApp === 'esports') && (
                <div className="rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {discoverApp === 'nearby'
                      ? '附近同城动态（杭州 · 余杭/西湖）'
                      : discoverApp === 'reading'
                      ? '星涟阅读精选书单'
                      : discoverApp === 'weishi'
                      ? '热门短片精选'
                      : '热门赛事直播间'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-4 space-y-1">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {discoverApp === 'nearby'
                          ? '西湖断桥日落摄影打卡 · 1.2 km'
                          : discoverApp === 'reading'
                          ? '《高性能前端架构与即时通讯实践》'
                          : discoverApp === 'weishi'
                          ? '1分钟看懂 10GB 快传如何跑满千兆带宽'
                          : 'KPL 秋季赛总决赛回放解说'}
                      </div>
                      <div className="text-slate-500">热度 9,420 · 点击即可收藏至个人空间</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-4 space-y-1">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {discoverApp === 'nearby'
                          ? '未来科技城极客咖啡局 · 0.8 km'
                          : discoverApp === 'reading'
                          ? '《交互设计细节指南：从桌面客户端说起》'
                          : discoverApp === 'weishi'
                          ? '西湖边樱花季延时摄影 4K 精选'
                          : '无畏契约高校邀请赛实时战况'}
                      </div>
                      <div className="text-slate-500">热度 6,180 · 今日持续更新</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Guestbook */}
          {tab === 'guestbook' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-4 flex gap-2">
                <input
                  value={guestDraft}
                  onChange={(e) => setGuestDraft(e.target.value)}
                  placeholder="在主人留言板踩一踩..."
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={() => {
                    if (!guestDraft.trim()) return;
                    onAddGuestbook(guestDraft.trim());
                    setGuestDraft('');
                  }}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-[#2563EB] text-white"
                >
                  留言
                </button>
              </div>
              <div className="rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {guestbook.map((g) => (
                  <div key={g.id} className="p-4 flex items-start gap-3">
                    <button
                      onClick={() =>
                        onOpenUserProfile?.({
                          name: g.authorName,
                          avatar: g.authorAvatar,
                        })
                      }
                      className="shrink-0 hover:opacity-85"
                      title={`查看 ${g.authorName} 的资料与空间`}
                    >
                      <AvatarView name={g.authorName} src={g.authorAvatar} size="sm" />
                    </button>
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        <button
                          onClick={() =>
                            onOpenUserProfile?.({
                              name: g.authorName,
                              avatar: g.authorAvatar,
                            })
                          }
                          className="hover:text-[#2563EB]"
                        >
                          {g.authorName}
                        </button>
                        <span className="ml-2 text-xs text-slate-400 font-mono-tabular font-normal">
                          {g.time}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{g.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Visitors */}
          {tab === 'visitors' && (
            <div className="rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { id: 'c-lin', name: '林小雨', avatar: GENERATED_ASSETS.lin, time: '今天 16:05', action: '浏览了你的相册《杭州西湖十景》' },
                { id: 'c-chen', name: '陈子昂', avatar: GENERATED_ASSETS.chen, time: '今天 14:22', action: '赞了你的日志' },
                { id: 'c-zhou', name: '周敏敏', time: '昨天 22:18', action: '访问了你的空间主页' },
              ].map((v, idx) => (
                <div
                  key={idx}
                  onClick={() =>
                    onOpenUserProfile?.({ id: v.id, name: v.name, avatar: v.avatar })
                  }
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <AvatarView name={v.name} src={v.avatar} size="sm" />
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-[#2563EB]">
                        {v.name}
                      </div>
                      <div className="text-xs text-slate-500">{v.action}</div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono-tabular">{v.time}</span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: 与我相关 */}
          {tab === 'related' && (
            <div className="rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { id: 'c-lin', name: '林小雨', avatar: GENERATED_ASSETS.lin, time: '10分钟前', detail: '赞了你的说说并赠送了「玫瑰花」' },
                { id: 'c-chen', name: '陈子昂', avatar: GENERATED_ASSETS.chen, time: '1小时前', detail: '评论了你的相片《杭州西湖十景》：构图很有电影感！' },
                { id: 'c-zhou', name: '周敏敏', time: '今天 11:30', detail: '在你的空间留言板踩了一踩' },
              ].map((r, i) => (
                <div
                  key={i}
                  onClick={() =>
                    onOpenUserProfile?.({ id: r.id, name: r.name, avatar: r.avatar })
                  }
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <AvatarView name={r.name} src={r.avatar} size="sm" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-[#2563EB]">
                        {r.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{r.detail}</div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono-tabular">{r.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Album AI Repair & Erase Modal */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                相册 AI 工坊 · {editingPhoto.caption}
              </span>
              <button
                onClick={() => setEditingPhoto(null)}
                className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <canvas
                ref={editorCanvasRef}
                width={600}
                height={400}
                onClick={handleCanvasEraseClick}
                className={`w-full rounded-lg border border-slate-200 dark:border-slate-700 ${
                  eraseMode ? 'cursor-crosshair' : ''
                }`}
              />
              {aiStatusText && (
                <div className="rounded-lg bg-[#2563EB]/10 text-[#1D4ED8] dark:text-indigo-300 px-3.5 py-2 text-xs">
                  {aiStatusText}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    disabled={aiBusy}
                    onClick={() => runPhotoAi('repair')}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI 修复画质与色彩
                  </button>
                  <button
                    disabled={aiBusy}
                    onClick={() => {
                      setEraseMode(!eraseMode);
                      if (!eraseMode) {
                        runPhotoAi('erase');
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border ${
                      eraseMode
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    {eraseMode ? '点击照片消除杂物（已激活）' : 'AI 消除路人/杂物'}
                  </button>
                </div>
                <button
                  onClick={() => setEditingPhoto(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  完成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share to WeChat Moments Poster Modal */}
      {wechatSharePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                生成动态分享卡片
              </span>
              <button onClick={() => setWechatSharePost(null)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2">
              <div className="text-xs text-slate-500">来自星涟空间 · {wechatSharePost.authorName}</div>
              <div className="text-sm text-slate-800 dark:text-slate-200 line-clamp-4">
                {wechatSharePost.content}
              </div>
              {wechatSharePost.images[0] && (
                <img
                  src={wechatSharePost.images[0]}
                  alt="分享封面"
                  referrerPolicy="no-referrer"
                  className="w-full h-32 object-cover rounded-lg"
                />
              )}
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(`${wechatSharePost.authorName}的星涟空间动态：${wechatSharePost.content}`);
                setWechatSharePost(null);
              }}
              className="w-full py-2.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
            >
              复制动态分享链接
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
