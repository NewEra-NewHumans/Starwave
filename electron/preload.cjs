const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('starRippleNative', {
  isDesktop: true,
  getPlatformInfo: () => ipcRenderer.invoke('starripple:get-platform'),
});
