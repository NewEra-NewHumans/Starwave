import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  PanelRightClose,
  Pin,
  PinOff,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  AllowedDockEdges,
  DockedEdge,
  EdgeIndicatorStyle,
  WindowBounds,
  WindowDockSettings,
} from '../types/qq';

export const DEFAULT_WINDOW_DOCK_SETTINGS: WindowDockSettings = {
  displayMode: 'fullscreen',
  autoHideEnabled: true,
  allowedEdges: 'all',
  hideDelayMs: 650,
  revealDelayMs: 60,
  peekWidthPx: 6,
  snapThresholdPx: 28,
  indicatorStyle: 'glow',
  autoRevealOnUnread: true,
};

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const MIN_WINDOW_W = 390;
const MIN_WINDOW_H = 440;

function getViewportSize() {
  if (typeof window === 'undefined') {
    return { vw: 1280, vh: 800 };
  }
  return { vw: window.innerWidth, vh: window.innerHeight };
}

export function getInitialFloatingBounds(): WindowBounds {
  const { vw, vh } = getViewportSize();
  const width = Math.max(MIN_WINDOW_W, Math.min(980, vw - 84));
  const height = Math.max(MIN_WINDOW_H, Math.min(680, vh - 64));
  return {
    x: Math.max(24, Math.round((vw - width) / 2)),
    y: Math.max(24, Math.round((vh - height) / 2)),
    width,
    height,
  };
}

function clampBoundsToViewport(b: WindowBounds, dockedEdge: DockedEdge): WindowBounds {
  const { vw, vh } = getViewportSize();
  const width = Math.max(MIN_WINDOW_W, Math.min(b.width, vw));
  const height = Math.max(MIN_WINDOW_H, Math.min(b.height, vh));
  let x = b.x;
  let y = Math.max(0, Math.min(b.y, vh - height));

  if (dockedEdge === 'right') {
    x = Math.max(0, vw - width);
  } else if (dockedEdge === 'left') {
    x = 0;
  } else if (dockedEdge === 'top') {
    y = 0;
    x = Math.max(0, Math.min(x, vw - width));
  } else if (dockedEdge === 'bottom') {
    y = Math.max(0, vh - height);
    x = Math.max(0, Math.min(x, vw - width));
  } else {
    x = Math.max(0, Math.min(x, vw - width));
  }

  return { x, y, width, height };
}

function getEdgeLabel(edge: Exclude<DockedEdge, null>): string {
  switch (edge) {
    case 'right':
      return '右侧';
    case 'left':
      return '左侧';
    case 'top':
      return '顶部';
    case 'bottom':
      return '底部';
  }
}

interface DesktopWindowShellProps {
  settings: WindowDockSettings;
  onUpdateSettings: (patch: Partial<WindowDockSettings>) => void;
  totalUnread: number;
  blockingModalOpen?: boolean;
  onToast?: (msg: string) => void;
  children: React.ReactNode;
}

