@echo off
chcp 65001 >nul
title MHUR FRANCE - Annuler V576
cd /d "%~dp0"
node "ANNULER_TOUT_V576.js"
echo.
pause
