@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title MHUR France - Correctif V537 Repare

cscript //nologo "%~dp0APPLIQUER_CORRECTIF_V537_REPARE.js"

echo.
pause
