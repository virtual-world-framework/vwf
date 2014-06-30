@ECHO OFF

REM Copyright 2014 United States Government, as represented by the Secretary of Defense, Under
REM Secretary of Defense (Personnel & Readiness).

REM Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
REM in compliance with the License. You may obtain a copy of the License at
 
REM   http://www.apache.org/licenses/LICENSE-2.0

REM Unless required by applicable law or agreed to in writing, software distributed under the License
REM is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
REM or implied. See the License for the specific language governing permissions and limitations under
REM the License.

REM ---------------------------

REM Remove the old vwf-build folder if it exists
rmdir /Q /S vwf-windows-build

REM Copy the files and folders that we want
REM /i - If it makes sense that destination is a directory, assume so without asking
REM /s - Copy directories and subdirectories, unless they are empty
REM /k - Retain read-only attribute on copied files
REM /r - Copy read-only files
REM /o - Copy file ownership and discretionary access control list (DACL) information
REM /y - Overwrite existing destination files w/o asking
xcopy /i /s /k /r /o /y /exclude:vwf\support\build\Scripts\exclude.txt vwf\lib vwf-windows-build\lib
xcopy /i /s /k /r /o /y /exclude:vwf\support\build\Scripts\exclude.txt vwf\node vwf-windows-build\node
xcopy /i /s /k /r /o /y /exclude:vwf\support\build\Scripts\exclude.txt vwf\support\cli vwf-windows-build\support\cli
xcopy /i /s /k /r /o /y /exclude:vwf\support\build\Scripts\exclude.txt vwf\support\client vwf-windows-build\support\client
xcopy /i /s /k /r /o /y /exclude:vwf\support\build\Scripts\exclude.txt vwf\support\proxy vwf-windows-build\support\proxy
xcopy /i /s /k /r /o /y /exclude:vwf\support\build\Scripts\exclude.txt vwf\support\server vwf-windows-build\support\server
copy /y vwf\CHANGELOG.md vwf-windows-build
copy /y vwf\LICENSE vwf-windows-build
copy /y vwf\node_vwf.js vwf-windows-build
copy /y vwf\node-server.js vwf-windows-build
copy /y vwf\npm-shrinkwrap.json vwf-windows-build
copy /y vwf\package.json vwf-windows-build
copy /y vwf\README.md vwf-windows-build
copy /y vwf\vwf.bat vwf-windows-build

REM Run heat to create .wxs file
"%WIX%bin\heat" dir ".\vwf-windows-build" -ag -out vwf-files.wxs

REM Run candle to create .wixobj files
"%WIX%bin\candle" vwf\support\build\Scripts\product.wxs vwf-files.wxs

REM Run light to create .msi
"%WIX%bin\light" product.wixobj vwf-files.wixobj -out vwf.msi
