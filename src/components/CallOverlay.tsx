import React, { useEffect, useRef, useState } from 'react';
import {
  FileText,
  Film,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  MonitorUp,
  Music,
  PhoneOff,
  Sparkles,
  UserCheck,
  Users,
  Video,
  VideoOff,
} from 'lucide-react';
import { ActiveCallState } from '../types/qq';
import { AvatarView } from './AvatarView';

interface CallOverlayProps {
  call: ActiveCallState | null;
  onUpdateCall: (updater: (prev: ActiveCallState) => ActiveCallState) => void;
  onHangUp: () => void;
  onInviteMore: () => void;
}

const TRACKS = [
  { title: '晴天 · Acoustic Unplugged', artist: '林小雨推荐歌单', lyric: '刮风这天 我试过握着你手 · 一起听歌同步中' },
  { title: 'Late Night Coding Lo-Fi', artist: '陈工的工作台', lyric: 'Soft rain on the window glass · 02:14 / 03:45' },
  { title: '西湖暮色钢琴曲', artist: '云端共听频道', lyric: '轻柔的琴声与晚风一同飘过湖面' },
];

const DOC_SLIDES = [
  { title: '星涟 StarRipple 全端协同架构', bullets: ['单群最高 2000 人实时消息投递', '多端 WebSocket 增量状态同步', '10GB 极速快传 P2P 分片校验'] },
  { title: '星澜智能引擎与隐私保护', bullets: ['未读消息一键提取议题与待办', '端到端加密传输 + 密钥指纹核验', '专注/关怀/简洁三大场景模式'] },
  { title: '音视频实时互动体验升级', bullets: ['实时美颜滤镜与虚拟形象替身', '文档远程演示激光笔同步翻页', '一起看视频 & 一起听歌低延迟对齐'] },
];

