@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V549

cscript //nologo "%~dp0ANNULER_CORRECTIF_V549.js"

echo.
pause
