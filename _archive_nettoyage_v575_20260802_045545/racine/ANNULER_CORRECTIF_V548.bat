@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V548
cscript //nologo "%~dp0ANNULER_CORRECTIF_V548.js"
echo.
pause
