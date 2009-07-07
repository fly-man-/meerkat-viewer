; First is default
LoadLanguageFile "${NSISDIR}\Contrib\Language files\English.nlf"

; subtitle on license text caption
LangString LicenseSubTitleUpdate ${LANG_ENGLISH} " Update"
LangString LicenseSubTitleSetup ${LANG_ENGLISH} " Setup"

; installation directory text
LangString DirectoryChooseTitle ${LANG_ENGLISH} "Installation Directory" 
LangString DirectoryChooseUpdate ${LANG_ENGLISH} "Select the Meerkat directory to update to version ${VERSION_LONG}.(XXX):"
LangString DirectoryChooseSetup ${LANG_ENGLISH} "Select the directory to install Meerkat in:"

; CheckStartupParams message box
LangString CheckStartupParamsMB ${LANG_ENGLISH} "Could not find the program '$INSTPROG'. Silent update failed."

; installation success dialog
LangString InstSuccesssQuestion ${LANG_ENGLISH} "Start Meerkat now?"

; remove old NSIS version
LangString RemoveOldNSISVersion ${LANG_ENGLISH} "Checking for old version..."

; check windows version
LangString CheckWindowsVersionDP ${LANG_ENGLISH} "Checking Windows version..."
LangString CheckWindowsVersionMB ${LANG_ENGLISH} 'Meerkat only supports Windows XP, Windows 2000, and Mac OS X.$\n$\nAttempting to install on Windows $R0 can result in crashes and data loss.$\n$\nInstall anyway?'

; checkifadministrator function (install)
LangString CheckAdministratorInstDP ${LANG_ENGLISH} "Checking for permission to install..."
LangString CheckAdministratorInstMB ${LANG_ENGLISH} 'You appear to be using a "limited" account.$\nYou must be an "administrator" to install Meerkat.'

; checkifadministrator function (uninstall)
LangString CheckAdministratorUnInstDP ${LANG_ENGLISH} "Checking for permission to uninstall..."
LangString CheckAdministratorUnInstMB ${LANG_ENGLISH} 'You appear to be using a "limited" account.$\nYou must be an "administrator" to uninstall Meerkat.'

; checkifalreadycurrent
LangString CheckIfCurrentMB ${LANG_ENGLISH} "It appears that Meerkat ${VERSION_LONG} is already installed.$\n$\nWould you like to install it again?"

; closeMeerkat function (install)
LangString CloseMeerkatInstDP ${LANG_ENGLISH} "Waiting for Meerkat to shut down..."
LangString CloseMeerkatInstMB ${LANG_ENGLISH} "Meerkat can't be installed while it is already running.$\n$\nFinish what you're doing then select OK to close Meerkat and continue.$\nSelect CANCEL to cancel installation."

; closeMeerkat function (uninstall)
LangString CloseMeerkatUnInstDP ${LANG_ENGLISH} "Waiting for Meerkat to shut down..."
LangString CloseMeerkatUnInstMB ${LANG_ENGLISH} "Meerkat can't be uninstalled while it is already running.$\n$\nFinish what you're doing then select OK to close Meerkat and continue.$\nSelect CANCEL to cancel."

; removecachefiles
LangString RemoveCacheFilesDP ${LANG_ENGLISH} "Deleting cache files in Documents and Settings folder"

; delete program files
LangString DeleteProgramFilesMB ${LANG_ENGLISH} "There are still files in your Meerkat program directory.$\n$\nThese are possibly files you created or moved to:$\n$INSTDIR$\n$\nDo you want to remove them?"

; uninstall text
LangString UninstallTextMsg ${LANG_ENGLISH} "This will uninstall Meerkat ${VERSION_LONG} from your system."
