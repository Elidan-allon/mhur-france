@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V557

cscript //nologo "%~dp0ANNULER_CORRECTIF_V557.js"

echo.
pause
