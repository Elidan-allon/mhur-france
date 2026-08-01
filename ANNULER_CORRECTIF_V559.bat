@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>&1
if errorlevel 1 goto no_node
node.exe "%~dp0ANNULER_CORRECTIF_V559.js"
if errorlevel 1 goto failed
echo.
echo Correctif V559 annule avec succes.
pause
exit /b 0

:no_node
echo.
echo ERREUR: Node.js est introuvable sur ce PC.
pause
exit /b 1

:failed
echo.
echo ERREUR: impossible d annuler le correctif.
pause
exit /b 1