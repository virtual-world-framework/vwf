:: Created by npm, please don't edit manually.
@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\node_modules\node-inspector\bin\inspector.js" %*
) ELSE (
  node  "%~dp0\node_modules\node-inspector\bin\inspector.js" %*
)