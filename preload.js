// 简化的预加载脚本
console.log('Preload script loaded');

// 基本的安全检查
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded in preload');

  // 添加应用标识
  if (document.body) {
    document.body.classList.add('electron-app');
  }

  // 设置应用信息
  const appInfo = document.createElement('meta');
  appInfo.name = 'app-platform';
  appInfo.content = 'electron';
  if (document.head) {
    document.head.appendChild(appInfo);
  }
});

// 安全检查
window.addEventListener('DOMContentLoaded', () => {
  // 检查是否在Electron环境中
  if (typeof window.electronAPI !== 'undefined') {
    console.log('Electron API 已加载');
    
    // 添加应用标识
    document.body.classList.add('electron-app');
    
    // 设置应用信息
    const appInfo = document.createElement('meta');
    appInfo.name = 'app-platform';
    appInfo.content = 'electron';
    document.head.appendChild(appInfo);
  }
});

// 阻止拖拽文件到窗口
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

// 阻止右键菜单（生产环境）
if (process.env.NODE_ENV === 'production') {
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
}

// 键盘快捷键处理
document.addEventListener('keydown', (e) => {
  // 阻止某些快捷键
  if (process.env.NODE_ENV === 'production') {
    // 阻止F12开发者工具
    if (e.key === 'F12') {
      e.preventDefault();
    }
    
    // 阻止Ctrl+Shift+I开发者工具
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
    }
    
    // 阻止Ctrl+U查看源码
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
    }
  }
});
