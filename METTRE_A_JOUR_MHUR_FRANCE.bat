@echo off
chcp 65001 >nul 2>&1
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"
call "%~dp0mise_a_jour\METTRE_A_JOUR_MAINTENANT.bat"
