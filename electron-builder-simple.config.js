module.exports = {
  appId: 'com.schoolmanagement.app',
  productName: '学校管理系统',
  directories: {
    output: 'dist',
    buildResources: 'build-resources'
  },
  files: [
    'electron-main.js',
    'preload.js',
    'assets/**/*',
    'backend/**/*',
    'frontend/build/**/*',
    '!backend/node_modules/**/*',
    '!backend/.env',
    '!backend/test/**/*',
    '!backend/scripts/**/*',
    '!frontend/src/**/*',
    '!frontend/public/**/*',
    '!frontend/node_modules/**/*'
  ],
  extraResources: [
    {
      from: 'backend',
      to: 'backend',
      filter: [
        '**/*',
        '!node_modules/**/*',
        '!test/**/*',
        '!scripts/**/*',
        '!.env'
      ]
    },
    {
      from: 'frontend/build',
      to: 'frontend'
    }
  ],
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    icon: 'assets/icon.ico'
  },
  nsis: {
    oneClick: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: '学校管理系统'
  }
};
