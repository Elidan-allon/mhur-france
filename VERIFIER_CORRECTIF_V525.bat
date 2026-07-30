@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title MHUR France - Verification V525

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0VERIFIER_CORRECTIF_V525.ps1"

echo.
pause
