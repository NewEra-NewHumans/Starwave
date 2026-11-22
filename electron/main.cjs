const { app, BrowserWindow, shell, ipcMain } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SERVER_URL = process.env.STARRIPPLE_SERVER_URL || '';
let localStaticServer = null;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

function isAllowedExternalUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function resolveAllowedServerUrl(rawUrl) {
  if (!rawUrl || !rawUrl.trim()) return '';
  try {
    const parsed = new URL(rawUrl.trim());
    const isLocalLoopback =
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
    if (parsed.protocol === 'https:' || isLocalLoopback) {
      return parsed.toString();
    }
    console.warn('[Electron Security] Ignoring insecure STARRIPPLE_SERVER_URL:', parsed.protocol);
  } catch {
    console.warn('[Electron Security] Ignoring malformed STARRIPPLE_SERVER_URL');
  }
  return '';
}

function startLocalDistServer() {
  if (localStaticServer && localStaticServer.listening) {
    const addr = localStaticServer.address();
    return Promise.resolve(`http://localhost:${addr.port}`);
  }
  const distDir = path.resolve(__dirname, '../dist');
  const indexHtmlPath = path.join(distDir, 'index.html');
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { 'X-Content-Type-Options': 'nosniff' });
        res.end('Method Not Allowed');
        return;
      }

      let rawPathname = '/';
      try {
        rawPathname = decodeURIComponent((req.url || '/').split('?')[0]);
      } catch {
        res.writeHead(400, { 'X-Content-Type-Options': 'nosniff' });
        res.end('Bad Request');
        return;
      }

      const strippedRel = rawPathname.replace(/^[/\\]+/, '');
      const candidatePath = path.resolve(distDir, strippedRel || 'index.html');
      const relative = path.relative(distDir, candidatePath);
      const isInsideDist =
        relative !== '' &&
        !relative.startsWith('..') &&
        !path.isAbsolute(relative);
      const hasHiddenSegment = relative
        .split(path.sep)
        .some((seg) => seg.startsWith('.'));

      let filePath = candidatePath;
      if (
        !isInsideDist ||
        hasHiddenSegment ||
        !fs.existsSync(filePath) ||
        fs.statSync(filePath).isDirectory()
      ) {
        filePath = indexHtmlPath;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      });
      fs.createReadStream(filePath).pipe(res);
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      localStaticServer = server;
      const addr = server.address();
      resolve(`http://localhost:${addr.port}`);
    });
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: '星涟 StarRipple',
    backgroundColor: '#0b1222',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
      allowRunningInsecureContent: false,
    },
  });

  const validatedServerUrl = resolveAllowedServerUrl(SERVER_URL);
  const startUrl = validatedServerUrl || (await startLocalDistServer());
  const allowedOrigin = new URL(startUrl).origin;

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, targetUrl) => {
    try {
      const targetOrigin = new URL(targetUrl).origin;
      if (targetOrigin !== allowedOrigin) {
        event.preventDefault();
        if (isAllowedExternalUrl(targetUrl)) {
          shell.openExternal(targetUrl);
        }
      }
    } catch {
      event.preventDefault();
    }
  });

  win.loadURL(startUrl);
}

ipcMain.handle('starripple:get-platform', () => ({
  platform: process.platform,
  arch: process.arch,
  electron: process.versions.electron,
}));

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (localStaticServer) {
    localStaticServer.close();
    localStaticServer = null;
  }
});
