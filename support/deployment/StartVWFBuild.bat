REM Intitial Setup
echo off
set ENV=temp
set PATH=C:\cygwin\bin;%PATH%;C:\Program Files (x86)\NSIS
SET IS_CYGWIN=true
set HISTSIZE=1200
set HOME=temp
set CYGWIN=mintty

REM Start Build

call bash "/cygdrive/c/cygwin/build.sh"

REM Extract Node
cd c:\vwf\node
7z x -y c:\vwf\node\*.zip 
cd c:\
del c:\vwf\node\*.zip

REM Packaging Section

REM Read Version Number and Set Variable For Package Name

set content=
for /F "delims=" %%i in (version.txt) do set content=%%i
echo %content%
set datetimef=%content%

set str=VWF_Master_%datetimef%-windows-full
set str2=VWF_Master_%datetimef%-source-code

REM CREATE VWF FULL PACKAGE AND MOVE TO DOWNLOADS WEBSITE

7za a -mx9 -tzip %str%.zip vwf
ncftpput -f C:\login.txt .\archive c:\%str%.zip
del c:\%str%.zip

REM CREATE VWF SOURCE PACKAGE AND MOVE TO DOWNLOADS WEBSITE

7za a -mx9 -tzip %str2%.zip vwfsource
ncftpput -f C:\login.txt .\archive c:\%str2%.zip
del c:\%str2%.zip


REM CREATE VWF INSTALLER AND MOVE TO DOWNLOADS WEBSITE

(
echo \public\
echo \support\build\ruby-1.9.3-p392-i386-mingw32\
echo \support\build\DevKit-tdm-32-4.5.2-20111229-1559-sfx\
echo \support\build\ruby-1.9.3-p392-i386-mingw32.7z
echo \support\build\DevKit-tdm-32-4.5.2-20111229-1559-sfx.7z
)>Exclusion_List.txt

RMDir c:\vwf_temp /s /q

echo d | xcopy vwf vwf_temp /e /f /s /d /y /EXCLUDE:Exclusion_List.txt
makensis c:\vwf\support\build\Scripts\build_windows_installer.nsi
ncftpput -f C:\login.txt . c:\VWF_Windows_Install.exe

REM CLOSE SERVER WHEN COMPLETE
REM SHUTDOWN /s /t 60 /c "Shutdown in progress, leave the vicinity immediately"