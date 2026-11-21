import { Contact } from '../types/qq';

export type LevelTierKey =
  | 'initiate'
  | 'explorer'
  | 'active'
  | 'advanced'
  | 'social'
  | 'elite'
  | 'honor'
  | 'legend';

export type StarTierKey = LevelTierKey;

export interface LevelTierDefinition {
  key: LevelTierKey;
  minLevel: number;
  maxLevel: number | null;
  rangeLabel: string;
  name: string;
  englishName: string;
  accentClass: string;
  highlightTextClass: string;
  perkSummary: string;
}

export const EXP_PER_ACTIVE_DAY = 100;

/**
 * 星涟 8 阶炫彩徽章成长体系：
 * Lv.1-5   初识者
 * Lv.6-10  探索者
 * Lv.11-20 活跃者
 * Lv.21-35 进阶达人
 * Lv.36-50 社交达人
 * Lv.51-70 精英玩家
 * Lv.71-100 荣耀大师
 * Lv.101+  传奇用户
 */
export const LEVEL_TIER_DEFINITIONS: LevelTierDefinition[] = [
  {
    key: 'initiate',
    minLevel: 1,
    maxLevel: 5,
    rangeLabel: 'Lv.1–5',
    name: '初识者',
    englishName: 'Initiate',
    accentClass: 'text-sky-600 dark:text-sky-400',
    highlightTextClass: 'text-[#2563EB] dark:text-sky-300',
    perkSummary: '点亮初识者蓝晶圆章，开启星涟全端多端同步与每日成长加速任务。',
  },
  {
    key: 'explorer',
    minLevel: 6,
    maxLevel: 10,
    rangeLabel: 'Lv.6–10',
    name: '探索者',
    englishName: 'Explorer',
    accentClass: 'text-cyan-600 dark:text-cyan-400',
    highlightTextClass: 'text-cyan-600 dark:text-cyan-300',
    perkSummary: '解锁彩色签名标签、快捷卡片预览与基础社交装扮。',
  },
  {
    key: 'active',
    minLevel: 11,
    maxLevel: 20,
    rangeLabel: 'Lv.11–20',
    name: '活跃者',
    englishName: 'Active',
    accentClass: 'text-indigo-600 dark:text-indigo-400',
    highlightTextClass: 'text-indigo-600 dark:text-indigo-300',
    perkSummary: '解锁冰晶棱柱徽章、消息分组归档拓展与灵感频道发帖特权。',
  },
  {
    key: 'advanced',
    minLevel: 21,
    maxLevel: 35,
    rangeLabel: 'Lv.21–35',
    name: '进阶达人',
    englishName: 'Advanced',
    accentClass: 'text-purple-600 dark:text-purple-400',
    highlightTextClass: 'text-purple-600 dark:text-purple-300',
    perkSummary: '支持创建 500 人协作大群、群相册原图存储与共听歌单挂件。',
  },
  {
    key: 'social',
    minLevel: 36,
    maxLevel: 50,
    rangeLabel: 'Lv.36–50',
    name: '社交达人',
    englishName: 'Social Star',
    accentClass: 'text-blue-600 dark:text-blue-400',
    highlightTextClass: 'text-[#2563EB] dark:text-blue-300',
    perkSummary: '解锁皇冠银翼社交徽章、专属名片流光背景与好友互动火花加倍。',
  },
  {
    key: 'elite',
    minLevel: 51,
    maxLevel: 70,
    rangeLabel: 'Lv.51–70',
    name: '精英玩家',
    englishName: 'Elite',
    accentClass: 'text-amber-600 dark:text-amber-400',
    highlightTextClass: 'text-amber-600 dark:text-amber-300',
    perkSummary: '解锁金翼精英盾章、10GB 极速快传优先带宽通道与全屏特效表情。',
  },
  {
    key: 'honor',
    minLevel: 71,
    maxLevel: 100,
    rangeLabel: 'Lv.71–100',
    name: '荣耀大师',
    englishName: 'Honor Master',
    accentClass: 'text-fuchsia-600 dark:text-fuchsia-400',
    highlightTextClass: 'text-fuchsia-600 dark:text-fuchsia-300',
    perkSummary: '解锁紫金双翼荣耀纹章、2000 人超级社群建群资格与专属音效包。',
  },
  {
    key: 'legend',
    minLevel: 101,
    maxLevel: null,
    rangeLabel: 'Lv.101+',
    name: '传奇用户',
    englishName: 'Legend',
    accentClass: 'text-amber-500 dark:text-amber-300',
    highlightTextClass: 'text-amber-600 dark:text-amber-300',
    perkSummary: '解锁至高黄金皇冠飞翼传奇徽章、全局尊享流光资料卡与全特权通行。',
  },
];

