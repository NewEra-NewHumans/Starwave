import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  // Allow packaged Electron / Capacitor standalone apps to reach API endpoints
  app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  const server = http.createServer(app);

  // WebSocket server for real-time messaging, multi-device sync, and call signaling
  const wss = new WebSocketServer({ server, path: '/ws' });
  const connectedClients = new Map<
    WebSocket,
    { clientId: string; platform: string; deviceName: string; connectedAt: number }
  >();

  function broadcast(payload: Record<string, unknown>, exclude?: WebSocket) {
    const raw = JSON.stringify(payload);
    for (const [client] of connectedClients) {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    }
  }

  wss.on('connection', (ws) => {
    const defaultMeta = {
      clientId: `dev-${Math.random().toString(36).slice(2, 8)}`,
      platform: 'Web',
      deviceName: 'Web 浏览器端',
      connectedAt: Date.now(),
    };
    connectedClients.set(ws, defaultMeta);

    ws.send(
      JSON.stringify({
        type: 'sync:connected',
        clientId: defaultMeta.clientId,
        activeSessions: Array.from(connectedClients.values()),
      })
    );

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'device:register') {
          connectedClients.set(ws, {
            clientId: msg.clientId || defaultMeta.clientId,
            platform: msg.platform || 'Web',
            deviceName: msg.deviceName || '星涟桌面端',
            connectedAt: Date.now(),
          });
          broadcast({
            type: 'sync:sessions',
            activeSessions: Array.from(connectedClients.values()),
          });
          return;
        }
        // Broadcast all chat, call, typing, and device kick events to synced peers
        broadcast(msg, ws);
      } catch {
        // Ignore malformed packets
      }
    });

    ws.on('close', () => {
      connectedClients.delete(ws);
      broadcast({
        type: 'sync:sessions',
        activeSessions: Array.from(connectedClients.values()),
      });
    });
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      wsClients: connectedClients.size,
      aiReady: Boolean(getGeminiClient()),
      env: process.env.NODE_ENV || 'development',
      uptimeSec: Math.round(process.uptime()),
    });
  });

  // 1. AI Group Summary (AI群总结)
  app.post('/api/ai/summarize', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: '未检测到有效的 GEMINI_API_KEY，请在 Settings > Secrets 中配置后再试。',
      });
    }

    const { groupTitle, messages } = req.body as {
      groupTitle?: string;
      messages?: Array<{ senderName: string; content: string; timestamp: string }>;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '没有可总结的群聊消息。' });
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
      res.json({ summary: response.text || '暂无总结结果。' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI总结请求失败';
      res.status(500).json({ error: message });
    }
  });

  // 2. AI Message Translation (消息翻译)
  app.post('/api/ai/translate', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: '未检测到有效的 GEMINI_API_KEY，请在 Settings > Secrets 中配置后再试。',
      });
    }

    const { text, targetLang = '自动互译（中文/英文）' } = req.body as {
      text?: string;
      targetLang?: string;
    };

    if (!text) {
      return res.status(400).json({ error: '缺少待翻译文本。' });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `请将以下内容翻译为${targetLang}。如果是中文则译为地道英文，如果是外文则译为自然流畅的简体中文。只输出译文：\n\n${text}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
      res.json({ translatedText: (response.text || '').trim() });
    } catch (err) {
      const message = err instanceof Error ? err.message : '翻译请求失败';
      res.status(500).json({ error: message });
    }
  });

  // 3. Qzone AI Photo Repair / Erase analysis (相册 AI修复 / AI消除)
  app.post('/api/ai/photo-enhance', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: '未检测到有效的 GEMINI_API_KEY，请在 Settings > Secrets 中配置后再试。',
      });
    }

    const { action, caption } = req.body as {
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
      res.json({ note: (response.text || '').trim() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI图像优化分析失败';
      res.status(500).json({ error: message });
    }
  });

  // 4. StarBot Reply (智能助手星澜)
  app.post('/api/ai/bot-reply', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: '未检测到有效的 GEMINI_API_KEY，请在 Settings > Secrets 中配置后再试。',
      });
    }

    const { prompt, contextTitle } = req.body as {
      prompt?: string;
      contextTitle?: string;
    };

    if (!prompt) {
      return res.status(400).json({ error: '请输入消息内容。' });
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
      res.json({ reply: (response.text || '').trim() });
    } catch (err) {
      const message = err instanceof Error ? err.message : '星澜助手回复失败';
      res.status(500).json({ error: message });
    }
  });

  // 5. AI Smart Reply Suggestions & Draft Polish (AI 智能回复建议与文案润色)
  app.post('/api/ai/smart-reply', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: '未检测到有效的 GEMINI_API_KEY，请在 Settings > Secrets 中配置后再试。',
      });
    }

    const { draft, recentMessages, chatTitle } = req.body as {
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
      res.json({ suggestions: parsed });
    } catch (err) {
      const message = err instanceof Error ? err.message : '智能回复生成失败';
      res.status(500).json({ error: message });
    }
  });

  // 6. AI Screenshot OCR & Scene Recognition (截图智能文字提取与内容识别)
  app.post('/api/ai/screenshot-ocr', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: '未检测到有效的 GEMINI_API_KEY，请在 Settings > Secrets 中配置后再试。',
      });
    }

    const { imageBase64, mimeType = 'image/png', mode = 'ocr' } = req.body as {
      imageBase64?: string;
      mimeType?: string;
      mode?: 'ocr' | 'summary';
    };

    if (!imageBase64) {
      return res.status(400).json({ error: '缺少截图图像数据。' });
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
      res.json({ text: (response.text || '').trim() });
    } catch (err) {
      const message = err instanceof Error ? err.message : '截图识别失败';
      res.status(500).json({ error: message });
    }
  });

  // Vite dev middleware or static dist serving
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'));
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`StarRipple Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
