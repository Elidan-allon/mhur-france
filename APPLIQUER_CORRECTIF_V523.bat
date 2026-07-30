@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title MHUR France - Correctif V523

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0APPLIQUER_CORRECTIF_V523.ps1"

echo.
pause