export interface StarTierInfo {
  level: number;
  tierKey: LevelTierKey;
  tierName: string;
  tierEnglish: string;
  rangeLabel: string;
  tierSymbol: string;
  stageStars: number;
  accentClass: string;
}

export interface QqLevelProgress {
  level: number;
  activeDays: number;
  totalExp: number;
  currentLevelFloorDays: number;
  nextLevelTargetDays: number;
  daysIntoCurrentLevel: number;
  daysNeededForNextLevel: number;
  remainingDaysToNextLevel: number;
  remainingExpToNextLevel: number;
  progressPercent: number;
  title: string;
  nextMilestone: {
    targetLevel: number;
    tierKey: LevelTierKey;
    iconEmoji: string;
    iconLabel: string;
    remainingDays: number;
    remainingExp: number;
  };
}

export interface QqGrowthTask {
  id: string;
  title: string;
  description: string;
  category: '基础在线' | '社交互动' | '空间动态' | '社群活跃' | '好友羁绊' | '会员加速';
  rewardDays: number;
  badgeText: string;
}

export interface QqLevelPerk {
  level: number;
  tierKey: LevelTierKey;
  badgeEmoji: string;
  badgeLabel: string;
  title: string;
  description: string;
}

export function getStarTierInfo(level: number): StarTierInfo {
  const safeLevel = Math.max(1, Math.floor(level));
  const def =
    LEVEL_TIER_DEFINITIONS.find(
      (t) => safeLevel >= t.minLevel && (t.maxLevel === null || safeLevel <= t.maxLevel)
    ) || LEVEL_TIER_DEFINITIONS[0];

  const span = def.maxLevel !== null ? def.maxLevel - def.minLevel + 1 : 25;
  const offset = safeLevel - def.minLevel;
  const stageStars = Math.min(5, Math.max(1, Math.floor((offset / span) * 5) + 1));

  const symbolMap: Record<LevelTierKey, string> = {
    initiate: '●',
    explorer: '⚡',
    active: '◆',
    advanced: '★',
    social: '♛',
    elite: '✦',
    honor: '❖',
    legend: '♔',
  };

  return {
    level: safeLevel,
    tierKey: def.key,
    tierName: def.name,
    tierEnglish: def.englishName,
    rangeLabel: def.rangeLabel,
    tierSymbol: symbolMap[def.key],
    stageStars,
    accentClass: def.accentClass,
  };
}

export function formatLevelIconsText(level: number): string {
  const info = getStarTierInfo(level);
  return `${info.tierName} · ${info.rangeLabel}`;
}

/**
 * 星涟线性-二次混合活跃度与经验公式：
 * 升至第 L 级所需累计活跃天 = (L^2 + 5L) / 2
 * 1 活跃天 = 100 经验值
 */
export function requiredActiveDaysForLevel(level: number): number {
  const l = Math.max(0, Math.floor(level));
  if (l === 0) return 0;
  return Math.floor((l * l + 5 * l) / 2);
}

export function calculateLevelFromActiveDays(activeDays: number): number {
  const safeDays = Math.max(3, activeDays);
  const raw = Math.floor((-5 + Math.sqrt(25 + 8 * safeDays)) / 2);
  return Math.max(1, raw);
}

export function getLevelTitle(level: number): string {
  return getStarTierInfo(level).tierName;
}

