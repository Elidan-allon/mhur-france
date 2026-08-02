@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V538

cscript //nologo "%~dp0ANNULER_CORRECTIF_V538.js"

echo.
pause
