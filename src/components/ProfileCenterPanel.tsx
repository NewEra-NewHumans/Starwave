import React, { useState } from 'react';
import {
  Bookmark,
  ChevronRight,
  Edit3,
  Heart,
  Image as ImageIcon,
  Layers,
  Palette,
  Plus,
  Settings,
  Sparkles,
  ThumbsUp,
  UserCheck,
  Wallet,
  CalendarCheck,
  TrendingUp,
  Award,
  Zap,
  Check,
} from 'lucide-react';
import {
  AppSection,
  DressUpConfig,
  OnlineStatusType,
  UserProfile,
  WalletTransaction,
} from '../types/qq';
import { AvatarView } from './AvatarView';
import { GENERATED_ASSETS } from '../data/seedData';
import { CARD_BG_PRESETS } from '../utils/dressUpCatalog';
import { LevelTierBadge } from './LevelTierBadge';
import {
  getStarTierInfo,
  formatLevelIconsText,
  getLevelProgress,
  QQ_GROWTH_TASKS,
} from '../utils/qqLevel';

/* StarRipple Original 8-Tier Crest Emblem Display */
export const QqLevelIcons: React.FC<{
  level: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showTitle?: boolean;
}> = ({ level, size = 'sm', onClick }) => {
  const tier = getStarTierInfo(level);
  const badgeSize: 'xs' | 'sm' | 'md' =
    size === 'lg' ? 'md' : size === 'md' ? 'sm' : 'xs';

  const content = (
    <span className={`inline-flex items-center gap-1 font-bold ${tier.accentClass}`}>
      <LevelTierBadge tierKey={tier.tierKey} size={badgeSize} active />
      <span className={size === 'xs' ? 'text-[10px]' : 'text-[11px]'}>
        {tier.tierName}
      </span>
    </span>
  );

  const label = `等级 LV.${tier.level}（${formatLevelIconsText(tier.level)}）· 点击查看全部等级徽章`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={label}
        className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
      >
        {content}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1" title={label}>
      {content}
    </span>
  );
};

interface ProfileCenterPanelProps {
  profile: UserProfile;
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  dressUp: DressUpConfig;
  onlineStatus: OnlineStatusType;
  walletBalance: number;
  transactions: WalletTransaction[];
  onRechargeWallet: (amount: number) => void;
  favoritesCount: number;
  photosCount: number;
  postsCount: number;
  onNavigate: (section: AppSection) => void;
  onOpenLevelCenter: () => void;
  boundEmail?: string;
  authProviderLabel?: string;
  onOpenAuthModal?: () => void;
  minimalMode: boolean;
}

