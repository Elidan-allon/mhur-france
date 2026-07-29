@echo off
setlocal EnableExtensions
chcp 65001 >nul 2>&1
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"
cd /d "%~dp0.."
title Verifier UltraRumble maintenant
call "%~dp0outils\VERIFIER_ET_SYNCHRONISER_SILENCIEUX.bat"
echo.
if errorlevel 1 (echo [ERREUR] Consulte data\ultrarumble\synchronisation_ultrarumble.log) else (echo [OK] Verification terminee.)
pause
