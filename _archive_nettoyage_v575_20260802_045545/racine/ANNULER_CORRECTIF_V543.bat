@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V543

cscript //nologo "%~dp0ANNULER_CORRECTIF_V543.js"

echo.
pause