export function getLevelProgress(activeDays: number): QqLevelProgress {
  const safeDays = Number(Math.max(3, activeDays).toFixed(1));
  const level = calculateLevelFromActiveDays(safeDays);
  const currentLevelFloorDays = requiredActiveDaysForLevel(level);
  const nextLevelTargetDays = requiredActiveDaysForLevel(level + 1);
  const daysIntoCurrentLevel = Number(
    Math.max(0, safeDays - currentLevelFloorDays).toFixed(1)
  );
  const daysNeededForNextLevel = Math.max(
    1,
    nextLevelTargetDays - currentLevelFloorDays
  );
  const remainingDaysToNextLevel = Number(
    Math.max(0, nextLevelTargetDays - safeDays).toFixed(1)
  );
  const remainingExpToNextLevel = Math.max(
    10,
    Math.round(remainingDaysToNextLevel * EXP_PER_ACTIVE_DAY)
  );
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((daysIntoCurrentLevel / daysNeededForNextLevel) * 100))
  );

  const nextTierDef =
    LEVEL_TIER_DEFINITIONS.find((t) => t.minLevel > level) ||
    LEVEL_TIER_DEFINITIONS[LEVEL_TIER_DEFINITIONS.length - 1];
  const milestoneTarget =
    level >= 101 ? Math.ceil((level + 1) / 10) * 10 : nextTierDef.minLevel;
  const milestoneDays = requiredActiveDaysForLevel(milestoneTarget);
  const milestoneRemDays = Number(Math.max(0, milestoneDays - safeDays).toFixed(1));

  return {
    level,
    activeDays: safeDays,
    totalExp: Math.round(safeDays * EXP_PER_ACTIVE_DAY),
    currentLevelFloorDays,
    nextLevelTargetDays,
    daysIntoCurrentLevel,
    daysNeededForNextLevel,
    remainingDaysToNextLevel,
    remainingExpToNextLevel,
    progressPercent,
    title: getLevelTitle(level),
    nextMilestone: {
      targetLevel: milestoneTarget,
      tierKey: nextTierDef.key,
      iconEmoji: getStarTierInfo(milestoneTarget).tierSymbol,
      iconLabel:
        level >= 101
          ? `传奇高阶 (Lv.${milestoneTarget})`
          : `${nextTierDef.name} (Lv.${milestoneTarget})`,
      remainingDays: milestoneRemDays,
      remainingExp: Math.round(milestoneRemDays * EXP_PER_ACTIVE_DAY),
    },
  };
}

export function getContactLevelInfo(contact: Contact): {
  level: number;
  activeDays: number;
  title: string;
  iconsText: string;
} {
  const derivedLevel =
    contact.level ??
    12 + (parseInt(contact.qqNumber.slice(-2) || '18', 10) % 58);
  const derivedActiveDays =
    contact.activeDays ?? requiredActiveDaysForLevel(derivedLevel) + 18;
  return {
    level: derivedLevel,
    activeDays: derivedActiveDays,
    title: getLevelTitle(derivedLevel),
    iconsText: formatLevelIconsText(derivedLevel),
  };
}

export const QQ_GROWTH_TASKS: QqGrowthTask[] = [
  {
    id: 'login_dual',
    title: '桌面端 + 移动端双端协同在线',
    description: '桌面端与移动端同时登录保持在线达标，享基础活跃与经验双端加速',
    category: '基础在线',
    rewardDays: 1.2,
    badgeText: '+120 经验',
  },
  {
    id: 'pro_boost',
    title: 'Pro 会员星阶加速通道',
    description: '尊享 2.4x 成长加速通道，每日额外赠送会员成长经验值',
    category: '会员加速',
    rewardDays: 1.6,
    badgeText: '+160 经验',
  },
  {
    id: 'chat_active',
    title: '好友 / 群聊每日活跃互动',
    description: '在任意单聊或群聊发送消息即可自动完成并累计成长经验',
    category: '社交互动',
    rewardDays: 0.5,
    badgeText: '+50 经验',
  },
  {
    id: 'moments_interact',
    title: '星涟空间动态与好友点赞',
    description: '发布动态日志、相册照片或在好友空间点赞/留言互动',
    category: '空间动态',
    rewardDays: 0.5,
    badgeText: '+50 经验',
  },
  {
    id: 'group_checkin',
    title: '群签到 / 频道打卡任务',
    description: '参与一次群内每日签到或在灵感频道发布/回复话题',
    category: '社群活跃',
    rewardDays: 0.4,
    badgeText: '+40 经验',
  },
  {
    id: 'spark_keep',
    title: '点亮好友互动火花',
    description: '与特别关心好友持续保持对话，维系连续互动火花天数',
    category: '好友羁绊',
    rewardDays: 0.4,
    badgeText: '+40 经验',
  },
];

export const QQ_LEVEL_PERKS: QqLevelPerk[] = LEVEL_TIER_DEFINITIONS.slice(1).map((t) => ({
  level: t.minLevel,
  tierKey: t.key,
  badgeEmoji: getStarTierInfo(t.minLevel).tierSymbol,
  badgeLabel: `${t.name} (${t.rangeLabel})`,
  title: `${t.name}专属特权`,
  description: t.perkSummary,
}));
