@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
title Mettre a jour MHUR France maintenant

if not exist "public\index.html" goto INCOMPLETE
if not exist "mise_a_jour\outils\surveiller_ultrarumble.py" goto INCOMPLETE

set "PY_CMD="
where py >nul 2>&1 && set "PY_CMD=py -3"
if not defined PY_CMD where python >nul 2>&1 && set "PY_CMD=python"
if not defined PY_CMD goto NOPYTHON

if not exist "data\ultrarumble" mkdir "data\ultrarumble" >nul 2>&1
set "LOG=data\ultrarumble\synchronisation_ultrarumble.log"

%PY_CMD% -c "import requests, bs4, lxml" >nul 2>&1
if errorlevel 1 (
  echo Installation des dependances necessaires...
  %PY_CMD% -m pip install -r "mise_a_jour\requirements.txt"
  if errorlevel 1 goto ERROR
)

echo.
echo ===============================================
echo  MISE A JOUR IMMEDIATE DE MHUR FRANCE
echo ===============================================
echo.
echo Verification et synchronisation complete en cours...
echo Les evenements sont mis a jour en premier. Ne ferme pas cette fenetre avant [OK].
%PY_CMD% "mise_a_jour\outils\surveiller_ultrarumble.py" --site-root public --force --wait-lock 300
if errorlevel 1 goto ERROR

echo.
echo [OK] Le site a ete mis a jour immediatement.
echo Ouvre public\index.html pour voir les changements.
echo.
pause
exit /b 0

:INCOMPLETE
echo [DOSSIER INCOMPLET] Extrais entierement le ZIP avant de lancer ce fichier.
pause
exit /b 2

:NOPYTHON
echo [PYTHON INTROUVABLE] Installe Python 3 et coche Add Python to PATH.
pause
exit /b 3

:ERROR
echo.
echo [ERREUR] La mise a jour a echoue.
echo Consulte le fichier : %LOG%
echo.
pause
exit /b 1
