@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title MHUR France - Correctif V553

cscript //nologo "%~dp0APPLIQUER_CORRECTIF_V553.js"

echo.
pause
