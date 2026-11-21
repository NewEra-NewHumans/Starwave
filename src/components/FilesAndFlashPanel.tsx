import React, { useMemo, useState } from 'react';
import {
  Archive,
  Calendar as CalendarIcon,
  Check,
  Download,
  FileText,
  Film,
  Forward,
  Image as ImageIcon,
  Link2,
  MapPin,
  Pause,
  Play,
  Plus,
  QrCode,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';
import {
  Conversation,
  FileAttachment,
  FlashTransferBatch,
  StoredFileItem,
} from '../types/qq';
import { formatBytes } from '../utils/qr';
import { QrCodeSvg } from './AvatarView';

interface FilesAndFlashPanelProps {
  storedFiles: StoredFileItem[];
  flashBatches: FlashTransferBatch[];
  p2pTransfers: FileAttachment[];
  conversations: Conversation[];
  onToggleP2pPause: (fileId: string) => void;
  onCreateFlashBatch: (batch: FlashTransferBatch) => void;
  onAddFileToFlashBatch: (batchId: string, file: FlashTransferBatch['files'][0]) => void;
  onDeleteFileFromFlashBatch: (batchId: string, fileId: string) => void;
  onUpdateFlashExpiry: (batchId: string, expiryDays: 90 | 180) => void;
  onBatchDeleteFiles: (fileIds: string[]) => void;
  onBatchForwardFiles: (files: StoredFileItem[]) => void;
  onLocateInChat: (conversationId: string, messageId: string) => void;
  onShowToast?: (msg: string) => void;
}

export const FilesAndFlashPanel: React.FC<FilesAndFlashPanelProps> = ({
  storedFiles,
  flashBatches,
  p2pTransfers,
  onToggleP2pPause,
  onCreateFlashBatch,
  onAddFileToFlashBatch,
  onDeleteFileFromFlashBatch,
  onUpdateFlashExpiry,
  onBatchDeleteFiles,
  onBatchForwardFiles,
  onLocateInChat,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'flash' | 'manager' | 'p2p'>('flash');

  // Flash transfer state
  const [newTitle, setNewTitle] = useState('');
  const [expiryDays, setExpiryDays] = useState<90 | 180>(180);
  const [activeQrBatchId, setActiveQrBatchId] = useState<string>(flashBatches[0]?.id || '');
  const [flashError, setFlashError] = useState('');
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  // File manager filter state
  const [typeFilter, setTypeFilter] = useState<'all' | StoredFileItem['fileType']>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '7d' | 'month'>('all');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(true);

  const TEN_GB = 10 * 1024 * 1024 * 1024;

  const handleUploadFlashFile = (e: React.ChangeEvent<HTMLInputElement>, targetBatchId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > TEN_GB) {
      setFlashError('单文件超过 10GB 上限，请拆分后上传');
      return;
    }
    setFlashError('');
    const fileType: StoredFileItem['fileType'] = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
      ? 'video'
      : file.name.endsWith('.zip') || file.name.endsWith('.rar')
      ? 'archive'
      : 'document';

    const newEntry = {
      id: `ff-${Date.now()}`,
      name: file.name,
      sizeBytes: file.size || 2450000,
      fileType,
      progress: 100,
    };

    if (targetBatchId) {
      onAddFileToFlashBatch(targetBatchId, newEntry);
      return;
    }

    const code = `SR-${Math.floor(1000 + Math.random() * 9000)}`;
    const batch: FlashTransferBatch = {
      id: `flash-${Date.now()}`,
      title: newTitle.trim() || `${file.name} 无损快传`,
      shareCode: code,
      shareUrl: `https://transfer.starripple.example/s/${code}`,
      expiryDays,
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16),
      expiresAt: expiryDays === 90 ? '2027-02-17' : '2027-05-18',
      downloads: 0,
      files: [newEntry],
    };
    onCreateFlashBatch(batch);
    setActiveQrBatchId(batch.id);
    setNewTitle('');
  };

  const handleSimulateLarge10Gb = () => {
    const code = `SR-${Math.floor(1000 + Math.random() * 9000)}`;
    const batch: FlashTransferBatch = {
      id: `flash-${Date.now()}`,
      title: newTitle.trim() || '8.6GB 4K原片工程无损快传',
      shareCode: code,
      shareUrl: `https://transfer.starripple.example/s/${code}`,
      expiryDays,
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16),
      expiresAt: expiryDays === 90 ? '2027-02-17' : '2027-05-18',
      downloads: 0,
      files: [
        {
          id: `ff-${Date.now()}`,
          name: 'RAW_Cinema_Master_8.6GB.mov',
          sizeBytes: 9234179686,
          fileType: 'video',
          progress: 100,
        },
      ],
    };
    onCreateFlashBatch(batch);
    setActiveQrBatchId(batch.id);
    setNewTitle('');
  };

  const filteredFiles = useMemo(() => {
    return storedFiles.filter((f) => {
      if (typeFilter !== 'all' && f.fileType !== typeFilter) return false;
      if (selectedCalendarDate && f.dateStr !== selectedCalendarDate) return false;
      if (timeFilter === 'today' && f.dateStr !== '2026-11-19') return false;
      if (timeFilter === '7d' && f.dateStr < '2026-11-12') return false;
      return true;
    });
  }, [storedFiles, typeFilter, timeFilter, selectedCalendarDate]);

  const calendarDays = useMemo(() => {
    // November 2026 calendar grid (30 days, Nov 1 2026 is Sunday)
    const activeDates = new Set(storedFiles.map((f) => f.dateStr));
    return Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const dateStr = `2026-11-${String(day).padStart(2, '0')}`;
      return { day, dateStr, hasFile: activeDates.has(dateStr) };
    });
  }, [storedFiles]);

  const toggleSelectFile = (id: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const renderFileIcon = (type: StoredFileItem['fileType']) => {
    if (type === 'image') return <ImageIcon className="w-4 h-4 text-sky-500" />;
    if (type === 'video') return <Film className="w-4 h-4 text-amber-500" />;
    if (type === 'archive') return <Archive className="w-4 h-4 text-indigo-500" />;
    return <FileText className="w-4 h-4 text-emerald-600" />;
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden sr-aurora-canvas">
      {/* Header */}
      <div className="px-6 py-4 bg-white/82 dark:bg-[#151a25]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            文件传输与极速快传中心
          </h2>
          <p className="text-xs text-slate-500">
            单文件最高 10GB 无损不限速快传 · 90/180天长效期 · 跨应用扫码免登录下载 · 聊天文件按日历溯源
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/90">
          {[
            { id: 'flash', label: '极速快传 (10GB)' },
            { id: 'manager', label: '聊天文件管理' },
            { id: 'p2p', label: '多端断点续传' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? 'bg-white dark:bg-slate-900 text-[#2563EB] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: Flash Transfer */}
        {activeTab === 'flash' && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              {/* Create Flash Batch Box */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 bg-[#f8fafc] dark:bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#2563EB]" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      发起无损闪传（单文件最大 10GB · 不限速）
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-500">有效期：</span>
                    {([90, 180] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setExpiryDays(d)}
                        className={`px-2.5 py-1 rounded-md font-mono-tabular ${
                          expiryDays === d
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {d}天
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="闪传包标题（可选，如：设计工程源文件）"
                    className="flex-1 min-w-[200px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  />
                  <label className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] cursor-pointer whitespace-nowrap">
                    <Upload className="w-3.5 h-3.5" />
                    选择本地文件
                    <input
                      type="file"
                      onChange={(e) => handleUploadFlashFile(e)}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handleSimulateLarge10Gb}
                    className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 whitespace-nowrap"
                  >
                    模拟 8.6GB 大文件闪传
                  </button>
                </div>
                {flashError && <p className="text-xs text-rose-600">{flashError}</p>}
              </div>

              {/* Flash Batches List */}
              <div className="space-y-4">
                {flashBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {batch.title}
                        </h3>
                        <div className="text-xs text-slate-500 font-mono-tabular mt-0.5">
                          提取码 {batch.shareCode} · 有效期 {batch.expiryDays} 天（至 {batch.expiresAt}）· 已下载 {batch.downloads} 次
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={batch.expiryDays}
                          onChange={(e) =>
                            onUpdateFlashExpiry(batch.id, Number(e.target.value) as 90 | 180)
                          }
                          className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-slate-700 dark:text-slate-300"
                        >
                          <option value={90}>改 90 天</option>
                          <option value={180}>改 180 天</option>
                        </select>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(`${batch.shareUrl} 提取码:${batch.shareCode}`);
                            setCopiedShareId(batch.id);
                            setTimeout(() => setCopiedShareId(null), 2000);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        >
                          {copiedShareId === batch.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Link2 className="w-3.5 h-3.5" />
                          )}
                          跨应用复制链接
                        </button>
                        <button
                          onClick={() => setActiveQrBatchId(batch.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          二维码
                        </button>
                      </div>
                    </div>

                    {/* Files inside batch with Add / Delete */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-100 dark:border-slate-800">
                      {batch.files.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {renderFileIcon(f.fileType)}
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                              {f.name}
                            </span>
                            <span className="text-slate-400 font-mono-tabular shrink-0">
                              {formatBytes(f.sizeBytes)} · 原画无损
                            </span>
                          </div>
                          <button
                            onClick={() => onDeleteFileFromFlashBatch(batch.id, f.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="从已分享闪传中删除此文件"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] cursor-pointer hover:underline">
                        <Plus className="w-3.5 h-3.5" />
                        向此闪传追加文件
                        <input
                          type="file"
                          onChange={(e) => handleUploadFlashFile(e, batch.id)}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono-tabular">
                        共 {batch.files.length} 个文件 · 合计{' '}
                        {formatBytes(batch.files.reduce((s, x) => s + x.sizeBytes, 0))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: External Friend Download QR Card */}
            <div className="space-y-4">
              {(() => {
                const target =
                  flashBatches.find((b) => b.id === activeQrBatchId) || flashBatches[0];
                if (!target) return null;
                return (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center text-center space-y-3 bg-[#f8fafc] dark:bg-slate-900/50">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      跨平台免登录扫码下载
                    </div>
                    <p className="text-xs text-slate-500">
                      手机 / 浏览器扫一扫即可不限速下载原文件
                    </p>
                    <QrCodeSvg value={target.shareUrl} size={160} label={`提取码 ${target.shareCode}`} />
                    <div className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-left space-y-1">
                      <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                        {target.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono-tabular truncate">
                        {target.shareUrl}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 2: Chat File Management (Type + Time + Calendar Filter + Batch Ops + Locate in Chat) */}
        {activeTab === 'manager' && (
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'all', label: '全部类型' },
                    { id: 'document', label: '文档' },
                    { id: 'image', label: '图片' },
                    { id: 'video', label: '视频' },
                    { id: 'archive', label: '压缩包' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTypeFilter(t.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      typeFilter === t.id
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as typeof timeFilter)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                >
                  <option value="all">全部时间</option>
                  <option value="today">今天</option>
                  <option value="7d">最近 7 天</option>
                  <option value="month">本月</option>
                </select>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border ${
                    showCalendar
                      ? 'border-[#2563EB] text-[#2563EB] bg-[#2563EB]/5'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  日历筛选
                </button>
              </div>

              {selectedFileIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono-tabular">
                    已选 {selectedFileIds.length} 项
                  </span>
                  <button
                    onClick={() => {
                      const picked = storedFiles.filter((f) => selectedFileIds.includes(f.id));
                      onBatchForwardFiles(picked);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#2563EB] text-white"
                  >
                    <Forward className="w-3.5 h-3.5" />
                    批量转发
                  </button>
                  <button
                    onClick={() => {
                      onShowToast?.(`已开始批量打包下载 ${selectedFileIds.length} 个文件`);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    批量下载
                  </button>
                  <button
                    onClick={() => {
                      onBatchDeleteFiles(selectedFileIds);
                      setSelectedFileIds([]);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-600 text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    批量删除
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
              {showCalendar && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 h-fit">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      2026年 11月 文件日历
                    </span>
                    {selectedCalendarDate && (
                      <button
                        onClick={() => setSelectedCalendarDate(null)}
                        className="text-[11px] text-[#2563EB] hover:underline"
                      >
                        清除日期
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-400">
                    {['日', '一', '二', '三', '四', '五', '六'].map((w) => (
                      <span key={w}>{w}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((d) => {
                      const selected = selectedCalendarDate === d.dateStr;
                      return (
                        <button
                          key={d.dateStr}
                          onClick={() =>
                            setSelectedCalendarDate(selected ? null : d.dateStr)
                          }
                          className={`h-8 rounded-md text-xs font-mono-tabular relative flex items-center justify-center transition-colors ${
                            selected
                              ? 'bg-[#2563EB] text-white font-semibold'
                              : d.hasFile
                              ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-medium hover:bg-sky-100'
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {d.day}
                          {d.hasFile && !selected && (
                            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#2563EB]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div
                className={`${
                  showCalendar ? 'lg:col-span-3' : 'lg:col-span-4'
                } rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden`}
              >
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredFiles.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                      当前筛选条件下暂无聊天文件
                    </div>
                  ) : (
                    filteredFiles.map((file) => {
                      const checked = selectedFileIds.includes(file.id);
                      return (
                        <div
                          key={file.id}
                          className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSelectFile(file.id)}
                              className="w-4 h-4 accent-[#2563EB]"
                            />
                            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              {renderFileIcon(file.fileType)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {file.name}
                              </div>
                              <div className="text-xs text-slate-500 font-mono-tabular truncate">
                                {formatBytes(file.sizeBytes)} · 来自「{file.conversationTitle}」({file.senderName}) · {file.dateStr} {file.timeStr}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => onLocateInChat(file.conversationId, file.messageId)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 whitespace-nowrap"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              定位到对应聊天
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Multi-device P2P Resumable Transfers */}
        {activeTab === 'p2p' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                手机电脑多端点对点断点续传队列
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                支持图片、文档、压缩包、视频在多端之间点对点断点续传，网络波动中断后可从精确字节进度恢复。
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {p2pTransfers.map((item) => (
                <div key={item.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {renderFileIcon(item.fileType)}
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono-tabular">
                          总大小 {formatBytes(item.sizeBytes)} · 进度 {item.progress ?? 0}% ·{' '}
                          {item.paused
                            ? '已暂停（保留断点分片）'
                            : (item.progress ?? 0) >= 100
                            ? '多端同步完成'
                            : `局域网 P2P 直传 ${item.speedMbps || 72.4} MB/s`}
                        </div>
                      </div>
                    </div>
                    {(item.progress ?? 0) < 100 && (
                      <button
                        onClick={() => onToggleP2pPause(item.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                      >
                        {item.paused ? (
                          <>
                            <Play className="w-3.5 h-3.5 text-[#2563EB]" />
                            继续续传
                          </>
                        ) : (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            暂停
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        item.paused ? 'bg-amber-500' : 'bg-[#2563EB]'
                      }`}
                      style={{ width: `${item.progress ?? 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
