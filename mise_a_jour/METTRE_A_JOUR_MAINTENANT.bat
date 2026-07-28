@echo off
setlocal EnableExtensions
set "SCRIPT_DIR=%~dp0"
set "ROOT="

rem Cas normal : ce fichier est dans mhur-france\mise_a_jour\
for %%I in ("%SCRIPT_DIR%..") do set "CANDIDATE=%%~fI"
if exist "%CANDIDATE%\public\index.html" if exist "%CANDIDATE%\mise_a_jour\outils\surveiller_ultrarumble.py" set "ROOT=%CANDIDATE%"

rem Cas accepte : le fichier a ete place directement a la racine du site.
if not defined ROOT (
  for %%I in ("%SCRIPT_DIR%") do set "CANDIDATE=%%~fI"
  if exist "%CANDIDATE%\public\index.html" if exist "%CANDIDATE%\mise_a_jour\outils\surveiller_ultrarumble.py" set "ROOT=%CANDIDATE%"
)

if not defined ROOT goto INCOMPLETE
pushd "%ROOT%" >nul 2>&1 || goto INCOMPLETE

title Mettre a jour MHUR France maintenant

set "PY_CMD="
where py >nul 2>&1 && set "PY_CMD=py -3"
if not defined PY_CMD where python >nul 2>&1 && set "PY_CMD=python"
if not defined PY_CMD goto NOPYTHON

if not exist "public\data\ultrarumble" mkdir "public\data\ultrarumble" >nul 2>&1
set "LOG=public\data\ultrarumble\synchronisation_ultrarumble.log"

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
%PY_CMD% "mise_a_jour\outils\surveiller_ultrarumble.py" --site-root "public" --force --wait-lock 300
if errorlevel 1 goto ERROR

echo.
echo [OK] Le site a ete mis a jour immediatement.
echo Ouvre public\index.html pour voir les changements.
echo.
popd
pause
exit /b 0

:INCOMPLETE
echo.
echo [DOSSIER INTROUVABLE] Le programme ne trouve pas les fichiers du site.
echo.
echo Garde ce fichier dans :
echo   mhur-france\mise_a_jour\METTRE_A_JOUR_MAINTENANT.bat
echo.
echo Les deux fichiers suivants doivent exister :
echo   mhur-france\public\index.html
echo   mhur-france\mise_a_jour\outils\surveiller_ultrarumble.py
echo.
echo Ne lance pas le fichier depuis l'apercu d'une archive ZIP et ne le deplace pas seul.
pause
exit /b 2

:NOPYTHON
echo.
echo [PYTHON INTROUVABLE] Installe Python 3 et coche Add Python to PATH.
echo.
popd
pause
exit /b 3

:ERROR
echo.
echo [ERREUR] La mise a jour a echoue.
echo Consulte le fichier : %LOG%
echo.
popd
pause
exit /b 1
