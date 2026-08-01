@echo off
chcp 65001 >nul
setlocal
pushd "%~dp0"
echo.
echo ==============================================
echo   MHUR FRANCE - CORRECTIF V561 GITHUB
echo ==============================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERREUR: Node.js est introuvable sur ce PC.
  echo Installe Node.js puis relance ce fichier.
  echo.
  pause
  popd
  exit /b 1
)
node APPLIQUER_CORRECTIF_V561.js
if errorlevel 1 (
  echo.
  echo Le correctif ne s est pas applique. Lis l erreur au-dessus.
  pause
  popd
  exit /b 1
)
echo.
echo Termine. Fais maintenant Commit to main puis Push origin.
echo.
pause
popd
endlocal
