const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const AppStartup = require('./startup');

// 保持对窗口对象的全局引用
let mainWindow;
let appStartup;

// 启动应用服务
async function startAppServices() {
  appStartup = new AppStartup();
  try {
    await appStartup.startApp();
    console.log('App services started successfully');
  } catch (error) {
    console.error('Failed to start app services:', error);
  }
}

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    show: false,
    titleBarStyle: 'default'
  });

  // 设置应用菜单
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // 启动应用服务
  startAppServices();

  // 等待服务启动后加载前端
  setTimeout(() => {
    if (isDev) {
      // 开发模式：加载开发服务器
      mainWindow.loadURL('http://localhost:3000');
      mainWindow.webContents.openDevTools();
    } else {
      // 生产模式：加载构建后的静态文件
      const frontendPath = path.join(__dirname, '..', 'frontend', 'build', 'index.html');
      mainWindow.loadFile(frontendPath);
    }
    
    mainWindow.show();
  }, 3000); // 等待3秒让后端启动

  // 当窗口关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(createWindow);

// 当所有窗口都关闭时退出应用
app.on('window-all-closed', () => {
  // 在 macOS 上，应用和菜单栏通常会保持活跃状态
  // 直到用户使用 Cmd + Q 显式退出
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // 在 macOS 上，当单击 dock 图标并且没有其他窗口打开时
  // 通常会重新创建一个窗口
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 应用退出时清理进程
app.on('before-quit', () => {
  if (appStartup) {
    console.log('Cleaning up app services...');
    appStartup.cleanup();
  }
});

// 处理证书错误（用于开发环境）
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    // 在开发环境中忽略证书错误
    event.preventDefault();
    callback(true);
  } else {
    // 在生产环境中使用默认行为
    callback(false);
  }
});
