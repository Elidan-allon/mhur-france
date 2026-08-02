@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V540

cscript //nologo "%~dp0ANNULER_CORRECTIF_V540.js"

echo.
pause
