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
  BACKEND_PATH: isDev ? './backend' : path.join(process.resourcesPath, 'backend'),
  FRONTEND_PATH: isDev ? './frontend/build' : path.join(process.resourcesPath, 'frontend')
};

// 启动后端服务
function startBackendServer() {
  return new Promise((resolve, reject) => {
    console.log('启动后端服务...');

    const env = {
      ...process.env,
      PORT: APP_CONFIG.BACKEND_PORT,
      NODE_ENV: 'production',
      MONGO_URL: `mongodb://127.0.0.1:27017/school`,
      CORS_ORIGIN: `http://localhost:${APP_CONFIG.FRONTEND_PORT}`
    };

    const backendScript = path.join(APP_CONFIG.BACKEND_PATH, 'index.js');
    backendProcess = spawn('node', [backendScript], {
      env,
      cwd: APP_CONFIG.BACKEND_PATH,
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

    setTimeout(() => {
      if (backendProcess && !backendProcess.killed) {
        resolve();
      }
    }, 10000);
  });
}

// 创建主窗口
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    icon: path.join(__dirname, 'assets/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false
    }
  });

  const frontendUrl = isDev
    ? `http://localhost:${APP_CONFIG.FRONTEND_PORT}`
    : `file://${path.join(APP_CONFIG.FRONTEND_PATH, 'index.html')}`;

  mainWindow.loadURL(frontendUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
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
          accelerator: 'Ctrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'Ctrl+R', role: 'reload' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
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
              title: '关于',
              message: '学校管理系统',
              detail: '版本 1.0.0'
            });
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// 应用启动
app.whenReady().then(async () => {
  try {
    await startBackendServer();
    createMainWindow();
    createMenu();
    console.log('应用启动成功');
  } catch (error) {
    console.error('应用启动失败:', error);
    dialog.showErrorBox('启动错误', `应用启动失败: ${error.message}`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('before-quit', () => {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
    setTimeout(() => {
      if (backendProcess && !backendProcess.killed) {
        backendProcess.kill('SIGKILL');
      }
    }, 5000);
  }
});
