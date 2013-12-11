@ECHO OFF

REM Check to see if the VWF_DIR environment variable exists. If not, ask the user where they extracted VWF to set the variable
REM This allows us to update the PATH variable and run VWF commands from any folder in the future.
SET VWF_DIR=%VWF_DIR%
SETLOCAL enableextensions enabledelayedexpansion
IF "%VWF_DIR%"=="" goto :setup
IF NOT EXIST "%VWF_DIR%" goto :setup
goto :start

:setup
echo "VWF_DIR" variable is not set. 
echo This occurs the first time you execute VWF or if you have moved your VWF folder.  
echo To complete your installation please enter your directory path for VWF. 
echo A restart will be required to complete configuration.
set /p VWF_DIR="Enter VWF Folder Location: "
REG DELETE "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH /f 
REG DELETE "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v VWF_DIR /f 
REG ADD "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v VWF_DIR /d !VWF_DIR!
REG ADD "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH /d "%path%;!VWF_DIR!"
echo "VWF_DIR" is now set to !VWF_DIR!. You will need to restart your computer now.
echo Shutting down in 30 seconds. Please type "shutdown /a" to abort.
cmd.exe /K shutdown /f /t 30 /r



:start
REM Check to see if Node is installed and accessible from the Path variable
set test=c:\program files (x86)\nodejs
call:inPath test 

REM  If it is, we start up the NodeJS Server. The NodeJS server accepts command line parameters.
REM  C:\> vwf --help will display all of the currently available parameters accepted by Virtual World Framework

IF NOT ERRORLEVEL 1 pushd %VWF_DIR% && cmd.exe /C npm install && popd && cmd.exe /C node "%VWF_DIR%/node-server.js" %*
IF ERRORLEVEL 1 set test=c:\program files\nodejs & call:inPath test 
IF ERRORLEVEL 1 bitsadmin.exe /transfer "NodeJS is not installed. We are downloading NodeJS for you." http://nodejs.org/dist/v0.10.22/x64/node-v0.10.22-x64.msi C:\windows\temp\node-v0.10.22-x64.msi & call C:\windows\temp\node-v0.10.22-x64.msi & echo Node is now installed. You will need to restart your computer and execute VWF again to start your server.
endlocal

:inPath pathVar
::
::  Tests if the path stored within variable pathVar exists within PATH.
::
::  The result is returned as the ERRORLEVEL:
::    0 if the pathVar path is found in PATH.
::    1 if the pathVar path is not found in PATH.
::    2 if pathVar is missing or undefined or if PATH is undefined.
::
::  If the pathVar path is fully qualified, then it is logically compared
::  to each fully qualified path within PATH. The path strings don't have
::  to match exactly, they just need to be logically equivalent.
::
::  If the pathVar path is relative, then it is strictly compared to each
::  relative path within PATH. Case differences and double quotes are
::  ignored, but otherwise the path strings must match exactly.
::
::------------------------------------------------------------------------
::
:: Error checking
if "%~1"=="" exit /b 2
if not defined %~1 exit /b 2
if not defined path exit /b 2
::
:: Prepare to safely parse PATH into individual paths
setlocal DisableDelayedExpansion
set "var=%path:"=""%"
set "var=%var:^=^^%"
set "var=%var:&=^&%"
set "var=%var:|=^|%"
set "var=%var:<=^<%"
set "var=%var:>=^>%"
set "var=%var:;=^;^;%"
set var=%var:""="%
set "var=%var:"=""Q%"
set "var=%var:;;="S"S%"
set "var=%var:^;^;=;%"
set "var=%var:""="%"
setlocal EnableDelayedExpansion
set "var=!var:"Q=!"
set "var=!var:"S"S=";"!"
::
:: Remove quotes from pathVar and abort if it becomes empty
set "new=!%~1:"=!"
if not defined new exit /b 2
::
:: Determine if pathVar is fully qualified
echo("!new!"|findstr /i /r /c:^"^^\"[a-zA-Z]:[\\/][^\\/]" ^
                           /c:^"^^\"[\\][\\]" >nul ^
  && set "abs=1" || set "abs=0"
::
:: For each path in PATH, check if path is fully qualified and then do
:: proper comparison with pathVar.
:: Exit with ERRORLEVEL 0 if a match is found.
:: Delayed expansion must be disabled when expanding FOR variables
:: just in case the value contains !
for %%A in ("!new!\") do for %%B in ("!var!") do (
  if "!!"=="" endlocal
  for %%C in ("%%~B\") do (
    echo(%%B|findstr /i /r /c:^"^^\"[a-zA-Z]:[\\/][^\\/]" ^
                           /c:^"^^\"[\\][\\]" >nul ^
      && (if %abs%==1 if /i "%%~sA"=="%%~sC" exit /b 0) ^
      || (if %abs%==0 if /i "%%~A"=="%%~C" exit /b 0)
  )
)
:: No match was found so exit with ERRORLEVEL 1
exit /b 1