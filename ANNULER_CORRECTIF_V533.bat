@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V533

cscript //nologo "%~dp0ANNULER_CORRECTIF_V533.js"

echo.
pause
