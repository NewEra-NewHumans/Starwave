import {
  ChatSoundConfig,
  MessageType,
  SoundEffectId,
  SoundMessageCategory,
} from '../types/qq';

export interface SoundLibraryItem {
  id: SoundEffectId;
  name: string;
  category: 'keyboard' | 'retro' | 'chime' | 'fun' | 'mute';
  categoryLabel: string;
  description: string;
  durationMs: number;
  bars: number[];
}

export const SOUND_LIBRARY: SoundLibraryItem[] = [
  {
    id: 'typewriter',
    name: '机械打字机',
    category: 'keyboard',
    categoryLabel: '键盘与点击',
    description: '清脆机械轴敲击声与金属回弹，适合打字与文字发送',
    durationMs: 140,
    bars: [40, 95, 65, 85, 35],
  },
  {
    id: 'crisp_click',
    name: '清脆点击',
    category: 'keyboard',
    categoryLabel: '键盘与点击',
    description: '高瞬态利落轻点音效，简洁不打扰',
    durationMs: 90,
    bars: [30, 100, 45, 25, 15],
  },
  {
    id: 'retro_dial',
    name: '怀旧拨号',
    category: 'retro',
    categoryLabel: '怀旧复古',
    description: '经典双音多频按键拨号音，充满千禧年代通信感',
    durationMs: 280,
    bars: [70, 75, 45, 90, 60],
  },
  {
    id: 'dual_chime',
    name: '清脆双音提示',
    category: 'retro',
    categoryLabel: '清润提示',
    description: '轻快悦耳的清脆双音阶提示音，日常收发清晰柔和',
    durationMs: 220,
    bars: [65, 90, 50, 95, 40],
  },
  {
    id: 'chime',
    name: '水晶风铃',
    category: 'chime',
    categoryLabel: '清脆铃声',
    description: '通透的三连音高泛音风铃声，适合文件与重要通知',
    durationMs: 420,
    bars: [50, 75, 95, 80, 45],
  },
  {
    id: 'bubble_pop',
    name: '水滴气泡',
    category: 'chime',
    categoryLabel: '清脆铃声',
    description: 'Q 弹水润的气泡啵一声，接收新消息更灵动',
    durationMs: 130,
    bars: [35, 85, 100, 55, 20],
  },
  {
    id: 'woodblock',
    name: '清润木鱼',
    category: 'chime',
    categoryLabel: '清脆铃声',
    description: '温润柔和的木质敲击声，久听不刺耳',
    durationMs: 120,
    bars: [55, 90, 60, 30, 15],
  },
  {
    id: 'lofi_warm',
    name: '暖调电钢',
    category: 'chime',
    categoryLabel: '清脆铃声',
    description: '温暖舒缓的 Lo-Fi 双音和弦，夜间聊天更舒适',
    durationMs: 360,
    bars: [60, 75, 70, 65, 50],
  },
  {
    id: 'pixel_coin',
    name: '8-bit 游戏金币',
    category: 'fun',
    categoryLabel: '趣味互动',
    description: '复古像素掌机跳跃拾取音效，适合表情与小游戏',
    durationMs: 240,
    bars: [60, 100, 85, 95, 45],
  },
  {
    id: 'red_packet_joy',
    name: '喜庆金币铃',
    category: 'fun',
    categoryLabel: '趣味互动',
    description: '明亮欢快的四连金铃音，发抢红包专属氛围',
    durationMs: 380,
    bars: [70, 90, 100, 85, 75],
  },
  {
    id: 'silent',
    name: '静音（关闭）',
    category: 'mute',
    categoryLabel: '静音',
    description: '该类消息触发时不播放任何背景音效',
    durationMs: 0,
    bars: [12, 12, 12, 12, 12],
  },
];

