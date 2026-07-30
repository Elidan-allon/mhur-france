@echo off
setlocal
chcp 65001 >nul
title MHUR France - Correctif V520
cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0APPLIQUER_CORRECTIF_V520.ps1"
set "RESULTAT=%ERRORLEVEL%"

echo.
if not "%RESULTAT%"=="0" (
  echo [ERREUR] Le correctif n'a pas ete applique.
  echo Aucune ecriture finale n'est faite si la verification des balises echoue.
) else (
  echo [TERMINE] Correctif V520 applique.
)
echo.
pause
exit /b %RESULTAT%
