@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V556

cscript //nologo "%~dp0ANNULER_CORRECTIF_V556.js"

echo.
pause
