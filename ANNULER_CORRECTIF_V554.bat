@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V554

cscript //nologo "%~dp0ANNULER_CORRECTIF_V554.js"

echo.
pause
