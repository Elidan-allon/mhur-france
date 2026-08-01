@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V555

cscript //nologo "%~dp0ANNULER_CORRECTIF_V555.js"

echo.
pause
