@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V551

cscript //nologo "%~dp0ANNULER_CORRECTIF_V551.js"

echo.
pause
