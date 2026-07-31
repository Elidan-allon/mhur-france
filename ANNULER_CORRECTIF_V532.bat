@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V532

cscript //nologo "%~dp0ANNULER_CORRECTIF_V532.js"

echo.
pause
