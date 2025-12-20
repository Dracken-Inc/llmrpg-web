param(
  [string]$WorkingDir = "d:\llmrpg-web\server",
  [int]$Port = 3001,
  [string]$LogDir = "$WorkingDir\logs"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $WorkingDir)) { throw "WorkingDir not found: $WorkingDir" }
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outLog = Join-Path $LogDir "server-$timestamp.out.log"
$errLog = Join-Path $LogDir "server-$timestamp.err.log"
$pidFile = Join-Path $WorkingDir "server.pid"

# If existing PID file, attempt to stop previous process
if (Test-Path $pidFile) {
  try {
    $oldPid = Get-Content $pidFile | Select-Object -First 1
    if ($oldPid) { Stop-Process -Id [int]$oldPid -Force -ErrorAction SilentlyContinue }
  } catch {}
  Remove-Item $pidFile -ErrorAction SilentlyContinue
}

# Start server as background process with stdout/stderr logs
$proc = Start-Process -FilePath "node" -ArgumentList "index.js" -WorkingDirectory $WorkingDir -NoNewWindow -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru

Set-Content -Path $pidFile -Value $proc.Id

Write-Host "Server started (PID $($proc.Id)). Logs:" -ForegroundColor Cyan
Write-Host "  $outLog" -ForegroundColor Gray
Write-Host "  $errLog" -ForegroundColor Gray
