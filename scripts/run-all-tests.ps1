param(
  [string]$RepoRoot = "d:\llmrpg-web",
  [string]$ServerDir = "d:\llmrpg-web\server",
  [int]$TimeoutSec = 30,
  [int]$JestTimeoutSec = 600
)

$ErrorActionPreference = "Stop"

$logDir = Join-Path $ServerDir "logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$jestLog = Join-Path $logDir "jest-tests-$timestamp.log"

Write-Host "Running Jest tests (serial) with coverage..." -ForegroundColor Cyan

# Ensure non-interactive mode for Jest
$env:CI = "true"

# Run Jest via Start-Process with timeout and log redirection
$npmExe = "npm.cmd"
if (-not (Get-Command $npmExe -ErrorAction SilentlyContinue)) { $npmExe = "npm" }

$jestProc = Start-Process -FilePath $npmExe -ArgumentList "run","test:serial" -WorkingDirectory $ServerDir -NoNewWindow -RedirectStandardOutput $jestLog -RedirectStandardError $jestLog -PassThru

try {
  Wait-Process -Id $jestProc.Id -Timeout $JestTimeoutSec -ErrorAction Stop
} catch {
  Write-Host "Jest exceeded timeout ($JestTimeoutSec s). Terminating..." -ForegroundColor Yellow
  try { Stop-Process -Id $jestProc.Id -Force } catch {}
}

Write-Host "Jest complete. Log: $jestLog" -ForegroundColor Gray

Write-Host "Running auth HTTP tests against live server..." -ForegroundColor Cyan
& (Join-Path $RepoRoot "scripts\run-auth-tests.ps1") -ServerDir $ServerDir -RepoRoot $RepoRoot -TimeoutSec $TimeoutSec

Write-Host "All tests executed. See logs under $logDir" -ForegroundColor Green