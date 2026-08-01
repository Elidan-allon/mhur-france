@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title MHUR France - Correctif V554

cscript //nologo "%~dp0APPLIQUER_CORRECTIF_V554.js"

echo.
pause
