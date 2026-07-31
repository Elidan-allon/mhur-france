@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V544

cscript //nologo "%~dp0ANNULER_CORRECTIF_V544.js"

echo.
pause
