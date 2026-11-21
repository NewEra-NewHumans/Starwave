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

function startLocalDistServer() {
  if (localStaticServer && localStaticServer.listening) {
    const addr = localStaticServer.address();
    return Promise.resolve(`http://localhost:${addr.port}`);
  }
  const distDir = path.resolve(__dirname, '../dist');
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const safeRel = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
      let filePath = path.join(distDir, safeRel === '/' || safeRel === '\\' ? 'index.html' : safeRel);

      if (!filePath.startsWith(distDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distDir, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
      });
      fs.createReadStream(filePath).pipe(res);
    });

    server.on('error', reject);
    server.listen(0, 'localhost', () => {
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
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (SERVER_URL) {
    win.loadURL(SERVER_URL);
  } else {
    const localUrl = await startLocalDistServer();
    win.loadURL(localUrl);
  }
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
