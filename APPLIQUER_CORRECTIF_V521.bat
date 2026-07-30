@echo off
setlocal
chcp 65001 >nul
title MHUR France - Correctif V521
cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0APPLIQUER_CORRECTIF_V521.ps1"
set "RESULTAT=%ERRORLEVEL%"

echo.
if not "%RESULTAT%"=="0" (
  echo [ERREUR] Le correctif V521 n'a pas ete applique.
) else (
  echo [TERMINE] Correctif V521 applique.
)
echo.
pause
exit /b %RESULTAT%
