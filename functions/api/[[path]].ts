import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

interface Env {
  GEMINI_API_KEY?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}

function getGeminiClient(env: Env): GoogleGenAI | null {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, '');

  if (request.method === 'GET' && pathname === '/api/health') {
    return jsonResponse({
      status: 'ok',
      wsClients: 0,
      aiReady: Boolean(getGeminiClient(env)),
      env: 'cloudflare-pages',
      uptimeSec: 0,
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const ai = getGeminiClient(env);
  if (!ai) {
    return jsonResponse(
      { error: '未检测到有效的 GEMINI_API_KEY，请在 Cloudflare Pages 环境变量中配置后再试。' },
      503
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: '请求体必须为有效的 JSON。' }, 400);
  }

  if (pathname === '/api/ai/summarize') {
    const { groupTitle, messages } = body as {
      groupTitle?: string;
      messages?: Array<{ senderName: string; content: string; timestamp: string }>;
    };
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: '没有可总结的群聊消息。' }, 400);
    }
    const transcript = messages
      .map((m) => `[${m.timestamp}] ${m.senderName}: ${m.content}`)
      .join('\n');
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `请为星涟群聊「${groupTitle || '群聊'}」的近期聊天记录生成一份简明扼要的「AI群总结」。\n要求包含：\n1. 核心议题与结论（3条以内）\n2. 待办事项与责任人\n3. 重要文件/接龙/活动提醒\n\n聊天记录：\n${transcript}`,
        config: {
          systemInstruction: '你是星涟工作台内置的群效率助手，输出简洁清晰的中文要点，不要使用冗长客套话。',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
      return jsonResponse({ summary: response.text || '暂无总结结果。' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI总结请求失败';
      return jsonResponse({ error: message }, 500);
    }
  }

  if (pathname === '/api/ai/translate') {
    const { text, targetLang = '自动互译（中文/英文）' } = body as {
      text?: string;
      targetLang?: string;
    };
    if (!text) {
      return jsonResponse({ error: '缺少待翻译文本。' }, 400);
    }
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `请将以下内容翻译为${targetLang}。如果是中文则译为地道英文，如果是外文则译为自然流畅的简体中文。只输出译文：\n\n${text}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
      return jsonResponse({ translatedText: (response.text || '').trim() });
    } catch (err) {
      const message = err instanceof Error ? err.message : '翻译请求失败';
      return jsonResponse({ error: message }, 500);
    }
  }

  if (pathname === '/api/ai/photo-enhance') {
    const { action, caption } = body as {
      action: 'repair' | 'erase';
      caption?: string;
    };
    try {
      const prompt =
        action === 'repair'
          ? `用户正在星涟空间相册对照片「${caption || '生活照片'}」执行「AI画质修复与色彩还原」。请用一句简短专业的话说明已优化的参数（如动态范围、人像肤色、噪点抑制）。`
          : `用户正在星涟空间相册对照片「${caption || '生活照片'}」执行「AI智能消除路人/杂物」。请用一句简短专业的话说明纹理补全与光影融合完成情况。`;
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
      return jsonResponse({ note: (response.text || '').trim() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI图像优化分析失败';
      return jsonResponse({ error: message }, 500);
    }
  }

  if (pathname === '/api/ai/bot-reply') {
    const { prompt, contextTitle } = body as {
      prompt?: string;
      contextTitle?: string;
    };
    if (!prompt) {
      return jsonResponse({ error: '请输入消息内容。' }, 400);
    }
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `对话场景：${contextTitle || '星涟对话'}\n用户消息：${prompt}`,
        config: {
          systemInstruction:
            '你是星涟（StarRipple）内置智能助理星澜（StarBot），擅长群内答疑、策划活动、整理文案和辅助办公。回复简练友好，控制在120字以内。',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
      return jsonResponse({ reply: (response.text || '').trim() });
    } catch (err) {
      const message = err instanceof Error ? err.message : '星澜助手回复失败';
      return jsonResponse({ error: message }, 500);
    }
  }

  if (pathname === '/api/ai/smart-reply') {
    const { draft, recentMessages, chatTitle } = body as {
      draft?: string;
      recentMessages?: Array<{ senderName: string; content: string }>;
      chatTitle?: string;
    };
    const contextLines = (recentMessages || [])
      .slice(-6)
      .map((m) => `${m.senderName}: ${m.content}`)
      .join('\n');
    const prompt = draft?.trim()
      ? `会话「${chatTitle || '聊天'}」背景：\n${contextLines}\n\n请将用户当前草稿「${draft.trim()}」润色为 3 个不同风格的版本（专业得体、温和亲切、简洁干练）。`
      : `会话「${chatTitle || '聊天'}」最近对话：\n${contextLines}\n\n请根据上下文生成 3 条自然、实用的下一句快捷回复建议（分别偏礼貌确认、积极协同、轻松口吻）。`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                style: { type: Type.STRING },
                text: { type: Type.STRING },
              },
            },
          },
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
      const parsed = JSON.parse((response.text || '[]').trim());
      return jsonResponse({ suggestions: parsed });
    } catch (err) {
      const message = err instanceof Error ? err.message : '智能回复生成失败';
      return jsonResponse({ error: message }, 500);
    }
  }

  if (pathname === '/api/ai/screenshot-ocr') {
    const { imageBase64, mimeType = 'image/png', mode = 'ocr' } = body as {
      imageBase64?: string;
      mimeType?: string;
      mode?: 'ocr' | 'summary';
    };
    if (!imageBase64) {
      return jsonResponse({ error: '缺少截图图像数据。' }, 400);
    }
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const prompt =
      mode === 'summary'
        ? '请用简明中文概括这张截图的核心内容、重点信息或待办要点（不超过 150 字）。'
        : '请精准提取这张截图中的所有可读文字内容，按原有的段落和排版顺序输出。如果图中包含代码、表格或界面文案请清晰保留结构；若图片中没有文字，请简述画面内容。';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { data: cleanBase64, mimeType } },
              { text: prompt },
            ],
          },
        ],
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
      return jsonResponse({ text: (response.text || '').trim() });
    } catch (err) {
      const message = err instanceof Error ? err.message : '截图识别失败';
      return jsonResponse({ error: message }, 500);
    }
  }

  return jsonResponse({ error: 'API route not found' }, 404);
}
