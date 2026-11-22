import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ChatMessage } from '../types/qq';
import { AccountDirectoryEntry, CloudUserAccount } from './accountService';

export interface CloudFriendRequest {
  requestId: string;
  fromUid: string;
  fromAccountId: string;
  fromName: string;
  fromAvatar: string;
  fromSignature: string;
  fromLevel: number;
  toUid: string;
  toAccountId: string;
  toName: string;
  toAvatar: string;
  note: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAtMs: number;
  updatedAtMs: number;
}

export interface CloudChat {
  chatId: string;
  kind: 'single' | 'group';
  title: string;
  avatar: string;
  ownerUid: string;
  memberUids: string[];
  lastMessagePreview: string;
  lastMessageTime: string;
  lastMessageSenderUid: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export type CloudSupportedMessageType =
  | 'text'
  | 'image'
  | 'file'
  | 'voice'
  | 'system'
  | 'red_packet';

function clampString(val: string | undefined | null, maxLen: number, fallback = ''): string {
  const clean = (val || fallback).trim();
  return clean.slice(0, maxLen);
}

function nowHHmm(): string {
  return new Date().toTimeString().slice(0, 5);
}

function timestampToMs(ts: unknown): number {
  if (ts instanceof Timestamp) return ts.toMillis();
  if (ts && typeof ts === 'object' && 'toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}

export function isCloudConversationId(convId: string): boolean {
  return convId.startsWith('dm_') || convId.startsWith('grp_');
}

export function getDirectChatId(uidA: string, uidB: string): string {
  const sorted = [uidA, uidB].sort();
  return `dm_${sorted[0]}_${sorted[1]}`;
}

function normalizeCloudMsgType(t: ChatMessage['type']): CloudSupportedMessageType {
  if (t === 'image' || t === 'file' || t === 'voice' || t === 'system' || t === 'red_packet') {
    return t;
  }
  return 'text';
}

function isSafeImageSourceUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(trimmed)) return true;
  if (/^https:\/\//i.test(trimmed)) return true;
  return false;
}

async function compressImageDataUrlIfNeeded(rawUrl: string): Promise<string> {
  if (!rawUrl || !isSafeImageSourceUrl(rawUrl)) return '';
  if (rawUrl.length <= 230000) return rawUrl;
  if (!rawUrl.startsWith('data:image/')) {
    return rawUrl.slice(0, 250000);
  }
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return '';
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const maxDim = 960;
        let width = img.naturalWidth || 800;
        let height = img.naturalHeight || 600;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        for (const q of [0.75, 0.55, 0.38]) {
          const encoded = canvas.toDataURL('image/jpeg', q);
          if (encoded.length <= 240000) {
            resolve(encoded);
            return;
          }
        }
        resolve('');
      } catch {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = rawUrl;
  });
}

function mapFriendRequestDoc(
  docSnap: { id: string; data: (options?: { serverTimestamps: 'estimate' }) => Record<string, unknown> }
): CloudFriendRequest {
  const d = docSnap.data({ serverTimestamps: 'estimate' });
  return {
    requestId: String(d.requestId || docSnap.id),
    fromUid: String(d.fromUid || ''),
    fromAccountId: String(d.fromAccountId || ''),
    fromName: String(d.fromName || '星涟用户'),
    fromAvatar: String(d.fromAvatar || ''),
    fromSignature: String(d.fromSignature || ''),
    fromLevel: Number(d.fromLevel || 1),
    toUid: String(d.toUid || ''),
    toAccountId: String(d.toAccountId || ''),
    toName: String(d.toName || '星涟用户'),
    toAvatar: String(d.toAvatar || ''),
    note: String(d.note || ''),
    status: (d.status as CloudFriendRequest['status']) || 'pending',
    createdAtMs: timestampToMs(d.createdAt),
    updatedAtMs: timestampToMs(d.updatedAt),
  };
}

