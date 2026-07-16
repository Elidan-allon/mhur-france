@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
title Verifier UltraRumble maintenant
call "%~dp0outils\VERIFIER_ET_SYNCHRONISER_SILENCIEUX.bat"
echo.
if errorlevel 1 (echo [ERREUR] Consulte data\ultrarumble\synchronisation_ultrarumble.log) else (echo [OK] Verification terminee.)
pause
