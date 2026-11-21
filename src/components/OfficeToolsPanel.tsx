import React, { useState } from 'react';
import {
  Bookmark,
  Calendar,
  Crop,
  FileSpreadsheet,
  Laptop,
  Mail,
  MousePointerClick,
  Plus,
  Send,
  Share2,
} from 'lucide-react';
import {
  FavoriteItem,
  MailMessage,
  ScheduleEvent,
} from '../types/qq';

interface OfficeToolsPanelProps {
  mails: MailMessage[];
  onSendMail: (mail: MailMessage) => void;
  schedules: ScheduleEvent[];
  onAddSchedule: (ev: ScheduleEvent) => void;
  favorites: FavoriteItem[];
  onOpenScreenshotModal: () => void;
  onShareDocToGroup: (docTitle: string, docSummary: string) => void;
}

export const OfficeToolsPanel: React.FC<OfficeToolsPanelProps> = ({
  mails,
  onSendMail,
  schedules,
  onAddSchedule,
  favorites,
  onOpenScreenshotModal,
  onShareDocToGroup,
}) => {
  const [tab, setTab] = useState<'mail' | 'schedule' | 'docs' | 'remote' | 'favorites'>('mail');

  // Mail state
  const [selectedMailId, setSelectedMailId] = useState(mails[0]?.id || '');
  const [composingMail, setComposingMail] = useState(false);
  const [mailTo, setMailTo] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');

  // Schedule state
  const [schTitle, setSchTitle] = useState('');
  const [schDate, setSchDate] = useState('2026-11-20');
  const [schTime, setSchTime] = useState('14:00');
  const [schLocation, setSchLocation] = useState('星涟线上会议室');

  // Cloud Docs live collaborative editor state
  const [docTitle, setDocTitle] = useState('Q4 全端版本发布与协同测试清单');
  const [docBody, setDocBody] = useState(
    '1. 单聊/群聊核心链路验证：已通过（苏明远）\n2. 10GB 极速快传与二维码下载压测：已通过（陈子昂）\n3. 关怀模式大字体适配与简洁模式去噪：已走查（林小雨）\n4. 周五西湖团建餐厅统计表：接龙收集进行中'
  );
  const [docSharedMsg, setDocSharedMsg] = useState('');

  // Remote Assistance state
  const [remoteCode] = useState('729 418');
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [remotePeerInput, setRemotePeerInput] = useState('');
  const [remoteCursor, setRemoteCursor] = useState({ x: 45, y: 40 });

  // Favorites filter
  const [favCategory, setFavCategory] = useState<'all' | FavoriteItem['category']>('all');

  const selectedMail = mails.find((m) => m.id === selectedMailId) || mails[0];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-[#191c24]">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            星涟办公辅助与收藏中心
          </h2>
          <p className="text-xs text-slate-500">
            集成云端邮局、日程管理、全能截图、远程协助、协同云文档与分类收藏夹
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenScreenshotModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <Crop className="w-3.5 h-3.5 text-[#2563EB]" />
            全能截图工作台
          </button>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            {[
              { id: 'mail', label: '云端邮局', icon: Mail },
              { id: 'schedule', label: '日程管理', icon: Calendar },
              { id: 'docs', label: '协同云文档', icon: FileSpreadsheet },
              { id: 'remote', label: '远程协助', icon: Laptop },
              { id: 'favorites', label: '我的收藏', icon: Bookmark },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id as typeof tab)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    tab === item.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* 1. Cloud Mail */}
        {tab === 'mail' && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  收件箱 / 已发送 ({mails.length})
                </span>
                <button
                  onClick={() => setComposingMail(true)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#2563EB] text-white"
                >
                  写邮件
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {mails.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMailId(m.id);
                      setComposingMail(false);
                    }}
                    className={`w-full p-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      selectedMail?.id === m.id && !composingMail ? 'bg-[#2563EB]/5' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="truncate">{m.folder === 'sent' ? `发给: ${m.to}` : m.from}</span>
                      <span className="font-mono-tabular shrink-0">{m.time}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate mt-1">
                      {m.subject}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              {composingMail ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    发送新邮件 (sumingyuan@gmail.com)
                  </h3>
                  <input
                    value={mailTo}
                    onChange={(e) => setMailTo(e.target.value)}
                    placeholder="收件人邮箱，例如：name@gmail.com 或 name@outlook.com"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  />
                  <input
                    value={mailSubject}
                    onChange={(e) => setMailSubject(e.target.value)}
                    placeholder="邮件主题"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  />
                  <textarea
                    rows={8}
                    value={mailBody}
                    onChange={(e) => setMailBody(e.target.value)}
                    placeholder="输入正文内容..."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-900 dark:text-slate-100"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setComposingMail(false)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        if (!mailTo.trim() || !mailSubject.trim()) return;
                        const newMail: MailMessage = {
                          id: `mail-${Date.now()}`,
                          folder: 'sent',
                          from: 'sumingyuan@gmail.com',
                          to: mailTo.trim(),
                          subject: mailSubject.trim(),
                          body: mailBody,
                          time: '刚刚',
                          unread: false,
                        };
                        onSendMail(newMail);
                        setSelectedMailId(newMail.id);
                        setComposingMail(false);
                        setMailTo('');
                        setMailSubject('');
                        setMailBody('');
                      }}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-[#2563EB] text-white"
                    >
                      <Send className="w-3.5 h-3.5" />
                      立即发送
                    </button>
                  </div>
                </div>
              ) : selectedMail ? (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {selectedMail.subject}
                    </h3>
                    <div className="text-xs text-slate-500 mt-1 font-mono-tabular">
                      发件人：{selectedMail.from} · 收件人：{selectedMail.to} · {selectedMail.time}
                    </div>
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {selectedMail.body}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* 2. Schedule Management */}
        {tab === 'schedule' && (
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 bg-[#f8fafc] dark:bg-slate-900/50">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                新建星涟日程提醒
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <input
                  value={schTitle}
                  onChange={(e) => setSchTitle(e.target.value)}
                  placeholder="日程标题"
                  className="sm:col-span-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
                <input
                  type="date"
                  value={schDate}
                  onChange={(e) => setSchDate(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono-tabular"
                />
                <input
                  type="time"
                  value={schTime}
                  onChange={(e) => setSchTime(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono-tabular"
                />
              </div>
              <div className="flex gap-2">
                <input
                  value={schLocation}
                  onChange={(e) => setSchLocation(e.target.value)}
                  placeholder="会议室或地点"
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={() => {
                    if (!schTitle.trim()) return;
                    onAddSchedule({
                      id: `sch-${Date.now()}`,
                      title: schTitle.trim(),
                      dateStr: schDate,
                      timeStr: schTime,
                      participants: '苏明远, 林小雨',
                      location: schLocation,
                      remindMinutes: 15,
                    });
                    setSchTitle('');
                  }}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-medium rounded-lg bg-[#2563EB] text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加日程
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {schedules.map((s) => (
                <div key={s.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {s.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      参与人：{s.participants} · 地点：{s.location}
                    </div>
                  </div>
                  <div className="text-right font-mono-tabular shrink-0">
                    <div className="text-sm font-medium text-[#2563EB]">
                      {s.dateStr} {s.timeStr}
                    </div>
                    <div className="text-[11px] text-slate-400">提前 {s.remindMinutes} 分钟弹窗</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Tencent Docs Collaboration */}
        {tab === 'docs' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <input
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="text-base font-semibold bg-transparent border-b border-transparent focus:border-[#2563EB] text-slate-900 dark:text-slate-100 focus:outline-none"
                />
                <span className="text-xs text-emerald-600">
                  林小雨、陈子昂 正在共同编辑 · 已实时保存
                </span>
              </div>
              <button
                onClick={() => {
                  onShareDocToGroup(docTitle, docBody.split('\n')[0]);
                  setDocSharedMsg('已分享协作文档卡片至「2026 产品研发协同大群」');
                  setTimeout(() => setDocSharedMsg(''), 3000);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              >
                <Share2 className="w-3.5 h-3.5" />
                一键分享到群聊
              </button>
            </div>
            {docSharedMsg && <p className="text-xs text-emerald-600">{docSharedMsg}</p>}
            <textarea
              rows={12}
              value={docBody}
              onChange={(e) => setDocBody(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-900 p-5 text-sm leading-relaxed text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        )}

        {/* 4. Remote Assistance */}
        {tab === 'remote' && (
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-2">
                <div className="text-xs text-slate-500">本机远程识别码</div>
                <div className="text-2xl font-bold font-mono-tabular text-[#2563EB] tracking-wider">
                  {remoteCode}
                </div>
                <p className="text-xs text-slate-500">
                  将识别码发给好友后，对方可请求受控远程桌面协助，操作全程可一键中断。
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <div className="text-xs text-slate-500">输入对方识别码发起远程协助</div>
                <div className="flex gap-2">
                  <input
                    value={remotePeerInput}
                    onChange={(e) => setRemotePeerInput(e.target.value)}
                    placeholder="例如：814 290"
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-mono-tabular text-slate-900 dark:text-slate-100"
                  />
                  <button
                    onClick={() => setRemoteConnected(!remoteConnected)}
                    className={`px-4 py-2 text-xs font-medium rounded-lg text-white ${
                      remoteConnected ? 'bg-rose-600' : 'bg-[#2563EB]'
                    }`}
                  >
                    {remoteConnected ? '断开协助' : '请求连接'}
                  </button>
                </div>
              </div>
            </div>

            {remoteConnected && (
              <div
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setRemoteCursor({
                    x: Math.round(((e.clientX - rect.left) / rect.width) * 100),
                    y: Math.round(((e.clientY - rect.top) / rect.height) * 100),
                  });
                }}
                className="relative h-64 rounded-xl bg-slate-900 border border-slate-700 p-4 text-white overflow-hidden cursor-crosshair"
              >
                <div className="text-xs text-emerald-400 font-mono-tabular">
                  已连接至林小雨的 MacBook Pro · 端到端加密通道 · 光标坐标 ({remoteCursor.x}%, {remoteCursor.y}%)
                </div>
                <div className="mt-8 mx-auto max-w-md rounded-lg bg-slate-800 border border-slate-700 p-4 text-xs text-slate-300 space-y-2">
                  <div className="font-semibold text-white">远程桌面预览窗口</div>
                  <div>在下方移动鼠标即可实时同步远程控制光标位置。</div>
                </div>
                <div
                  className="absolute pointer-events-none transition-transform duration-75"
                  style={{ left: `${remoteCursor.x}%`, top: `${remoteCursor.y}%` }}
                >
                  <MousePointerClick className="w-5 h-5 text-[#2563EB]" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. My Favorites */}
        {tab === 'favorites' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-2">
              {(
                [
                  { id: 'all', label: '全部收藏' },
                  { id: 'chat', label: '聊天内容' },
                  { id: 'image', label: '图片' },
                  { id: 'link', label: '链接' },
                  { id: 'document', label: '文档' },
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFavCategory(c.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                    favCategory === c.id
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
              {favorites
                .filter((f) => favCategory === 'all' || f.category === favCategory)
                .map((fav) => (
                  <div key={fav.id} className="p-4 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {fav.title}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">{fav.content}</div>
                      <div className="text-xs text-slate-400">
                        来源：{fav.sourceName} · 收藏于 {fav.savedAt}
                      </div>
                    </div>
                    {fav.mediaUrl && (
                      <img
                        src={fav.mediaUrl}
                        alt={fav.title}
                        referrerPolicy="no-referrer"
                        className="w-20 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
