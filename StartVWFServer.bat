@echo off
set NPM_PATH=%HOMEDRIVE%%HOME_PATH%\AppData\Roaming\npm
set NODEJS_PATH=%ProgramFiles%\nodejs
set PATH=%NPM_PATH%;%NODEJS_PATH%;%PATH%
cd C:\ITDG\VWF
npm start
exit