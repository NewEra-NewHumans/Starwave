import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { FIREBASE_PROJECT_ID } from '../firebase';
import {
  AllowedEmailProvider,
  CloudUserAccount,
  formatAccountIdDisplay,
  registerWithAllowedEmail,
  reloadCurrentUser,
  resendVerificationMail,
  signInWithAllowedEmail,
  signInWithGoogleEmail,
  signInWithMicrosoftEmail,
  signOutAccount,
  validateAllowedAuthEmail,
} from '../utils/accountService';

interface AuthGateModalProps {
  open: boolean;
  onClose: () => void;
  authUser: User | null;
  cloudAccount: CloudUserAccount | null;
  allocatingId: boolean;
  onJumpToAddById: () => void;
  onSyncComplete: (user: User) => Promise<void>;
}

export const AuthGateModal: React.FC<AuthGateModalProps> = ({
  open,
  onClose,
  authUser,
  cloudAccount,
  allocatingId,
  onJumpToAddById,
  onSyncComplete,
}) => {
  const [authTab, setAuthTab] = useState<'oauth' | 'email'>('oauth');
  const [emailMode, setEmailMode] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [consoleGuideProvider, setConsoleGuideProvider] = useState<
    'microsoft' | 'email' | null
  >(null);
  const [copiedId, setCopiedId] = useState(false);

  if (!open) return null;

  const emailCheck = email.trim() ? validateAllowedAuthEmail(email) : null;

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setConsoleGuideProvider(null);
    setLoading(true);
    const res = await signInWithGoogleEmail();
    setLoading(false);
    if (res.error) {
      setErrorMsg(res.error);
      return;
    }
    if (res.user) {
      await onSyncComplete(res.user);
    }
  };

  const handleMicrosoftLogin = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setConsoleGuideProvider(null);
    setLoading(true);
    const res = await signInWithMicrosoftEmail();
    setLoading(false);
    if (res.error) {
      setErrorMsg(res.error);
      if (res.needsConsoleSetup && res.providerHint) {
        setConsoleGuideProvider(res.providerHint);
      }
      return;
    }
    if (res.user) {
      await onSyncComplete(res.user);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setConsoleGuideProvider(null);

    const validation = validateAllowedAuthEmail(email);
    if (!validation.valid) {
      setErrorMsg(validation.error || '邮箱格式不受支持');
      return;
    }

    setLoading(true);
    const res =
      emailMode === 'register'
        ? await registerWithAllowedEmail(email, password, displayName)
        : await signInWithAllowedEmail(email, password);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
      if (res.needsConsoleSetup && res.providerHint) {
        setConsoleGuideProvider(res.providerHint);
      }
      return;
    }

    if (res.user) {
      if (!res.user.emailVerified) {
        setInfoMsg(
          `验证邮件已发送至 ${res.user.email}，请打开收件箱点击验证链接后点击下方「我已完成验证」。`
        );
      } else {
        await onSyncComplete(res.user);
      }
    }
  };

  const handleCheckVerified = async () => {
    setErrorMsg('');
    setLoading(true);
    const updated = await reloadCurrentUser();
    if (updated && updated.emailVerified) {
      await onSyncComplete(updated);
      setInfoMsg('邮箱验证成功！已为您激活专属 9 位星涟号。');
    } else {
      setErrorMsg('暂未检测到邮箱验证完成，请先在邮件中点击确认链接后再试。');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (!authUser) return;
    setErrorMsg('');
    setLoading(true);
    const err = await resendVerificationMail(authUser);
    setLoading(false);
    if (err) {
      setErrorMsg(err);
    } else {
      setInfoMsg(`已重新发送验证邮件至 ${authUser.email}。`);
    }
  };

  const handleCopyAccountId = () => {
    if (!cloudAccount) return;
    navigator.clipboard?.writeText(cloudAccount.accountId).catch(() => {});
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  const renderProviderLabel = (p: AllowedEmailProvider) =>
    p === 'google' ? 'Google 邮箱账号' : 'Microsoft 邮箱账号';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#0D9488] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              星
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                星涟 StarRipple · 邮箱通行证与专属星涟号
              </h2>
              <p className="text-[11px] text-slate-500">
                支持 Google / Microsoft 邮箱注册与登录 · 全面替代手机号注册
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* State A: Verified & Exclusive Account ID Ready */}
          {authUser && authUser.emailVerified && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/25 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>邮箱已验证 · 云端名片同步开启</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {cloudAccount ? renderProviderLabel(cloudAccount.emailProvider) : '已认证账号'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3">
                  <div>
                    <div className="text-[11px] text-slate-500">我的专属星涟号（9位唯一识别码）</div>
                    <div className="text-2xl font-bold tracking-wider font-mono-tabular text-[#2563EB] dark:text-sky-400 mt-0.5">
                      {allocatingId
                        ? '正在生成...'
                        : cloudAccount
                        ? formatAccountIdDisplay(cloudAccount.accountId)
                        : '同步中...'}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!cloudAccount}
                    onClick={handleCopyAccountId}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#2563EB] hover:text-[#2563EB] flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        复制号码
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2">
                  <span>绑定邮箱：{authUser.email}</span>
                  <span>昵称：{cloudAccount?.name || authUser.displayName || '星涟用户'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onJumpToAddById();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  通过星涟号查找并添加好友
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await signOutAccount();
                    setInfoMsg('已退出当前星涟账号。');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  切换账号
                </button>
              </div>
            </div>
          )}

          {/* State B: Signed in via Email/Password but awaiting verification */}
          {authUser && !authUser.emailVerified && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-4 space-y-3 text-xs">
              <div className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>请验证您的邮箱以分配专属星涟号</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                当前登录邮箱为 <span className="font-mono-tabular font-semibold">{authUser.email}</span>。
                为防止恶意抢注号码，完成邮件链接验证后系统将立即为您分配唯一 9 位星涟号。
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCheckVerified}
                  className="px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  我已完成验证，领取星涟号
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleResend}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                >
                  重发验证邮件
                </button>
                <button
                  type="button"
                  onClick={() => signOutAccount()}
                  className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-800"
                >
                  更换其他邮箱
                </button>
              </div>
            </div>
          )}

          {/* State C: Not Signed In */}
          {!authUser && (
            <>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    无手机号极简注册：
                  </span>
                  仅接受 <span className="font-medium text-slate-900 dark:text-white">Google 邮箱 (@gmail.com)</span> 与{' '}
                  <span className="font-medium text-slate-900 dark:text-white">Microsoft 邮箱 (@outlook.com / @hotmail.com)</span>。
                  验证成功后自动生成 9 位专属星涟号。
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('oauth');
                    setErrorMsg('');
                    setConsoleGuideProvider(null);
                  }}
                  className={`py-2 rounded-lg font-medium transition-colors ${
                    authTab === 'oauth'
                      ? 'bg-white dark:bg-slate-900 text-[#2563EB] shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Google / Microsoft 一键登录
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('email');
                    setErrorMsg('');
                    setConsoleGuideProvider(null);
                  }}
                  className={`py-2 rounded-lg font-medium transition-colors ${
                    authTab === 'email'
                      ? 'bg-white dark:bg-slate-900 text-[#2563EB] shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  邮箱密码注册 / 登录
                </button>
              </div>

              {authTab === 'oauth' ? (
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleLogin}
                    className="w-full py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>使用 Google 邮箱登录 / 自动注册（推荐）</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleMicrosoftLogin}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[#2563EB] text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center justify-center gap-2.5 disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4 text-[#0D9488]" />
                    <span>使用 Microsoft 邮箱授权登录（Outlook / Hotmail）</span>
                  </button>

                  <p className="text-[11px] text-slate-400 text-center pt-1">
                    使用 Google 账号授权无需额外配置，登录即自动分配唯一 9 位星涟号。
                  </p>
                </div>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {emailMode === 'register' ? '新用户邮箱注册' : '已有账号登录'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailMode((m) => (m === 'register' ? 'login' : 'register'));
                        setErrorMsg('');
                      }}
                      className="text-[#2563EB] hover:underline font-medium"
                    >
                      {emailMode === 'register' ? '已有账号？去登录' : '没有账号？去注册'}
                    </button>
                  </div>

                  {emailMode === 'register' && (
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        个人昵称
                      </label>
                      <input
                        type="text"
                        maxLength={40}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="例如：林深见鹿"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-slate-500">
                        Google / Microsoft 邮箱地址（禁止手机号）
                      </label>
                      {emailCheck?.valid && emailCheck.provider && (
                        <span className="text-[11px] font-medium text-[#0D9488]">
                          已识别为 {emailCheck.provider === 'google' ? 'Google 邮箱' : 'Microsoft 邮箱'}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@gmail.com 或 name@outlook.com"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                    {emailCheck && !emailCheck.valid && (
                      <div className="text-[11px] text-rose-600 mt-1">
                        {emailCheck.error}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      登录密码（至少 6 位）
                    </label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="输入密码"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {loading
                      ? '处理中...'
                      : emailMode === 'register'
                      ? '注册并发送验证邮件'
                      : '使用邮箱密码登录'}
                  </button>
                </form>
              )}
            </>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50 dark:bg-sky-950/30 p-3 text-xs text-sky-800 dark:text-sky-200 leading-relaxed">
              {infoMsg}
            </div>
          )}

          {consoleGuideProvider && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/25 p-3.5 text-[11px] text-amber-900 dark:text-amber-200 space-y-1.5 leading-relaxed">
              <div className="font-semibold">
                Firebase 控制台启用指引（项目 ID：{FIREBASE_PROJECT_ID}）
              </div>
              <p>
                默认仅自动开启了 Google 登录。如需使用{' '}
                {consoleGuideProvider === 'microsoft' ? 'Microsoft OAuth' : '邮箱密码注册'}
                ：
              </p>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-700 dark:text-slate-300">
                <li>打开 Firebase Console → Authentication → Sign-in method</li>
                <li>
                  点击「添加新提供商」，启用{' '}
                  <span className="font-semibold">
                    {consoleGuideProvider === 'microsoft' ? 'Microsoft' : '电子邮件地址/密码'}
                  </span>
                </li>
                <li>若为 Microsoft，填入 Azure 应用的 Client ID 与 Secret 后保存即可使用</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
