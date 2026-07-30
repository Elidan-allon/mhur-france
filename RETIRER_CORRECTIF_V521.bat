@echo off
setlocal
chcp 65001 >nul
title MHUR France - Retirer V521
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0RETIRER_CORRECTIF_V521.ps1"
set "RESULTAT=%ERRORLEVEL%"
echo.
pause
exit /b %RESULTAT%
