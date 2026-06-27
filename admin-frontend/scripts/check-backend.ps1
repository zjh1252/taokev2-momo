# Check Java backend before starting admin Next.js dev server
# Usage:
#   .\scripts\check-backend.ps1           # strict
#   .\scripts\check-backend.ps1 -WarnOnly # predev: warn only

param(
    [string]$ApiBase = "",
    [switch]$WarnOnly
)

function Read-DotEnvValue {
    param([string]$FilePath, [string]$Key)
    if (-not (Test-Path $FilePath)) { return $null }
    foreach ($line in Get-Content $FilePath -Encoding UTF8) {
        $trimmed = $line.Trim()
        if ($trimmed -eq "" -or $trimmed.StartsWith("#")) { continue }
        if ($trimmed -match "^\s*$([regex]::Escape($Key))\s*=\s*(.+)$") {
            return $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
    return $null
}

function Normalize-ApiBase {
    param([string]$Url)
    if (-not $Url) { return $Url }
    return $Url.TrimEnd('/').Replace('://localhost:', '://127.0.0.1:')
}

$envFile = Join-Path (Split-Path $PSScriptRoot -Parent) ".env.local"
$candidates = [System.Collections.Generic.List[string]]::new()

foreach ($raw in @(
        $ApiBase,
        $env:BACKEND_URL,
        $env:NEXT_PUBLIC_API_BASE_URL,
        (Read-DotEnvValue $envFile "BACKEND_URL"),
        (Read-DotEnvValue $envFile "NEXT_PUBLIC_API_BASE_URL"),
        "http://10.0.14.20:8080",
        "http://127.0.0.1:8080"
    )) {
    $normalized = Normalize-ApiBase $raw
    if ($normalized -and -not $candidates.Contains($normalized)) {
        [void]$candidates.Add($normalized)
    }
}

$lastError = ""
foreach ($base in $candidates) {
    $healthUrl = "$base/actuator/health"
    Write-Host "Checking backend: $healthUrl"
    try {
        $resp = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5
        if ($resp.StatusCode -eq 200) {
            Write-Host "OK - backend is up at $base"
            $configured = Normalize-ApiBase (Read-DotEnvValue $envFile "BACKEND_URL")
            if ($configured -and $configured -ne $base) {
                Write-Host "TIP: .env.local has $configured but $base works — consider updating BACKEND_URL"
            }
            exit 0
        }
        $lastError = "HTTP $($resp.StatusCode)"
        Write-Host "  skip ($lastError)"
    } catch {
        $lastError = $_.Exception.Message
        Write-Host "  skip ($lastError)"
    }
}

Write-Host ""
Write-Host "No reachable backend. Tried: $($candidates -join ', ')"
Write-Host ""
Write-Host "Options:"
Write-Host "  1. Start TaokeApplication locally (port 8080)"
Write-Host "  2. Use shared dev server in admin-frontend/.env.local:"
Write-Host "       BACKEND_URL=http://10.0.14.20:8080"
Write-Host "  3. Skip check: `$env:SKIP_BACKEND_CHECK=1; npm run dev"

if ($WarnOnly -or $env:SKIP_BACKEND_CHECK -eq "1") {
    Write-Host ""
    Write-Host "WARN - continuing without backend (WarnOnly / SKIP_BACKEND_CHECK)."
    exit 0
}

exit 1
