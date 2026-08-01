@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V553

cscript //nologo "%~dp0ANNULER_CORRECTIF_V553.js"

echo.
pause
