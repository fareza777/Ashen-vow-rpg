@echo off
cd /d "%~dp0"
call npm run android:apk
pause
