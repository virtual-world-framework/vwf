Function openLinkNewWindow
  Push $3
  Exch
  Push $2
  Exch
  Push $1
  Exch
  Push $0
  Exch

  ReadRegStr $0 HKCR "http\shell\open\command" ""
# Get browser path
    DetailPrint $0
  StrCpy $2 '"'
  StrCpy $1 $0 1
  StrCmp $1 $2 +2 # if path is not enclosed in " look for space as final char
    StrCpy $2 ' '
  StrCpy $3 1
  loop:
    StrCpy $1 $0 1 $3
    DetailPrint $1
    StrCmp $1 $2 found
    StrCmp $1 "" found
    IntOp $3 $3 + 1
    Goto loop

  found:
    StrCpy $1 $0 $3
    StrCmp $2 " " +2
      StrCpy $1 '$1"'

  Pop $0
  Exec '$1 $0'
  Pop $0
  Pop $1
  Pop $2
  Pop $3
FunctionEnd

!macro _OpenURL URL
Push "${URL}"
Call openLinkNewWindow
!macroend

!define OpenURL '!insertmacro "_OpenURL"'
!include EnvVarUpdate.nsh
!include "x64.nsh"
; MUI 1.67 compatible ------
!include "MUI.nsh"
!include LogicLib.nsh

!ifdef GENFILELIST
OutFile "${GENFILELIST}.exe"
RequestExecutionLevel user
SilentInstall silent
Var ins
Var uns
Function ProcessDir
        Pop $R1 ;reldir
        Pop $R0 ;absdir
        Push $0
        Push $1
        FileWrite $ins 'Push $$Outdir$\n'
        FileWrite $ins 'SetOutPath "$$instdir\$R1"$\n'
        FindFirst $0 $1 "$R0\*"
        loop:
            StrCmp "" $1  done
            StrCmp "." $1 next
            StrCmp ".." $1 next
            IfFileExists "$R0\$1\*.*" 0 processfile
                Push $R0
                Push $R1
                Push "$R0\$1"
                Push "$R1$1\"
                call ProcessDir
                Pop $R1
                Pop $R0
                goto next
        processfile:
            FileWrite $ins 'File "${SRCDIR}\$R1$1"$\n'
            FileWrite $uns 'Delete "$$instdir\$R1$1"$\n'
        next:
            FindNext $0 $1
            Goto loop
        done:
        FindClose $0
        FileWrite $uns 'RMDir "$$instdir\$R1"$\n'
        FileWrite $ins 'Pop $$Outdir$\n'
        Pop $1
        Pop $0
FunctionEnd
Section
        FileOpen $ins "${GENFILELIST}ins" w
        FileOpen $uns "${GENFILELIST}uns" w
        Push "${SRCDIR}"
        Push ""
        Call ProcessDir
SectionEnd
!else
!TempFile FILELIST
!System '"${NSISDIR}\makensis" -NOCD "-DGENFILELIST=${FILELIST}" "-DSRCDIR=c:\vwf_temp" "${__FILE__}"' = 0
!System '"${FILELIST}.exe"' = 0
!DelFile "${FILELIST}"
!DelFile "${FILELIST}.exe"

### Main script starts here ###
; Script for VWF installation creation

!define PRODUCT_NAME "Virtual World Framework"
!define PRODUCT_VERSION "0.6"
!define PRODUCT_PUBLISHER "Lockheed Martin"
!define PRODUCT_WEB_SITE "http://www.virtualworldframework.com"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"



; MUI Settings
!define MUI_ABORTWARNING
!define MUI_ICON "c:\Users\Administrator\Desktop\876fede2976334ba33c3ce6004e8be7a_normal.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"


; Welcome page
!insertmacro MUI_PAGE_WELCOME
; Directory page
!insertmacro MUI_PAGE_DIRECTORY
; Instfiles page
!insertmacro MUI_PAGE_INSTFILES
; Finish page
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_INSTFILES

; Language files
!insertmacro MUI_LANGUAGE "English"

; MUI end ------
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "c:\VWF_Windows_Install.exe"
InstallDir "$PROGRAMFILES\Virtual World Framework"
ShowInstDetails show
ShowUnInstDetails show

Section
        SetOutPath $instdir
        WriteUninstaller "$instdir\uninst.exe"
        !Include "${FILELIST}ins"
        !DelFile "${FILELIST}ins"
        WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
        WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
        WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
        WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
        WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
        ${EnvVarUpdate} $0 "PATH" "A" "HKLM" "$INSTDIR"  ; Append the new path
        ${EnvVarUpdate} $0 "PATH" "A" "HKLM" "$INSTDIR\node"  ; Append the new path
        ${EnvVarUpdate} $0 "VWF_DIR" "A" "HKLM" "$INSTDIR"  ; Append the new path
        ${OpenURL} "https://github.com/virtual-world-framework/vwf/blob/development/README.md"
SectionEnd

Function un.onUninstSuccess
  HideWindow
  MessageBox MB_ICONINFORMATION|MB_OK "$(^Name) was successfully removed from your computer."
FunctionEnd

Function un.onInit
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "Are you sure you want to completely remove $(^Name) and all of its components?" IDYES +2
  Abort
FunctionEnd

Section uninstall
        !Include "${FILELIST}uns"
        !DelFile "${FILELIST}uns"
        Delete "$instdir\uninst.exe"
        RMDir "$instdir"
        DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
        ${un.EnvVarUpdate} $0 "PATH" "R" "HKLM" "$INSTDIR"  ; Append the new path
        ${un.EnvVarUpdate} $0 "VWF_DIR" "R" "HKLM" "$INSTDIR"  ; Append the new path
        ${un.EnvVarUpdate} $0 "PATH" "A" "HKLM" "$INSTDIR\node"  ; Append the new path
        SetAutoClose true
SectionEnd
!endif
