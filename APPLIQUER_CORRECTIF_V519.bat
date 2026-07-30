@echo off
setlocal
chcp 65001 >nul
title MHUR France - Correctif V519

cd /d "%~dp0"

echo.
echo ============================================
echo   MHUR FRANCE - APPLICATION CORRECTIF V519
echo ============================================
echo.

if not exist "public\index.html" (
  echo [ERREUR] Le fichier public\index.html est introuvable.
  echo.
  echo Place ce correctif dans le dossier principal du depot mhur-france,
  echo puis relance ce fichier.
  echo.
  pause
  exit /b 1
)

if not exist "public\css\v519-character-style-fix.css" (
  echo [ERREUR] Le fichier CSS du correctif est introuvable.
  pause
  exit /b 1
)

if not exist "public\js\v519-character-style-fix.js" (
  echo [ERREUR] Le fichier JavaScript du correctif est introuvable.
  pause
  exit /b 1
)

if not exist "public\index.html.avant-v519.bak" (
  copy /y "public\index.html" "public\index.html.avant-v519.bak" >nul
  echo [OK] Sauvegarde de public\index.html creee.
) else (
  echo [OK] La sauvegarde V519 existe deja.
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$path = Join-Path (Get-Location) 'public\index.html';" ^
  "$content = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8);" ^
  "$css = '<link rel=""stylesheet"" href=""css/v519-character-style-fix.css?v=519"">';" ^
  "$js = '<script src=""js/v519-character-style-fix.js?v=519""></script>';" ^
  "if ($content -notmatch [regex]::Escape($css)) {" ^
  "  if ($content -notmatch '</head>') { throw 'Balise </head> introuvable.' };" ^
  "  $content = $content -replace '</head>', ($css + [Environment]::NewLine + '</head>');" ^
  "};" ^
  "if ($content -notmatch [regex]::Escape($js)) {" ^
  "  if ($content -notmatch '</body>') { throw 'Balise </body> introuvable.' };" ^
  "  $content = $content -replace '</body>', ($js + [Environment]::NewLine + '</body>');" ^
  "};" ^
  "$utf8NoBom = New-Object Text.UTF8Encoding($false);" ^
  "[IO.File]::WriteAllText($path, $content, $utf8NoBom);"

if errorlevel 1 (
  echo.
  echo [ERREUR] La modification de public\index.html a echoue.
  echo La sauvegarde n'a pas ete supprimee.
  echo.
  pause
  exit /b 1
)

echo [OK] CSS V519 relie au site.
echo [OK] JavaScript V519 relie au site.
echo [OK] Correctif applique sans doublon.
echo.
echo Ouvre maintenant GitHub Desktop :
echo   1. Commit to main
echo   2. Push origin
echo   3. Recharge le site avec Ctrl + F5
echo.
pause
exit /b 0
