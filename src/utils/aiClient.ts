import { auth } from '../firebase';
import { apiUrl } from './serverEndpoint';

export interface AiPostResult<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  authRequired?: boolean;
  data: T & { error?: string; code?: string };
}

export async function authedAiPost<T = Record<string, unknown>>(
  path: string,
  payload: unknown
): Promise<AiPostResult<T>> {
  const user = auth.currentUser;
  if (!user) {
    return {
      ok: false,
      status: 401,
      authRequired: true,
      data: {
        error: '请先登录星涟账号后再使用云端 AI 功能。',
        code: 'AUTH_REQUIRED',
      } as T & { error?: string; code?: string },
    };
  }

  let token = await user.getIdToken();
  let resp = await fetch(apiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (resp.status === 401) {
    token = await user.getIdToken(true);
    resp = await fetch(apiUrl(path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  }

  let data = {} as T & { error?: string; code?: string };
  try {
    data = (await resp.json()) as T & { error?: string; code?: string };
  } catch {
    data = {} as T & { error?: string; code?: string };
  }

  return {
    ok: resp.ok,
    status: resp.status,
    authRequired: resp.status === 401,
    data,
  };
}