export const DesktopWindowShell: React.FC<DesktopWindowShellProps> = ({
  settings,
  onUpdateSettings,
  totalUnread,
  blockingModalOpen = false,
  onToast,
  children,
}) => {
  const [bounds, setBounds] = useState<WindowBounds>(() => getInitialFloatingBounds());
  const [dockedEdge, setDockedEdge] = useState<DockedEdge>(null);
  const [isHidden, setIsHidden] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<ResizeDir | null>(null);
  const [snapPreviewEdge, setSnapPreviewEdge] = useState<DockedEdge>(null);

  const boundsRef = useRef(bounds);
  const dockedEdgeRef = useRef(dockedEdge);
  const isHiddenRef = useRef(isHidden);
  const settingsRef = useRef(settings);
  const pinnedOpenRef = useRef(pinnedOpen);
  const blockingRef = useRef(blockingModalOpen || settingsOpen);

  boundsRef.current = bounds;
  dockedEdgeRef.current = dockedEdge;
  isHiddenRef.current = isHidden;
  settingsRef.current = settings;
  pinnedOpenRef.current = pinnedOpen;
  blockingRef.current = blockingModalOpen || settingsOpen;

  const hideTimerRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: -1, y: -1 });
  const prevUnreadRef = useRef(totalUnread);

  const clearTimers = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  };

  // Clamp bounds when viewport resizes
  useEffect(() => {
    const onResize = () => {
      setBounds((prev) => clampBoundsToViewport(prev, dockedEdgeRef.current));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Reset hidden state when leaving floating mode or turning off auto-hide
  useEffect(() => {
    if (settings.displayMode !== 'floating' || !settings.autoHideEnabled || dockedEdge === null) {
      clearTimers();
      setIsHidden(false);
    }
  }, [settings.displayMode, settings.autoHideEnabled, dockedEdge]);

  // If a modal opens while edge-hidden, reveal immediately
  useEffect(() => {
    if ((blockingModalOpen || settingsOpen) && isHidden) {
      clearTimers();
      setIsHidden(false);
    }
  }, [blockingModalOpen, settingsOpen, isHidden]);

  // Optional auto-reveal when new unread messages arrive while edge-hidden
  useEffect(() => {
    if (
      settings.displayMode === 'floating' &&
      settings.autoHideEnabled &&
      settings.autoRevealOnUnread &&
      dockedEdge !== null &&
      isHiddenRef.current &&
      totalUnread > prevUnreadRef.current
    ) {
      clearTimers();
      setIsHidden(false);
      hideTimerRef.current = window.setTimeout(() => {
        if (
          settingsRef.current.displayMode === 'floating' &&
          settingsRef.current.autoHideEnabled &&
          dockedEdgeRef.current !== null &&
          !pinnedOpenRef.current &&
          !blockingRef.current
        ) {
          setIsHidden(true);
        }
      }, Math.max(2200, settings.hideDelayMs));
    }
    prevUnreadRef.current = totalUnread;
  }, [totalUnread, settings.displayMode, settings.autoHideEnabled, settings.autoRevealOnUnread, settings.hideDelayMs, dockedEdge]);

  // Core Edge Auto-Hide & Reveal Pointer State Machine
  useEffect(() => {
    if (
      settings.displayMode !== 'floating' ||
      !settings.autoHideEnabled ||
      dockedEdge === null ||
      pinnedOpen ||
      dragging ||
      resizing !== null
    ) {
      clearTimers();
      return;
    }

    const isInsideWindow = (cx: number, cy: number) => {
      const b = boundsRef.current;
      return cx >= b.x - 3 && cx <= b.x + b.width + 3 && cy >= b.y - 3 && cy <= b.y + b.height + 3;
    };

    const isInsideHotZone = (cx: number, cy: number) => {
      const { vw, vh } = getViewportSize();
      const b = boundsRef.current;
      const edge = dockedEdgeRef.current;
      const zoneThick = Math.max(18, settingsRef.current.peekWidthPx + 12);

      if (edge === 'right') {
        return cx >= vw - zoneThick && cy >= b.y - 4 && cy <= b.y + b.height + 4;
      }
      if (edge === 'left') {
        return cx <= zoneThick && cy >= b.y - 4 && cy <= b.y + b.height + 4;
      }
      if (edge === 'top') {
        return cy <= zoneThick && cx >= b.x - 4 && cx <= b.x + b.width + 4;
      }
      if (edge === 'bottom') {
        return cy >= vh - zoneThick && cx >= b.x - 4 && cx <= b.x + b.width + 4;
      }
      return false;
    };

    const scheduleHide = () => {
      if (blockingRef.current || pinnedOpenRef.current) return;
      if (hideTimerRef.current !== null) return;
      hideTimerRef.current = window.setTimeout(() => {
        hideTimerRef.current = null;
        if (
          settingsRef.current.displayMode === 'floating' &&
          settingsRef.current.autoHideEnabled &&
          dockedEdgeRef.current !== null &&
          !pinnedOpenRef.current &&
          !blockingRef.current
        ) {
          setIsHidden(true);
        }
      }, settingsRef.current.hideDelayMs);
    };

    const scheduleReveal = () => {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (!isHiddenRef.current) return;
      if (settingsRef.current.revealDelayMs <= 0) {
        setIsHidden(false);
        return;
      }
      if (revealTimerRef.current !== null) return;
      revealTimerRef.current = window.setTimeout(() => {
        revealTimerRef.current = null;
        setIsHidden(false);
      }, settingsRef.current.revealDelayMs);
    };

    const handlePointerMove = (ev: PointerEvent) => {
      const cx = ev.clientX;
      const cy = ev.clientY;
      lastPointerRef.current = { x: cx, y: cy };

      if (blockingRef.current) {
        clearTimers();
        return;
      }

      if (isHiddenRef.current) {
        if (isInsideHotZone(cx, cy)) {
          scheduleReveal();
        } else if (revealTimerRef.current !== null) {
          window.clearTimeout(revealTimerRef.current);
          revealTimerRef.current = null;
        }
      } else {
        if (isInsideWindow(cx, cy) || isInsideHotZone(cx, cy)) {
          if (hideTimerRef.current !== null) {
            window.clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
          }
        } else {
          scheduleHide();
        }
      }
    };

    const handleDocumentMouseLeave = () => {
      if (blockingRef.current || isHiddenRef.current) return;
      const { vw, vh } = getViewportSize();
      const edge = dockedEdgeRef.current;
      const last = lastPointerRef.current;
      // Avoid misfiring hide when cursor intentionally rests right at the docked edge
      if (edge === 'right' && last.x >= vw - 18) return;
      if (edge === 'left' && last.x <= 18) return;
      if (edge === 'top' && last.y <= 18) return;
      if (edge === 'bottom' && last.y >= vh - 18) return;
      scheduleHide();
    };

    window.addEventListener('pointermove', handlePointerMove);
    document.documentElement.addEventListener('mouseleave', handleDocumentMouseLeave);

    return () => {
      clearTimers();
      window.removeEventListener('pointermove', handlePointerMove);
      document.documentElement.removeEventListener('mouseleave', handleDocumentMouseLeave);
    };
  }, [
    settings.displayMode,
    settings.autoHideEnabled,
    settings.hideDelayMs,
    settings.revealDelayMs,
    settings.peekWidthPx,
    dockedEdge,
    pinnedOpen,
    dragging,
    resizing,
  ]);

  // Helper: Dock to an edge immediately
  const snapToEdge = (edge: Exclude<DockedEdge, null>, customWidth?: number, customHeight?: number) => {
    const { vw, vh } = getViewportSize();
    setBounds((prev) => {
      const w = Math.max(MIN_WINDOW_W, Math.min(customWidth ?? prev.width, vw));
      const h = Math.max(MIN_WINDOW_H, Math.min(customHeight ?? prev.height, vh));
      let x = prev.x;
      let y = Math.max(0, Math.min(prev.y, vh - h));
      if (edge === 'right') x = vw - w;
      else if (edge === 'left') x = 0;
      else if (edge === 'top') {
        y = 0;
        x = Math.max(0, Math.min(prev.x, vw - w));
      } else if (edge === 'bottom') {
        y = vh - h;
        x = Math.max(0, Math.min(prev.x, vw - w));
      }
      return { x, y, width: w, height: h };
    });
    setDockedEdge(edge);
    setPinnedOpen(false);
    setIsHidden(false);
  };

  // Dragging the window title bar
  const handleTitleBarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-no-drag="true"]')) return;
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startBounds = { ...boundsRef.current };
    let currentSnap: DockedEdge = null;

    setDragging(true);
    setIsHidden(false);
    clearTimers();

    const detectSnapEdge = (
      nextX: number,
      nextY: number,
      width: number,
      height: number,
      clientX: number,
      clientY: number
    ): DockedEdge => {
      const { vw, vh } = getViewportSize();
      const threshold = settingsRef.current.snapThresholdPx;
      const allowed = settingsRef.current.allowedEdges;

      const allowHorizontal = allowed === 'horizontal' || allowed === 'all';
      const allowVertical = allowed === 'vertical' || allowed === 'all';

      if (allowed !== 'vertical' && (nextX + width >= vw - threshold || clientX >= vw - 14)) {
        return 'right';
      }
      if (allowHorizontal && (nextX <= threshold || clientX <= 14)) {
        return 'left';
      }
      if (allowVertical && (nextY <= threshold || clientY <= 14)) {
        return 'top';
      }
      if (allowVertical && (nextY + height >= vh - threshold || clientY >= vh - 14)) {
        return 'bottom';
      }
      return null;
    };

    const onMove = (ev: PointerEvent) => {
      const { vw, vh } = getViewportSize();
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      const rawX = startBounds.x + dx;
      const rawY = startBounds.y + dy;
      const clampedX = Math.max(-startBounds.width + 120, Math.min(rawX, vw - 120));
      const clampedY = Math.max(0, Math.min(rawY, vh - 48));

      const edge = detectSnapEdge(
        rawX,
        rawY,
        startBounds.width,
        startBounds.height,
        ev.clientX,
        ev.clientY
      );
      currentSnap = edge;
      setSnapPreviewEdge(edge);

      setBounds({
        x: Math.max(0, Math.min(clampedX, vw - startBounds.width)),
        y: Math.max(0, Math.min(clampedY, vh - startBounds.height)),
        width: startBounds.width,
        height: startBounds.height,
      });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);

      setDragging(false);
      setSnapPreviewEdge(null);

      if (currentSnap) {
        snapToEdge(currentSnap);
        const edgeLabel = getEdgeLabel(currentSnap);
        onToast?.(
          settingsRef.current.autoHideEnabled
            ? `窗口已贴靠屏幕${edgeLabel}，鼠标移出窗口后将自动缩进隐藏`
            : `窗口已贴靠屏幕${edgeLabel}`
        );
      } else {
        setDockedEdge(null);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  // Resizing the window from any of 8 handles
  const handleResizePointerDown = (dir: ResizeDir) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const start = { ...boundsRef.current };

    setResizing(dir);
    setIsHidden(false);
    clearTimers();

    const onMove = (ev: PointerEvent) => {
      const { vw, vh } = getViewportSize();
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      let nextX = start.x;
      let nextY = start.y;
      let nextW = start.width;
      let nextH = start.height;

      if (dir.includes('e')) {
        nextW = Math.max(MIN_WINDOW_W, Math.min(start.width + dx, vw - start.x));
      }
      if (dir.includes('s')) {
        nextH = Math.max(MIN_WINDOW_H, Math.min(start.height + dy, vh - start.y));
      }
      if (dir.includes('w')) {
        const rightEdge = start.x + start.width;
        const proposedW = start.width - dx;
        nextW = Math.max(MIN_WINDOW_W, Math.min(proposedW, rightEdge));
        nextX = rightEdge - nextW;
      }
      if (dir.includes('n')) {
        const bottomEdge = start.y + start.height;
        const proposedH = start.height - dy;
        nextH = Math.max(MIN_WINDOW_H, Math.min(proposedH, bottomEdge));
        nextY = bottomEdge - nextH;
      }

      setBounds({ x: nextX, y: nextY, width: nextW, height: nextH });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      setResizing(null);

      // Update docked status based on final position
      const { vw, vh } = getViewportSize();
      const b = boundsRef.current;
      const threshold = settingsRef.current.snapThresholdPx;
      const allowed = settingsRef.current.allowedEdges;
      const allowHorizontal = allowed === 'horizontal' || allowed === 'all';
      const allowVertical = allowed === 'vertical' || allowed === 'all';

      if (allowed !== 'vertical' && b.x + b.width >= vw - 4) {
        setDockedEdge('right');
      } else if (allowHorizontal && b.x <= 4) {
        setDockedEdge('left');
      } else if (allowVertical && b.y <= 4) {
        setDockedEdge('top');
      } else if (allowVertical && b.y + b.height >= vh - 4) {
        setDockedEdge('bottom');
      } else if (dockedEdgeRef.current === 'right' && b.x + b.width < vw - threshold) {
        setDockedEdge(null);
      } else if (dockedEdgeRef.current === 'left' && b.x > threshold) {
        setDockedEdge(null);
      } else if (dockedEdgeRef.current === 'top' && b.y > threshold) {
        setDockedEdge(null);
      } else if (dockedEdgeRef.current === 'bottom' && b.y + b.height < vh - threshold) {
        setDockedEdge(null);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  // Fullscreen mode: clean pass-through with zero wrapper overhead
  if (settings.displayMode === 'fullscreen') {
    return (
      <>
        {children}
        {settingsOpen && (
          <WindowDockSettingsModal
            settings={settings}
            dockedEdge={dockedEdge}
            bounds={bounds}
            onUpdateSettings={onUpdateSettings}
            onApplyPreset={(w, h, edge) => {
              onUpdateSettings({ displayMode: 'floating' });
              if (edge) {
                snapToEdge(edge, w, h);
              } else {
                const { vw, vh } = getViewportSize();
                setBounds({
                  x: Math.max(20, Math.round((vw - w) / 2)),
                  y: Math.max(20, Math.round((vh - h) / 2)),
                  width: Math.min(w, vw),
                  height: Math.min(h, vh),
                });
                setDockedEdge(null);
              }
            }}
            onTestHide={() => {
              onUpdateSettings({ displayMode: 'floating', autoHideEnabled: true });
              snapToEdge('right');
              setSettingsOpen(false);
              window.setTimeout(() => setIsHidden(true), 120);
            }}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </>
    );
  }

  // Compute rendered position for floating mode (using left/top so fixed modals stay viewport-anchored)
  const { vw, vh } = getViewportSize();
  let renderLeft = bounds.x;
  let renderTop = bounds.y;

  if (isHidden && dockedEdge) {
    if (dockedEdge === 'right') {
      renderLeft = vw - settings.peekWidthPx;
    } else if (dockedEdge === 'left') {
      renderLeft = -(bounds.width - settings.peekWidthPx);
    } else if (dockedEdge === 'top') {
      renderTop = -(bounds.height - settings.peekWidthPx);
    } else if (dockedEdge === 'bottom') {
      renderTop = vh - settings.peekWidthPx;
    }
  }

  const shouldAnimateSlide = !dragging && resizing === null;

  return (
    <div className="fixed inset-0 overflow-hidden select-none bg-[#e8eef7] dark:bg-[#070a12]">
      {/* Subtle Desktop Environment Backdrop behind the floating chat window */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(900px circle at 18% 18%, rgba(37, 99, 235, 0.14), transparent 60%), radial-gradient(760px circle at 84% 82%, rgba(13, 148, 136, 0.12), transparent 58%), radial-gradient(rgba(15, 23, 42, 0.06) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 100% 100%, 28px 28px',
        }}
      />

      {/* Desktop Control Hint Card (top-left of desktop surface, accessible when docked/hidden) */}
      <div className="fixed top-5 left-5 z-10 max-w-md rounded-2xl bg-white/88 dark:bg-[#141925]/88 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-lg p-4 space-y-3 text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              <PanelRightClose className="w-4 h-4 text-[#2563EB]" />
              <span>桌面悬浮窗与四向贴边隐藏</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              拖动窗口顶部标题栏至屏幕左、右、上、下任意边缘松手即可贴边自动隐藏；四边与四角可自由缩放。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-mono-tabular">
          <span>
            状态：
            {isHidden && dockedEdge
              ? `已缩进${getEdgeLabel(dockedEdge)}边缘（露边 ${settings.peekWidthPx}px）`
              : dockedEdge
              ? `已贴靠${getEdgeLabel(dockedEdge)}`
              : '自由悬浮中'}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {Math.round(bounds.width)} × {Math.round(bounds.height)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              onUpdateSettings({ autoHideEnabled: true });
              snapToEdge('right', Math.min(bounds.width, 460), Math.min(bounds.height, vh - 48));
              onToast?.('已贴靠屏幕右侧，鼠标移出窗口即自动隐藏');
            }}
            className="px-2.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium transition-colors"
          >
            贴靠右侧
          </button>
          <button
            type="button"
            onClick={() => {
              onUpdateSettings({ autoHideEnabled: true, allowedEdges: 'all' });
              snapToEdge('top');
              onToast?.('已贴靠屏幕顶部，鼠标移出窗口即向上自动隐藏');
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] text-xs font-medium transition-colors"
          >
            贴靠顶部
          </button>
          <button
            type="button"
            onClick={() => {
              onUpdateSettings({ autoHideEnabled: true, allowedEdges: 'all' });
              snapToEdge('bottom');
              onToast?.('已贴靠屏幕底部，鼠标移出窗口即向下自动隐藏');
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] text-xs font-medium transition-colors"
          >
            贴靠底部
          </button>
          <button
            type="button"
            onClick={() => {
              onUpdateSettings({ autoHideEnabled: true });
              snapToEdge(dockedEdge || 'right');
              window.setTimeout(() => setIsHidden(true), 60);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] text-xs font-medium transition-colors"
          >
            立即缩进测试
          </button>
          <button
            type="button"
            onClick={() => {
              setDockedEdge(null);
              setIsHidden(false);
              setBounds(getInitialFloatingBounds());
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] text-xs font-medium transition-colors"
          >
            居中还原
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] text-xs font-medium transition-colors"
          >
            自定义设置
          </button>
          <button
            type="button"
            onClick={() => {
              setIsHidden(false);
              setDockedEdge(null);
              onUpdateSettings({ displayMode: 'fullscreen' });
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium transition-colors"
          >
            全屏铺满
          </button>
        </div>
      </div>

      {/* Edge Snap Magnetic Preview Overlay while dragging */}
      {dragging && snapPreviewEdge && (
        <div
          className={`fixed z-30 pointer-events-none rounded-2xl border-2 border-[#2563EB] bg-[#2563EB]/15 backdrop-blur-sm transition-all duration-150 ${
            snapPreviewEdge === 'right'
              ? 'right-1.5 top-2 bottom-2 w-24'
              : snapPreviewEdge === 'left'
              ? 'left-1.5 top-2 bottom-2 w-24'
              : snapPreviewEdge === 'top'
              ? 'top-1.5 left-2 right-2 h-20'
              : 'bottom-1.5 left-2 right-2 h-20'
          }`}
        >
          <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-[#2563EB]">
            松手贴靠{getEdgeLabel(snapPreviewEdge)}
          </div>
        </div>
      )}

      {/* Floating Resizable & Edge-Dockable Chat Window */}
      <div
        style={{
          left: renderLeft,
          top: renderTop,
          width: bounds.width,
          height: bounds.height,
          transition: shouldAnimateSlide
            ? 'left 280ms cubic-bezier(0.22, 1, 0.36, 1), top 280ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease'
            : 'none',
        }}
        className={`fixed z-40 flex flex-col rounded-2xl overflow-hidden border border-slate-300/90 dark:border-slate-700/90 bg-white dark:bg-[#0d111a] shadow-[0_24px_60px_-14px_rgba(15,23,42,0.35)] ${
          isHidden ? 'ring-2 ring-[#2563EB]/45' : ''
        }`}
      >
        {/* Top Window Drag Titlebar */}
        <div
          onPointerDown={handleTitleBarPointerDown}
          onDoubleClick={() => {
            setIsHidden(false);
            setDockedEdge(null);
            onUpdateSettings({ displayMode: 'fullscreen' });
          }}
          className="h-9 shrink-0 px-3 flex items-center justify-between gap-2 bg-[#0b1222] text-slate-200 border-b border-white/10 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold tracking-wide text-white truncate">
              星涟 StarRipple
            </span>
            <span className="text-[10px] font-mono-tabular text-slate-400 shrink-0">
              {Math.round(bounds.width)}×{Math.round(bounds.height)}
            </span>
            {dockedEdge && (
              <span className="text-[10px] text-sky-300 font-medium truncate">
                · {getEdgeLabel(dockedEdge)}贴边
                {settings.autoHideEnabled ? (pinnedOpen ? '（已固定）' : '（自动隐藏）') : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0" data-no-drag="true">
            {(
              [
                { edge: 'left', icon: ArrowLeftToLine, label: '左', title: '贴靠左侧隐藏' },
                { edge: 'top', icon: ArrowUpToLine, label: '上', title: '贴靠顶部向上隐藏' },
                { edge: 'bottom', icon: ArrowDownToLine, label: '下', title: '贴靠底部向下隐藏' },
                { edge: 'right', icon: ArrowRightToLine, label: '右', title: '贴靠右侧隐藏' },
              ] as const
            ).map((btn) => {
              const Icon = btn.icon;
              const isCur = dockedEdge === btn.edge;
              return (
                <button
                  key={btn.edge}
                  type="button"
                  onClick={() => {
                    if (isCur) {
                      setDockedEdge(null);
                      setIsHidden(false);
                      onToast?.(`已取消${getEdgeLabel(btn.edge)}贴边`);
                    } else {
                      if (
                        (btn.edge === 'top' || btn.edge === 'bottom') &&
                        settings.allowedEdges !== 'all' &&
                        settings.allowedEdges !== 'vertical'
                      ) {
                        onUpdateSettings({ allowedEdges: 'all' });
                      }
                      snapToEdge(btn.edge);
                      onToast?.(
                        settings.autoHideEnabled
                          ? `已贴靠屏幕${getEdgeLabel(btn.edge)}，移出鼠标自动隐藏`
                          : `已贴靠屏幕${getEdgeLabel(btn.edge)}`
                      );
                    }
                  }}
                  className={`p-1.5 rounded-md text-[11px] font-medium flex items-center gap-0.5 transition-colors ${
                    isCur
                      ? 'bg-[#2563EB] text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                  title={isCur ? `取消${getEdgeLabel(btn.edge)}贴边` : btn.title}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                const next = !settings.autoHideEnabled;
                onUpdateSettings({ autoHideEnabled: next });
                if (!next) setIsHidden(false);
                onToast?.(next ? '已开启贴边自动隐藏' : '已关闭贴边自动隐藏');
              }}
              className={`p-1.5 rounded-md transition-colors ${
                settings.autoHideEnabled
                  ? 'text-teal-300 bg-teal-500/15 hover:bg-teal-500/25'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
              title={settings.autoHideEnabled ? '自动隐藏：已开启' : '自动隐藏：已关闭'}
            >
              {settings.autoHideEnabled ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>

            {dockedEdge && settings.autoHideEnabled && (
              <button
                type="button"
                onClick={() => {
                  const next = !pinnedOpen;
                  setPinnedOpen(next);
                  if (next) setIsHidden(false);
                  onToast?.(next ? '已临时固定展开，暂停自动隐藏' : '已恢复自动隐藏');
                }}
                className={`p-1.5 rounded-md transition-colors ${
                  pinnedOpen
                    ? 'text-amber-300 bg-amber-500/20'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
                title={pinnedOpen ? '取消临时固定' : '临时固定展开（不自动隐藏）'}
              >
                {pinnedOpen ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 rounded-md text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              title="贴边隐藏与窗口自定义设置"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {dockedEdge && settings.autoHideEnabled && (
              <button
                type="button"
                onClick={() => {
                  clearTimers();
                  setPinnedOpen(false);
                  setIsHidden(true);
                }}
                className="p-1.5 rounded-md text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                title="立即缩进隐藏到屏幕边缘"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsHidden(false);
                setDockedEdge(null);
                onUpdateSettings({ displayMode: 'fullscreen' });
              }}
              className="p-1.5 rounded-md text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              title="切换全屏模式"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main App Content Container (bounded cleanly inside floating window) */}
        <div
          className={`flex-1 min-h-0 min-w-0 flex overflow-hidden relative ${
            isHidden ? 'pointer-events-none' : ''
          }`}
        >
          {children}
        </div>

        {/* Live Size Pill while Dragging/Resizing */}
        {(resizing !== null || dragging) && (
          <div className="absolute bottom-3 right-3 z-50 px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-[11px] font-mono-tabular shadow-lg pointer-events-none">
            {Math.round(bounds.width)} × {Math.round(bounds.height)}
          </div>
        )}

        {/* 8-Direction Resize Handles */}
        {!isHidden && (
          <>
            <div
              onPointerDown={handleResizePointerDown('n')}
              className="absolute top-0 left-3 right-3 h-1.5 cursor-ns-resize z-50"
            />
            <div
              onPointerDown={handleResizePointerDown('s')}
              className="absolute bottom-0 left-3 right-3 h-1.5 cursor-ns-resize z-50"
            />
            <div
              onPointerDown={handleResizePointerDown('w')}
              className="absolute left-0 top-3 bottom-3 w-1.5 cursor-ew-resize z-50 hover:bg-[#2563EB]/40 transition-colors"
            />
            <div
              onPointerDown={handleResizePointerDown('e')}
              className="absolute right-0 top-3 bottom-3 w-1.5 cursor-ew-resize z-50 hover:bg-[#2563EB]/40 transition-colors"
            />
            <div
              onPointerDown={handleResizePointerDown('nw')}
              className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize z-50"
            />
            <div
              onPointerDown={handleResizePointerDown('ne')}
              className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize z-50"
            />
            <div
              onPointerDown={handleResizePointerDown('sw')}
              className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize z-50"
            />
            <div
              onPointerDown={handleResizePointerDown('se')}
              className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize z-50"
            />
          </>
        )}
      </div>

      {/* Edge Hot-Zone & Visual Peek Strip when Hidden */}
      {isHidden && dockedEdge && (
        <div
          onPointerEnter={() => {
            if (revealTimerRef.current !== null) {
              window.clearTimeout(revealTimerRef.current);
              revealTimerRef.current = null;
            }
            if (settings.revealDelayMs <= 0) {
              setIsHidden(false);
            } else {
              revealTimerRef.current = window.setTimeout(() => {
                revealTimerRef.current = null;
                setIsHidden(false);
              }, settings.revealDelayMs);
            }
          }}
          onClick={() => {
            clearTimers();
            setIsHidden(false);
          }}
          style={
            dockedEdge === 'right'
              ? {
                  right: 0,
                  top: bounds.y,
                  height: bounds.height,
                  width: Math.max(18, settings.peekWidthPx + 12),
                }
              : dockedEdge === 'left'
              ? {
                  left: 0,
                  top: bounds.y,
                  height: bounds.height,
                  width: Math.max(18, settings.peekWidthPx + 12),
                }
              : dockedEdge === 'top'
              ? {
                  top: 0,
                  left: bounds.x,
                  width: bounds.width,
                  height: Math.max(18, settings.peekWidthPx + 12),
                }
              : {
                  bottom: 0,
                  left: bounds.x,
                  width: bounds.width,
                  height: Math.max(18, settings.peekWidthPx + 12),
                }
          }
          className="fixed z-50 cursor-pointer flex items-center justify-center group"
          title="鼠标移至此处或点击即可滑出聊天窗口"
        >
          {settings.indicatorStyle === 'tab' ? (
            <div
              className={`bg-gradient-to-b from-[#2563EB] to-[#0D9488] text-white shadow-xl flex items-center justify-center gap-1 transition-transform group-hover:scale-105 ${
                dockedEdge === 'right'
                  ? 'rounded-l-xl px-1.5 py-4 flex-col'
                  : dockedEdge === 'left'
                  ? 'rounded-r-xl px-1.5 py-4 flex-col'
                  : dockedEdge === 'top'
                  ? 'rounded-b-xl px-4 py-1 flex-row'
                  : 'rounded-t-xl px-4 py-1 flex-row'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] font-bold tracking-wider">
                {dockedEdge === 'top' || dockedEdge === 'bottom' ? '星涟聊天' : '星\n涟'}
              </span>
              {totalUnread > 0 && (
                <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-mono-tabular font-bold flex items-center justify-center">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>
          ) : settings.indicatorStyle === 'glow' ? (
            <div
              className={`relative transition-all ${
                dockedEdge === 'top'
                  ? 'w-28 h-1.5 rounded-b-full bg-gradient-to-r from-sky-400 via-[#2563EB] to-teal-400 shadow-[0_0_16px_rgba(37,99,235,0.65)]'
                  : dockedEdge === 'bottom'
                  ? 'w-28 h-1.5 rounded-t-full bg-gradient-to-r from-sky-400 via-[#2563EB] to-teal-400 shadow-[0_0_16px_rgba(37,99,235,0.65)]'
                  : 'h-32 w-1.5 rounded-full bg-gradient-to-b from-sky-400 via-[#2563EB] to-teal-400 shadow-[0_0_16px_rgba(37,99,235,0.65)]'
              } ${
                dockedEdge === 'right'
                  ? 'ml-auto mr-0.5'
                  : dockedEdge === 'left'
                  ? 'mr-auto ml-0.5'
                  : dockedEdge === 'top'
                  ? 'mb-auto mt-0.5'
                  : 'mt-auto mb-0.5'
              }`}
            >
              {totalUnread > 0 && dockedEdge !== 'top' && dockedEdge !== 'bottom' && (
                <span
                  className={`absolute top-1/2 -translate-y-1/2 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-mono-tabular font-bold flex items-center justify-center shadow-md ${
                    dockedEdge === 'right' ? 'right-2' : 'left-2'
                  }`}
                >
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
              {totalUnread > 0 && (dockedEdge === 'top' || dockedEdge === 'bottom') && (
                <span
                  className={`absolute left-1/2 -translate-x-1/2 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-mono-tabular font-bold flex items-center justify-center shadow-md ${
                    dockedEdge === 'top' ? 'top-2' : 'bottom-2'
                  }`}
                >
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>
          ) : (
            <div
              className={`bg-slate-400/70 dark:bg-slate-500/70 ${
                dockedEdge === 'top'
                  ? 'w-20 h-1 rounded-b-full mb-auto'
                  : dockedEdge === 'bottom'
                  ? 'w-20 h-1 rounded-t-full mt-auto'
                  : 'h-24 w-1 rounded-full'
              } ${dockedEdge === 'right' ? 'ml-auto mr-0.5' : dockedEdge === 'left' ? 'mr-auto ml-0.5' : ''}`}
            />
          )}
        </div>
      )}

      {settingsOpen && (
        <WindowDockSettingsModal
          settings={settings}
          dockedEdge={dockedEdge}
          bounds={bounds}
          onUpdateSettings={onUpdateSettings}
          onApplyPreset={(w, h, edge) => {
            if (edge) {
              snapToEdge(edge, w, h);
            } else {
              const { vw: curVw, vh: curVh } = getViewportSize();
              setBounds({
                x: Math.max(20, Math.round((curVw - w) / 2)),
                y: Math.max(20, Math.round((curVh - h) / 2)),
                width: Math.min(w, curVw),
                height: Math.min(h, curVh),
              });
              setDockedEdge(null);
            }
          }}
          onTestHide={() => {
            onUpdateSettings({ displayMode: 'floating', autoHideEnabled: true });
            snapToEdge('right');
            setSettingsOpen(false);
            window.setTimeout(() => setIsHidden(true), 120);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
};

interface WindowDockSettingsModalProps {
  settings: WindowDockSettings;
  dockedEdge: DockedEdge;
  bounds: WindowBounds;
  onUpdateSettings: (patch: Partial<WindowDockSettings>) => void;
  onApplyPreset: (width: number, height: number, edge: DockedEdge) => void;
  onTestHide: () => void;
  onClose: () => void;
}

interface CustomWindowPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  edge: DockedEdge;
}

const CUSTOM_WINDOW_PRESETS_KEY = 'star_ripple_custom_window_presets_v1';

const WindowDockSettingsModal: React.FC<WindowDockSettingsModalProps> = ({
  settings,
  dockedEdge,
  bounds,
  onUpdateSettings,
  onApplyPreset,
  onTestHide,
  onClose,
}) => {
  const [customPresets, setCustomPresets] = useState<CustomWindowPreset[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_WINDOW_PRESETS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });
  const [presetName, setPresetName] = useState('');
  const [presetWidth, setPresetWidth] = useState(Math.round(bounds.width));
  const [presetHeight, setPresetHeight] = useState(Math.round(bounds.height));
  const [presetEdge, setPresetEdge] = useState<DockedEdge>(dockedEdge || 'right');

  const persistPresets = (next: CustomWindowPreset[]) => {
    setCustomPresets(next);
    try {
      localStorage.setItem(CUSTOM_WINDOW_PRESETS_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  };

  const handleAddPreset = () => {
    const safeW = Math.max(MIN_WINDOW_W, Math.min(2400, Number(presetWidth) || MIN_WINDOW_W));
    const safeH = Math.max(MIN_WINDOW_H, Math.min(1600, Number(presetHeight) || MIN_WINDOW_H));
    const nextItem: CustomWindowPreset = {
      id: `preset-${Date.now()}`,
      name: presetName.trim() || `自定义 ${safeW}×${safeH}`,
      width: safeW,
      height: safeH,
      edge: presetEdge,
    };
    persistPresets([...customPresets, nextItem]);
    setPresetName('');
  };

  return (
    <div
      data-window-keep-open="true"
      className="fixed inset-0 z-[130] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#161b26] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">窗口贴边与自动隐藏设置</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              自定义贴边范围、隐藏/滑出延迟、露边宽度与边缘视觉样式
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Core Toggle */}
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 cursor-pointer">
            <div>
              <div className="text-sm font-semibold">启用贴边自动隐藏</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                窗口贴靠屏幕边缘且鼠标离开后自动缩进隐藏，移入边缘热区自动滑出
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoHideEnabled}
              onChange={(e) => onUpdateSettings({ autoHideEnabled: e.target.checked })}
              className="w-4 h-4 accent-[#2563EB]"
            />
          </label>

          {/* Allowed Dock Edges */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-700 dark:text-slate-200">
              允许贴靠的屏幕边缘
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'right_only', label: '仅最右侧' },
                  { id: 'horizontal', label: '左右两侧' },
                  { id: 'vertical', label: '上下两侧' },
                  { id: 'all', label: '上下左右四边' },
                ] as Array<{ id: AllowedDockEdges; label: string }>
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateSettings({ allowedEdges: opt.id })}
                  className={`py-2 px-2 rounded-xl border font-medium transition-colors ${
                    settings.allowedEdges === opt.id
                      ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#2563EB]/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Delays */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">离开自动隐藏延迟</span>
                <span className="font-mono-tabular text-[#2563EB] font-bold">
                  {settings.hideDelayMs} ms
                </span>
              </div>
              <input
                type="range"
                min={150}
                max={2500}
                step={50}
                value={settings.hideDelayMs}
                onChange={(e) => onUpdateSettings({ hideDelayMs: Number(e.target.value) })}
                className="w-full accent-[#2563EB]"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>150ms 极速</span>
                <span>2500ms 从容</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">移入边缘滑出延迟</span>
                <span className="font-mono-tabular text-[#2563EB] font-bold">
                  {settings.revealDelayMs} ms
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={500}
                step={20}
                value={settings.revealDelayMs}
                onChange={(e) => onUpdateSettings({ revealDelayMs: Number(e.target.value) })}
                className="w-full accent-[#2563EB]"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0ms 即时滑出</span>
                <span>500ms 防误触</span>
              </div>
            </div>
          </div>

          {/* Peek width & Snap threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">隐藏后边缘露出宽度</span>
                <span className="font-mono-tabular text-[#2563EB] font-bold">
                  {settings.peekWidthPx} px
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={16}
                step={1}
                value={settings.peekWidthPx}
                onChange={(e) => onUpdateSettings({ peekWidthPx: Number(e.target.value) })}
                className="w-full accent-[#2563EB]"
              />
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">边缘磁吸吸附距离</span>
                <span className="font-mono-tabular text-[#2563EB] font-bold">
                  {settings.snapThresholdPx} px
                </span>
              </div>
              <input
                type="range"
                min={12}
                max={56}
                step={2}
                value={settings.snapThresholdPx}
                onChange={(e) => onUpdateSettings({ snapThresholdPx: Number(e.target.value) })}
                className="w-full accent-[#2563EB]"
              />
            </div>
          </div>

          {/* Indicator Style */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-700 dark:text-slate-200">
              缩进隐藏后的边缘指示条样式
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'glow', label: '星涟极光条 + 未读标' },
                  { id: 'tab', label: '经典侧边耳标' },
                  { id: 'minimal', label: '极简细线' },
                ] as Array<{ id: EdgeIndicatorStyle; label: string }>
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onUpdateSettings({ indicatorStyle: st.id })}
                  className={`py-2 px-2.5 rounded-xl border font-medium transition-colors ${
                    settings.indicatorStyle === st.id
                      ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#2563EB]/50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Auto Reveal on New Unread */}
          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
            <div>
              <div className="font-semibold">收到新消息时自动短暂滑出提醒</div>
              <div className="text-[11px] text-slate-500">
                隐藏期间有新未读消息时自动探出窗口并在无操作后缩回
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoRevealOnUnread}
              onChange={(e) => onUpdateSettings({ autoRevealOnUnread: e.target.checked })}
              className="w-4 h-4 accent-[#2563EB]"
            />
          </label>

          {/* Quick Size & Dock Presets */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                快捷尺寸与自定义窗口预设
              </span>
              <span className="text-[11px] font-mono-tabular text-slate-400">
                当前 {Math.round(bounds.width)}×{Math.round(bounds.height)}
                {dockedEdge ? ` · 贴靠${getEdgeLabel(dockedEdge)}` : ''}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onApplyPreset(440, 700, 'right')}
                className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] hover:text-[#2563EB] font-medium"
              >
                经典右窄栏 440×700
              </button>
              <button
                type="button"
                onClick={() => onApplyPreset(960, 660, 'right')}
                className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] hover:text-[#2563EB] font-medium"
              >
                右贴边工作窗 960×660
              </button>
              <button
                type="button"
                onClick={() => onApplyPreset(1120, 720, null)}
                className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] hover:text-[#2563EB] font-medium"
              >
                居中宽屏 1120×720
              </button>
            </div>

            {customPresets.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {customPresets.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50"
                  >
                    <button
                      type="button"
                      onClick={() => onApplyPreset(item.width, item.height, item.edge)}
                      className="flex-1 text-left truncate hover:text-[#2563EB] font-medium"
                      title={`点击应用：${item.width}×${item.height}`}
                    >
                      <span>{item.name}</span>
                      <span className="ml-1.5 text-[10px] font-mono-tabular text-slate-400">
                        {item.width}×{item.height}
                        {item.edge === 'right'
                          ? ' · 右'
                          : item.edge === 'left'
                          ? ' · 左'
                          : item.edge === 'top'
                          ? ' · 顶'
                          : item.edge === 'bottom'
                          ? ' · 底'
                          : ' · 居中'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        persistPresets(customPresets.filter((p) => p.id !== item.id))
                      }
                      className="p-1 text-slate-400 hover:text-rose-500 rounded"
                      title="删除预设"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300">
                <span>保存自定义窗口大小预设</span>
                <button
                  type="button"
                  onClick={() => {
                    setPresetWidth(Math.round(bounds.width));
                    setPresetHeight(Math.round(bounds.height));
                    setPresetEdge(dockedEdge);
                  }}
                  className="text-[#2563EB] hover:underline"
                >
                  读取当前窗口尺寸
                </button>
              </div>
              <div className="grid grid-cols-12 gap-1.5 items-center">
                <input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="预设名称"
                  className="col-span-4 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-[#2563EB]"
                />
                <input
                  type="number"
                  min={MIN_WINDOW_W}
                  max={2400}
                  value={presetWidth}
                  onChange={(e) => setPresetWidth(Number(e.target.value))}
                  aria-label="窗口宽度"
                  className="col-span-2 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono-tabular focus:outline-none focus:border-[#2563EB]"
                />
                <input
                  type="number"
                  min={MIN_WINDOW_H}
                  max={1600}
                  value={presetHeight}
                  onChange={(e) => setPresetHeight(Number(e.target.value))}
                  aria-label="窗口高度"
                  className="col-span-2 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono-tabular focus:outline-none focus:border-[#2563EB]"
                />
                <select
                  value={presetEdge || 'center'}
                  onChange={(e) =>
                    setPresetEdge(
                      e.target.value === 'center' ? null : (e.target.value as DockedEdge)
                    )
                  }
                  className="col-span-2 px-1.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="right">贴右</option>
                  <option value="left">贴左</option>
                  <option value="top">贴顶</option>
                  <option value="bottom">贴底</option>
                  <option value="center">居中</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddPreset}
                  className="col-span-2 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>保存</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => onUpdateSettings(DEFAULT_WINDOW_DOCK_SETTINGS)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复默认</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTestHide}
              className="px-3.5 py-1.5 rounded-lg border border-[#2563EB]/40 text-[#2563EB] hover:bg-[#2563EB]/10 text-xs font-medium"
            >
              立即右贴边并缩进
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium"
            >
              完成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
