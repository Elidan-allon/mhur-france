@echo off
chcp 65001 >nul
title MHUR FRANCE - Diagnostic V573 sans Git
cd /d "%~dp0"

echo.
echo ============================================================
echo  MHUR FRANCE - DIAGNOSTIC V573 SANS GIT
echo ============================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0DIAGNOSTIC_V573_SANS_GIT.ps1"
