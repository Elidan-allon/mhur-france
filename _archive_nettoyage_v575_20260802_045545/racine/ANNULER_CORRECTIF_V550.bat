@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V550

cscript //nologo "%~dp0ANNULER_CORRECTIF_V550.js"

echo.
pause
