import { SoundEffectId } from '../types/qq';
import { playSoundEffect } from './soundEngine';

// Deterministic QR matrix generator for Flash Transfer & Add Friend QR cards
export function generateQrMatrix(seedStr: string, size = 21): boolean[][] {
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[r0 + r][c0 + c] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      hash = Math.imul(hash ^ (r * 31 + c * 17), 16777619) >>> 0;
      matrix[r][c] = hash % 11 < 5;
    }
  }
  return matrix;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

// Synthesize StarRipple notification chimes cleanly via Web Audio API
export function playTone(
  kind: SoundEffectId | 'lofi' | 'call' | 'nudge' | 'mute',
  volumePercent = 80
): void {
  const mapped = kind === 'lofi' ? 'lofi_warm' : kind;
  playSoundEffect(mapped, volumePercent);
}

function sanitizeCsvCell(raw: string): string {
  const text = String(raw ?? '');
  const formulaSafe = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${formulaSafe.replace(/"/g, '""')}"`;
}

export function exportSolitaireCsv(
  title: string,
  entries: Array<{ index: number; authorName: string; value: string; time: string }>
): void {
  const header = ['序号', '群成员', '接龙内容', '提交时间'];
  const rows = entries.map((e) => [
    String(e.index),
    sanitizeCsvCell(e.authorName),
    sanitizeCsvCell(e.value),
    sanitizeCsvCell(e.time),
  ]);
  const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^\w\u4e00-\u9fa5-]/g, '_')}_接龙导出.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
