@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V534

cscript //nologo "%~dp0ANNULER_CORRECTIF_V534.js"

echo.
pause
