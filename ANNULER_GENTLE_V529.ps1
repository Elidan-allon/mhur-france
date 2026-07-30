$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root "public"

$Pairs = @(
    @(
        (Join-Path $Public "index.html.avant-v529.bak"),
        (Join-Path $Public "index.html")
    ),
    @(
        (Join-Path $Public "data\home_data.js.avant-v529.bak"),
        (Join-Path $Public "data\home_data.js")
    ),
    @(
        (Join-Path $Public "data\home_data.json.avant-v529.bak"),
        (Join-Path $Public "data\home_data.json")
    ),
    @(
        (Join-Path $Public "js\v526-ui-final.js.avant-v529.bak"),
        (Join-Path $Public "js\v526-ui-final.js")
    )
)

foreach ($Pair in $Pairs) {
    $Backup = $Pair[0]
    $Target = $Pair[1]

    if (Test-Path -LiteralPath $Backup) {
        Copy-Item -LiteralPath $Backup -Destination $Target -Force
    }
}

Write-Host ""
Write-Host "[OK] Les sauvegardes V529 ont ete restaurees." -ForegroundColor Green
Write-Host ""
