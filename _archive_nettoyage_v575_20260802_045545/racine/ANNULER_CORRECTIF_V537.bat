@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V537

cscript //nologo "%~dp0ANNULER_CORRECTIF_V537.js"

echo.
pause
