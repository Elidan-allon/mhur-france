@echo off
setlocal
chcp 65001 >nul
title MHUR France - Annuler V520
cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0ANNULER_CORRECTIF_V520.ps1"
set "RESULTAT=%ERRORLEVEL%"
echo.
pause
exit /b %RESULTAT%
