@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>&1
if errorlevel 1 goto no_node
node.exe "%~dp0APPLIQUER_CORRECTIF_V559.js"
if errorlevel 1 goto failed
echo.
echo Correctif V559 applique avec succes.
echo Ouvre GitHub Desktop, fais Commit puis Push origin.
pause
exit /b 0

:no_node
echo.
echo ERREUR: Node.js est introuvable sur ce PC.
echo Installe Node.js puis relance ce fichier.
pause
exit /b 1

:failed
echo.
echo ERREUR: le correctif n a pas pu etre applique.
echo Envoie une capture du message affiche juste au-dessus.
pause
exit /b 1