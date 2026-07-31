@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V542

cscript //nologo "%~dp0ANNULER_CORRECTIF_V542.js"

echo.
pause
