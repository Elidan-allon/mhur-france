@echo off
setlocal EnableExtensions

set "START_DIR=%~dp0"
pushd "%START_DIR%" >nul 2>&1
if errorlevel 1 (
  echo [ERREUR] Impossible d'ouvrir le dossier du correctif.
  pause
  exit /b 1
)

set "PREVIOUS_DIR="
:SEARCH_SITE_ROOT
if exist "mise_a_jour\outils\indexer_portraits_assets.py" if exist "public\assets" goto SITE_ROOT_FOUND
set "PREVIOUS_DIR=%CD%"
cd ..
if /I "%CD%"=="%PREVIOUS_DIR%" goto SITE_ROOT_NOT_FOUND
goto SEARCH_SITE_ROOT

:SITE_ROOT_FOUND
set "SITE_ROOT=%CD%"
echo ===============================================
echo  PORTRAITS LOCAUX VIA PUBLIC\ASSETS
echo ===============================================
echo.
echo Dossier du site detecte :
echo %SITE_ROOT%
echo.

where py >nul 2>&1
if not errorlevel 1 (
  py -3 "%SITE_ROOT%\mise_a_jour\outils\indexer_portraits_assets.py" --site-root "%SITE_ROOT%"
  goto CHECK_RESULT
)

where python >nul 2>&1
if not errorlevel 1 (
  python "%SITE_ROOT%\mise_a_jour\outils\indexer_portraits_assets.py" --site-root "%SITE_ROOT%"
  goto CHECK_RESULT
)

echo [ERREUR] Python est introuvable.
echo Installe Python ou ajoute-le au PATH Windows.
goto FAILED

:CHECK_RESULT
if errorlevel 1 goto FAILED

echo.
echo [OK] Les portraits sont indexes depuis :
echo %SITE_ROOT%\public\assets\personnage\style\portrait.*
echo.
popd >nul 2>&1
pause
exit /b 0

:SITE_ROOT_NOT_FOUND
echo ===============================================
echo  PORTRAITS LOCAUX VIA PUBLIC\ASSETS
echo ===============================================
echo.
echo [ERREUR] Le dossier racine de MHUR-France est introuvable.
echo.
echo Le fichier peut etre lance depuis la racine du site,
echo depuis public ou meme depuis public\assets, mais la structure suivante doit exister :
echo   mhur-france\public\assets
echo   mhur-france\mise_a_jour\outils\indexer_portraits_assets.py
echo.
goto FAILED

:FAILED
popd >nul 2>&1
pause
exit /b 1
