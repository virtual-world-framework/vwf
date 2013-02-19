@echo off
start "" "cmd" "/k cd %NODE_INSPECTOR%\node_modules\node-inspector\bin&&node inspector &"

if exist "%NODE_INSPECTOR%\environmentvars.bat" ( 
    start "" "cmd" "/k %NODE_INSPECTOR%\environmentvars.bat&&node --debug-brk app.js" 
) else ( 
    start "" "cmd" "/k node --debug-brk app.js" 
)

start "" %NODE_INSPECTOR_BROWSER% "http://localhost:8080"
echo start "" %NODE_INSPECTOR_BROWSER% "%1%"