@ECHO OFF

REM Check to see if the VWF_DIR environment variable exists. If not, ask the user where they extracted VWF to set the variable
REM This allows us to update the PATH variable and run VWF commands from any folder in the future.
IF NOT EXIST "C:\Program Files\nodejs\" ( 
IF NOT EXIST "C:\Program Files (x86)\nodejs\" goto :nodeInstall else goto :nodeInstallSkip) else goto :nodeInstallSkip

:nodeInstall
bitsadmin.exe /transfer "NodeJS is not installed. We are downloading NodeJS for you." http://nodejs.org/dist/v0.10.22/x64/node-v0.10.22-x64.msi C:\windows\temp\node-v0.10.22-x64.msi && call C:\windows\temp\node-v0.10.22-x64.msi 
goto :pathSetup

:nodeInstallSkip
SET VWF_DIR=%VWF_DIR%
SETLOCAL enableextensions enabledelayedexpansion
IF "%VWF_DIR%"=="" goto :pathSetup
IF NOT EXIST "%VWF_DIR%" goto :pathSetup
goto :start

:start
REM Check to see if Node is installed and accessible from the Path variable
REM  If it is, we start up the NodeJS Server. The NodeJS server accepts command line parameters.
REM  C:\> vwf --help will display all of the currently available parameters accepted by Virtual World Framework
pushd %VWF_DIR% && cmd.exe /C npm install && popd && cmd.exe /C node "%VWF_DIR%/node-server.js" %*


:pathSetup
path=%path%;C:\Program Files (x86)\nodejs\;C:\Program Files\nodejs\
echo "VWF_DIR" variable is not set. 
SET VWF_DIR=%CD%
REG DELETE "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH /f 
REG DELETE "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v VWF_DIR /f 
REG ADD "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v VWF_DIR /d %VWF_DIR%
REG ADD "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH /d "%path%;%VWF_DIR%"
path=%path%;%VWF_DIR%
pushd %VWF_DIR% && cmd.exe /C npm install && popd 
echo "VWF_DIR" is now set to %VWF_DIR%. 
echo This occurs the first time you execute VWF, if you have moved your VWF folder, or if you have not restarted since running vwf for the first time.  
echo Please restart your computer at your earliest convenience to clear this message.
cmd.exe /C node "%VWF_DIR%/node-server.js" %*
endlocal