export function subscribeToFriendRequests(
  uid: string,
  onData: (requests: CloudFriendRequest[]) => void
): () => void {
  const incomingQ = query(collection(db, 'friend_requests'), where('toUid', '==', uid));
  const outgoingQ = query(collection(db, 'friend_requests'), where('fromUid', '==', uid));

  let incomingMap = new Map<string, CloudFriendRequest>();
  let outgoingMap = new Map<string, CloudFriendRequest>();

  const emit = () => {
    const merged = new Map<string, CloudFriendRequest>();
    incomingMap.forEach((v, k) => merged.set(k, v));
    outgoingMap.forEach((v, k) => merged.set(k, v));
    const list = Array.from(merged.values()).sort((a, b) => b.updatedAtMs - a.updatedAtMs);
    onData(list);
  };

  const unsubIn = onSnapshot(
    incomingQ,
    (snap) => {
      incomingMap = new Map();
      snap.docs.forEach((docSnap) => {
        const req = mapFriendRequestDoc(docSnap);
        incomingMap.set(req.requestId, req);
      });
      emit();
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'friend_requests');
    }
  );

  const unsubOut = onSnapshot(
    outgoingQ,
    (snap) => {
      outgoingMap = new Map();
      snap.docs.forEach((docSnap) => {
        const req = mapFriendRequestDoc(docSnap);
        outgoingMap.set(req.requestId, req);
      });
      emit();
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'friend_requests');
    }
  );

  return () => {
    unsubIn();
    unsubOut();
  };
}

