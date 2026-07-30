@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Gentle Criminal - Correctif V528

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0APPLIQUER_GENTLE_V528.ps1"

echo.
pause
