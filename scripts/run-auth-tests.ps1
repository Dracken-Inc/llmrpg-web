param(
  [string]$ServerDir = "d:\llmrpg-web\server",
  [string]$RepoRoot = "d:\llmrpg-web",
  [string]$BaseUrl = "http://localhost:3001",
  [int]$TimeoutSec = 30
)

$ErrorActionPreference = "Stop"

$logDir = Join-Path $ServerDir "logs"
$pidFile = Join-Path $ServerDir "server.pid"

# Start server in background with logs
& (Join-Path $RepoRoot "scripts\start-server.ps1") -WorkingDir $ServerDir | Out-Null

# Wait for readiness
$deadline = (Get-Date).AddSeconds($TimeoutSec)
$ready = $false
while ((Get-Date) -lt $deadline) {
  try {
    $resp = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method GET -TimeoutSec 5
    if ($resp.status -eq "ok") { $ready = $true; break }
  } catch {
    Start-Sleep -Milliseconds 500
  }
}

if (-not $ready) {
  Write-Host "Server did not become ready within $TimeoutSec seconds." -ForegroundColor Red
  if (Test-Path $pidFile) {
    try { Stop-Process -Id ([int](Get-Content $pidFile)) -Force } catch {}
    Remove-Item $pidFile -ErrorAction SilentlyContinue
  }
  exit 1
}

Write-Host "Server ready. Running auth tests..." -ForegroundColor Yellow
$authLog = Join-Path $logDir ("auth-tests-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + ".log")

Push-Location $RepoRoot
try {
  & "$RepoRoot\test-auth.ps1" *>&1 | Tee-Object -FilePath $authLog
} finally {
  Pop-Location
}

# Stop server
if (Test-Path $pidFile) {
  try { Stop-Process -Id ([int](Get-Content $pidFile)) -Force } catch {}
  Remove-Item $pidFile -ErrorAction SilentlyContinue
}

Write-Host "Auth tests complete. Log: $authLog" -ForegroundColor Green
