@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0outils\desactiver_synchronisation_ultrarumble.ps1"
pause
