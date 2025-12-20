param(
  [string]$RepoRoot = "d:\llmrpg-web",
  [string]$ServerDir = "d:\llmrpg-web\server",
  [int]$TimeoutSec = 30
)

$ErrorActionPreference = "Stop"

$logDir = Join-Path $ServerDir "logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$jestLog = Join-Path $logDir "jest-tests-$timestamp.log"

Write-Host "Running Jest tests (serial) with coverage..." -ForegroundColor Cyan
Push-Location $ServerDir
try {
  npm run test:serial *>&1 | Tee-Object -FilePath $jestLog | Out-Null
} finally {
  Pop-Location
}

Write-Host "Jest complete. Log: $jestLog" -ForegroundColor Gray

Write-Host "Running auth HTTP tests against live server..." -ForegroundColor Cyan
& (Join-Path $RepoRoot "scripts\run-auth-tests.ps1") -ServerDir $ServerDir -RepoRoot $RepoRoot -TimeoutSec $TimeoutSec

Write-Host "All tests executed. See logs under $logDir" -ForegroundColor Green