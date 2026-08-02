@echo off
chcp 65001 >nul
title MHUR FRANCE - Annuler V577
cd /d "%~dp0"
node "ANNULER_CORRECTIF_V577.js"
echo.
pause
