@echo off
chcp 65001 >nul
title MHUR FRANCE - Annuler V578
cd /d "%~dp0"
node "ANNULER_CORRECTIF_V578.js"
echo.
pause
