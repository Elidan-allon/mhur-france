@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Annuler Gentle V529

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ANNULER_GENTLE_V529.ps1"

echo.
pause
