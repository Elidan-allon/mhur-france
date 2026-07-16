@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
title Activer la synchronisation automatique UltraRumble
if not exist "index.html" goto INCOMPLETE
if not exist "mise_a_jour\outils\surveiller_ultrarumble.py" goto INCOMPLETE
set "PY_CMD="
where py >nul 2>&1 && set "PY_CMD=py -3"
if not defined PY_CMD where python >nul 2>&1 && set "PY_CMD=python"
if not defined PY_CMD goto NOPYTHON
%PY_CMD% -c "import requests, bs4, lxml" >nul 2>&1
if errorlevel 1 %PY_CMD% -m pip install -r "mise_a_jour\requirements.txt"
if errorlevel 1 goto ERROR
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0outils\activer_synchronisation_ultrarumble.ps1"
if errorlevel 1 goto ERROR
echo.
echo [OK] La tache automatique est activee.
echo Pour forcer une mise a jour complete tout de suite, utilise :
echo mise_a_jour\METTRE_A_JOUR_MAINTENANT.bat
pause
exit /b 0
:INCOMPLETE
echo [DOSSIER INCOMPLET] Extrais entierement le ZIP.
pause
exit /b 2
:NOPYTHON
echo [PYTHON INTROUVABLE] Installe Python 3 et coche Add Python to PATH.
pause
exit /b 3
:ERROR
echo [ERREUR] Activation impossible.
pause
exit /b 1
