import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playSoundEffect } from '../utils/soundEngine';

const SNAP_THRESHOLD = 58;
const BURST_PARTICLES = [
  { dx: 24, dy: -8, size: 6 },
  { dx: 15, dy: -22, size: 5 },
  { dx: -16, dy: -20, size: 6 },
  { dx: -25, dy: 4, size: 5 },
  { dx: -11, dy: 21, size: 6 },
  { dx: 17, dy: 18, size: 5 },
];

interface DragSnapshot {
  originX: number;
  originY: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  width: number;
  height: number;
}

interface BurstSnapshot {
  id: number;
  x: number;
  y: number;
  color: string;
}

export interface DraggableUnreadBadgeProps {
  count: number;
  muted?: boolean;
  className?: string;
  soundEnabled?: boolean;
  title?: string;
  onDismiss: () => void;
}

export const DraggableUnreadBadge: React.FC<DraggableUnreadBadgeProps> = ({
  count,
  muted = false,
  className = '',
  soundEnabled = true,
  title = '长按拖拽红点可一键清除未读',
  onDismiss,
}) => {
  const badgeRef = useRef<HTMLSpanElement | null>(null);
  const dragRef = useRef<DragSnapshot | null>(null);
  const onDismissRef = useRef(onDismiss);
  const soundEnabledRef = useRef(soundEnabled);
  const mutedRef = useRef(muted);
  const draggedMovedRef = useRef(false);
  const burstTimerRef = useRef<number | null>(null);

  const [dragState, setDragState] = useState<DragSnapshot | null>(null);
  const [burstState, setBurstState] = useState<BurstSnapshot | null>(null);

  onDismissRef.current = onDismiss;
  soundEnabledRef.current = soundEnabled;
  mutedRef.current = muted;

  useEffect(() => {
    return () => {
      if (burstTimerRef.current !== null) {
        window.clearTimeout(burstTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!dragState) return;

    const handleMove = (ev: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;
      const dx = ev.clientX - current.startX;
      const dy = ev.clientY - current.startY;
      if (Math.hypot(dx, dy) >= 4) {
        draggedMovedRef.current = true;
      }
      const next: DragSnapshot = { ...current, dx, dy };
      dragRef.current = next;
      setDragState(next);
    };

    const suppressNextClick = () => {
      const handler = (clickEv: MouseEvent) => {
        clickEv.preventDefault();
        clickEv.stopPropagation();
        window.removeEventListener('click', handler, true);
      };
      window.addEventListener('click', handler, true);
      window.setTimeout(() => {
        window.removeEventListener('click', handler, true);
      }, 160);
    };

    const finishDrag = (ev: PointerEvent) => {
      const current = dragRef.current;
      dragRef.current = null;
      setDragState(null);

      if (!current) return;
      const dist = Math.hypot(current.dx, current.dy);

      if (draggedMovedRef.current) {
        suppressNextClick();
      }
      draggedMovedRef.current = false;

      if (ev.type === 'pointerup' && dist > SNAP_THRESHOLD) {
        const fillColor = mutedRef.current ? '#94a3b8' : '#f43f5e';
        const burstX = current.originX + current.dx;
        const burstY = current.originY + current.dy;

        if (burstTimerRef.current !== null) {
          window.clearTimeout(burstTimerRef.current);
        }
        setBurstState({
          id: Date.now(),
          x: burstX,
          y: burstY,
          color: fillColor,
        });
        burstTimerRef.current = window.setTimeout(() => {
          setBurstState(null);
        }, 360);

        if (soundEnabledRef.current) {
          playSoundEffect('bubble_pop', 75);
        }
        try {
          if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(25);
          }
        } catch {
          // Ignore environments blocking vibration
        }
        onDismissRef.current();
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);
    };
  }, [Boolean(dragState)]);

  if (count <= 0 && !burstState) {
    return null;
  }

  const label = count > 99 ? '99+' : String(count);
  const bgClass = muted ? 'bg-slate-400' : 'bg-rose-500';
  const fillColor = muted ? '#94a3b8' : '#f43f5e';

  const handlePointerDown = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.stopPropagation();

    const el = badgeRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const initial: DragSnapshot = {
      originX: rect.left + rect.width / 2,
      originY: rect.top + rect.height / 2,
      startX: e.clientX,
      startY: e.clientY,
      dx: 0,
      dy: 0,
      width: Math.max(16, rect.width),
      height: Math.max(16, rect.height),
    };
    draggedMovedRef.current = false;
    dragRef.current = initial;
    setDragState(initial);
  };

  let tetherElement: React.ReactNode = null;
  if (dragState) {
    const dist = Math.hypot(dragState.dx, dragState.dy);
    const snapped = dist > SNAP_THRESHOLD;
    const badgeCenterX = dragState.originX + dragState.dx;
    const badgeCenterY = dragState.originY + dragState.dy;
    const r2 = Math.min(dragState.width, dragState.height) / 2;
    const t = Math.min(1, dist / SNAP_THRESHOLD);
    const r1 = Math.max(1.8, r2 * 0.85 * (1 - t * 0.78));

    let tetherPath = '';
    if (!snapped && dist > 1) {
      const ux = dragState.dx / dist;
      const uy = dragState.dy / dist;
      const nx = -uy;
      const ny = ux;
      const mx = (dragState.originX + badgeCenterX) / 2;
      const my = (dragState.originY + badgeCenterY) / 2;

      const ax1 = dragState.originX + nx * r1;
      const ay1 = dragState.originY + ny * r1;
      const ax2 = dragState.originX - nx * r1;
      const ay2 = dragState.originY - ny * r1;
      const bx1 = badgeCenterX + nx * r2;
      const by1 = badgeCenterY + ny * r2;
      const bx2 = badgeCenterX - nx * r2;
      const by2 = badgeCenterY - ny * r2;

      tetherPath = `M ${ax1} ${ay1} Q ${mx} ${my} ${bx1} ${by1} L ${bx2} ${by2} Q ${mx} ${my} ${ax2} ${ay2} Z`;
    }

    tetherElement = (
      <div className="fixed inset-0 pointer-events-none z-[120] select-none">
        {!snapped && dist > 1 && (
          <svg className="w-full h-full overflow-visible">
            <circle cx={dragState.originX} cy={dragState.originY} r={r1} fill={fillColor} />
            <path d={tetherPath} fill={fillColor} />
          </svg>
        )}
        <span
          style={{
            left: badgeCenterX,
            top: badgeCenterY,
            width: dragState.width,
            height: dragState.height,
            transform: `translate(-50%, -50%) scale(${snapped ? 1.16 : 1.04})`,
          }}
          className={`fixed rounded-full text-white text-[10px] font-mono-tabular font-semibold flex items-center justify-center shadow-lg transition-transform duration-100 ${bgClass} ${
            snapped ? 'ring-4 ring-rose-500/25' : ''
          }`}
        >
          {label}
        </span>
      </div>
    );
  }

  const burstElement = burstState ? (
    <div
      key={burstState.id}
      className="fixed inset-0 pointer-events-none z-[125] select-none"
    >
      <span
        style={{
          left: burstState.x,
          top: burstState.y,
          borderColor: burstState.color,
        }}
        className="fixed w-5 h-5 rounded-full border-2 animate-sr-badge-pop-ring"
      />
      {BURST_PARTICLES.map((p, idx) => (
        <span
          key={idx}
          style={
            {
              left: burstState.x,
              top: burstState.y,
              width: p.size,
              height: p.size,
              backgroundColor: burstState.color,
              '--drop-x': `${p.dx}px`,
              '--drop-y': `${p.dy}px`,
            } as React.CSSProperties
          }
          className="fixed rounded-full animate-sr-badge-droplet"
        />
      ))}
    </div>
  ) : null;

  return (
    <>
      {count > 0 && (
        <span
          ref={badgeRef}
          data-unread-badge="true"
          draggable={false}
          onDragStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            if (e.button === 0) e.stopPropagation();
          }}
          onPointerDown={handlePointerDown}
          title={title}
          className={`min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-mono-tabular font-semibold inline-flex items-center justify-center shrink-0 touch-none select-none cursor-grab active:cursor-grabbing hover:scale-110 transition-transform ${bgClass} ${
            dragState ? 'opacity-0' : ''
          } ${className}`}
        >
          {label}
        </span>
      )}
      {typeof document !== 'undefined' && tetherElement
        ? createPortal(tetherElement, document.body)
        : null}
      {typeof document !== 'undefined' && burstElement
        ? createPortal(burstElement, document.body)
        : null}
    </>
  );
};
