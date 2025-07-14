const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// 检测是否为开发环境
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

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

console.log('应用配置:', APP_CONFIG);
console.log('开发模式:', isDev);

// 启动后端服务
function startBackendServer() {
  return new Promise((resolve, reject) => {
    console.log('启动后端服务...');
    
    // 检查后端目录是否存在
    if (!fs.existsSync(APP_CONFIG.BACKEND_PATH)) {
      console.error('后端目录不存在:', APP_CONFIG.BACKEND_PATH);
      reject(new Error('后端目录不存在'));
      return;
    }

    // 设置环境变量
    const env = {
      ...process.env,
      PORT: APP_CONFIG.BACKEND_PORT,
      NODE_ENV: isDev ? 'development' : 'production',
      MONGO_URL: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/school',
      CORS_ORIGIN: `http://localhost:${APP_CONFIG.FRONTEND_PORT}`
    };

    // 启动后端进程
    const backendScript = path.join(APP_CONFIG.BACKEND_PATH, 'index.js');
    console.log('后端脚本路径:', backendScript);
    
    backendProcess = spawn('node', [backendScript], {
      env,
      cwd: APP_CONFIG.BACKEND_PATH,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let startupTimeout = setTimeout(() => {
      console.log('后端启动超时，假设启动成功');
      resolve();
    }, 10000);

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`后端输出: ${output}`);
      
      if (output.includes('Server started') || output.includes('listening')) {
        clearTimeout(startupTimeout);
        console.log('✅ 后端服务启动成功');
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.error(`后端错误: ${error}`);
      
      // 如果是端口占用，也认为启动成功
      if (error.includes('EADDRINUSE') || error.includes('address already in use')) {
        clearTimeout(startupTimeout);
        console.log('⚠️ 后端端口已被占用，可能已有实例在运行');
        resolve();
      }
    });

    backendProcess.on('error', (error) => {
      clearTimeout(startupTimeout);
      console.error('后端启动失败:', error);
      reject(error);
    });

    backendProcess.on('close', (code) => {
      console.log(`后端进程退出，代码: ${code}`);
    });
  });
}

// 创建主窗口
function createMainWindow() {
  console.log('创建主窗口...');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    titleBarStyle: 'default',
    autoHideMenuBar: false,
    title: '学校管理系统'
  });

  // 确定要加载的URL
  let loadUrl;
  
  if (isDev) {
    // 开发模式：尝试加载开发服务器
    loadUrl = `http://localhost:${APP_CONFIG.FRONTEND_PORT}`;
    console.log('开发模式，加载URL:', loadUrl);
  } else {
    // 生产模式：加载构建文件
    const indexPath = path.join(APP_CONFIG.FRONTEND_PATH, 'index.html');
    if (fs.existsSync(indexPath)) {
      loadUrl = `file://${indexPath}`;
      console.log('生产模式，加载文件:', loadUrl);
    } else {
      console.error('前端构建文件不存在:', indexPath);
      // 回退到简单的HTML页面
      loadUrl = `data:text/html,<html><body><h1>学校管理系统</h1><p>前端文件未找到，请先构建前端应用</p><p>运行: cd frontend && npm run build</p></body></html>`;
    }
  }

  // 加载页面
  mainWindow.loadURL(loadUrl).catch(err => {
    console.error('加载页面失败:', err);
    // 加载错误页面
    const errorHtml = `
      <html>
        <head><title>学校管理系统 - 加载错误</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>🎓 学校管理系统</h1>
          <h2>⚠️ 页面加载失败</h2>
          <p><strong>错误信息:</strong> ${err.message}</p>
          <p><strong>尝试的URL:</strong> ${loadUrl}</p>
          <h3>解决方案:</h3>
          <ol>
            <li>如果是开发模式，请确保前端开发服务器正在运行: <code>cd frontend && npm start</code></li>
            <li>如果是生产模式，请确保前端已构建: <code>cd frontend && npm run build</code></li>
            <li>检查后端服务是否正常启动</li>
          </ol>
          <button onclick="location.reload()">重新加载</button>
        </body>
      </html>
    `;
    mainWindow.loadURL(`data:text/html,${encodeURIComponent(errorHtml)}`);
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    console.log('窗口准备就绪，显示窗口');
    mainWindow.show();
    
    // 开发模式下打开开发者工具
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // 处理窗口关闭
  mainWindow.on('closed', () => {
    console.log('主窗口已关闭');
    mainWindow = null;
  });

  // 处理页面加载完成
  mainWindow.webContents.once('did-finish-load', () => {
    console.log('页面加载完成');
  });

  // 处理页面加载失败
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('页面加载失败:', errorCode, errorDescription, validatedURL);
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
          click: () => app.quit()
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
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
  console.log('Electron 应用准备就绪');
  
  try {
    // 创建菜单
    createMenu();
    
    // 创建主窗口
    createMainWindow();
    
    // 尝试启动后端服务（如果失败也继续）
    try {
      await startBackendServer();
      console.log('✅ 后端服务启动成功');
    } catch (error) {
      console.warn('⚠️ 后端服务启动失败，但应用将继续运行:', error.message);
      
      // 显示警告对话框
      dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: '后端服务启动失败',
        message: '后端服务启动失败，部分功能可能不可用',
        detail: `错误信息: ${error.message}\n\n请检查:\n1. MongoDB 是否已安装并运行\n2. 后端依赖是否已安装\n3. 端口 ${APP_CONFIG.BACKEND_PORT} 是否被占用`,
        buttons: ['确定']
      });
    }
    
    console.log('✅ 应用启动完成');
    
  } catch (error) {
    console.error('❌ 应用启动失败:', error);
    dialog.showErrorBox('启动错误', `应用启动失败: ${error.message}`);
  }
});

// 所有窗口关闭时
app.on('window-all-closed', () => {
  console.log('所有窗口已关闭');
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
  console.log('应用即将退出，清理资源...');
  
  // 关闭后端进程
  if (backendProcess && !backendProcess.killed) {
    console.log('关闭后端服务...');
    backendProcess.kill('SIGTERM');
    
    // 强制关闭
    setTimeout(() => {
      if (backendProcess && !backendProcess.killed) {
        backendProcess.kill('SIGKILL');
      }
    }, 3000);
  }
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});
