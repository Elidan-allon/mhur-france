@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V531

cscript //nologo "%~dp0ANNULER_CORRECTIF_V531.js"

echo.
pause
