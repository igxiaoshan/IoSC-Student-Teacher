const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

// 检测是否为开发环境
const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === 'true' || !app.isPackaged;

// 后端服务进程
let backendProcess = null;
let mainWindow = null;

// 应用配置
const APP_CONFIG = {
  BACKEND_PORT: 5000,
  FRONTEND_PORT: 3000,
  MONGODB_PATH: path.join(os.homedir(), '.school-management', 'data'),
  BACKEND_PATH: isDev ? './backend' : path.join(process.resourcesPath, 'backend'),
  FRONTEND_PATH: isDev ? './frontend/build' : path.join(process.resourcesPath, 'frontend')
};

// 确保数据目录存在
function ensureDataDirectory() {
  const dataDir = path.dirname(APP_CONFIG.MONGODB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 启动后端服务
function startBackendServer() {
  return new Promise((resolve, reject) => {
    console.log('启动后端服务...');
    
    // 设置环境变量
    const env = {
      ...process.env,
      PORT: APP_CONFIG.BACKEND_PORT,
      NODE_ENV: 'production',
      MONGO_URL: `mongodb://127.0.0.1:27017/school`,
      CORS_ORIGIN: `http://localhost:${APP_CONFIG.FRONTEND_PORT}`
    };

    // 启动后端进程 - 注意 cwd 和 script 路径要匹配
    // 如果 cwd 是 backend 目录，则 script 只需传 index.js
    // 如果 cwd 是项目根目录，则 script 需要传 backend/index.js
    const backendScript = path.join(APP_CONFIG.BACKEND_PATH, 'index.js');
    backendProcess = spawn('node', [backendScript], {
      env,
      cwd: path.dirname(APP_CONFIG.BACKEND_PATH), // 设为 backend 的父目录（项目根目录）
      stdio: ['pipe', 'pipe', 'pipe']
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`后端输出: ${data}`);
      if (data.toString().includes('Server started')) {
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`后端错误: ${data}`);
    });

    backendProcess.on('error', (error) => {
      console.error('后端启动失败:', error);
      reject(error);
    });

    backendProcess.on('close', (code) => {
      console.log(`后端进程退出，代码: ${code}`);
    });

    // 超时处理
    setTimeout(() => {
      if (backendProcess && !backendProcess.killed) {
        resolve(); // 假设启动成功
      }
    }, 10000);
  });
}

// 创建主窗口
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // 应用图标
    show: false, // 先不显示，等加载完成后再显示
    titleBarStyle: 'default',
    autoHideMenuBar: false
  });

  // 加载前端应用
  const frontendUrl = isDev 
    ? `http://localhost:${APP_CONFIG.FRONTEND_PORT}`
    : `file://${path.join(APP_CONFIG.FRONTEND_PATH, 'index.html')}`;
  
  mainWindow.loadURL(frontendUrl);

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // 开发模式下打开开发者工具
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // 处理窗口关闭
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 阻止导航到外部URL
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== frontendUrl && !navigationUrl.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
}

// 创建应用菜单
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于学校管理系统',
              message: '学校管理系统',
              detail: '版本 1.0.0\n基于 Electron + React + Node.js 构建'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 应用启动
app.whenReady().then(async () => {
  try {
    // 确保数据目录存在
    ensureDataDirectory();
    
    // 启动后端服务
    await startBackendServer();
    
    // 创建主窗口
    createMainWindow();
    
    // 创建菜单
    createMenu();
    
    console.log('应用启动成功');
  } catch (error) {
    console.error('应用启动失败:', error);
    dialog.showErrorBox('启动错误', `应用启动失败: ${error.message}`);
    app.quit();
  }
});

// 所有窗口关闭时
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用激活时
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// 应用退出前清理
app.on('before-quit', () => {
  // 关闭后端进程
  if (backendProcess && !backendProcess.killed) {
    console.log('关闭后端服务...');
    backendProcess.kill('SIGTERM');
    
    // 强制关闭
    setTimeout(() => {
      if (backendProcess && !backendProcess.killed) {
        backendProcess.kill('SIGKILL');
      }
    }, 5000);
  }
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  dialog.showErrorBox('应用错误', `发生未预期的错误: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});
