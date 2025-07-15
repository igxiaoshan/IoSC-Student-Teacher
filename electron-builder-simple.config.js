/**
 * 简化的 Electron Builder 配置
 * 专门解决权限和代码签名问题
 */

module.exports = {
  appId: "com.schoolmanagement.app",
  productName: "学校管理系统",
  
  // 目录配置
  directories: {
    output: "dist",
    buildResources: "build-resources"
  },
  
  // 文件包含配置
  files: [
    "electron-main-simple.js",
    "preload.js",
    "package.json",
    "backend/**/*",
    "frontend/build/**/*",
    "!backend/node_modules/**/*",
    "!backend/.env*",
    "!backend/test/**/*",
    "!backend/tests/**/*",
    "!frontend/src/**/*",
    "!frontend/public/**/*",
    "!frontend/node_modules/**/*",
    "!**/node_modules/**/*"
  ],
  
  // 网络配置 - 使用国内镜像
  electronDownload: {
    mirror: "https://npmmirror.com/mirrors/electron/",
    customDir: "v28.3.3",
    cache: "./electron-cache"
  },
  
  // 完全禁用代码签名
  forceCodeSigning: false,
  
  // Windows 配置 - 简化版
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64"]
      }
    ],
    // 不设置图标，避免资源问题
    requestedExecutionLevel: "asInvoker",
    artifactName: "${productName}-${version}.${ext}",
    
    // 完全禁用签名相关
    sign: null,
    signtool: null,
    certificateFile: null,
    certificatePassword: null,
    verifyUpdateCodeSignature: false
  },
  
  // NSIS 配置 - 简化版
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "学校管理系统",
    deleteAppDataOnUninstall: false,
    runAfterFinish: false,
    // 不包含自定义脚本
    include: null
  },
  
  // 禁用发布
  publish: null,
  
  // 压缩配置
  compression: "store", // 不压缩，加快构建速度
  
  // 额外元数据
  extraMetadata: {
    main: "electron-main-simple.js"
  },
  
  // 构建前检查
  beforeBuild: async (context) => {
    console.log('🔧 简化构建前检查...');
    
    const fs = require('fs');
    
    // 检查必要文件
    const requiredFiles = [
      'electron-main-simple.js',
      'preload.js'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`必要文件不存在: ${file}`);
      }
    }
    
    // 检查前端构建
    if (!fs.existsSync('frontend/build/index.html')) {
      console.log('⚠️ 前端未构建，将使用默认页面');
    }
    
    console.log('✅ 简化构建检查完成');
  }
};
