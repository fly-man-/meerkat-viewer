; First is default
LoadLanguageFile "${NSISDIR}\Contrib\Language files\French.nlf"

; Language selection dialog
LangString InstallerLanguageTitle  ${LANG_FRENCH} "Langue du programme d’installation"
LangString SelectInstallerLanguage  ${LANG_FRENCH} "Veuillez sélectionner la langue du programme d’installation"

; subtitle on license text caption
LangString LicenseSubTitleUpdate ${LANG_FRENCH} " Mise à jour"
LangString LicenseSubTitleSetup ${LANG_FRENCH} " Configuration"

; installation directory text
LangString DirectoryChooseTitle ${LANG_FRENCH} "Répertoire d'installation" 
LangString DirectoryChooseUpdate ${LANG_FRENCH} "Sélectionnez le répertoire de  pour installer la nouvelle version ${VERSION_LONG}. (XXX) :"
LangString DirectoryChooseSetup ${LANG_FRENCH} "Sélectionnez le répertoire dans lequel installer  :"

; CheckStartupParams message box
LangString CheckStartupParamsMB ${LANG_FRENCH} "Impossible de trouver le programme '$INSTPROG'. La mise à jour silencieuse a échoué."

; installation success dialog
LangString InstSuccesssQuestion ${LANG_FRENCH} "Démarrer  maintenant ?"

; remove old NSIS version
LangString RemoveOldNSISVersion ${LANG_FRENCH} "Vérification de l'ancienne version en cours..."

; check windows version
LangString CheckWindowsVersionDP ${LANG_FRENCH} "Vérification de la version de Windows en cours..."
LangString CheckWindowsVersionMB ${LANG_FRENCH} " prend uniquement en charge Windows XP, Windows 2000 et Mac OS X.$\n$\nToute tentative d'installation sous Windows $R0 peut causer des crashs et des pertes de données.$\n$\nInstaller quand même ?"

; checkifadministrator function (install)
LangString CheckAdministratorInstDP ${LANG_FRENCH} "Vérification de la permission pour effectuer l'installation en cours..."
LangString CheckAdministratorInstMB ${LANG_FRENCH} "Il semblerait que votre compte soit « limité ».$\nPour installer , vous devez avoir un compte « administrateur »."

; checkifadministrator function (uninstall)
LangString CheckAdministratorUnInstDP ${LANG_FRENCH} "Vérification de la permission pour effectuer la désinstallation en cours..."
LangString CheckAdministratorUnInstMB ${LANG_FRENCH} "Il semblerait que votre compte soit « limité ».$\nPour désinstaller , vous devez avoir un compte « administrateur »."

; checkifalreadycurrent
LangString CheckIfCurrentMB ${LANG_FRENCH} "Il semblerait que vous ayez déjà installé  ${VERSION_LONG}.$\n$\nSouhaitez-vous procéder à une nouvelle installation ?"

; close function (install)
LangString CloseInstDP ${LANG_FRENCH} "En attente de la fermeture de ..."
LangString CloseInstMB ${LANG_FRENCH} " ne peut pas être installée si l'application est déjà lancée..$\n$\nFinissez ce que vous faîtes puis sélectionnez OK pour fermer  et continuer.$\nSélectionnez ANNULER pour annuler l'installation."

; close function (uninstall)
LangString CloseUnInstDP ${LANG_FRENCH} "En attente de la fermeture de ..."
LangString CloseUnInstMB ${LANG_FRENCH} " ne peut pas être désinstallée si l'application est déjà lancée.$\n$\nFinissez ce que vous faîtes puis sélectionnez OK pour fermer  et continuer.$\nSélectionnez ANNULER pour annuler la désinstallation."

; CheckNetworkConnection
LangString CheckNetworkConnectionDP ${LANG_FRENCH} "Connexion au réseau en cours de vérification..."

; removecachefiles
LangString RemoveCacheFilesDP ${LANG_FRENCH} "Suppression des fichiers du cache dans le dossier Documents et Paramètres"

; delete program files
LangString DeleteProgramFilesMB ${LANG_FRENCH} "Il y a encore des fichiers dans votre répertoire .$\n$\nIl est possible que vous ayez créé ou déplacé ces dossiers vers : $\n$INSTDIR$\n$\nVoulez-vous les supprimer ?"

; uninstall text
LangString UninstallTextMsg ${LANG_FRENCH} "Cela désinstallera  ${VERSION_LONG} de votre système."