export const SOUND_MESSAGE_CATEGORIES: Array<{
  id: SoundMessageCategory;
  label: string;
  desc: string;
  sampleLabel: string;
}> = [
  {
    id: 'text',
    label: '发送文字消息',
    desc: '日常文本与引用回复发出时播放',
    sampleLabel: '发消息',
  },
  {
    id: 'incoming',
    label: '收到新消息',
    desc: '收到好友回复、星澜助手回复或跨端同步消息',
    sampleLabel: '收消息',
  },
  {
    id: 'typing',
    label: '打字敲击背景音',
    desc: '在输入框打字时随每次按键实时响起（需开启打字反馈）',
    sampleLabel: '打字音',
  },
  {
    id: 'voice_media',
    label: '语音 / 图片 / 视频',
    desc: '发送或分享图片、短视频、语音条时播放',
    sampleLabel: '多媒体',
  },
  {
    id: 'file',
    label: '文件与极速快传',
    desc: '发送附件文档或断点续传文件时播放',
    sampleLabel: '传文件',
  },
  {
    id: 'red_packet',
    label: '心意红包与礼物',
    desc: '发出拼手气/口令红包或拆开红包时播放',
    sampleLabel: '红包礼',
  },
  {
    id: 'mention_system',
    label: '群公告 / @我 / 拍一拍',
    desc: '群公告推送、窗口抖动或重要系统提示',
    sampleLabel: '强提醒',
  },
  {
    id: 'game_sticker',
    label: '全屏互动表情 / 骰子猜拳',
    desc: '发送互动大表情、骰子、猜拳或专注自习室',
    sampleLabel: '趣互动',
  },
];

export const SOUND_PRESETS: Array<{
  id: string;
  name: string;
  tag: string;
  config: Partial<ChatSoundConfig>;
}> = [
  {
    id: 'classic_chime',
    name: '星涟清脆默认',
    tag: '推荐',
    config: {
      enabled: true,
      typingFeedbackEnabled: false,
      perMessageType: {
        text: 'dual_chime',
        incoming: 'bubble_pop',
        typing: 'typewriter',
        voice_media: 'crisp_click',
        file: 'chime',
        red_packet: 'red_packet_joy',
        mention_system: 'retro_dial',
        game_sticker: 'pixel_coin',
      },
    },
  },
  {
    id: 'typewriter_office',
    name: '机械打字办公风',
    tag: '沉浸',
    config: {
      enabled: true,
      typingFeedbackEnabled: true,
      perMessageType: {
        text: 'typewriter',
        incoming: 'crisp_click',
        typing: 'typewriter',
        voice_media: 'crisp_click',
        file: 'woodblock',
        red_packet: 'red_packet_joy',
        mention_system: 'chime',
        game_sticker: 'crisp_click',
      },
    },
  },
  {
    id: 'retro_dial_pack',
    name: '千禧拨号复古风',
    tag: '复古',
    config: {
      enabled: true,
      typingFeedbackEnabled: true,
      perMessageType: {
        text: 'retro_dial',
        incoming: 'dual_chime',
        typing: 'crisp_click',
        voice_media: 'pixel_coin',
        file: 'retro_dial',
        red_packet: 'pixel_coin',
        mention_system: 'retro_dial',
        game_sticker: 'pixel_coin',
      },
    },
  },
  {
    id: 'calm_soft',
    name: '深夜轻柔低噪',
    tag: '护耳',
    config: {
      enabled: true,
      typingFeedbackEnabled: false,
      perMessageType: {
        text: 'woodblock',
        incoming: 'lofi_warm',
        typing: 'silent',
        voice_media: 'woodblock',
        file: 'lofi_warm',
        red_packet: 'chime',
        mention_system: 'lofi_warm',
        game_sticker: 'bubble_pop',
      },
    },
  },
];

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new Ctx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function resolveMessageSoundCategory(
  msgType: MessageType,
  isIncoming = false
): SoundMessageCategory {
  if (isIncoming) return 'incoming';
  switch (msgType) {
    case 'voice':
    case 'image':
    case 'video':
      return 'voice_media';
    case 'file':
      return 'file';
    case 'red_packet':
      return 'red_packet';
    case 'announcement':
    case 'system':
    case 'call_log':
      return 'mention_system';
    case 'sticker':
    case 'game_dice':
    case 'game_rps':
    case 'pomodoro':
      return 'game_sticker';
    default:
      return 'text';
  }
}

