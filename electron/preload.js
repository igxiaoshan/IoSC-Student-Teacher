const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 可以在这里添加需要的API
  platform: process.platform,
  versions: process.versions
});
