# LLMRPG MUD - Start Server and Client
# Run this script to start both server and client

Write-Host "=== LLMRPG MUD - Starting Services ===" -ForegroundColor Green
Write-Host ""

# Start server in background
Write-Host "Starting server on http://localhost:3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"

# Wait a bit for server to start
Start-Sleep -Seconds 3

# Start client in background
Write-Host "Starting client on http://localhost:3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"

Write-Host ""
Write-Host "=======================" -ForegroundColor Green
Write-Host "Services starting..." -ForegroundColor Cyan
Write-Host "Server: http://localhost:3001" -ForegroundColor White
Write-Host "Client: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Wait a few seconds, then open http://localhost:3000 in your browser!" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Green
