@echo off
setlocal
cd /d "%~dp0.."
title Configurer la communaute MHUR France
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\mise_a_jour\outils\configurer_communaute.ps1"
if errorlevel 1 (
  echo.
  echo [ERREUR] Configuration annulee ou invalide.
  pause
  exit /b 1
)
echo.
pause
