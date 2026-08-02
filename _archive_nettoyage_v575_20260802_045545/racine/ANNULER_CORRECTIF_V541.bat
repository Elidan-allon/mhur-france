@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler MHUR V541

cscript //nologo "%~dp0ANNULER_CORRECTIF_V541.js"

echo.
pause
