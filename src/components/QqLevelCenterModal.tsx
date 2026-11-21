import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Lock,
  Sliders,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Unlock,
  X,
  Zap,
} from 'lucide-react';
import { Contact, UserProfile } from '../types/qq';
import { AvatarView } from './AvatarView';
import { QqLevelIcons } from './ProfileCenterPanel';
import { LevelTierBadge } from './LevelTierBadge';
import {
  EXP_PER_ACTIVE_DAY,
  LEVEL_TIER_DEFINITIONS,
  getStarTierInfo,
  formatLevelIconsText,
  getContactLevelInfo,
  getLevelProgress,
  getLevelTitle,
  QQ_GROWTH_TASKS,
  QQ_LEVEL_PERKS,
  requiredActiveDaysForLevel,
} from '../utils/qqLevel';

interface QqLevelCenterModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  contacts: Contact[];
  minimalMode: boolean;
  onClaimTask: (taskId: string) => void;
  onSelectContactProfile?: (contact: Contact) => void;
}

export const QqLevelCenterModal: React.FC<QqLevelCenterModalProps> = ({
  open,
  onClose,
  profile,
  contacts,
  minimalMode,
  onClaimTask,
  onSelectContactProfile,
}) => {
  const [tab, setTab] = useState<'growth' | 'ranking' | 'perks'>('growth');
  const [simLevel, setSimLevel] = useState<number>(() =>
    getLevelProgress(profile.activeDays).level
  );

  const levelInfo = useMemo(
    () => getLevelProgress(profile.activeDays),
    [profile.activeDays]
  );
  const currentTier = useMemo(
    () => getStarTierInfo(levelInfo.level),
    [levelInfo.level]
  );

  const estimatedCalendarDays = Math.max(
    1,
    Math.ceil(
      levelInfo.remainingDaysToNextLevel /
        Math.max(1, profile.growthSpeedMultiplier)
    )
  );

  const leaderboard = useMemo(() => {
    const friendsEntries = contacts
      .filter((c) => !c.blocked)
      .map((c) => {
        const info = getContactLevelInfo(c);
        return {
          id: c.id,
          name: c.remark || c.name,
          avatar: c.avatar,
          isMe: false,
          contact: c,
          level: info.level,
          activeDays: info.activeDays,
          title: info.title,
          vipLabel: c.vipLabel,
        };
      });

    const meEntry = {
      id: 'me',
      name: `${profile.name} (我)`,
      avatar: profile.avatar,
      isMe: true,
      contact: null as Contact | null,
      level: levelInfo.level,
      activeDays: Math.round(levelInfo.activeDays),
      title: levelInfo.title,
      vipLabel: profile.vipLabel,
    };

    return [meEntry, ...friendsEntries].sort((a, b) =>
      b.level !== a.level ? b.level - a.level : b.activeDays - a.activeDays
    );
  }, [contacts, profile, levelInfo]);

  const simTier = useMemo(() => getStarTierInfo(simLevel), [simLevel]);
  const simDays = useMemo(() => requiredActiveDaysForLevel(simLevel), [simLevel]);

  if (!open) return null;

  const unclaimedCount = QQ_GROWTH_TASKS.filter(
    (t) => !profile.completedGrowthTaskIds.includes(t.id)
  ).length;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[88vh] rounded-2xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top StarTier Growth Hero Header */}
        <div className="bg-gradient-to-r from-[#2563EB] via-blue-600 to-[#0D9488] p-5 text-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-0.5 rounded-full bg-white/30 shadow-md shrink-0">
                <AvatarView
                  name={profile.name}
                  src={profile.avatar}
                  size="lg"
                  minimalMode={minimalMode}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold truncate">{profile.name}</h3>
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-bold">
                    {profile.vipLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-semibold">
                    {levelInfo.title}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/25 backdrop-blur-sm">
                    <QqLevelIcons level={levelInfo.level} size="md" />
                    <span className="text-xs font-bold font-mono-tabular">
                      LV.{levelInfo.level}
                    </span>
                  </span>
                  <span className="text-xs text-sky-100 font-mono-tabular">
                    累计经验 {levelInfo.totalExp.toLocaleString()} · 活跃 {levelInfo.activeDays} 天 · 连续登录 {profile.continuousLoginDays} 天
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/20 hover:bg-black/35 text-white shrink-0"
              title="关闭等级成长中心"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Real-time Level Progress Strip */}
          <div className="mt-4 rounded-xl bg-black/20 backdrop-blur-sm p-3.5 space-y-2 border border-white/15">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                当前加速 {profile.growthSpeedMultiplier.toFixed(1)}x · 今日已获 +{Math.round(profile.todayGrowthEarned * EXP_PER_ACTIVE_DAY)} 经验（+{profile.todayGrowthEarned.toFixed(1)} 天）
              </span>
              <span className="font-mono-tabular text-amber-200 font-semibold">
                升级进度 {levelInfo.progressPercent}%（{levelInfo.daysIntoCurrentLevel} / {levelInfo.daysNeededForNextLevel} 天）
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-300 via-yellow-300 to-emerald-300 transition-all duration-300"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-sky-100">
              <span>
                距离 <strong className="text-white">LV.{levelInfo.level + 1}</strong> 还需{' '}
                <strong className="text-amber-200 font-mono-tabular">
                  {levelInfo.remainingExpToNextLevel}
                </strong>{' '}
                经验（约 {estimatedCalendarDays} 个自然日）
              </span>
              <span>
                下一阶位：{levelInfo.nextMilestone.iconLabel}（还差{' '}
                <strong className="text-amber-200 font-mono-tabular">
                  {levelInfo.nextMilestone.remainingExp.toLocaleString()}
                </strong>{' '}
                经验）
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0 bg-slate-50/70 dark:bg-slate-900/40">
          {[
            {
              id: 'growth' as const,
              label: `成长加速任务${unclaimedCount > 0 ? ` (${unclaimedCount})` : ''}`,
              icon: TrendingUp,
            },
            { id: 'ranking' as const, label: '好友星阶榜', icon: Trophy },
            { id: 'perks' as const, label: '换算规则与特权', icon: Award },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  active
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {tab === 'growth' && (
            <>
              {/* 8-Tier Illustrated Badge Showcase Card ("我的等级") */}
              <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 bg-gradient-to-b from-[#F4F6FF] via-[#F9FAFF] to-[#EEF0FF] dark:from-slate-900/90 dark:via-slate-900/80 dark:to-indigo-950/40 p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-indigo-100/80 dark:border-indigo-900/40">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-500 flex items-center justify-center">
                      <Trophy className="w-3.5 h-3.5" />
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      我的等级
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-[#2563EB] dark:text-sky-300 text-[11px] font-semibold">
                      {currentTier.tierName} · Lv.{levelInfo.level}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab('perks')}
                    className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-500 hover:text-[#2563EB] transition-colors"
                  >
                    <span>查看全部等级</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 8-Badge Progression Strip */}
                <div className="overflow-x-auto pb-1">
                  <div className="flex items-center justify-between min-w-[640px] gap-0.5 px-1">
                    {LEVEL_TIER_DEFINITIONS.map((tier, idx) => {
                      const isCurrent = currentTier.tierKey === tier.key;
                      const isReached = levelInfo.level >= tier.minLevel;
                      return (
                        <React.Fragment key={tier.key}>
                          <button
                            type="button"
                            onClick={() => {
                              setSimLevel(tier.minLevel);
                              setTab('perks');
                            }}
                            title={`${tier.rangeLabel} ${tier.name}：${tier.perkSummary}`}
                            className={`group flex flex-col items-center text-center px-1.5 py-2 rounded-xl transition-all shrink-0 ${
                              isCurrent
                                ? 'bg-white/95 dark:bg-slate-800/90 ring-2 ring-[#6366F1]/50 shadow-md -translate-y-0.5'
                                : 'hover:bg-white/60 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <div
                              className={`relative flex items-center justify-center ${
                                isReached ? '' : 'opacity-85 group-hover:opacity-100'
                              }`}
                            >
                              {isCurrent && (
                                <span className="absolute inset-0 rounded-full bg-indigo-400/25 blur-md pointer-events-none" />
                              )}
                              <LevelTierBadge
                                tierKey={tier.key}
                                size="lg"
                                active={isCurrent}
                              />
                            </div>
                            <span
                              className={`mt-1.5 text-[11px] font-bold font-mono-tabular leading-tight ${
                                isCurrent
                                  ? 'text-[#2563EB] dark:text-sky-300'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {tier.rangeLabel}
                            </span>
                            <span
                              className={`text-[11px] font-semibold leading-tight mt-0.5 ${
                                isCurrent
                                  ? 'text-[#2563EB] dark:text-sky-300'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {tier.name}
                            </span>
                          </button>
                          {idx < LEVEL_TIER_DEFINITIONS.length - 1 && (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 -mx-0.5" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Soft Lavender Experience Bar Strip */}
                <div className="rounded-xl bg-[#EAE8FF]/85 dark:bg-indigo-950/45 border border-indigo-200/70 dark:border-indigo-900/50 px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400/20 text-amber-500 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      </span>
                      <span>
                        再获得{' '}
                        <strong className="text-[#4F46E5] dark:text-indigo-300 font-mono-tabular">
                          {levelInfo.remainingExpToNextLevel}
                        </strong>{' '}
                        经验，即可升级到{' '}
                        <strong className="font-mono-tabular text-slate-900 dark:text-white">
                          Lv.{levelInfo.level + 1}
                        </strong>
                      </span>
                    </div>
                    <span className="text-[11px] font-mono-tabular font-semibold text-[#4F46E5] dark:text-indigo-300">
                      {levelInfo.progressPercent}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#6D28D9] via-[#7C3AED] to-[#2563EB] transition-all duration-300"
                      style={{ width: `${levelInfo.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Daily Growth Acceleration Tasks */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    今日活跃天加速任务（点击领取立即累计活跃天并触发升级）
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono-tabular">
                    已完成 {profile.completedGrowthTaskIds.length} / {QQ_GROWTH_TASKS.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {QQ_GROWTH_TASKS.map((task) => {
                    const done = profile.completedGrowthTaskIds.includes(task.id);
                    return (
                      <div
                        key={task.id}
                        className={`rounded-xl border p-3.5 flex items-start justify-between gap-3 transition-colors ${
                          done
                            ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/15'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40'
                        }`}
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium">
                              {task.category}
                            </span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {task.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        {done ? (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            已领
                          </span>
                        ) : (
                          <button
                            onClick={() => onClaimTask(task.id)}
                            className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-semibold font-mono-tabular whitespace-nowrap shadow-sm"
                          >
                            {task.badgeText}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {tab === 'ranking' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  好友星阶成长排行榜（按星阶与活跃天数排序）
                </h4>
                <span className="text-[11px] text-slate-500">
                  共 {leaderboard.length} 位成员
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                {leaderboard.map((row, idx) => {
                  const diff = row.level - levelInfo.level;
                  return (
                    <div
                      key={row.id}
                      onClick={() => {
                        if (!row.isMe && row.contact && onSelectContactProfile) {
                          onSelectContactProfile(row.contact);
                          onClose();
                        }
                      }}
                      className={`px-4 py-3 flex items-center justify-between gap-3 ${
                        row.isMe
                          ? 'bg-[#2563EB]/5 dark:bg-[#2563EB]/10'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-full text-xs font-bold font-mono-tabular flex items-center justify-center shrink-0 ${
                            idx === 0
                              ? 'bg-amber-400 text-slate-950'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-900'
                              : idx === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <AvatarView
                          name={row.name}
                          src={row.avatar}
                          size="sm"
                          minimalMode={minimalMode}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {row.name}
                            </span>
                            {row.vipLabel && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 text-[10px] font-semibold">
                                {row.vipLabel}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono-tabular">
                            {row.title} · 累计活跃 {row.activeDays} 天
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-0.5">
                        <div className="flex items-center justify-end gap-2">
                          <QqLevelIcons level={row.level} size="sm" />
                          <span className="text-xs font-bold font-mono-tabular text-slate-800 dark:text-slate-200">
                            LV.{row.level}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono-tabular text-slate-400">
                          {row.isMe
                            ? '当前我的排位'
                            : diff > 0
                            ? `领先你 ${diff} 级`
                            : diff < 0
                            ? `落后你 ${Math.abs(diff)} 级`
                            : '与你同级'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'perks' && (
            <div className="space-y-5">
              {/* Interactive StarTier Calculator */}
              <div className="rounded-2xl border border-[#2563EB]/30 bg-sky-50/60 dark:bg-sky-950/20 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#2563EB]" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      星涟星阶活跃度计算器（原创公式：活跃度 = (L² + 5L) / 2）
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono-tabular text-[#2563EB]">
                    模拟星阶 LV.{simLevel}
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={120}
                  value={simLevel}
                  onChange={(e) => setSimLevel(Number(e.target.value))}
                  className="w-full accent-[#2563EB]"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white dark:bg-[#191c24] p-3 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <LevelTierBadge tierKey={simTier.tierKey} size="lg" active />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        LV.{simLevel} · {getLevelTitle(simLevel)}（{simTier.rangeLabel}）
                      </div>
                      <div className="text-[11px] text-slate-500">
                        当前阶位：{simTier.tierName} ({simTier.tierEnglish}) · 阶内 {simTier.stageStars} 星
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">所需累计经验 / 活跃天</div>
                    <div className="text-base font-bold font-mono-tabular text-amber-600">
                      {(simDays * EXP_PER_ACTIVE_DAY).toLocaleString()} 经验 ({simDays.toLocaleString()} 天)
                    </div>
                  </div>
                </div>
              </div>

              {/* Level Milestone Perks */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  全部 8 阶等级徽章与解锁权益
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {QQ_LEVEL_PERKS.map((perk) => {
                    const unlocked = levelInfo.level >= perk.level;
                    return (
                      <div
                        key={perk.level}
                        className={`rounded-xl border p-3.5 space-y-1.5 ${
                          unlocked
                            ? 'border-amber-300/80 dark:border-amber-700/50 bg-amber-50/40 dark:bg-amber-950/15'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 opacity-85'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                            <LevelTierBadge tierKey={perk.tierKey} size="sm" active={unlocked} />
                            <span>{perk.title}</span>
                            <span className="text-[10px] font-mono-tabular text-slate-500">
                              (LV.{perk.level})
                            </span>
                          </span>
                          {unlocked ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                              <Unlock className="w-3 h-3" />
                              已解锁
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
                              <Lock className="w-3 h-3" />
                              需 {requiredActiveDaysForLevel(perk.level)} 天
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {perk.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
