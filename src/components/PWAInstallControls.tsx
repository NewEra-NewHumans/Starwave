import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Laptop,
  Monitor,
  Smartphone,
  Terminal,
  WifiOff,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWAInstall();
  if (isOnline) return null;

  return (
    <div className="px-4 py-1.5 bg-amber-600 text-white text-xs font-medium flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <WifiOff className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">
          当前处于离线状态 · 已切换本地 PWA 离线缓存视图，恢复联网后将自动重连 WebSocket 实时通道
        </span>
      </div>
      <span className="text-[11px] font-mono-tabular opacity-90 shrink-0">OFFLINE</span>
    </div>
  );
};

export const PWAInstallModal: React.FC<{
  open: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onTriggerNativePrompt: () => void;
}> = ({
  open,
  onClose,
  isInstallable,
  isInstalled,
  isIOS,
  onTriggerNativePrompt,
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!open) return null;

  const copyCommand = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 1600);
  };

  const nativeConfigs = [
    {
      id: 'win',
      platform: 'Windows (.exe)',
      detail: 'Electron NSIS 安装包 · x64 / arm64 · 桌面快捷方式',
      cmd: 'npm run electron:build:win',
    },
    {
      id: 'mac',
      platform: 'macOS (.dmg)',
      detail: 'Electron Universal · Apple Silicon + Intel · 隐藏式标题栏',
      cmd: 'npm run electron:build:mac',
    },
    {
      id: 'android',
      platform: 'Android (.apk)',
      detail: 'Capacitor 原生壳 · 沉浸式状态栏 · Gradle Release 打包',
      cmd: 'npm run cap:sync && npx cap open android',
    },
    {
      id: 'ios',
      platform: 'iOS / iPadOS (.ipa)',
      detail: 'Capacitor Xcode 工程 · 需在 macOS Xcode 签名归档',
      cmd: 'npm run cap:sync && npx cap open ios',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#161b26] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              安装星涟客户端 · 四端 PWA 直装与原生安装包构建
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              支持浏览器一键安装为独立桌面/手机应用，也可通过项目内配置打包原生四端安装包
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {/* PWA Instant Install Section */}
          <div className="rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/70 dark:bg-sky-950/20 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-[#2563EB]" />
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  方案一：PWA 免商城跨端独立应用（立即可用）
                </span>
              </div>
              {isInstalled ? (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  当前已在独立应用窗口运行
                </span>
              ) : isInstallable ? (
                <button
                  onClick={onTriggerNativePrompt}
                  className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium whitespace-nowrap"
                >
                  立即弹出系统安装窗口
                </button>
              ) : (
                <span className="text-xs text-slate-500">通过浏览器菜单添加</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-2.5">
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1">
                  <Monitor className="w-3.5 h-3.5 text-sky-500" />
                  Windows / macOS (Chrome · Edge)
                </div>
                <p>在独立标签页打开本应用后，点击地址栏右侧「安装星涟」图标即可生成桌面图标与独立窗口。</p>
              </div>
              <div className="rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-2.5">
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1">
                  <Smartphone className="w-3.5 h-3.5 text-teal-500" />
                  {isIOS ? '当前 iPhone / iPad Safari' : 'iOS Safari / Android Chrome'}
                </div>
                <p>iOS 点击底部分享按钮 →「添加到主屏幕」；Android 点击右上角菜单 →「安装应用」。</p>
              </div>
            </div>
          </div>

          {/* Native 4-platform Packaging Commands */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Laptop className="w-4 h-4 text-[#2563EB]" />
                <span>方案二：四端原生独立安装包（Electron + Capacitor + CI）</span>
              </div>
              <span className="text-[11px] font-mono-tabular text-slate-500">
                已就绪打包配置与 GitHub Actions
              </span>
            </div>
            <p className="text-xs text-slate-500">
              项目已内置 <code className="font-mono text-[11px]">electron-builder.json</code>、
              <code className="font-mono text-[11px]">capacitor.config.ts</code> 与自动构建工作流；在对应目标系统或 GitHub Actions 中执行以下命令即可产出独立安装包：
            </p>
            <div className="space-y-2">
              {nativeConfigs.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/60 dark:bg-slate-900/40"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {item.platform}
                    </div>
                    <div className="text-[11px] text-slate-500">{item.detail}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <code className="px-2.5 py-1 rounded-lg bg-slate-900 text-sky-300 text-[11px] font-mono-tabular">
                      {item.cmd}
                    </code>
                    <button
                      onClick={() => copyCommand(item.id, item.cmd)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      title="复制构建命令"
                    >
                      {copiedCmd === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-[11px] text-slate-500 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span>
                说明：当前云端网页容器为 Linux 环境，缺少 macOS Xcode 与 Windows 签名环境，需在本地对应系统或触发仓库 CI Workflow 生成最终二进制安装包。
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PWAInstallButton: React.FC<{
  variant?: 'rail' | 'button';
  onToast?: (msg: string) => void;
}> = ({ variant = 'button', onToast }) => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await promptInstall();
      if (outcome === 'accepted') {
        onToast?.('星涟桌面/移动独立应用安装成功');
        return;
      }
      if (outcome === 'dismissed') return;
    }
    setGuideOpen(true);
  };

  return (
    <>
      {variant === 'rail' ? (
        <button
          type="button"
          onClick={handleClick}
          className={`w-full py-1.5 rounded-xl flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
            isInstalled
              ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
              : isInstallable
              ? 'bg-sky-500/20 text-sky-300 font-semibold hover:bg-sky-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/8'
          }`}
          title={
            isInstalled
              ? '已安装为独立客户端 · 点击查看四端安装包构建方案'
              : '安装星涟客户端 / 查看四端独立安装包'
          }
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isInstalled ? '客户端' : '安装'}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-[#2563EB] dark:text-sky-300 whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isInstalled ? '客户端构建与安装指南' : '安装四端独立应用'}</span>
        </button>
      )}

      <PWAInstallModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
        onTriggerNativePrompt={async () => {
          const res = await promptInstall();
          if (res === 'accepted') {
            setGuideOpen(false);
            onToast?.('星涟独立客户端已添加到系统桌面');
          }
        }}
      />
    </>
  );
};
