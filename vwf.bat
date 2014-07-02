@ECHO OFF

:start
REM Check to see if Node is installed and accessible from the Path variable
REM  If it is, we start up the NodeJS Server. The NodeJS server accepts command line parameters.
REM  C:\> vwf --help will display all of the currently available parameters accepted by Virtual World Framework
pushd %VWF_DIR% && npm install && popd && node "%VWF_DIR%/node-server.js" %*
