@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "ZIP="
if exist "%~dp0assets.zip" set "ZIP=%~dp0assets.zip"
if not defined ZIP if exist "%~dp0..\assets.zip" set "ZIP=%~dp0..\assets.zip"

if not defined ZIP (
  echo.
  echo [ERREUR] assets.zip est introuvable.
  echo Place ton fichier assets.zip dans ce dossier mhur-france,
  echo puis relance INSTALLER_MES_ASSETS.bat.
  echo.
  pause
  exit /b 1
)

echo Installation de tes assets dans public\assets...
set "TMP=%TEMP%\mhur_assets_v31_%RANDOM%"
mkdir "%TMP%" >nul 2>&1

powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '%ZIP%' -DestinationPath '%TMP%' -Force"
if errorlevel 1 (
  echo [ERREUR] Impossible d'extraire assets.zip.
  rmdir /s /q "%TMP%" >nul 2>&1
  pause
  exit /b 1
)

if exist "%TMP%\assets" (
  xcopy "%TMP%\assets\*" "%~dp0public\assets\" /E /I /Y /Q >nul
) else (
  xcopy "%TMP%\*" "%~dp0public\assets\" /E /I /Y /Q >nul
)

rmdir /s /q "%TMP%" >nul 2>&1

echo.
echo [OK] Tes assets sont installes dans public\assets.
echo Les mises a jour ne remplaceront plus les portraits des personnages.
echo.
pause
