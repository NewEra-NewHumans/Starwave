import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { Contact, FriendGroupName, OnlinePlatform } from '../types/qq';

export type AllowedEmailProvider = 'google' | 'microsoft';

export const GOOGLE_EMAIL_DOMAINS = ['gmail.com', 'googlemail.com'] as const;
export const MICROSOFT_EMAIL_DOMAINS = [
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'outlook.cn',
  'hotmail.co.uk',
  'outlook.jp',
] as const;

export interface EmailValidationResult {
  valid: boolean;
  provider: AllowedEmailProvider | null;
  normalizedEmail: string;
  error?: string;
}

export interface CloudUserAccount {
  uid: string;
  email: string;
  emailProvider: AllowedEmailProvider;
  accountId: string;
  name: string;
  avatar: string;
  signature: string;
  level: number;
  activeDays: number;
}

export interface AccountDirectoryEntry {
  accountId: string;
  uid: string;
  name: string;
  avatar: string;
  signature: string;
  emailProvider: AllowedEmailProvider;
  level: number;
  online: boolean;
  platform: OnlinePlatform;
}

export interface AuthActionResult {
  user?: User;
  error?: string;
  needsConsoleSetup?: boolean;
  providerHint?: 'microsoft' | 'email';
}

export function isPhoneLikeInput(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.includes('@')) return false;
  return /^\+?[\d\s\-()]{6,20}$/.test(trimmed);
}

export function detectEmailProvider(email: string): AllowedEmailProvider | null {
  const domain = email.trim().toLowerCase().split('@')[1] || '';
  if ((GOOGLE_EMAIL_DOMAINS as readonly string[]).includes(domain)) return 'google';
  if ((MICROSOFT_EMAIL_DOMAINS as readonly string[]).includes(domain)) return 'microsoft';
  return null;
}

export function validateAllowedAuthEmail(rawEmail: string): EmailValidationResult {
  const normalized = rawEmail.trim().toLowerCase();
  if (!normalized) {
    return { valid: false, provider: null, normalizedEmail: '', error: '请输入您的 Google 或 Microsoft 邮箱地址。' };
  }
  if (isPhoneLikeInput(normalized)) {
    return {
      valid: false,
      provider: null,
      normalizedEmail: normalized,
      error: '星涟已取消手机号注册与登录，请使用 Google 邮箱（@gmail.com）或 Microsoft 邮箱（@outlook.com / @hotmail.com）。',
    };
  }
  const basicEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicEmailPattern.test(normalized) || normalized.length > 160) {
    return {
      valid: false,
      provider: null,
      normalizedEmail: normalized,
      error: '邮箱格式无效，请输入正确的 Google 或 Microsoft 邮箱。',
    };
  }
  const provider = detectEmailProvider(normalized);
  if (!provider) {
    return {
      valid: false,
      provider: null,
      normalizedEmail: normalized,
      error:
        '仅支持 Google 邮箱（@gmail.com / @googlemail.com）与 Microsoft 邮箱（@outlook.com / @hotmail.com / @live.com / @msn.com）。',
    };
  }
  return { valid: true, provider, normalizedEmail: normalized };
}