export const CallOverlay: React.FC<CallOverlayProps> = ({
  call,
  onUpdateCall,
  onHangUp,
  onInviteMore,
}) => {
  const [minimized, setMinimized] = useState(false);
  const [myMicOn, setMyMicOn] = useState(true);
  const [myCamOn, setMyCamOn] = useState(call?.mode === 'video');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!call) return;
    setMyCamOn(call.mode === 'video');
    const tick = () => {
      setElapsedSec(Math.max(0, Math.floor((Date.now() - call.startedAt) / 1000)));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [call?.id]);

  // Request real webcam stream when video is toggled on
  useEffect(() => {
    let cancelled = false;
    async function startCam() {
      if (!call || !myCamOn || call.virtualAvatar) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        setCameraReady(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setCameraReady(true);
      } catch {
        setCameraReady(false);
      }
    }
    startCam();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [call?.id, myCamOn, call?.virtualAvatar]);

  if (!call) return null;

  const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const secs = String(elapsedSec % 60).padStart(2, '0');

  const filterCss =
    call.beautyFilter === 'natural'
      ? 'brightness(1.06) contrast(0.96) saturate(1.08)'
      : call.beautyFilter === 'warm'
      ? 'sepia(0.18) brightness(1.05) saturate(1.2)'
      : call.beautyFilter === 'cool'
      ? 'hue-rotate(12deg) contrast(1.05) saturate(0.92)'
      : call.beautyFilter === 'mono'
      ? 'grayscale(100%) contrast(1.1)'
      : 'none';

  const handleScreenShare = async () => {
    if (!call.screenSharing) {
      try {
        const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
        display.getTracks().forEach((t) => t.stop());
      } catch {
        // Simulated workspace screen share when browser cancels or blocks
      }
    }
    onUpdateCall((prev) => ({
      ...prev,
      screenSharing: !prev.screenSharing,
      docPresenting: false,
      watchTogether: false,
    }));
  };

  if (minimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-2xl border border-slate-700">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        <div className="min-w-0">
          <div className="text-xs font-semibold truncate max-w-[160px]">
            {call.conversationTitle}
          </div>
          <div className="text-[11px] text-slate-300 font-mono-tabular">
            {call.mode === 'video' ? '视频通话' : '语音通话'} · {mins}:{secs} · {call.participants.length + 1}人
          </div>
        </div>
        <button
          onClick={() => setMinimized(false)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
          title="展开通话窗口"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={onHangUp}
          className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500"
          title="挂断"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const currentSlide = DOC_SLIDES[call.docPage % DOC_SLIDES.length];
  const currentTrack = TRACKS[call.listenTrackIndex % TRACKS.length];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-[#14171f] text-white border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <div>
              <h3 className="text-sm font-semibold">{call.conversationTitle}</h3>
              <p className="text-xs text-slate-400 font-mono-tabular">
                {call.isGroup ? '多人/群通话' : '1对1通话'} · {mins}:{secs} · {call.participants.length + 1}人连线中
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onInviteMore}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5" />
              邀请成员
            </button>
            <button
              onClick={() => setMinimized(true)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="缩小为悬浮窗"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Stage: Shared Mode OR Participant Grid */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {call.screenSharing && (
            <div className="rounded-xl bg-slate-900 border border-sky-500/40 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-sky-400">
                <span className="font-medium">正在屏幕分享 · 我共享的桌面工作区</span>
                <button
                  onClick={handleScreenShare}
                  className="px-2.5 py-1 rounded bg-rose-600/20 text-rose-300 hover:bg-rose-600/30"
                >
                  停止共享
                </button>
              </div>
              <div className="h-56 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex flex-col items-center justify-center gap-2 p-6 text-center">
                <MonitorUp className="w-10 h-10 text-[#2563EB]" />
                <div className="text-sm font-medium">实时屏幕画面广播中 (1080p · 60fps)</div>
                <div className="text-xs text-slate-400">
                  所有参会成员均可实时查看您的演示窗口与鼠标轨迹
                </div>
              </div>
            </div>
          )}

          {call.docPresenting && (
            <div className="rounded-xl bg-slate-900 border border-indigo-500/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-indigo-300">
                  文档远程演示 · {currentSlide.title} (第 {(call.docPage % DOC_SLIDES.length) + 1} / {DOC_SLIDES.length} 页)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onUpdateCall((p) => ({
                        ...p,
                        docPage: (p.docPage - 1 + DOC_SLIDES.length) % DOC_SLIDES.length,
                      }))
                    }
                    className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() =>
                      onUpdateCall((p) => ({
                        ...p,
                        docPage: (p.docPage + 1) % DOC_SLIDES.length,
                      }))
                    }
                    className="px-2.5 py-1 text-xs rounded bg-[#2563EB] hover:bg-[#1D4ED8]"
                  >
                    下一页
                  </button>
                </div>
              </div>
              <div className="rounded-lg bg-white text-slate-900 p-6 space-y-3">
                <h4 className="text-lg font-bold">{currentSlide.title}</h4>
                <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                  {currentSlide.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {call.watchTogether && (
            <div className="rounded-xl bg-slate-900 border border-amber-500/40 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300 font-medium">一起看视频 · 《西湖秋色 4K 航拍短片》同步放映厅</span>
                <button
                  onClick={() => onUpdateCall((p) => ({ ...p, watchPlaying: !p.watchPlaying }))}
                  className="px-3 py-1 rounded bg-amber-500 text-slate-950 font-medium"
                >
                  {call.watchPlaying ? '暂停同步' : '一起播放'}
                </button>
              </div>
              <div className="h-48 rounded-lg bg-gradient-to-r from-amber-950 via-slate-900 to-sky-950 flex flex-col items-center justify-center relative overflow-hidden">
                <Film className={`w-10 h-10 text-amber-400 mb-2 transition-transform ${call.watchPlaying ? 'scale-105' : ''}`} />
                <div className="text-sm font-medium">
                  {call.watchPlaying ? '正在与大家同步播放中...' : '已暂停在 01:18'}
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={call.watchProgress}
                  onChange={(e) =>
                    onUpdateCall((p) => ({ ...p, watchProgress: Number(e.target.value) }))
                  }
                  className="w-3/4 mt-4 accent-amber-400"
                />
              </div>
            </div>
          )}

          {call.listenTogether && (
            <div className="rounded-xl bg-slate-900 border border-emerald-500/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                  <Music className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{currentTrack.title}</div>
                  <div className="text-xs text-slate-400">{currentTrack.artist} · {currentTrack.lyric}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onUpdateCall((p) => ({
                      ...p,
                      listenTrackIndex: (p.listenTrackIndex + 1) % TRACKS.length,
                    }))
                  }
                  className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700"
                >
                  切歌
                </button>
                <button
                  onClick={() => onUpdateCall((p) => ({ ...p, listenPlaying: !p.listenPlaying }))}
                  className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium"
                >
                  {call.listenPlaying ? '暂停共听' : '播放音乐'}
                </button>
              </div>
            </div>
          )}

          {/* Participant Video / Audio Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Local User Tile */}
            <div className="relative aspect-[4/3] rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col items-center justify-center">
              {call.virtualAvatar ? (
                <div className="flex flex-col items-center gap-2">
                  <svg viewBox="0 0 80 80" className="w-20 h-20">
                    <circle cx="40" cy="40" r="36" fill="#2563EB" opacity="0.2" />
                    <circle cx="40" cy="34" r="18" fill="#FCD5B5" />
                    <path d="M22 30 Q40 12 58 30" fill="#1e293b" />
                    <circle cx="33" cy="34" r="2.5" fill="#0f172a" />
                    <circle cx="47" cy="34" r="2.5" fill="#0f172a" />
                    <path d="M35 42 Q40 46 45 42" stroke="#e11d48" strokeWidth="2" fill="none" />
                    <path d="M18 72 Q40 54 62 72" fill="#2563EB" />
                  </svg>
                  <span className="text-[11px] text-sky-300">虚拟形象替身已开启</span>
                </div>
              ) : myCamOn && cameraReady ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ filter: filterCss }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  style={{ filter: filterCss }}
                  className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-800/80 to-slate-900"
                >
                  <AvatarView name="苏明远" size="lg" />
                  {myCamOn && (
                    <span className="mt-2 text-[11px] text-slate-400">
                      本地模拟视频流（{call.beautyFilter === 'none' ? '原画' : '美颜滤镜'}）
                    </span>
                  )}
                </div>
              )}
              <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 rounded bg-black/60 text-white">我 (苏明远)</span>
                {!myMicOn && <MicOff className="w-3.5 h-3.5 text-rose-400" />}
              </div>
            </div>

            {call.participants.map((p) => (
              <div
                key={p.id}
                className={`relative aspect-[4/3] rounded-xl bg-slate-900 border overflow-hidden flex flex-col items-center justify-center ${
                  p.speaking ? 'border-emerald-500' : 'border-slate-800'
                }`}
              >
                <AvatarView name={p.name} src={p.avatar} size="lg" />
                <span className="mt-2 text-xs text-slate-400">
                  {p.speaking ? '正在发言...' : p.muted ? '已静音' : '在线收听'}
                </span>
                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded bg-black/60 text-white truncate">{p.name}</span>
                  {p.muted && <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                </div>
              </div>
            ))}
          </div>

          {/* Beauty / Filter / Avatar Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900/90 border border-slate-800 px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                美颜与滤镜:
              </span>
              {(
                [
                  { id: 'none', label: '原画' },
                  { id: 'natural', label: '自然美颜' },
                  { id: 'warm', label: '暖阳' },
                  { id: 'cool', label: '清冷' },
                  { id: 'mono', label: '黑白胶片' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => onUpdateCall((prev) => ({ ...prev, beautyFilter: f.id }))}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    call.beautyFilter === f.id
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={() =>
                onUpdateCall((prev) => ({ ...prev, virtualAvatar: !prev.virtualAvatar }))
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                call.virtualAvatar
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {call.virtualAvatar ? '关闭虚拟形象' : '开启虚拟形象'}
            </button>
          </div>
        </div>

        {/* Bottom Action Toolbar */}
        <div className="px-5 py-4 border-t border-slate-800 flex flex-wrap items-center justify-center gap-2.5 bg-[#101219]">
          <button
            onClick={() => setMyMicOn(!myMicOn)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium ${
              myMicOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-rose-600/80 text-white'
            }`}
          >
            {myMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            {myMicOn ? '麦克风开' : '已静音'}
          </button>

          <button
            onClick={() => setMyCamOn(!myCamOn)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium ${
              myCamOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-800/60 text-slate-400'
            }`}
          >
            {myCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            {myCamOn ? '摄像头开' : '摄像头关'}
          </button>

          <button
            onClick={handleScreenShare}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium ${
              call.screenSharing ? 'bg-[#2563EB] text-white' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <MonitorUp className="w-4 h-4" />
            屏幕分享
          </button>

          <button
            onClick={() =>
              onUpdateCall((p) => ({
                ...p,
                docPresenting: !p.docPresenting,
                screenSharing: false,
                watchTogether: false,
              }))
            }
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium ${
              call.docPresenting ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            文档远程演示
          </button>

          <button
            onClick={() =>
              onUpdateCall((p) => ({
                ...p,
                watchTogether: !p.watchTogether,
                screenSharing: false,
                docPresenting: false,
              }))
            }
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium ${
              call.watchTogether ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <Film className="w-4 h-4" />
            一起看视频
          </button>

          <button
            onClick={() =>
              onUpdateCall((p) => ({ ...p, listenTogether: !p.listenTogether }))
            }
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium ${
              call.listenTogether ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <Music className="w-4 h-4" />
            一起听歌
          </button>

          <button
            onClick={onHangUp}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white ml-2"
          >
            <PhoneOff className="w-4 h-4" />
            挂断通话
          </button>
        </div>
      </div>
    </div>
  );
};
