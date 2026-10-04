@echo off
cd /d "%~dp0"
powershell -NoProfile -Command "try { $response = Invoke-WebRequest 'http://localhost:4175/' -UseBasicParsing -TimeoutSec 2; if ($response.Content -match 'Ashen Vow') { Start-Process 'http://localhost:4175/'; exit 0 }; exit 1 } catch { exit 1 }"
if %errorlevel% == 0 exit /b 0
if not exist "node_modules" (
  call npm install
  if errorlevel 1 goto failed
)
if not exist "dist\index.html" (
  call npm run build
  if errorlevel 1 goto failed
)
call npm run preview -- --open
:failed
pause
