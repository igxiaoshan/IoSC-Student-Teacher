/**
 * 修复版 Electron Builder 配置
 * 解决入口文件不存在的问题
 */

module.exports = {
  appId: "com.schoolmanagement.app",
  productName: "学校管理系统",
  
  // 目录配置
  directories: {
    output: "dist",
    buildResources: "build-resources"
  },
  
  // 明确指定入口文件
  main: "electron-main-simple.js",
  
  // 文件包含配置 - 明确包含所有必要文件
  files: [
    {
      from: ".",
      to: ".",
      filter: [
        "electron-main-simple.js",
        "preload.js",
        "package.json"
      ]
    },
    {
      from: "backend",
      to: "backend",
      filter: [
        "**/*",
        "!node_modules/**/*",
        "!.env*",
        "!test/**/*",
        "!tests/**/*",
        "!*.log"
      ]
    },
    {
      from: "frontend/build",
      to: "frontend",
      filter: ["**/*"]
    }
  ],
  
  // 网络配置 - 使用国内镜像
  electronDownload: {
    mirror: "https://npmmirror.com/mirrors/electron/",
    customDir: "28.3.3",
    cache: "./electron-cache"
  },
  
  // 完全禁用代码签名
  forceCodeSigning: false,
  
  // Windows 配置
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64"]
      }
    ],
    requestedExecutionLevel: "asInvoker",
    artifactName: "${productName}-${version}.${ext}",
    
    // 禁用签名
    sign: null,
    signtool: null,
    certificateFile: null,
    certificatePassword: null,
    verifyUpdateCodeSignature: false
  },
  
  // NSIS 配置
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "学校管理系统",
    deleteAppDataOnUninstall: false,
    runAfterFinish: false
  },
  
  // 禁用发布
  publish: null,
  
  // 不压缩，避免问题
  compression: "store",
  
  // 禁用 asar 打包，避免文件找不到的问题
  asar: false,
  
  // 构建前检查
  beforeBuild: async (context) => {
    console.log('🔧 修复版构建前检查...');
    
    const fs = require('fs');
    const path = require('path');
    
    // 检查入口文件
    if (!fs.existsSync('electron-main-simple.js')) {
      throw new Error('入口文件不存在: electron-main-simple.js');
    }
    
    // 检查预加载文件
    if (!fs.existsSync('preload.js')) {
      throw new Error('预加载文件不存在: preload.js');
    }
    
    // 检查前端构建
    if (!fs.existsSync('frontend/build/index.html')) {
      console.log('⚠️ 前端未构建，创建默认页面...');
      
      // 确保目录存在
      if (!fs.existsSync('frontend/build')) {
        fs.mkdirSync('frontend/build', { recursive: true });
      }
      
      // 创建默认 index.html
      const defaultHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>学校管理系统</title>
    <style>
        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        .status {
            font-size: 1.2em;
            margin: 20px 0;
            padding: 15px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 8px;
        }
        .success { color: #4CAF50; }
        .warning { color: #FF9800; }
        .info { color: #2196F3; }
        .btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
            transition: background 0.3s;
        }
        .btn:hover {
            background: #45a049;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎓 学校管理系统</h1>
        <div class="status success">
            ✅ Electron 应用启动成功
        </div>
        <div class="status info">
            📦 版本: 1.0.0
        </div>
        <div class="status warning">
            ⚠️ 前端应用未构建，显示默认页面
        </div>
        
        <h2>📋 使用说明</h2>
        <p>这是学校管理系统的桌面版本</p>
        <p>如需完整功能，请构建前端应用：</p>
        <code style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; display: block; margin: 10px 0;">
            cd frontend && npm run build
        </code>
        
        <button class="btn" onclick="location.reload()">🔄 重新加载</button>
        <button class="btn" onclick="window.close()">❌ 关闭应用</button>
    </div>
    
    <script>
        console.log('学校管理系统 - Electron 版本');
        console.log('如需完整功能，请构建前端应用');
        
        // 检查是否在 Electron 环境中
        if (typeof require !== 'undefined') {
            console.log('✅ 运行在 Electron 环境中');
        }
    </script>
</body>
</html>
      `;
      
      fs.writeFileSync('frontend/build/index.html', defaultHtml.trim());
      console.log('✅ 创建了默认前端页面');
    }
    
    console.log('✅ 修复版构建检查完成');
  }
};
