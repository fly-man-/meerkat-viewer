; First is default
LoadLanguageFile "${NSISDIR}\Contrib\Language files\SimpChinese.nlf"

; Language selection dialog
LangString InstallerLanguageTitle  ${LANG_SIMPCHINESE} "安装语言"
LangString SelectInstallerLanguage  ${LANG_SIMPCHINESE} "请选择安装时使用的语言。"

; subtitle on license text caption
LangString LicenseSubTitleUpdate ${LANG_SIMPCHINESE} " 更新"
LangString LicenseSubTitleSetup ${LANG_SIMPCHINESE} " 设置"

; installation directory text
LangString DirectoryChooseTitle ${LANG_SIMPCHINESE} "安装目录" 
LangString DirectoryChooseUpdate ${LANG_SIMPCHINESE} "请选择第二人生的安装目录，以便于将软件更新到 ${VERSION_LONG} 版本（XXX）:"
LangString DirectoryChooseSetup ${LANG_SIMPCHINESE} "请选择安装第二人生的目录："

; CheckStartupParams message box
LangString CheckStartupParamsMB ${LANG_SIMPCHINESE} "找不到 '$INSTPROG' 程序。自动更新失败。"

; installation success dialog
LangString InstSuccesssQuestion ${LANG_SIMPCHINESE} "现在要启动第二人生吗？"

; remove old NSIS version
LangString RemoveOldNSISVersion ${LANG_SIMPCHINESE} "检查是否在使用旧版本…"

; check windows version
LangString CheckWindowsVersionDP ${LANG_SIMPCHINESE} "检查 Windows 版本…"
LangString CheckWindowsVersionMB ${LANG_SIMPCHINESE} '第二人生只支持 Windows XP, Windows 2000 和 Mac OS X。$\n$\n如果尝试在 Windows $R0 上安装，可能导致死机和资料遗失。$\n$\n您还是要进行安装吗？'

; checkifadministrator function (install)
LangString CheckAdministratorInstDP ${LANG_SIMPCHINESE} "检查安装所需的权限..."
LangString CheckAdministratorInstMB ${LANG_SIMPCHINESE} '您的帐户似乎是“受限的帐户“。$\n您必须有“管理员”权限才可以安装第二人生。'

; checkifadministrator function (uninstall)
LangString CheckAdministratorUnInstDP ${LANG_SIMPCHINESE} "检查卸载所需的权限..."
LangString CheckAdministratorUnInstMB ${LANG_SIMPCHINESE} '您的帐户似乎是“受限的帐户“。$\n您必须有“管理员”权限才可以解除安装第二人生。'

; checkifalreadycurrent
LangString CheckIfCurrentMB ${LANG_SIMPCHINESE} "第二人生 ${VERSION_LONG} 版本似乎已经存在。$\n$\n您还想再安装一次？"

; closesecondlife function (install)
LangString CloseMeerkatInstDP ${LANG_SIMPCHINESE} "等待第二人生停止运行…"
LangString CloseMeerkatInstMB ${LANG_SIMPCHINESE} "如果第二人生仍在运行，将无法进行安装。.$\n$\n请结束您在第二人生内的活动，然后选择确定，将第二人生关闭，以继续安装。$\n选择“取消”，取消安装。"

; closesecondlife function (uninstall)
LangString CloseMeerkatUnInstDP ${LANG_SIMPCHINESE} "等待第二人生停止运行…"
LangString CloseMeerkatUnInstMB ${LANG_SIMPCHINESE} "如果第二人生仍在运行，将无法进行卸载。$\n$\n请结束您在第二人生内的活动，然后选择确定，将第二人生关闭，以继续卸载。$\n选择“取消”，取消卸载。"

; CheckNetworkConnection
LangString CheckNetworkConnectionDP ${LANG_SIMPCHINESE} "正在检查网络连接..."

; removecachefiles
LangString RemoveCacheFilesDP ${LANG_SIMPCHINESE} "正在删除 Documents and Settings 文件夹中的缓存文件。"

; delete program files
LangString DeleteProgramFilesMB ${LANG_SIMPCHINESE} "在您的第二人生程序目录里仍存有一些文件。$\n$\n这些文件可能是您创建或移动到 $\n$INSTDIR 文件夹中的。$\n$\n您还想要将他们删除吗？"

; uninstall text
LangString UninstallTextMsg ${LANG_SIMPCHINESE} "这将从您的系统中卸载第二人生 ${VERSION_LONG}。"

