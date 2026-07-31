@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V535

cscript //nologo "%~dp0ANNULER_CORRECTIF_V535.js"

echo.
pause
