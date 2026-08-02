@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V545

cscript //nologo "%~dp0ANNULER_CORRECTIF_V545.js"

echo.
pause
