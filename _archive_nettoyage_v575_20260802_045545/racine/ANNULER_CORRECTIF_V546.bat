@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V546

cscript //nologo "%~dp0ANNULER_CORRECTIF_V546.js"

echo.
pause
