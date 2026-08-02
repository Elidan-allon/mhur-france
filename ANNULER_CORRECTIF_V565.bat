@echo off
chcp 65001 >nul
title MHUR FRANCE - Annuler V565
cd /d "%~dp0"
node "ANNULER_CORRECTIF_V565.js"
echo.
pause