function deterministicCandidateId(uid: string, attempt: number): string {
  let hash = 2166136261 ^ attempt * 16777619;
  for (let i = 0; i < uid.length; i += 1) {
    hash ^= uid.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const unsigned = hash >>> 0;
  // Generate 9-digit Account ID in [200000000, 999999999]
  const num = 200000000 + (unsigned % 799999999);
  return String(num);
}

function clampString(val: string, maxLen: number, fallback = ''): string {
  const clean = (val || fallback).trim();
  return clean.slice(0, maxLen);
}

function toCloudPlatform(p?: OnlinePlatform): 'Windows' | 'macOS' | 'iOS' | 'Android' | 'iPadOS' | 'Web' {
  if (!p) return 'Web';
  if (p === 'iPad') return 'iPadOS';
  return p;
}

function fromCloudPlatform(p?: unknown): OnlinePlatform {
  if (p === 'iPadOS') return 'iPad';
  if (p === 'Windows' || p === 'macOS' || p === 'iOS' || p === 'Android' || p === 'Web') {
    return p;
  }
  return 'Web';
}

function resolveProviderFromUser(user: User): AllowedEmailProvider {
  const emailProvider = user.email ? detectEmailProvider(user.email) : null;
  if (emailProvider) return emailProvider;
  const hasMicrosoft = user.providerData.some((p) => p.providerId === 'microsoft.com');
  return hasMicrosoft ? 'microsoft' : 'google';
}

export function formatAccountIdDisplay(accountId: string): string {
  const clean = accountId.replace(/\D/g, '');
  if (clean.length !== 9) return accountId;
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`;
}

export function isValidNineDigitAccountId(raw: string): boolean {
  return /^[1-9][0-9]{8}$/.test(raw.trim());
}

export async function signInWithGoogleEmail(): Promise<AuthActionResult> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    return { user: cred.user };
  } catch (error) {
    const code = (error as { code?: string })?.code || '';
    if (code === 'auth/popup-closed-by-user') {
      return { error: '已取消 Google 登录弹窗。' };
    }
    if (code === 'auth/operation-not-allowed') {
      return {
        error: '当前 Firebase 项目尚未启用 Google 登录方式。',
        needsConsoleSetup: true,
      };
    }
    return {
      error: error instanceof Error ? error.message : 'Google 邮箱登录失败，请稍后重试。',
    };
  }
}

export async function signInWithMicrosoftEmail(): Promise<AuthActionResult> {
  try {
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    return { user: cred.user };
  } catch (error) {
    const code = (error as { code?: string })?.code || '';
    if (code === 'auth/popup-closed-by-user') {
      return { error: '已取消 Microsoft 登录弹窗。' };
    }
    if (code === 'auth/operation-not-allowed' || code === 'auth/unauthorized-domain') {
      return {
        error:
          'Firebase 控制台尚未开启 Microsoft OAuth 登录，请按下方指引在 Authentication 中启用 Microsoft，或暂时先用下方「Microsoft 邮箱密码注册」或 Google 邮箱一键登录。',
        needsConsoleSetup: true,
        providerHint: 'microsoft',
      };
    }
    return {
      error: error instanceof Error ? error.message : 'Microsoft 邮箱登录失败。',
    };
  }
}

export async function registerWithAllowedEmail(
  email: string,
  password: string,
  displayName: string
): Promise<AuthActionResult> {
  const check = validateAllowedAuthEmail(email);
  if (!check.valid) {
    return { error: check.error };
  }
  if (password.length < 6) {
    return { error: '请设置至少 6 位字符的登录密码。' };
  }
  const cleanName = clampString(displayName, 40, check.normalizedEmail.split('@')[0]);
  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      check.normalizedEmail,
      password
    );
    await updateProfile(cred.user, { displayName: cleanName });
    await sendEmailVerification(cred.user);
    return { user: cred.user };
  } catch (error) {
    const code = (error as { code?: string })?.code || '';
    if (code === 'auth/operation-not-allowed') {
      return {
        error:
          '当前 Firebase 项目尚未开启「电子邮件地址/密码」登录方式。请先按指引在控制台启用，或直接使用 Google 邮箱一键登录。',
        needsConsoleSetup: true,
        providerHint: 'email',
      };
    }
    if (code === 'auth/email-already-in-use') {
      return { error: '该邮箱已注册星涟账号，请直接切换至「邮箱登录」。' };
    }
    return {
      error: error instanceof Error ? error.message : '邮箱注册失败，请检查网络或配置。',
    };
  }
}

export async function signInWithAllowedEmail(
  email: string,
  password: string
): Promise<AuthActionResult> {
  const check = validateAllowedAuthEmail(email);
  if (!check.valid) {
    return { error: check.error };
  }
  if (!password) {
    return { error: '请输入登录密码。' };
  }
  try {
    const cred = await signInWithEmailAndPassword(auth, check.normalizedEmail, password);
    return { user: cred.user };
  } catch (error) {
    const code = (error as { code?: string })?.code || '';
    if (code === 'auth/operation-not-allowed') {
      return {
        error: 'Firebase 控制台尚未开启「电子邮件地址/密码」登录方式，请开启后重试。',
        needsConsoleSetup: true,
        providerHint: 'email',
      };
    }
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found'
    ) {
      return { error: '邮箱或密码不正确，请核对后重试。' };
    }
    return {
      error: error instanceof Error ? error.message : '邮箱登录失败。',
    };
  }
}

export async function resendVerificationMail(user: User): Promise<string | null> {
  try {
    await sendEmailVerification(user);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : '发送验证邮件失败，请稍后再试。';
  }
}

export async function reloadCurrentUser(): Promise<User | null> {
  if (!auth.currentUser) return null;
  await auth.currentUser.reload();
  return auth.currentUser;
}

export async function signOutAccount(): Promise<void> {
  await signOut(auth);
}

/**
 * Atomically reads or allocates an exclusive 9-digit StarRipple Account ID
 * inside Firestore (`users/{uid}` + `account_ids/{accountId}`).
 */
export async function ensureAccountIdAndProfile(
  user: User,
  fallbackAvatar: string,
  fallbackSignature = '用星涟，连接每一刻灵感与协同。'
): Promise<CloudUserAccount> {
  if (!user.emailVerified) {
    throw new Error('请先完成邮箱验证后再生成专属星涟号。');
  }

  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  const emailProvider = resolveProviderFromUser(user);
  const email = clampString(user.email || `${user.uid}@gmail.com`, 160);
  const displayName = clampString(
    user.displayName || email.split('@')[0] || '星涟用户',
    40,
    '星涟用户'
  );
  const avatar = clampString(user.photoURL || fallbackAvatar, 500, '');
  const signature = clampString(fallbackSignature, 160, '');

  try {
    const result = await runTransaction(db, async (tx) => {
      const existingSnap = await tx.get(userRef);
      if (existingSnap.exists()) {
        const data = existingSnap.data();
        return {
          uid: String(data.uid),
          email: String(data.email),
          emailProvider: (data.emailProvider as AllowedEmailProvider) || emailProvider,
          accountId: String(data.accountId),
          name: String(data.name),
          avatar: String(data.avatar || fallbackAvatar),
          signature: String(data.signature || ''),
          level: Number(data.level || 1),
          activeDays: Number(data.activeDays || 1),
        };
      }

      let chosenId: string | null = null;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const candidate = deterministicCandidateId(user.uid, attempt);
        const idxRef = doc(db, 'account_ids', candidate);
        const idxSnap = await tx.get(idxRef);
        if (!idxSnap.exists()) {
          chosenId = candidate;
          break;
        }
      }

      if (!chosenId) {
        chosenId = String(200000000 + Math.floor(Math.random() * 799999999));
      }

      const idxRef = doc(db, 'account_ids', chosenId);
      tx.set(userRef, {
        uid: user.uid,
        email,
        emailProvider,
        accountId: chosenId,
        name: displayName,
        avatar,
        signature,
        level: 1,
        activeDays: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      tx.set(idxRef, {
        accountId: chosenId,
        uid: user.uid,
        name: displayName,
        avatar,
        signature,
        emailProvider,
        level: 1,
        online: true,
        platform: 'Web',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        uid: user.uid,
        email,
        emailProvider,
        accountId: chosenId,
        name: displayName,
        avatar,
        signature,
        level: 1,
        activeDays: 1,
      };
    });

    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function updateCloudProfile(
  uid: string,
  accountId: string,
  patch: {
    name: string;
    avatar: string;
    signature: string;
    level: number;
    activeDays: number;
    platform: OnlinePlatform;
    online: boolean;
  }
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const idxRef = doc(db, 'account_ids', accountId);
  try {
    const batch = writeBatch(db);
    batch.update(userRef, {
      name: clampString(patch.name, 40, '星涟用户'),
      avatar: clampString(patch.avatar, 500, ''),
      signature: clampString(patch.signature, 160, ''),
      level: Math.max(1, Math.min(200, Math.round(patch.level))),
      activeDays: Math.max(0, Math.min(100000, Math.round(patch.activeDays))),
      updatedAt: serverTimestamp(),
    });
    batch.update(idxRef, {
      name: clampString(patch.name, 40, '星涟用户'),
      avatar: clampString(patch.avatar, 500, ''),
      signature: clampString(patch.signature, 160, ''),
      level: Math.max(1, Math.min(200, Math.round(patch.level))),
      online: Boolean(patch.online),
      platform: toCloudPlatform(patch.platform),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function lookupAccountById(
  rawAccountId: string
): Promise<AccountDirectoryEntry | null> {
  const cleanId = rawAccountId.replace(/\s+/g, '').trim();
  if (!isValidNineDigitAccountId(cleanId)) {
    return null;
  }
  const path = `account_ids/${cleanId}`;
  try {
    const snap = await getDoc(doc(db, 'account_ids', cleanId));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      accountId: String(d.accountId),
      uid: String(d.uid),
      name: String(d.name),
      avatar: String(d.avatar || ''),
      signature: String(d.signature || ''),
      emailProvider: (d.emailProvider as AllowedEmailProvider) || 'google',
      level: Number(d.level || 1),
      online: Boolean(d.online),
      platform: fromCloudPlatform(d.platform),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

function normalizeFriendGroupName(value: unknown): FriendGroupName {
  if (
    value === '特别关心' ||
    value === '我的好友' ||
    value === '同事伙伴' ||
    value === '校园同学'
  ) {
    return value;
  }
  return '我的好友';
}

export function subscribeToUserFriends(
  uid: string,
  onData: (friends: Contact[]) => void
): () => void {
  const path = `users/${uid}/friends`;
  const q = query(collection(db, 'users', uid, 'friends'), where('uid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: Contact[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          qqNumber: String(d.accountId),
          name: String(d.name),
          remark: d.remark ? String(d.remark) : undefined,
          avatar: String(d.avatar || ''),
          signature: String(d.signature || ''),
          groupName: normalizeFriendGroupName(d.groupName),
          starred: Boolean(d.starred),
          sparkDays: Number(d.sparkDays || 1),
          online: Boolean(d.online),
          platform: fromCloudPlatform(d.platform),
          level: Number(d.level || 1),
        };
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveFriendToFirestore(
  uid: string,
  contact: Contact
): Promise<void> {
  const safeId = contact.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128) || `f-${Date.now()}`;
  const path = `users/${uid}/friends/${safeId}`;
  try {
    await setDoc(doc(db, 'users', uid, 'friends', safeId), {
      friendId: safeId,
      uid,
      accountId: contact.qqNumber,
      name: clampString(contact.name, 40, '我的好友'),
      remark: clampString(contact.remark || '', 40, ''),
      avatar: clampString(contact.avatar || '', 500, ''),
      signature: clampString(contact.signature, 160, ''),
      groupName: clampString(contact.groupName || '我的好友', 30, '我的好友'),
      starred: Boolean(contact.starred),
      sparkDays: Math.max(0, Math.min(100000, Math.round(contact.sparkDays || 1))),
      online: Boolean(contact.online),
      platform: toCloudPlatform(contact.platform),
      level: Math.max(1, Math.min(200, Math.round(contact.level || 1))),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateFriendInFirestore(
  uid: string,
  friendId: string,
  patch: { remark?: string; groupName?: string; starred?: boolean }
): Promise<void> {
  const path = `users/${uid}/friends/${friendId}`;
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (patch.remark !== undefined) {
    payload.remark = clampString(patch.remark, 40, '');
  }
  if (patch.groupName !== undefined) {
    payload.groupName = clampString(patch.groupName, 30, '星涟好友');
  }
  if (patch.starred !== undefined) {
    payload.starred = Boolean(patch.starred);
  }
  try {
    await updateDoc(doc(db, 'users', uid, 'friends', friendId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteFriendFromFirestore(
  uid: string,
  friendId: string
): Promise<void> {
  const path = `users/${uid}/friends/${friendId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'friends', friendId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
