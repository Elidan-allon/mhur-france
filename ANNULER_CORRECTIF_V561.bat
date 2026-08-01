@echo off
chcp 65001 >nul
setlocal
pushd "%~dp0"
echo.
echo ==============================================
echo   ANNULATION DU CORRECTIF V561
echo ==============================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERREUR: Node.js est introuvable sur ce PC.
  pause
  popd
  exit /b 1
)
node ANNULER_CORRECTIF_V561.js
if errorlevel 1 (
  echo.
  pause
  popd
  exit /b 1
)
echo.
pause
popd
endlocal
