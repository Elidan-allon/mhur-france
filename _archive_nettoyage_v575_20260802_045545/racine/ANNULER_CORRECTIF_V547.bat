@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V547

cscript //nologo "%~dp0ANNULER_CORRECTIF_V547.js"

echo.
pause
