; First is default
LoadLanguageFile "${NSISDIR}\Contrib\Language files\Japanese.nlf"

; Language selection dialog
LangString InstallerLanguageTitle  ${LANG_JAPANESE} "インストーラの言語"
LangString SelectInstallerLanguage  ${LANG_JAPANESE} "インストーラの言語を選択してください"

; subtitle on license text caption
LangString LicenseSubTitleUpdate ${LANG_JAPANESE} " アップデート" 
LangString LicenseSubTitleSetup ${LANG_JAPANESE} " セットアップ" 

; description on license page
LangString LicenseDescUpdate ${LANG_JAPANESE} "このパッケージはセカンドライフをバージョン${VERSION_LONG}.にアップデートします。" 
LangString LicenseDescSetup ${LANG_JAPANESE} "このパッケージはあなたのコンピュータにセカンドライフをインストールします。" 
LangString LicenseDescNext ${LANG_JAPANESE} "次" 

; installation directory text
LangString DirectoryChooseTitle ${LANG_JAPANESE} "インストール・ディレクトリ" 
LangString DirectoryChooseUpdate ${LANG_JAPANESE} "アップデートするセカンドライフのディレクトリを選択してください。:" 
LangString DirectoryChooseSetup ${LANG_JAPANESE} "セカンドライフをインストールするディレクトリを選択してください。: " 

; CheckStartupParams message box
LangString CheckStartupParamsMB ${LANG_JAPANESE} "プログラム名'$INSTPROG'が見つかりません。サイレント・アップデートに失敗しました。" 

; installation success dialog
LangString InstSuccesssQuestion ${LANG_JAPANESE} "直ちにセカンドライフを開始しますか？ " 

; remove old NSIS version
LangString RemoveOldNSISVersion ${LANG_JAPANESE} "古いバージョン情報をチェック中です…" 

; check windows version
LangString CheckWindowsVersionDP ${LANG_JAPANESE} "ウィンドウズのバージョン情報をチェック中です..." 
LangString CheckWindowsVersionMB ${LANG_JAPANESE} "セカンドライフはWindows XP、Windows 2000、Mac OS Xのみをサポートしています。Windows $R0をインストールする事は、データの消失やクラッシュの原因になる可能性があります。インストールを続けますか？" 

; checkifadministrator function (install)
LangString CheckAdministratorInstDP ${LANG_JAPANESE} "インストールのための権限をチェック中です..." 
LangString CheckAdministratorInstMB ${LANG_JAPANESE} "セカンドライフをインストールするには管理者権限が必要です。"

; checkifadministrator function (uninstall)
LangString CheckAdministratorUnInstDP ${LANG_JAPANESE} "アンインストールのための権限をチェック中です..." 
LangString CheckAdministratorUnInstMB ${LANG_JAPANESE} "セカンドライフをアンインストールするには管理者権限が必要です。" 

; checkifalreadycurrent
LangString CheckIfCurrentMB ${LANG_JAPANESE} "セカンドライフ${VERSION_LONG} はインストール済みです。再度インストールしますか？ " 

; closesecondlife function (install)
LangString CloseMeerkatInstDP ${LANG_JAPANESE} "セカンドライフを終了中です..." 
LangString CloseMeerkatInstMB ${LANG_JAPANESE} "セカンドライフの起動中にインストールは出来ません。直ちにセカンドライフを終了してインストールを開始する場合はOKボタンを押してください。CANCELを押すと中止します。"

; closesecondlife function (uninstall)
LangString CloseMeerkatUnInstDP ${LANG_JAPANESE} "セカンドライフを終了中です..." 
LangString CloseMeerkatUnInstMB ${LANG_JAPANESE} "セカンドライフの起動中にアンインストールは出来ません。直ちにセカンドライフを終了してアンインストールを開始する場合はOKボタンを押してください。CANCELを押すと中止します。" 

; CheckNetworkConnection
LangString CheckNetworkConnectionDP ${LANG_JAPANESE} "ネットワークの接続を確認中..." 

; removecachefiles
LangString RemoveCacheFilesDP ${LANG_JAPANESE} " Documents and Settings フォルダのキャッシュファイルをデリート中です。" 

; delete program files
LangString DeleteProgramFilesMB ${LANG_JAPANESE} "セカンドライフのディレクトリには、まだファイルが残されています。$\n$INSTDIR$\nにあなたが作成、または移動させたファイルがある可能性があります。全て削除しますか？ " 

; uninstall text
LangString UninstallTextMsg ${LANG_JAPANESE} "セカンドライフ${VERSION_LONG}をアンインストールします。"