export function playSoundEffect(
  kind: SoundEffectId | 'call' | 'nudge' | 'mute',
  volumePercent = 80
): void {
  if (kind === 'silent' || kind === 'mute' || volumePercent <= 0) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const volScale = Math.max(0.02, Math.min(1.5, volumePercent / 100));

    const tone = (
      freq: number,
      startOffset: number,
      duration: number,
      type: OscillatorType = 'sine',
      baseGain = 0.08,
      endFreq?: number
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + startOffset);
      if (endFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(20, endFreq),
          now + startOffset + duration
        );
      }
      const peak = Math.max(0.002, baseGain * volScale);
      gain.gain.setValueAtTime(0.0005, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(peak, now + startOffset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.01);
    };

    const noiseBurst = (
      startOffset: number,
      duration: number,
      filterFreq: number,
      qValue: number,
      baseGain = 0.14
    ) => {
      const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.35));
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(filterFreq, now + startOffset);
      filter.Q.setValueAtTime(qValue, now + startOffset);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(baseGain * volScale, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now + startOffset);
    };

    switch (kind) {
      case 'dual_chime':
        tone(880, 0, 0.08, 'triangle', 0.09);
        tone(1046.5, 0.09, 0.11, 'triangle', 0.09);
        break;
      case 'typewriter':
        // Mechanical key down strike + crisp carriage spring resonance
        noiseBurst(0, 0.045, 2200, 1.8, 0.18);
        tone(320, 0, 0.03, 'square', 0.04, 140);
        noiseBurst(0.055, 0.04, 3400, 2.4, 0.11);
        tone(1480, 0.06, 0.045, 'triangle', 0.025);
        break;
      case 'crisp_click':
        noiseBurst(0, 0.028, 3600, 3.0, 0.14);
        tone(1250, 0, 0.032, 'sine', 0.08, 620);
        break;
      case 'retro_dial': {
        // Classic DTMF dual-tone digits ("5" + "8")
        const dtmf = (f1: number, f2: number, offset: number, dur: number) => {
          tone(f1, offset, dur, 'sine', 0.055);
          tone(f2, offset, dur, 'sine', 0.055);
        };
        dtmf(770, 1336, 0, 0.09);
        dtmf(852, 1336, 0.12, 0.11);
        break;
      }
      case 'chime':
        tone(587.33, 0, 0.18, 'sine', 0.075);
        tone(880, 0.1, 0.24, 'sine', 0.065);
        tone(1174.66, 0.2, 0.32, 'sine', 0.055);
        break;
      case 'bubble_pop':
        tone(420, 0, 0.09, 'sine', 0.1, 1180);
        break;
      case 'woodblock':
        tone(680, 0, 0.065, 'sine', 0.11, 520);
        break;
      case 'lofi_warm':
        tone(440, 0, 0.22, 'sine', 0.06);
        tone(554.37, 0.14, 0.28, 'triangle', 0.045);
        break;
      case 'pixel_coin':
        tone(987.77, 0, 0.07, 'square', 0.045);
        tone(1318.51, 0.07, 0.16, 'square', 0.045);
        break;
      case 'red_packet_joy':
        tone(783.99, 0, 0.09, 'triangle', 0.08);
        tone(987.77, 0.08, 0.09, 'triangle', 0.08);
        tone(1174.66, 0.16, 0.1, 'triangle', 0.08);
        tone(1567.98, 0.24, 0.2, 'sine', 0.09);
        break;
      case 'call':
        tone(523.25, 0, 0.22, 'sine', 0.07);
        tone(659.25, 0.24, 0.22, 'sine', 0.07);
        tone(783.99, 0.48, 0.35, 'sine', 0.07);
        break;
      case 'nudge':
        tone(340, 0, 0.06, 'sawtooth', 0.05);
        tone(480, 0.07, 0.06, 'sawtooth', 0.05);
        tone(340, 0.14, 0.08, 'sawtooth', 0.05);
        break;
    }
  } catch {
    // Ignore browser autoplay restrictions
  }
}
