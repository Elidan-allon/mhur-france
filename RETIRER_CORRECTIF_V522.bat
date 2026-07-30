@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title MHUR France - Retirer V522

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0RETIRER_CORRECTIF_V522.ps1"

echo.
pause