const VIP_PRIVILEGE_BADGES = [
  { id: 'pro', name: 'Pro 会员', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40', desc: '2000人超大群 · 2.4x 星阶加速 · 专属气泡' },
  { id: 'album', name: '相册云空间', color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40', desc: '星涟空间装扮全免 · 原图极速上传' },
  { id: 'music', name: '无损共听会员', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40', desc: '一起听歌无损音质 · 专属空间背景音乐' },
  { id: 'wardrobe', name: '虚拟形象衣橱', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40', desc: '虚拟形象穿搭 · 超级互动大表情特权' },
  { id: 'cloud', name: '10GB 快传会员', color: 'text-[#2563EB] bg-sky-50 dark:bg-sky-950/40', desc: '10GB 极速快传通道 · 180天长效期' },
  { id: 'cinema', name: '4K 放映厅会员', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40', desc: '4K 蓝光一起看视频 · 院线同步厅' },
];

const VIRTUAL_OUTFITS = [
  { id: 'cyber', label: '极客卫衣套装', avatarEmoji: '🧑‍💻', bg: 'from-blue-600 to-indigo-700', mood: '正在打磨 StarRipple V2.4' },
  { id: 'casual', label: '西湖假日风衣', avatarEmoji: '🧥', bg: 'from-amber-400 to-rose-500', mood: '周末西湖扫街摄影中' },
  { id: 'astronaut', label: '星际漫步宇航服', avatarEmoji: '👩‍🚀', bg: 'from-slate-800 to-teal-700', mood: '探索新灵感频道' },
];

export const ProfileCenterPanel: React.FC<ProfileCenterPanelProps> = ({
  profile,
  onUpdateProfile,
  dressUp,
  onlineStatus,
  walletBalance,
  transactions,
  onRechargeWallet,
  favoritesCount,
  photosCount,
  postsCount,
  onNavigate,
  onOpenLevelCenter,
  boundEmail,
  authProviderLabel,
  onOpenAuthModal,
  minimalMode,
}) => {
  const [editingSig, setEditingSig] = useState(false);
  const [sigDraft, setSigDraft] = useState(profile.signature);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [activeSubView, setActiveSubView] = useState<'card' | 'wallet' | 'qqshow'>('card');
  const [selectedBadge, setSelectedBadge] = useState(VIP_PRIVILEGE_BADGES[0]);
  const [selectedOutfit, setSelectedOutfit] = useState(VIRTUAL_OUTFITS[0]);

  const levelInfo = getLevelProgress(profile.activeDays);
  const unclaimedTasksCount = QQ_GROWTH_TASKS.filter(
    (t) => !profile.completedGrowthTaskIds.includes(t.id)
  ).length;

  const cardPreset =
    CARD_BG_PRESETS.find((c) => c.id === dressUp.cardBgId) || CARD_BG_PRESETS[0];
  const coverBg = cardPreset.useWestlakeImage
    ? `url(${GENERATED_ASSETS.qzoneCover})`
    : undefined;

  const statusText =
    onlineStatus === 'online'
      ? '我在线上'
      : onlineStatus === 'qme'
      ? '欢迎私聊'
      : onlineStatus === 'away'
      ? '离开'
      : onlineStatus === 'busy'
      ? '忙碌'
      : onlineStatus === 'dnd'
      ? '请勿打扰'
      : '隐身';

  return (
    <div className="h-full w-full overflow-y-auto sr-aurora-canvas p-5 lg:p-7">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Classic "我 / 个人中心" Menu List */}
        <section className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-white/95 dark:bg-[#161b26]/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-[0_8px_24px_-8px_rgba(15,23,42,0.08)]">
            {/* Top Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#0B1325] via-[#15223F] to-[#112A3E] text-white flex items-center justify-between">
              <span className="text-sm font-bold">
                我 · 个人中心
              </span>
              <span className="text-xs text-sky-300 font-medium">{statusText}</span>
            </div>

            {/* Identity Row */}
            <div className="p-5 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800">
              <AvatarView
                name={profile.name}
                src={profile.avatar}
                size="lg"
                online={onlineStatus !== 'invisible'}
                frameId={dressUp.frameId}
                pendantId={dressUp.pendantId}
                minimalMode={minimalMode}
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {editingName ? (
                    <div className="flex items-center gap-1">
                      <input
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        className="px-2 py-0.5 text-sm rounded border border-[#2563EB] bg-slate-50 dark:bg-slate-900 w-28"
                      />
                      <button
                        onClick={() => {
                          if (nameDraft.trim()) onUpdateProfile({ name: nameDraft.trim() });
                          setEditingName(false);
                        }}
                        className="p-1 rounded bg-[#2563EB] text-white"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setNameDraft(profile.name);
                        setEditingName(true);
                      }}
                      className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-[#2563EB] flex items-center gap-1"
                      title="点击修改昵称"
                    >
                      {profile.name}
                      <Edit3 className="w-3 h-3 text-slate-400" />
                    </button>
                  )}
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    · {profile.vipLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <QqLevelIcons level={levelInfo.level} onClick={onOpenLevelCenter} />
                  <button
                    onClick={onOpenLevelCenter}
                    className="text-[11px] text-[#2563EB] hover:underline font-mono-tabular font-medium"
                  >
                    LV.{levelInfo.level} · {levelInfo.title}
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono-tabular">
                    星涟号 {profile.qqNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Signature Row */}
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30">
              {editingSig ? (
                <div className="flex items-center gap-2">
                  <input
                    value={sigDraft}
                    onChange={(e) => setSigDraft(e.target.value)}
                    placeholder="编辑个性签名，展示我的独特态度..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#2563EB] bg-white dark:bg-slate-900"
                  />
                  <button
                    onClick={() => {
                      onUpdateProfile({ signature: sigDraft.trim() || '暂无签名' });
                      setEditingSig(false);
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#2563EB] text-white"
                  >
                    保存
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSigDraft(profile.signature);
                    setEditingSig(true);
                  }}
                  className="w-full flex items-center justify-between text-left text-xs text-slate-600 dark:text-slate-300 hover:text-[#2563EB]"
                >
                  <span className="truncate">
                    <span className="text-slate-400 mr-2">个性签名</span>
                    {profile.signature}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              )}
            </div>

            {/* Classic Action Menu Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              <button
                onClick={() => setActiveSubView('wallet')}
                className={`w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                  activeSubView === 'wallet' ? 'bg-[#2563EB]/5' : ''
                }`}
              >
                <span className="flex items-center gap-3 font-medium text-slate-800 dark:text-slate-200">
                  <Wallet className="w-4 h-4 text-[#2563EB]" />
                  我的零钱钱包
                </span>
                <span className="flex items-center gap-2 text-xs font-mono-tabular text-amber-600 font-semibold">
                  ¥{walletBalance.toFixed(2)}
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </span>
              </button>

              <button
                onClick={() => setActiveSubView('qqshow')}
                className={`w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                  activeSubView === 'qqshow' ? 'bg-[#2563EB]/5' : ''
                }`}
              >
                <span className="flex items-center gap-3 font-medium text-slate-800 dark:text-slate-200">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  虚拟形象衣橱
                </span>
                <span className="flex items-center gap-2 text-xs text-slate-400">
                  {selectedOutfit.label}
                  <ChevronRight className="w-4 h-4" />
                </span>
              </button>

              <button
                onClick={onOpenLevelCenter}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-amber-50/60 dark:hover:bg-amber-950/20 transition-colors"
              >
                <span className="flex items-center gap-3 font-medium text-slate-800 dark:text-slate-200">
                  <Award className="w-4 h-4 text-amber-500" />
                  星阶成长中心
                </span>
                <span className="flex items-center gap-2 text-xs">
                  <span className="font-mono-tabular text-amber-600 font-semibold">
                    {levelInfo.progressPercent}%
                  </span>
                  {unclaimedTasksCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[10px] font-semibold">
                      {unclaimedTasksCount} 项可领
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </span>
              </button>

              <button
                onClick={() => setActiveSubView('card')}
                className={`w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                  activeSubView === 'card' ? 'bg-[#2563EB]/5' : ''
                }`}
              >
                <span className="flex items-center gap-3 font-medium text-slate-800 dark:text-slate-200">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  我的个人资料名片
                </span>
                <span className="flex items-center gap-2 text-xs text-slate-400 font-mono-tabular">
                  {profile.likesCount} 赞
                  <ChevronRight className="w-4 h-4" />
                </span>
              </button>

              <button
                onClick={() => onNavigate('office')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className="flex items-center gap-3 font-medium text-slate-800 dark:text-slate-200">
                  <Bookmark className="w-4 h-4 text-sky-500" />
                  我的收藏
                </span>
                <span className="flex items-center gap-2 text-xs text-slate-400 font-mono-tabular">
                  {favoritesCount} 项
                  <ChevronRight className="w-4 h-4" />
                </span>
              </button>

              <button
                onClick={() => onNavigate('qzone')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className="flex items-center gap-3 font-medium text-slate-800 dark:text-slate-200">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  我的相册与星涟空间
                </span>
                <span className="flex items-center gap-2 text-xs text-slate-400 font-mono-tabular">
                  {photosCount} 张 · {postsCount} 动态
                  <ChevronRight className="w-4 h-4" />
                </span>
              </button>

              <button
                onClick={() => onNavigate('dressup')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className="flex items-center gap-3 font-medium text-slate-800 dark:text-slate-200">
                  <Palette className="w-4 h-4 text-indigo-500" />
                  表情、气泡、主题（个性装扮）
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('security')}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className="flex items-center gap-3 font-medium text-slate-800 dark:text-slate-200">
                  <Settings className="w-4 h-4 text-slate-500" />
                  设置与模式中心
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Interactive Profile Card / Wallet Ledger / StarShow Studio */}
        <section className="lg:col-span-7 space-y-5">
          {activeSubView === 'card' && (
            <div className="rounded-2xl bg-white/95 dark:bg-[#161b26]/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-[0_10px_28px_-10px_rgba(15,23,42,0.1)]">
              {/* Banner Cover */}
              <div
                className={`h-48 relative bg-gradient-to-br ${cardPreset.gradientClass} bg-cover bg-center ${
                  dressUp.cardBgId === 'grid' ? 'sr-bubble-grid' : ''
                }`}
                style={coverBg ? { backgroundImage: coverBg } : undefined}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/20 to-transparent" />
                <div className="absolute left-5 top-4 text-[11px] font-mono-tabular tracking-widest uppercase text-sky-200/85">
                  StarRipple Identity Card
                </div>
                {/* Right floating Like + Level Speedup badges */}
                <div className="absolute right-4 bottom-4 flex items-center gap-2">
                  <button
                    onClick={() =>
                      onUpdateProfile({
                        likedByMe: !profile.likedByMe,
                        likesCount: profile.likedByMe
                          ? profile.likesCount - 1
                          : profile.likesCount + 1,
                      })
                    }
                    className={`px-3 py-1.5 rounded-xl backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 border ${
                      profile.likedByMe
                        ? 'bg-rose-500/90 text-white border-rose-400'
                        : 'bg-black/45 text-white border-white/25 hover:bg-black/65'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span className="font-mono-tabular">{profile.likesCount}</span>
                  </button>
                  <button
                    onClick={onOpenLevelCenter}
                    className="px-3 py-1.5 rounded-xl bg-black/45 hover:bg-black/65 backdrop-blur-md text-amber-300 border border-white/20 text-xs font-semibold font-mono-tabular flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {profile.growthSpeedMultiplier.toFixed(1)}x 加速中
                  </button>
                </div>
              </div>

              {/* Centered Overlapping Avatar & Name */}
              <div className="px-6 pb-6 -mt-12 relative">
                <div className="flex flex-col items-center text-center">
                  <div className="p-1 rounded-full bg-white dark:bg-[#191c24] shadow-lg">
                    <AvatarView
                      name={profile.name}
                      src={profile.avatar}
                      size="xl"
                      frameId={dressUp.frameId}
                      pendantId={dressUp.pendantId}
                      minimalMode={minimalMode}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-3">
                    {profile.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">{profile.signature}</p>
                </div>

                {/* Detailed Info Rows */}
                <div className="mt-6 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-5 text-xs">
                  <div className="flex items-center justify-between py-1 gap-2">
                    <span className="text-slate-500">星涟号与绑定邮箱</span>
                    <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200 font-mono-tabular">
                      <span>
                        {profile.qqNumber} · {boundEmail || '未登录邮箱'}
                      </span>
                      {onOpenAuthModal && (
                        <button
                          type="button"
                          onClick={onOpenAuthModal}
                          className="text-[#2563EB] hover:underline font-sans text-[11px]"
                        >
                          {authProviderLabel ? '切换邮箱' : '邮箱登录/注册'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500">星涟成长星阶与体系</span>
                    <button
                      onClick={onOpenLevelCenter}
                      className="flex items-center gap-2 hover:opacity-80"
                    >
                      <QqLevelIcons level={levelInfo.level} />
                      <span className="text-emerald-600 font-medium font-mono-tabular">
                        LV.{levelInfo.level} ({formatLevelIconsText(levelInfo.level)})
                      </span>
                    </button>
                  </div>

                  <div className="rounded-xl bg-[#F4F6FF] dark:bg-indigo-950/30 p-3.5 space-y-2 border border-indigo-200/70 dark:border-indigo-900/40">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#4F46E5]" />
                        8 阶徽章成长（初识者 → 精英玩家 → 传奇用户）
                      </span>
                      <span className="font-mono-tabular text-[#4F46E5] dark:text-indigo-300 font-semibold">
                        {levelInfo.progressPercent}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#6D28D9] via-[#7C3AED] to-[#2563EB] transition-all duration-300"
                        style={{ width: `${levelInfo.progressPercent}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="font-mono-tabular">
                        再获 <strong className="text-[#4F46E5] dark:text-indigo-300">{levelInfo.remainingExpToNextLevel}</strong> 经验升级到 LV.{levelInfo.level + 1}
                      </span>
                      <button
                        onClick={onOpenLevelCenter}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2563EB] text-white text-[11px] font-medium hover:bg-[#1D4ED8]"
                      >
                        <CalendarCheck className="w-3 h-3" />
                        {unclaimedTasksCount > 0 ? `领经验 (${unclaimedTasksCount})` : '查看全部等级'}
                      </button>
                    </div>
                  </div>

                  {/* Privilege Icon Wall */}
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">已点亮业务与会员图标墙</span>
                      <span className="text-[11px] text-slate-400">点击查看特权</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {VIP_PRIVILEGE_BADGES.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setSelectedBadge(b)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            selectedBadge.id === b.id
                              ? 'border-[#2563EB] ring-1 ring-[#2563EB]/30'
                              : 'border-transparent'
                          } ${b.color}`}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                    <div className="rounded-lg bg-sky-50/70 dark:bg-sky-950/20 px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-[#2563EB] mr-1.5">
                        {selectedBadge.name}:
                      </span>
                      {selectedBadge.desc}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('qzone')}
                    className="w-full mt-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] flex items-center justify-between px-4 text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    <span>进入「{profile.name} 的星涟空间」</span>
                    <span className="text-slate-400 font-mono-tabular">
                      {postsCount} 条动态 · {photosCount} 张相片 →
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSubView === 'wallet' && (
            <div className="rounded-2xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-sm">
              <div className="rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#0D9488] p-6 text-white flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-sky-100">星涟零钱钱包余额</div>
                  <div className="text-3xl font-bold font-mono-tabular mt-1">
                    ¥{walletBalance.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRechargeWallet(100)}
                    className="px-3.5 py-2 rounded-xl bg-white text-[#2563EB] text-xs font-semibold hover:bg-sky-50 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    充值 ¥100
                  </button>
                  <button
                    onClick={() => onRechargeWallet(500)}
                    className="px-3.5 py-2 rounded-xl bg-white/15 text-white border border-white/30 text-xs font-semibold hover:bg-white/25"
                  >
                    +¥500
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  最近红包与账户收支明细
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {tx.title}
                        </div>
                        <div className="text-slate-400 font-mono-tabular mt-0.5">{tx.time}</div>
                      </div>
                      <span
                        className={`font-bold font-mono-tabular text-sm ${
                          tx.kind === 'in' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {tx.kind === 'in' ? '+' : '-'}¥{tx.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSubView === 'qqshow' && (
            <div className="rounded-2xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    虚拟形象衣橱
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    切换个人虚拟形象穿搭风格，实时同步至资料名片与空间主页
                  </p>
                </div>
                <Layers className="w-5 h-5 text-rose-500" />
              </div>

              <div
                className={`rounded-2xl bg-gradient-to-br ${selectedOutfit.bg} p-8 text-white flex flex-col items-center justify-center text-center space-y-3`}
              >
                <div className="text-7xl drop-shadow-md">{selectedOutfit.avatarEmoji}</div>
                <div className="text-lg font-bold">{selectedOutfit.label}</div>
                <div className="px-3 py-1 rounded-lg bg-white/15 text-xs backdrop-blur-sm">
                  当前状态：{selectedOutfit.mood}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {VIRTUAL_OUTFITS.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOutfit(o)}
                    className={`p-3 rounded-xl border text-center space-y-1 ${
                      selectedOutfit.id === o.id
                        ? 'border-[#2563EB] bg-[#2563EB]/10'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="text-3xl">{o.avatarEmoji}</div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {o.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
