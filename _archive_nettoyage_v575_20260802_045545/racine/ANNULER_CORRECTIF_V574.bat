@echo off
chcp 65001 >nul
cd /d "%~dp0"
node "ANNULER_CORRECTIF_V574.js"
echo.
pause