export async function sendFriendRequest(
  myAccount: CloudUserAccount,
  target: AccountDirectoryEntry,
  note: string,
  knownRequests: CloudFriendRequest[] = []
): Promise<'sent' | 'resent' | 'already_pending' | 'incoming_exists' | 'already_accepted'> {
  if (target.uid === myAccount.uid) {
    throw new Error('不能向自己发送好友申请。');
  }

  const reversePending = knownRequests.find(
    (r) => r.fromUid === target.uid && r.toUid === myAccount.uid && r.status === 'pending'
  );
  if (reversePending) {
    return 'incoming_exists';
  }

  const requestId = `${myAccount.uid}_${target.uid}`;
  const reqRef = doc(db, 'friend_requests', requestId);
  const path = `friend_requests/${requestId}`;

  const existingLocal = knownRequests.find((r) => r.requestId === requestId);
  if (existingLocal) {
    if (existingLocal.status === 'pending') return 'already_pending';
    if (existingLocal.status === 'accepted') return 'already_accepted';
    if (existingLocal.status === 'rejected') {
      try {
        await updateDoc(reqRef, {
          fromName: clampString(myAccount.name, 40, '星涟用户'),
          fromAvatar: clampString(myAccount.avatar, 500, ''),
          fromSignature: clampString(myAccount.signature, 160, ''),
          fromLevel: Math.max(1, Math.min(200, Math.round(myAccount.level || 1))),
          note: clampString(note, 120, ''),
          status: 'pending',
          updatedAt: serverTimestamp(),
        });
        return 'resent';
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  }

  try {
    await setDoc(reqRef, {
      requestId,
      fromUid: myAccount.uid,
      fromAccountId: myAccount.accountId,
      fromName: clampString(myAccount.name, 40, '星涟用户'),
      fromAvatar: clampString(myAccount.avatar, 500, ''),
      fromSignature: clampString(myAccount.signature, 160, ''),
      fromLevel: Math.max(1, Math.min(200, Math.round(myAccount.level || 1))),
      toUid: target.uid,
      toAccountId: target.accountId,
      toName: clampString(target.name, 40, '星涟用户'),
      toAvatar: clampString(target.avatar, 500, ''),
      note: clampString(note, 120, '你好，我想加你为星涟好友'),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return 'sent';
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function acceptFriendRequest(
  req: CloudFriendRequest,
  myAccount: CloudUserAccount,
  existingFriendIds: Set<string>,
  existingCloudChats: CloudChat[]
): Promise<string> {
  const reqRef = doc(db, 'friend_requests', req.requestId);
  const myFriendDocId = `uid-${req.fromUid}`;
  const peerFriendDocId = `uid-${myAccount.uid}`;
  const dmChatId = getDirectChatId(req.fromUid, myAccount.uid);

  const batch = writeBatch(db);
  batch.update(reqRef, {
    status: 'accepted',
    updatedAt: serverTimestamp(),
  });

  if (!existingFriendIds.has(myFriendDocId)) {
    batch.set(doc(db, 'users', myAccount.uid, 'friends', myFriendDocId), {
      friendId: myFriendDocId,
      uid: myAccount.uid,
      accountId: req.fromAccountId,
      name: clampString(req.fromName, 40, '我的好友'),
      remark: '',
      avatar: clampString(req.fromAvatar, 500, ''),
      signature: clampString(req.fromSignature, 160, ''),
      groupName: '我的好友',
      starred: false,
      sparkDays: 1,
      online: true,
      platform: 'Web',
      level: Math.max(1, Math.min(200, Math.round(req.fromLevel || 1))),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  batch.set(doc(db, 'users', req.fromUid, 'friends', peerFriendDocId), {
    friendId: peerFriendDocId,
    uid: req.fromUid,
    accountId: myAccount.accountId,
    name: clampString(myAccount.name, 40, '我的好友'),
    remark: '',
    avatar: clampString(myAccount.avatar, 500, ''),
    signature: clampString(myAccount.signature, 160, ''),
    groupName: '我的好友',
    starred: false,
    sparkDays: 1,
    online: true,
    platform: 'Web',
    level: Math.max(1, Math.min(200, Math.round(myAccount.level || 1))),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `friend_requests/${req.requestId}`);
  }

  // Create shared DM chat doc if it does not already exist
  const hasChat = existingCloudChats.some((c) => c.chatId === dmChatId);
  if (!hasChat) {
    await ensureDirectCloudChat(
      myAccount,
      req.fromUid,
      req.fromName,
      req.fromAvatar,
      existingCloudChats
    );
  }
  return dmChatId;
}

export async function rejectFriendRequest(requestId: string): Promise<void> {
  const path = `friend_requests/${requestId}`;
  try {
    await updateDoc(doc(db, 'friend_requests', requestId), {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cancelFriendRequest(requestId: string): Promise<void> {
  const path = `friend_requests/${requestId}`;
  try {
    await deleteDoc(doc(db, 'friend_requests', requestId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function ensureDirectCloudChat(
  myAccount: CloudUserAccount,
  peerUid: string,
  peerName: string,
  peerAvatar: string,
  existingCloudChats: CloudChat[]
): Promise<string> {
  const chatId = getDirectChatId(myAccount.uid, peerUid);
  if (existingCloudChats.some((c) => c.chatId === chatId)) {
    return chatId;
  }

  const memberUids = [myAccount.uid, peerUid].sort();
  const path = `chats/${chatId}`;
  try {
    await setDoc(doc(db, 'chats', chatId), {
      chatId,
      kind: 'single',
      title: clampString(peerName, 60, '好友私聊'),
      avatar: clampString(peerAvatar, 500, ''),
      ownerUid: myAccount.uid,
      memberUids,
      lastMessagePreview: '已建立云端会话，开始对话吧',
      lastMessageTime: nowHHmm(),
      lastMessageSenderUid: myAccount.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    // If peer simultaneously created this deterministic chat, ignore permission-denied on update attempt
    const code = (error as { code?: string })?.code || '';
    if (code === 'permission-denied') {
      try {
        const snap = await getDoc(doc(db, 'chats', chatId));
        if (snap.exists()) {
          return chatId;
        }
      } catch {
        // fall through to standard handler
      }
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
  return chatId;
}

export async function createGroupCloudChat(
  myAccount: CloudUserAccount,
  title: string,
  rawMemberUids: string[]
): Promise<string> {
  const uniqueMembers = Array.from(
    new Set([myAccount.uid, ...rawMemberUids.filter((u) => Boolean(u))])
  ).slice(0, 50);
  const chatId = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `chats/${chatId}`;

  try {
    await setDoc(doc(db, 'chats', chatId), {
      chatId,
      kind: 'group',
      title: clampString(title, 60, '星涟云端群聊'),
      avatar: '',
      ownerUid: myAccount.uid,
      memberUids: uniqueMembers,
      lastMessagePreview: '云端群聊已创建，欢迎加入',
      lastMessageTime: nowHHmm(),
      lastMessageSenderUid: myAccount.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
  return chatId;
}

export function subscribeToCloudChats(
  uid: string,
  onData: (chats: CloudChat[]) => void
): () => void {
  const q = query(collection(db, 'chats'), where('memberUids', 'array-contains', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: CloudChat[] = snap.docs
        .map((docSnap) => {
          const d = docSnap.data({ serverTimestamps: 'estimate' });
          return {
            chatId: String(d.chatId || docSnap.id),
            kind: d.kind === 'group' ? ('group' as const) : ('single' as const),
            title: String(d.title || '云端会话'),
            avatar: String(d.avatar || ''),
            ownerUid: String(d.ownerUid || ''),
            memberUids: Array.isArray(d.memberUids) ? d.memberUids.map(String) : [],
            lastMessagePreview: String(d.lastMessagePreview || ''),
            lastMessageTime: String(d.lastMessageTime || ''),
            lastMessageSenderUid: String(d.lastMessageSenderUid || ''),
            createdAtMs: timestampToMs(d.createdAt),
            updatedAtMs: timestampToMs(d.updatedAt),
          };
        })
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    }
  );
}

export function subscribeToCloudChatMessages(
  chatId: string,
  myUid: string,
  onData: (messages: ChatMessage[]) => void
): () => void {
  const path = `chats/${chatId}/messages`;
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    where('memberUids', 'array-contains', myUid)
  );
  return onSnapshot(
    q,
    (snap) => {
      const msgs: ChatMessage[] = snap.docs
        .map((docSnap) => {
          const d = docSnap.data({ serverTimestamps: 'estimate' });
          const senderUid = String(d.senderUid || '');
          const isMe = senderUid === myUid;
          const fileName = String(d.fileName || '');
          const fileSizeBytes = Number(d.fileSizeBytes || 0);
          const fileTypeRaw = String(d.fileType || 'other');
          const fileType =
            fileTypeRaw === 'image' ||
            fileTypeRaw === 'document' ||
            fileTypeRaw === 'archive' ||
            fileTypeRaw === 'video'
              ? fileTypeRaw
              : 'other';
          const replyToSender = String(d.replyToSender || '');
          const replyToPreview = String(d.replyToPreview || '');
          const imageUrl = String(d.imageUrl || '');
          const msgType = (d.type as ChatMessage['type']) || 'text';
          const burnSec = Number(d.burnAfterSeconds || 0);

          const mapped: ChatMessage = {
            id: String(d.messageId || docSnap.id),
            conversationId: chatId,
            senderId: isMe ? 'me' : `uid-${senderUid}`,
            senderName: String(d.senderName || '星涟用户'),
            senderAvatar: d.senderAvatar ? String(d.senderAvatar) : undefined,
            type: msgType,
            content: String(d.content || ''),
            timestamp: String(d.timestampLabel || '刚刚'),
            createdAt: timestampToMs(d.createdAt),
            recalled: Boolean(d.recalled),
            burnAfterSeconds: burnSec > 0 ? burnSec : undefined,
            mediaUrl: imageUrl || undefined,
            quote:
              replyToSender && replyToPreview
                ? {
                    id: `q-${docSnap.id}`,
                    senderName: replyToSender,
                    preview: replyToPreview,
                  }
                : undefined,
            file:
              msgType === 'file' && fileName
                ? {
                    id: `f-${docSnap.id}`,
                    name: fileName,
                    sizeBytes: fileSizeBytes,
                    fileType,
                    progress: 100,
                  }
                : undefined,
          };
          return mapped;
        })
        .sort((a, b) => a.createdAt - b.createdAt);
      onData(msgs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function sendCloudChatMessage(
  chatId: string,
  myAccount: CloudUserAccount,
  memberUids: string[],
  partial: Partial<ChatMessage> & { type: ChatMessage['type']; content: string },
  previewText: string,
  timestampLabel: string
): Promise<string> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const msgPath = `chats/${chatId}/messages/${messageId}`;
  const cloudType = normalizeCloudMsgType(partial.type);
  const safeImageUrl =
    partial.mediaUrl && (partial.type === 'image' || cloudType === 'image')
      ? await compressImageDataUrlIfNeeded(partial.mediaUrl)
      : '';

  const contentFallback =
    partial.type !== cloudType
      ? `[${partial.type}] ${partial.content || ''}`.trim()
      : partial.content;

  const batch = writeBatch(db);
  batch.set(doc(db, 'chats', chatId, 'messages', messageId), {
    messageId,
    chatId,
    senderUid: myAccount.uid,
    senderAccountId: myAccount.accountId,
    senderName: clampString(myAccount.name, 40, '星涟用户'),
    senderAvatar: clampString(myAccount.avatar, 500, ''),
    type: cloudType,
    content: clampString(contentFallback, 4000, ' '),
    timestampLabel: clampString(timestampLabel, 20, nowHHmm()),
    recalled: false,
    burnAfterSeconds: Math.max(0, Math.min(3600, Math.round(partial.burnAfterSeconds || 0))),
    replyToSender: clampString(partial.quote?.senderName, 40, ''),
    replyToPreview: clampString(partial.quote?.preview, 120, ''),
    fileName: clampString(partial.file?.name, 200, ''),
    fileSizeBytes: Math.max(0, Math.min(10737418240, Math.round(partial.file?.sizeBytes || 0))),
    fileType: clampString(partial.file?.fileType, 40, ''),
    imageUrl: safeImageUrl,
    memberUids: memberUids.slice(0, 50),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.update(doc(db, 'chats', chatId), {
    lastMessagePreview: clampString(previewText, 200, '新消息'),
    lastMessageTime: clampString(timestampLabel, 20, nowHHmm()),
    lastMessageSenderUid: myAccount.uid,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, msgPath);
  }
  return messageId;
}

export async function recallCloudChatMessage(
  chatId: string,
  messageId: string
): Promise<void> {
  const path = `chats/${chatId}/messages/${messageId}`;
  try {
    await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
      recalled: true,
      content: '[消息已撤回]',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
