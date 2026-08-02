@echo off
chcp 65001 >nul
title MHUR FRANCE - Annuler V566
cd /d "%~dp0"
node "ANNULER_CORRECTIF_V566.js"
echo.
pause
