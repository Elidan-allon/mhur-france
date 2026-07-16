@echo off
setlocal EnableExtensions
cd /d "%~dp0..\.."
if not exist "data\ultrarumble" mkdir "data\ultrarumble" >nul 2>&1
set "LOG=data\ultrarumble\synchronisation_ultrarumble.log"
set "PY_CMD="
where py >nul 2>&1 && set "PY_CMD=py -3"
if not defined PY_CMD where python >nul 2>&1 && set "PY_CMD=python"
if not defined PY_CMD (
  >>"%LOG%" echo [ERREUR] Python 3 est introuvable.
  exit /b 3
)
%PY_CMD% -c "import requests, bs4, lxml" >nul 2>&1
if errorlevel 1 (
  %PY_CMD% -m pip install -r "mise_a_jour\requirements.txt" >>"%LOG%" 2>&1
  if errorlevel 1 exit /b 4
)
%PY_CMD% "mise_a_jour\outils\surveiller_ultrarumble.py" --site-root public
exit /b %ERRORLEVEL%
