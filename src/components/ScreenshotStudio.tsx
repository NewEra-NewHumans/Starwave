import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Brush,
  Check,
  Circle,
  ClipboardCopy,
  Compass,
  Crop,
  Download,
  Eraser,
  FileText,
  FlipHorizontal2,
  Focus,
  Hash,
  Highlighter,
  Image as ImageIcon,
  MessageSquare,
  MessageSquarePlus,
  Monitor,
  PenTool,
  Pin,
  Redo2,
  RotateCcw,
  RotateCw,
  ScanText,
  Send,
  Sparkles,
  Square,
  Sticker,
  Type as TypeIcon,
  Undo2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { apiUrl } from '../utils/serverEndpoint';
import { ChatMessage } from '../types/qq';
import { GENERATED_ASSETS } from '../data/seedData';

export type ScreenshotTool =
  | 'crop'
  | 'mosaic'
  | 'rect'
  | 'ellipse'
  | 'arrow'
  | 'pen'
  | 'highlighter'
  | 'spotlight'
  | 'callout'
  | 'text'
  | 'step'
  | 'stamp';

export type DoodleBackdropStyle = 'white' | 'grid' | 'dark' | 'aurora';

export interface PinnedScreenshotItem {
  id: string;
  dataUrl: string;
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

interface ScreenshotStudioModalProps {
  open: boolean;
  initialMode?: 'capture' | 'doodle';
  onClose: () => void;
  onSendToChat: (dataUrl: string) => void;
  onSendTextToChat?: (text: string) => void;
  onPinToScreen?: (dataUrl: string) => void;
  onShareToQzone?: (dataUrl: string, caption: string) => void;
  activeConvTitle?: string;
  activeMessages?: ChatMessage[];
  onToast?: (msg: string) => void;
}

const COLOR_SWATCHES = [
  { hex: '#ef4444', label: '经典红' },
  { hex: '#2563EB', label: '星涟蓝' },
  { hex: '#10b981', label: '翡翠绿' },
  { hex: '#f59e0b', label: '琥珀黄' },
  { hex: '#0f172a', label: '墨黑' },
  { hex: '#ffffff', label: '纯白' },
];

const STROKE_TIERS = [
  { id: 1, label: '细', lineW: 2.5, mosaicBlock: 8, fontSize: 16, stepR: 12 },
  { id: 2, label: '中', lineW: 4.5, mosaicBlock: 14, fontSize: 22, stepR: 15 },
  { id: 3, label: '粗', lineW: 8, mosaicBlock: 22, fontSize: 28, stepR: 19 },
];

function wrapCanvasLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];
  for (const para of paragraphs) {
    if (!para) {
      lines.push('');
      continue;
    }
    let current = '';
    for (const ch of para) {
      const test = current + ch;
      if (ctx.measureText(test).width > maxWidth && current.length > 0) {
        lines.push(current);
        current = ch;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }
  return lines.slice(0, 6);
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

const DOODLE_STAMPS = ['👍', '❤️', '🔥', '💡', '✨', '✅', '❗', '🎯'];

const DOODLE_BACKDROPS: Array<{ id: DoodleBackdropStyle; label: string }> = [
  { id: 'grid', label: '方格手账' },
  { id: 'white', label: '纯白画纸' },
  { id: 'dark', label: '深夜黑板' },
  { id: 'aurora', label: '星涟信笺' },
];

export const ScreenshotStudioModal: React.FC<ScreenshotStudioModalProps> = ({
  open,
  initialMode = 'capture',
  onClose,
  onSendToChat,
  onSendTextToChat,
  onPinToScreen,
  onShareToQzone,
  activeConvTitle = '星涟会话',
  activeMessages = [],
  onToast,
}) => {
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [tool, setTool] = useState<ScreenshotTool>('mosaic');
  const [color, setColor] = useState('#ef4444');
  const [strokeTierIdx, setStrokeTierIdx] = useState(1);
  const [canvasDims, setCanvasDims] = useState({ width: 760, height: 480 });
  const [notice, setNotice] = useState('');
  const [sourceMode, setSourceMode] = useState<'chat' | 'doodle' | 'demo' | 'screen' | 'custom'>('chat');
  const [doodleBackdrop, setDoodleBackdrop] = useState<DoodleBackdropStyle>('grid');
  const [selectedStamp, setSelectedStamp] = useState('👍');
  const [anonymizeChat, setAnonymizeChat] = useState(false);
  const [capturingScreen, setCapturingScreen] = useState(false);

  // Drawing & Crop state
  const [drawing, setDrawing] = useState(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const penPointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const mosaicVisitedRef = useRef<Set<string>>(new Set());
  const [cropRect, setCropRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  // Step counter & Inline text/callout annotation
  const [stepCounter, setStepCounter] = useState(1);
  const [textOverlay, setTextOverlay] = useState<{
    mode: 'text' | 'callout';
    canvasX: number;
    canvasY: number;
    leftPct: number;
    topPct: number;
  } | null>(null);
  const [textDraft, setTextDraft] = useState('');

  // Undo / Redo History
  const historyRef = useRef<ImageData[]>([]);
  const historyIdxRef = useRef<number>(-1);
  const baseImageRef = useRef<ImageData | null>(null);
  const [historyMeta, setHistoryMeta] = useState({ canUndo: false, canRedo: false });

  // AI OCR Result
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const currentTier = STROKE_TIERS[strokeTierIdx] || STROKE_TIERS[1];

  const syncHistoryMeta = useCallback(() => {
    setHistoryMeta({
      canUndo: historyIdxRef.current > 0,
      canRedo: historyIdxRef.current < historyRef.current.length - 1,
    });
  }, []);

  const pushHistory = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const trimmed = historyRef.current.slice(0, historyIdxRef.current + 1);
    trimmed.push(snap);
    if (trimmed.length > 25) {
      trimmed.shift();
    }
    historyRef.current = trimmed;
    historyIdxRef.current = trimmed.length - 1;
    syncHistoryMeta();
  }, [syncHistoryMeta]);

  const resetHistoryWithCurrentCanvas = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    baseImageRef.current = snap;
    historyRef.current = [snap];
    historyIdxRef.current = 0;
    setCropRect(null);
    setStepCounter(1);
    setTextOverlay(null);
    setOcrResult(null);
    setOcrError(null);
    syncHistoryMeta();
  }, [syncHistoryMeta]);

  const applyCanvasSize = useCallback((w: number, h: number) => {
    const main = mainCanvasRef.current;
    const prev = previewCanvasRef.current;
    if (main) {
      main.width = w;
      main.height = h;
    }
    if (prev) {
      prev.width = w;
      prev.height = h;
    }
    setCanvasDims({ width: w, height: h });
  }, []);

  const restoreSnapshot = useCallback(
    (snap: ImageData) => {
      applyCanvasSize(snap.width, snap.height);
      const main = mainCanvasRef.current;
      const prev = previewCanvasRef.current;
      if (!main) return;
      const ctx = main.getContext('2d');
      if (!ctx) return;
      ctx.putImageData(snap, 0, 0);
      if (prev) {
        const pctx = prev.getContext('2d');
        pctx?.clearRect(0, 0, prev.width, prev.height);
      }
      setCropRect(null);
    },
    [applyCanvasSize]
  );

  const handleUndo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current -= 1;
    restoreSnapshot(historyRef.current[historyIdxRef.current]);
    syncHistoryMeta();
    setNotice('已撤销上一步');
  }, [restoreSnapshot, syncHistoryMeta]);

  const handleRedo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current += 1;
    restoreSnapshot(historyRef.current[historyIdxRef.current]);
    syncHistoryMeta();
    setNotice('已重做操作');
  }, [restoreSnapshot, syncHistoryMeta]);

  const handleResetToBase = () => {
    if (!baseImageRef.current) return;
    restoreSnapshot(baseImageRef.current);
    historyRef.current = [baseImageRef.current];
    historyIdxRef.current = 0;
    setStepCounter(1);
    syncHistoryMeta();
    setNotice('已还原为原始底图');
  };

  // Load image source onto canvas
  const loadImageOntoCanvas = useCallback(
    (img: HTMLImageElement, labelNotice?: string) => {
      const maxW = 860;
      const maxH = 540;
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
      const targetW = Math.max(320, Math.round(img.width * ratio));
      const targetH = Math.max(220, Math.round(img.height * ratio));
      applyCanvasSize(targetW, targetH);
      const main = mainCanvasRef.current;
      const ctx = main?.getContext('2d');
      if (!main || !ctx) return;
      ctx.clearRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);
      resetHistoryWithCurrentCanvas();
      if (labelNotice) setNotice(labelNotice);
    },
    [applyCanvasSize, resetHistoryWithCurrentCanvas]
  );

  // Render current chat log onto canvas (QQ-style long/privacy chat capture)
  const renderChatSnapshot = useCallback(
    (anonymize: boolean) => {
      const msgs = activeMessages
        .filter((m) => m.type !== 'system' && !m.recalled && !m.burned)
        .slice(-7);

      const width = 760;
      const ctxMeasure = document.createElement('canvas').getContext('2d')!;
      ctxMeasure.font = '14px "Plus Jakarta Sans", "Noto Sans SC", sans-serif';

      const prepared = msgs.map((m, idx) => {
        const isMe = m.senderId === 'me';
        const displayName = anonymize
          ? isMe
            ? '我（已脱敏）'
            : `星涟好友 ${String.fromCharCode(65 + (idx % 6))}`
          : m.senderName;
        const bodyText =
          m.content ||
          (m.type === 'image'
            ? '[图片]'
            : m.type === 'file'
            ? `[文件] ${m.file?.name || ''}`
            : `[${m.type}]`);
        const lines = wrapCanvasLines(ctxMeasure, bodyText, 410);
        const bubbleW = Math.min(
          450,
          Math.max(
            96,
            Math.max(...lines.map((l) => ctxMeasure.measureText(l).width)) + 32
          )
        );
        const bubbleH = lines.length * 21 + 20;
        return { msg: m, isMe, displayName, lines, bubbleW, bubbleH };
      });

      const contentHeight =
        prepared.length === 0
          ? 240
          : prepared.reduce((sum, item) => sum + item.bubbleH + 38, 24);
      const height = Math.max(420, Math.min(760, 74 + contentHeight + 38));

      applyCanvasSize(width, height);
      const canvas = mainCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      // Background
      ctx.fillStyle = '#f3f6fb';
      ctx.fillRect(0, 0, width, height);

      // Header bar
      const headerGrad = ctx.createLinearGradient(0, 0, width, 0);
      headerGrad.addColorStop(0, '#0b1222');
      headerGrad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = headerGrad;
      ctx.fillRect(0, 0, width, 58);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Plus Jakarta Sans", "Noto Sans SC", sans-serif';
      ctx.fillText(
        anonymize ? '星涟会话隐私长截图（昵称已脱敏）' : `${activeConvTitle} · 聊天截图`,
        24,
        35
      );
      ctx.fillStyle = 'rgba(186, 230, 253, 0.85)';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText(
        `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${prepared.length} 条记录`,
        width - 175,
        34
      );

      let yCursor = 80;
      if (prepared.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = '14px "Plus Jakarta Sans", "Noto Sans SC", sans-serif';
        ctx.fillText('当前会话暂无消息记录，可使用顶部「屏幕抓屏」或「导入图片」截图。', 140, 220);
      } else {
        const aliasColors = ['#2563EB', '#0D9488', '#7C3AED', '#EA580C', '#DB2777'];
        prepared.forEach((item, idx) => {
          if (yCursor + item.bubbleH > height - 42) return;
          const avatarX = item.isMe ? width - 56 : 24;
          const avatarColor = item.isMe
            ? '#2563EB'
            : aliasColors[idx % aliasColors.length];

          // Avatar circle
          ctx.fillStyle = avatarColor;
          ctx.beginPath();
          ctx.arc(avatarX + 16, yCursor + 16, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(item.displayName.slice(0, 1), avatarX + 10, yCursor + 21);

          // Sender + timestamp
          ctx.fillStyle = '#64748b';
          ctx.font = '11px "Plus Jakarta Sans", "Noto Sans SC", sans-serif';
          const metaLabel = `${item.displayName}  ${item.msg.timestamp}`;
          if (item.isMe) {
            const mw = ctx.measureText(metaLabel).width;
            ctx.fillText(metaLabel, width - 68 - mw, yCursor + 11);
          } else {
            ctx.fillText(metaLabel, 68, yCursor + 11);
          }

          // Bubble
          const bx = item.isMe ? width - 68 - item.bubbleW : 68;
          const by = yCursor + 18;
          if (item.isMe) {
            const bGrad = ctx.createLinearGradient(bx, by, bx + item.bubbleW, by + item.bubbleH);
            bGrad.addColorStop(0, '#2563EB');
            bGrad.addColorStop(1, '#1D4ED8');
            ctx.fillStyle = bGrad;
          } else {
            ctx.fillStyle = '#ffffff';
          }
          drawRoundedRectPath(ctx, bx, by, item.bubbleW, item.bubbleH, 14);
          ctx.fill();
          if (!item.isMe) {
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // Bubble text
          ctx.fillStyle = item.isMe ? '#ffffff' : '#0f172a';
          ctx.font = '14px "Plus Jakarta Sans", "Noto Sans SC", sans-serif';
          item.lines.forEach((ln, lIdx) => {
            ctx.fillText(ln, bx + 16, by + 24 + lIdx * 21);
          });

          yCursor += item.bubbleH + 34;
        });
      }

      // Footer bar
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, height - 30, width, 30);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px "Plus Jakarta Sans", "Noto Sans SC", sans-serif';
      ctx.fillText('星涟 StarRipple 截图工作台 · 支持框选裁剪 / 马赛克 / 钉在桌面 / AI 识图', 20, height - 11);

      resetHistoryWithCurrentCanvas();
    },
    [activeConvTitle, activeMessages, applyCanvasSize, resetHistoryWithCurrentCanvas]
  );

  const renderDoodleCanvas = useCallback(
    (style: DoodleBackdropStyle) => {
      const width = 760;
      const height = 460;
      applyCanvasSize(width, height);
      const canvas = mainCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      if (style === 'white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      } else if (style === 'grid') {
        ctx.fillStyle = '#fbfcfe';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let x = 24; x < width; x += 24) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 24; y < height; y += 24) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      } else if (style === 'dark') {
        const bg = ctx.createLinearGradient(0, 0, width, height);
        bg.addColorStop(0, '#0f172a');
        bg.addColorStop(1, '#1e293b');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);
      } else {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#eff6ff');
        grad.addColorStop(0.55, '#f5f3ff');
        grad.addColorStop(1, '#ecfeff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.fillStyle = style === 'dark' ? 'rgba(148,163,184,0.45)' : 'rgba(100,116,139,0.45)';
      ctx.font = '11px "Plus Jakarta Sans", "Noto Sans SC", sans-serif';
      ctx.fillText('星涟快捷涂鸦板 · 支持自由画笔 / 气泡批注 / 序号贴纸', 16, height - 12);

      resetHistoryWithCurrentCanvas();
      setNotice('已准备快捷涂鸦画板，可直接绘制或添加气泡贴纸');
    },
    [applyCanvasSize, resetHistoryWithCurrentCanvas]
  );

  const loadDemoPhoto = useCallback(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadImageOntoCanvas(img, '已载入示例风景底图');
    };
    img.src = GENERATED_ASSETS.travelPhoto;
  }, [loadImageOntoCanvas]);

  // Initial load on modal open
  useEffect(() => {
    if (!open) return;
    if (initialMode === 'doodle') {
      setSourceMode('doodle');
      setTool('pen');
      setColor(doodleBackdrop === 'dark' ? '#38bdf8' : '#2563EB');
      renderDoodleCanvas(doodleBackdrop);
    } else if (activeMessages.length > 0) {
      setSourceMode('chat');
      setTool('mosaic');
      renderChatSnapshot(anonymizeChat);
    } else {
      setSourceMode('demo');
      setTool('mosaic');
      loadDemoPhoto();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialMode]);

  // Global Paste (Ctrl+V) + Undo/Redo/Enter keyboard shortcuts while open
  useEffect(() => {
    if (!open) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          if (!blob) continue;
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            setSourceMode('custom');
            loadImageOntoCanvas(img, '已从剪贴板粘贴截图');
            URL.revokeObjectURL(url);
          };
          img.src = url;
          e.preventDefault();
          break;
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (textOverlay) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        if (cropRect) setCropRect(null);
      }
    };

    window.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, textOverlay, cropRect, handleUndo, handleRedo, loadImageOntoCanvas]);

  if (!open) return null;

  // Real Browser Display Capture (getDisplayMedia)
  const handleDisplayCapture = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setNotice('当前浏览器环境不支持实时抓屏，可直接按 Ctrl+V 粘贴系统截图');
      return;
    }
    setCapturingScreen(true);
    setNotice('请在浏览器弹窗中选择需要截取的窗口、标签页或屏幕...');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: false,
      });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

      const vw = video.videoWidth || 1280;
      const vh = video.videoHeight || 720;
      const maxW = 900;
      const maxH = 560;
      const scale = Math.min(maxW / vw, maxH / vh, 1);
      const cw = Math.round(vw * scale);
      const ch = Math.round(vh * scale);

      applyCanvasSize(cw, ch);
      const main = mainCanvasRef.current;
      const ctx = main?.getContext('2d');
      if (main && ctx) {
        ctx.drawImage(video, 0, 0, cw, ch);
        setSourceMode('screen');
        resetHistoryWithCurrentCanvas();
        setTool('crop');
        setNotice('已抓取实时屏幕画面！可直接使用「框选裁剪」截取局部区域');
      }
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setNotice('已取消抓屏或权限受限（也可直接 Ctrl+V 粘贴截图）');
    } finally {
      setCapturingScreen(false);
    }
  };

  const handleUploadCustom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setSourceMode('custom');
      loadImageOntoCanvas(img, `已导入图片：${file.name}`);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = mainCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(canvas.width, ((e.clientX - rect.left) / rect.width) * canvas.width)),
      y: Math.max(0, Math.min(canvas.height, ((e.clientY - rect.top) / rect.height) * canvas.height)),
      leftPct: ((e.clientX - rect.left) / rect.width) * 100,
      topPct: ((e.clientY - rect.top) / rect.height) * 100,
    };
  };

  const applyMosaicAt = (cx: number, cy: number) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const blockSize = currentTier.mosaicBlock;
    const brushRadius = blockSize * 1.6;
    const startX = Math.max(0, Math.floor((cx - brushRadius) / blockSize) * blockSize);
    const startY = Math.max(0, Math.floor((cy - brushRadius) / blockSize) * blockSize);
    const endX = Math.min(canvas.width, cx + brushRadius);
    const endY = Math.min(canvas.height, cy + brushRadius);

    for (let x = startX; x < endX; x += blockSize) {
      for (let y = startY; y < endY; y += blockSize) {
        const key = `${x},${y}`;
        if (mosaicVisitedRef.current.has(key)) continue;
        mosaicVisitedRef.current.add(key);

        const sampleX = Math.min(canvas.width - 1, x + Math.floor(blockSize / 2));
        const sampleY = Math.min(canvas.height - 1, y + Math.floor(blockSize / 2));
        const pixel = ctx.getImageData(sampleX, sampleY, 1, 1).data;
        ctx.fillStyle = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
        ctx.fillRect(x, y, blockSize, blockSize);
      }
    }
  };

  const drawArrowOnCtx = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeColor: string,
    lineW: number
  ) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = Math.max(12, lineW * 3.4);
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = lineW;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - Math.cos(angle) * headLen * 0.65, y2 - Math.sin(angle) * headLen * 0.65);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLen * Math.cos(angle - Math.PI / 6),
      y2 - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - headLen * Math.cos(angle + Math.PI / 6),
      y2 - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawCropOverlayOnPreview = (
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    const prev = previewCanvasRef.current;
    if (!prev) return;
    const pctx = prev.getContext('2d');
    if (!pctx) return;
    pctx.clearRect(0, 0, prev.width, prev.height);

    // Dim exterior
    pctx.fillStyle = 'rgba(2, 6, 23, 0.52)';
    pctx.fillRect(0, 0, prev.width, prev.height);
    pctx.clearRect(x, y, w, h);

    // Border & corner grips
    pctx.strokeStyle = '#38bdf8';
    pctx.lineWidth = 2;
    pctx.setLineDash([6, 4]);
    pctx.strokeRect(x, y, w, h);
    pctx.setLineDash([]);

    // Dimension readout pill
    const label = `${Math.round(w)} × ${Math.round(h)}`;
    pctx.font = '600 11px "JetBrains Mono", monospace';
    const tw = pctx.measureText(label).width + 14;
    const pillY = y >= 26 ? y - 24 : y + 6;
    pctx.fillStyle = '#0f172a';
    drawRoundedRectPath(pctx, x, pillY, tw, 20, 6);
    pctx.fill();
    pctx.fillStyle = '#f8fafc';
    pctx.fillText(label, x + 7, pillY + 14);
  };

  const clearPreview = () => {
    const prev = previewCanvasRef.current;
    if (!prev) return;
    prev.getContext('2d')?.clearRect(0, 0, prev.width, prev.height);
  };

  const commitTextAnnotation = () => {
    if (!textOverlay || !textDraft.trim()) {
      setTextOverlay(null);
      setTextDraft('');
      return;
    }
    const canvas = mainCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const content = textDraft.trim();
      ctx.save();
      if (textOverlay.mode === 'callout') {
        const fontSize = Math.max(13, currentTier.fontSize - 4);
        ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", "Noto Sans SC", sans-serif`;
        const padX = 14;
        const boxW = Math.min(280, Math.max(88, ctx.measureText(content).width + padX * 2));
        const boxH = fontSize + 18;
        const bx = Math.min(canvas.width - boxW - 12, Math.max(12, textOverlay.canvasX - boxW / 2));
        const by = Math.max(12, textOverlay.canvasY - boxH - 12);
        const fillHex = color === '#ffffff' ? '#0f172a' : color;
        ctx.fillStyle = fillHex;
        drawRoundedRectPath(ctx, bx, by, boxW, boxH, 10);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(bx + boxW / 2 - 7, by + boxH);
        ctx.lineTo(bx + boxW / 2 + 7, by + boxH);
        ctx.lineTo(bx + boxW / 2, by + boxH + 9);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText(content, bx + padX, by + boxH / 2 + 1, boxW - padX * 2);
      } else {
        ctx.font = `bold ${currentTier.fontSize}px "Plus Jakarta Sans", "Noto Sans SC", sans-serif`;
        ctx.lineWidth = 3;
        ctx.strokeStyle = color === '#ffffff' ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.88)';
        ctx.strokeText(content, textOverlay.canvasX, textOverlay.canvasY);
        ctx.fillStyle = color;
        ctx.fillText(content, textOverlay.canvasX, textOverlay.canvasY);
      }
      ctx.restore();
      pushHistory();
      setNotice(textOverlay.mode === 'callout' ? '已添加涂鸦气泡批注' : '已添加文字批注');
    }
    setTextOverlay(null);
    setTextDraft('');
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const pos = getCoords(e);

    if (tool === 'text' || tool === 'callout') {
      setTextOverlay({
        mode: tool,
        canvasX: pos.x,
        canvasY: pos.y,
        leftPct: Math.min(82, Math.max(4, pos.leftPct)),
        topPct: Math.min(88, Math.max(4, pos.topPct)),
      });
      setTextDraft('');
      return;
    }

    if (tool === 'stamp') {
      const main = mainCanvasRef.current;
      const ctx = main?.getContext('2d');
      if (main && ctx) {
        const size = currentTier.fontSize + 14;
        ctx.save();
        ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(selectedStamp, pos.x, pos.y);
        ctx.restore();
        pushHistory();
        setNotice(`已盖章涂鸦贴纸 ${selectedStamp}`);
      }
      return;
    }

    if (tool === 'step') {
      const main = mainCanvasRef.current;
      const ctx = main?.getContext('2d');
      if (main && ctx) {
        const r = currentTier.stepR;
        ctx.save();
        ctx.fillStyle = color === '#ffffff' ? '#2563EB' : color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(r * 1.05)}px "JetBrains Mono", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(stepCounter), pos.x, pos.y + 0.5);
        ctx.restore();

        setStepCounter((c) => c + 1);
        pushHistory();
      }
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    setDrawing(true);
    startPosRef.current = { x: pos.x, y: pos.y };

    if (tool === 'crop') {
      setCropRect(null);
      clearPreview();
    } else if (tool === 'mosaic') {
      mosaicVisitedRef.current.clear();
      applyMosaicAt(pos.x, pos.y);
    } else if (tool === 'pen') {
      const ctx = mainCanvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = currentTier.lineW;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    } else if (tool === 'highlighter') {
      penPointsRef.current = [{ x: pos.x, y: pos.y }];
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !startPosRef.current) return;
    const pos = getCoords(e);
    const start = startPosRef.current;

    if (tool === 'mosaic') {
      applyMosaicAt(pos.x, pos.y);
      return;
    }

    if (tool === 'pen') {
      const ctx = mainCanvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
      return;
    }

    const prev = previewCanvasRef.current;
    const pctx = prev?.getContext('2d');
    if (!prev || !pctx) return;

    if (tool === 'crop') {
      const rx = Math.min(start.x, pos.x);
      const ry = Math.min(start.y, pos.y);
      const rw = Math.abs(pos.x - start.x);
      const rh = Math.abs(pos.y - start.y);
      if (rw >= 4 && rh >= 4) {
        drawCropOverlayOnPreview(rx, ry, rw, rh);
      }
      return;
    }

    pctx.clearRect(0, 0, prev.width, prev.height);
    if (tool === 'spotlight') {
      const rx = Math.min(start.x, pos.x);
      const ry = Math.min(start.y, pos.y);
      const rw = Math.abs(pos.x - start.x);
      const rh = Math.abs(pos.y - start.y);
      pctx.fillStyle = 'rgba(2, 6, 23, 0.56)';
      pctx.fillRect(0, 0, prev.width, prev.height);
      pctx.clearRect(rx, ry, rw, rh);
      pctx.strokeStyle = '#facc15';
      pctx.lineWidth = 2.5;
      pctx.strokeRect(rx, ry, rw, rh);
    } else if (tool === 'rect') {
      pctx.strokeStyle = color;
      pctx.lineWidth = currentTier.lineW;
      pctx.strokeRect(start.x, start.y, pos.x - start.x, pos.y - start.y);
    } else if (tool === 'ellipse') {
      const cx = (start.x + pos.x) / 2;
      const cy = (start.y + pos.y) / 2;
      const rx = Math.abs(pos.x - start.x) / 2;
      const ry = Math.abs(pos.y - start.y) / 2;
      pctx.beginPath();
      pctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
      pctx.strokeStyle = color;
      pctx.lineWidth = currentTier.lineW;
      pctx.stroke();
    } else if (tool === 'arrow') {
      drawArrowOnCtx(pctx, start.x, start.y, pos.x, pos.y, color, currentTier.lineW);
    } else if (tool === 'highlighter') {
      penPointsRef.current.push({ x: pos.x, y: pos.y });
      const pts = penPointsRef.current;
      if (pts.length >= 2) {
        pctx.save();
        pctx.globalAlpha = 0.36;
        pctx.strokeStyle = color === '#ffffff' || color === '#0f172a' ? '#facc15' : color;
        pctx.lineWidth = currentTier.lineW * 3.8;
        pctx.lineCap = 'round';
        pctx.lineJoin = 'round';
        pctx.beginPath();
        pctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          pctx.lineTo(pts[i].x, pts[i].y);
        }
        pctx.stroke();
        pctx.restore();
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !startPosRef.current) return;
    setDrawing(false);
    const pos = getCoords(e);
    const start = startPosRef.current;
    startPosRef.current = null;

    const main = mainCanvasRef.current;
    const ctx = main?.getContext('2d');
    if (!main || !ctx) return;

    if (tool === 'crop') {
      const rx = Math.round(Math.min(start.x, pos.x));
      const ry = Math.round(Math.min(start.y, pos.y));
      const rw = Math.round(Math.abs(pos.x - start.x));
      const rh = Math.round(Math.abs(pos.y - start.y));
      if (rw >= 24 && rh >= 24) {
        setCropRect({ x: rx, y: ry, w: rw, h: rh });
        drawCropOverlayOnPreview(rx, ry, rw, rh);
        setNotice(`已框选 ${rw}×${rh} 区域，点击工具栏「确认裁剪」即可裁切`);
      } else {
        setCropRect(null);
        clearPreview();
      }
      return;
    }

    clearPreview();

    if (tool === 'pen') {
      ctx.restore();
      pushHistory();
    } else if (tool === 'mosaic') {
      mosaicVisitedRef.current.clear();
      pushHistory();
    } else if (tool === 'spotlight') {
      const rx = Math.round(Math.min(start.x, pos.x));
      const ry = Math.round(Math.min(start.y, pos.y));
      const rw = Math.round(Math.abs(pos.x - start.x));
      const rh = Math.round(Math.abs(pos.y - start.y));
      if (rw > 12 && rh > 12) {
        ctx.save();
        ctx.fillStyle = 'rgba(2, 6, 23, 0.56)';
        ctx.beginPath();
        ctx.rect(0, 0, main.width, main.height);
        ctx.rect(rx, ry, rw, rh);
        ctx.fill('evenodd');
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.restore();
        pushHistory();
        setNotice('已添加聚光灯重点聚焦遮罩');
      }
    } else if (tool === 'rect') {
      if (Math.abs(pos.x - start.x) > 3 && Math.abs(pos.y - start.y) > 3) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = currentTier.lineW;
        ctx.strokeRect(start.x, start.y, pos.x - start.x, pos.y - start.y);
        ctx.restore();
        pushHistory();
      }
    } else if (tool === 'ellipse') {
      const rx = Math.abs(pos.x - start.x) / 2;
      const ry = Math.abs(pos.y - start.y) / 2;
      if (rx > 3 && ry > 3) {
        const cx = (start.x + pos.x) / 2;
        const cy = (start.y + pos.y) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = currentTier.lineW;
        ctx.stroke();
        ctx.restore();
        pushHistory();
      }
    } else if (tool === 'arrow') {
      if (Math.hypot(pos.x - start.x, pos.y - start.y) > 8) {
        drawArrowOnCtx(ctx, start.x, start.y, pos.x, pos.y, color, currentTier.lineW);
        pushHistory();
      }
    } else if (tool === 'highlighter') {
      const pts = penPointsRef.current;
      penPointsRef.current = [];
      if (pts.length >= 2) {
        ctx.save();
        ctx.globalAlpha = 0.36;
        ctx.strokeStyle = color === '#ffffff' || color === '#0f172a' ? '#facc15' : color;
        ctx.lineWidth = currentTier.lineW * 3.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
        ctx.restore();
        pushHistory();
      }
    }
  };

  const handleTransformCanvas = (kind: 'rotate' | 'flip') => {
    const main = mainCanvasRef.current;
    if (!main) return;
    const temp = document.createElement('canvas');
    temp.width = main.width;
    temp.height = main.height;
    const tctx = temp.getContext('2d');
    if (!tctx) return;
    tctx.drawImage(main, 0, 0);

    if (kind === 'rotate') {
      const nw = main.height;
      const nh = main.width;
      applyCanvasSize(nw, nh);
      const ctx = main.getContext('2d');
      if (!ctx) return;
      ctx.save();
      ctx.translate(nw / 2, nh / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(temp, -temp.width / 2, -temp.height / 2);
      ctx.restore();
      setNotice('已顺时针旋转 90°');
    } else {
      const ctx = main.getContext('2d');
      if (!ctx) return;
      ctx.save();
      ctx.clearRect(0, 0, main.width, main.height);
      ctx.translate(main.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(temp, 0, 0);
      ctx.restore();
      setNotice('已水平镜像翻转画布');
    }
    pushHistory();
  };

  const applyCropSelection = () => {
    if (!cropRect || !mainCanvasRef.current) return;
    const ctx = mainCanvasRef.current.getContext('2d');
    if (!ctx) return;
    const cropped = ctx.getImageData(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    applyCanvasSize(cropRect.w, cropRect.h);
    const nextCtx = mainCanvasRef.current.getContext('2d');
    if (!nextCtx) return;
    nextCtx.putImageData(cropped, 0, 0);
    clearPreview();
    setCropRect(null);
    pushHistory();
    setNotice(`已完成裁剪 (${cropRect.w}×${cropRect.h})`);
  };

  const handleCopyClipboard = () => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setNotice('已复制高清截图到系统剪贴板');
          onToast?.('已复制高清截图到剪贴板');
          return;
        }
      } catch {
        // Fallback notice below
      }
      setNotice('当前环境受限未能写入剪贴板，请使用「保存到本地」或「钉在桌面」');
    }, 'image/png');
  };

  const handleRunAiOcr = async (mode: 'ocr' | 'summary') => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    setOcrLoading(true);
    setOcrError(null);
    setOcrResult(null);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const resp = await fetch(apiUrl('/api/ai/screenshot-ocr'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl, mimeType: 'image/png', mode }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setOcrError(data.error || 'AI 识图提取失败');
      } else {
        setOcrResult(data.text || '未识别到文字内容');
      }
    } catch {
      setOcrError('识图请求失败，请检查网络连接');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleExport = (action: 'download' | 'send' | 'pin' | 'qzone') => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (action === 'send') {
      onSendToChat(dataUrl);
      onClose();
    } else if (action === 'pin') {
      onPinToScreen?.(dataUrl);
      onClose();
    } else if (action === 'qzone') {
      onShareToQzone?.(
        dataUrl,
        sourceMode === 'doodle' ? '分享一张刚刚随手画的涂鸦灵感' : `分享来自「${activeConvTitle}」的标注截图`
      );
      onClose();
    } else {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `StarRipple_${sourceMode === 'doodle' ? '涂鸦' : '截图'}_${Date.now()}.png`;
      link.click();
      setNotice('已保存高清作品到本地');
    }
  };

  const toolButtons: Array<{
    id: ScreenshotTool;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'crop', label: '裁剪', icon: Crop },
    { id: 'mosaic', label: '马赛克', icon: Eraser },
    { id: 'rect', label: '矩形', icon: Square },
    { id: 'ellipse', label: '圆框', icon: Circle },
    { id: 'arrow', label: '箭头', icon: ArrowUpRight },
    { id: 'pen', label: '画笔', icon: PenTool },
    { id: 'highlighter', label: '荧光笔', icon: Highlighter },
    { id: 'spotlight', label: '聚光灯', icon: Focus },
    { id: 'callout', label: '气泡', icon: MessageSquarePlus },
    { id: 'text', label: '文字', icon: TypeIcon },
    { id: 'step', label: '序号', icon: Hash },
    { id: 'stamp', label: '贴纸', icon: Sticker },
  ];

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-3 sm:p-5">
      <div className="w-full max-w-5xl max-h-[94vh] rounded-2xl bg-white dark:bg-[#161b26] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Top Capture Source Header */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {sourceMode === 'doodle' ? '星涟快捷涂鸦与批注板' : '星涟全能截图与涂鸦工作台'}
            </h3>
            <span className="text-[11px] font-mono-tabular text-slate-400">
              {canvasDims.width} × {canvasDims.height} · 支持 Ctrl+V 粘贴图片
            </span>
            {notice && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {notice}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleDisplayCapture}
              disabled={capturingScreen}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                sourceMode === 'screen'
                  ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#2563EB]'
              }`}
              title="抓取浏览器标签页、桌面窗口或全屏"
            >
              <Monitor className="w-3.5 h-3.5" />
              {capturingScreen ? '等待选窗...' : '屏幕抓屏'}
            </button>

            <button
              type="button"
              onClick={() => {
                setSourceMode('chat');
                renderChatSnapshot(anonymizeChat);
                setNotice('已生成当前聊天长截图');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                sourceMode === 'chat'
                  ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#2563EB]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              聊天截图
            </button>

            <button
              type="button"
              onClick={() => {
                setSourceMode('doodle');
                setTool('pen');
                renderDoodleCanvas(doodleBackdrop);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                sourceMode === 'doodle'
                  ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#2563EB]'
              }`}
            >
              <Brush className="w-3.5 h-3.5" />
              快捷涂鸦板
            </button>

            {sourceMode === 'chat' && (
              <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer whitespace-nowrap shrink-0">
                <input
                  type="checkbox"
                  checked={anonymizeChat}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setAnonymizeChat(next);
                    renderChatSnapshot(next);
                  }}
                  className="accent-[#2563EB]"
                />
                <span>隐私脱敏</span>
              </label>
            )}

            {sourceMode === 'doodle' && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                {DOODLE_BACKDROPS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => {
                      setDoodleBackdrop(bg.id);
                      if (bg.id === 'dark' && color === '#0f172a') setColor('#38bdf8');
                      renderDoodleCanvas(bg.id);
                    }}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap ${
                      doodleBackdrop === bg.id
                        ? 'bg-white dark:bg-slate-900 text-[#2563EB] shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setSourceMode('demo');
                loadDemoPhoto();
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                sourceMode === 'demo'
                  ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#2563EB]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              示例图
            </button>

            <label className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer hover:border-[#2563EB] whitespace-nowrap shrink-0">
              <Upload className="w-3.5 h-3.5" />
              导入图片
              <input type="file" accept="image/*" onChange={handleUploadCustom} className="hidden" />
            </label>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 ml-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Workspace */}
        <div className="flex-1 min-h-0 overflow-auto p-4 bg-slate-100/90 dark:bg-[#0d111a] flex flex-col items-center justify-center gap-3">
          <div className="relative inline-block shadow-xl rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-white">
            <canvas
              ref={mainCanvasRef}
              width={canvasDims.width}
              height={canvasDims.height}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDoubleClick={() => {
                if (tool === 'crop' && cropRect) {
                  applyCropSelection();
                }
              }}
              className="block max-w-full max-h-[54vh] w-auto h-auto cursor-crosshair touch-none"
            />
            <canvas
              ref={previewCanvasRef}
              width={canvasDims.width}
              height={canvasDims.height}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Floating Inline Text / Callout Annotation Input */}
            {textOverlay && (
              <div
                style={{ left: `${textOverlay.leftPct}%`, top: `${textOverlay.topPct}%` }}
                className="absolute z-20 flex items-center gap-1 p-1 rounded-lg bg-white dark:bg-slate-900 border border-[#2563EB] shadow-xl"
              >
                <input
                  autoFocus
                  value={textDraft}
                  onChange={(e) => setTextDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitTextAnnotation();
                    if (e.key === 'Escape') {
                      setTextOverlay(null);
                      setTextDraft('');
                    }
                  }}
                  placeholder={textOverlay.mode === 'callout' ? '输入气泡提示内容...' : '输入文字批注...'}
                  className="w-40 px-2 py-1 text-xs bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={commitTextAnnotation}
                  className="p-1 rounded bg-[#2563EB] text-white"
                  title="确认"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTextOverlay(null);
                    setTextDraft('');
                  }}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {cropRect && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs shadow-lg">
              <span className="font-mono-tabular">
                选区：{cropRect.w} × {cropRect.h}
              </span>
              <button
                type="button"
                onClick={applyCropSelection}
                className="px-2.5 py-1 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] font-medium"
              >
                确认裁剪
              </button>
              <button
                type="button"
                onClick={() => {
                  setCropRect(null);
                  clearPreview();
                }}
                className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20"
              >
                取消选区
              </button>
            </div>
          )}

          {/* AI OCR Result Drawer */}
          {(ocrLoading || ocrResult || ocrError) && (
            <div className="w-full max-w-3xl rounded-xl bg-white dark:bg-[#191c24] border border-slate-200 dark:border-slate-700 p-3.5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2563EB] flex items-center gap-1.5">
                  <ScanText className="w-4 h-4" />
                  AI 识图提取结果
                </span>
                <div className="flex items-center gap-2">
                  {ocrResult && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(ocrResult);
                          setNotice('已复制识别文字');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-medium text-slate-700 dark:text-slate-200"
                      >
                        复制文字
                      </button>
                      {onSendTextToChat && (
                        <button
                          type="button"
                          onClick={() => {
                            onSendTextToChat(ocrResult);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#2563EB] text-white text-xs font-medium"
                        >
                          发送到当前聊天
                        </button>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setOcrResult(null);
                      setOcrError(null);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {ocrLoading ? (
                <div className="text-xs text-slate-500 py-2">正在识别截图中的文字与要点...</div>
              ) : ocrError ? (
                <div className="text-xs text-rose-600">{ocrError}</div>
              ) : (
                <pre className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-32 overflow-y-auto font-sans leading-relaxed">
                  {ocrResult}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Bottom Annotation Toolbar + Output Actions */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#191c24] space-y-2.5 shrink-0">
          {/* Quick Doodle Stamp Picker Row when Stamp tool active */}
          {tool === 'stamp' && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 font-medium whitespace-nowrap">选择涂鸦贴纸：</span>
              <div className="flex items-center gap-1 flex-wrap">
                {DOODLE_STAMPS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedStamp(emoji)}
                    className={`w-7 h-7 rounded-md text-base flex items-center justify-center transition-transform ${
                      selectedStamp === emoji
                        ? 'bg-[#2563EB]/15 ring-2 ring-[#2563EB] scale-110'
                        : 'hover:bg-slate-200/70 dark:hover:bg-slate-800'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-400 ml-auto">点击画布任意位置即可盖章</span>
            </div>
          )}

          {/* Row 1: Drawing Tools, Colors, Brush Sizes & Undo/Redo */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 flex-wrap">
              {toolButtons.map((tb) => {
                const Icon = tb.icon;
                const active = tool === tb.id;
                return (
                  <button
                    key={tb.id}
                    type="button"
                    onClick={() => {
                      setTool(tb.id);
                      if (tb.id !== 'crop') {
                        setCropRect(null);
                        clearPreview();
                      }
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#2563EB]/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tb.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Colors */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                {COLOR_SWATCHES.map((sw) => (
                  <button
                    key={sw.hex}
                    type="button"
                    onClick={() => setColor(sw.hex)}
                    title={sw.label}
                    style={{ backgroundColor: sw.hex }}
                    className={`w-4 h-4 rounded-full border transition-transform ${
                      color === sw.hex
                        ? 'scale-125 ring-2 ring-[#2563EB] border-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  />
                ))}
              </div>

              {/* Stroke Width / Mosaic Grain */}
              <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px]">
                {STROKE_TIERS.map((tier, idx) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setStrokeTierIdx(idx)}
                    className={`px-2 py-1 rounded-md font-medium ${
                      strokeTierIdx === idx
                        ? 'bg-white dark:bg-slate-900 text-[#2563EB] shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>

              {/* Transform & Undo / Redo / Reset */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleTransformCanvas('rotate')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  title="顺时针旋转 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleTransformCanvas('flip')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  title="水平镜像翻转"
                >
                  <FlipHorizontal2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={!historyMeta.canUndo}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-35"
                  title="撤销 (Ctrl+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={!historyMeta.canRedo}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-35"
                  title="重做 (Ctrl+Y)"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetToBase}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  title="清空标注 / 还原底图"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Extended Smart Actions & Exports */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/70">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleRunAiOcr('ocr')}
                disabled={ocrLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 whitespace-nowrap shrink-0"
              >
                <FileText className="w-3.5 h-3.5" />
                AI 提取文字 (OCR)
              </button>
              <button
                type="button"
                onClick={() => handleRunAiOcr('summary')}
                disabled={ocrLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-500/35 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI 总结画面
              </button>
              {onPinToScreen && (
                <button
                  type="button"
                  onClick={() => handleExport('pin')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 whitespace-nowrap shrink-0"
                  title="将截图作为悬浮贴图钉在桌面上，方便对照参考"
                >
                  <Pin className="w-3.5 h-3.5" />
                  钉在屏幕
                </button>
              )}
              {onShareToQzone && (
                <button
                  type="button"
                  onClick={() => handleExport('qzone')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 whitespace-nowrap shrink-0"
                  title="将当前截图或涂鸦作品发布到星涟空间动态"
                >
                  <Compass className="w-3.5 h-3.5" />
                  发到空间
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <ClipboardCopy className="w-3.5 h-3.5" />
                复制截图
              </button>
              <button
                type="button"
                onClick={() => handleExport('download')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                保存本地
              </button>
              <button
                type="button"
                onClick={() => handleExport('send')}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                发送至当前聊天
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Floating Pinned Screenshots Overlay (QQ / Snipaste F3 Pin-to-Screen) */
export const PinnedScreenshotOverlay: React.FC<{
  items: PinnedScreenshotItem[];
  onUpdateItem: (id: string, patch: Partial<PinnedScreenshotItem>) => void;
  onCloseItem: (id: string) => void;
  onSendToChat: (dataUrl: string) => void;
}> = ({ items, onUpdateItem, onCloseItem, onSendToChat }) => {
  if (items.length === 0) return null;

  return (
    <>
      {items.map((item) => (
        <PinnedCard
          key={item.id}
          item={item}
          onUpdate={(patch) => onUpdateItem(item.id, patch)}
          onClose={() => onCloseItem(item.id)}
          onSendToChat={() => onSendToChat(item.dataUrl)}
        />
      ))}
    </>
  );
};

const PinnedCard: React.FC<{
  item: PinnedScreenshotItem;
  onUpdate: (patch: Partial<PinnedScreenshotItem>) => void;
  onClose: () => void;
  onSendToChat: () => void;
}> = ({ item, onUpdate, onClose, onSendToChat }) => {
  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const ox = item.x;
    const oy = item.y;

    const onMove = (ev: PointerEvent) => {
      onUpdate({
        x: Math.max(8, Math.min(window.innerWidth - 160, ox + ev.clientX - sx)),
        y: Math.max(8, Math.min(window.innerHeight - 100, oy + ev.clientY - sy)),
      });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      style={{
        left: item.x,
        top: item.y,
        width: Math.round(320 * item.scale),
        opacity: item.opacity,
      }}
      className="fixed z-[115] rounded-xl overflow-hidden bg-slate-900 border-2 border-[#2563EB]/80 shadow-2xl select-none"
    >
      <div
        onPointerDown={startDrag}
        className="px-2.5 py-1.5 bg-[#0b1222] text-white flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing text-[11px]"
      >
        <span className="flex items-center gap-1 font-medium text-sky-300">
          <Pin className="w-3 h-3" />
          桌面贴图
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onUpdate({ scale: Math.max(0.6, Number((item.scale - 0.15).toFixed(2))) })}
            className="p-1 rounded hover:bg-white/15"
            title="缩小贴图"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ scale: Math.min(1.8, Number((item.scale + 0.15).toFixed(2))) })}
            className="p-1 rounded hover:bg-white/15"
            title="放大贴图"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdate({ opacity: item.opacity > 0.85 ? 0.72 : item.opacity > 0.55 ? 0.45 : 1 })
            }
            className="px-1.5 py-0.5 rounded hover:bg-white/15 font-mono-tabular"
            title="切换半透明对照"
          >
            {Math.round(item.opacity * 100)}%
          </button>
          <button
            type="button"
            onClick={onSendToChat}
            className="p-1 rounded hover:bg-[#2563EB] text-sky-300 hover:text-white"
            title="发送至当前聊天"
          >
            <Send className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-rose-500 text-slate-300 hover:text-white"
            title="关闭贴图"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
      <img
        src={item.dataUrl}
        alt="桌面悬浮贴图"
        draggable={false}
        className="w-full h-auto block bg-white"
      />
    </div>
  );
};
