!macro customHeader
  !define MUI_ICON "assets\icon.ico"
  !define MUI_UNICON "assets\icon.ico"
!macroend

!macro customInstall
  ; 创建数据目录
  CreateDirectory "$LOCALAPPDATA\school-management\data"

  ; 添加注册表项用于卸载
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayIcon" "$INSTDIR\${APP_NAME}.exe"
!macroend

!macro customUnInstall
  ; 清理数据目录（可选）
  ; RMDir /r "$LOCALAPPDATA\school-management"
!macroend
