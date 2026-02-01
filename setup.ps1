# LLMRPG MUD - Setup Script for Windows
# Run this script with PowerShell to set up the entire project

Write-Host "=== LLMRPG MUD Setup ===" -ForegroundColor Green
Write-Host ""

# Check Node.js
Write-Host "[1/6] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "  Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "[2/6] Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v
    Write-Host "  npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: npm not found." -ForegroundColor Red
    exit 1
}

# Install server dependencies
Write-Host "[3/6] Installing server dependencies..." -ForegroundColor Yellow
Set-Location -Path "server"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Failed to install server dependencies." -ForegroundColor Red
    exit 1
}
Write-Host "  Server dependencies installed!" -ForegroundColor Green
Set-Location -Path ".."

# Install client dependencies
Write-Host "[4/6] Installing client dependencies..." -ForegroundColor Yellow
Set-Location -Path "client"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Failed to install client dependencies." -ForegroundColor Red
    exit 1
}
Write-Host "  Client dependencies installed!" -ForegroundColor Green
Set-Location -Path ".."

# Initialize database
Write-Host "[5/6] Initializing database..." -ForegroundColor Yellow
Set-Location -Path "database"

# Check if sqlite3 is available
try {
    $sqliteVersion = sqlite3 -version
    Write-Host "  SQLite version: $sqliteVersion" -ForegroundColor Green
    
    # Create database
    if (Test-Path "world.db") {
        Write-Host "  Database already exists. Skipping initialization." -ForegroundColor Yellow
    } else {
        Get-Content "schema.sql" | sqlite3 "world.db"
        Write-Host "  Database initialized!" -ForegroundColor Green
    }
} catch {
    Write-Host "  WARNING: sqlite3 not found. Please initialize database manually." -ForegroundColor Yellow
    Write-Host "  Run: sqlite3 database/world.db < database/schema.sql" -ForegroundColor Yellow
}
Set-Location -Path ".."

# Setup complete
Write-Host "[6/6] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "=======================" -ForegroundColor Green
Write-Host "To start the server:" -ForegroundColor Cyan
Write-Host "  cd server" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "To start the client (in a new terminal):" -ForegroundColor Cyan
Write-Host "  cd client" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Then open http://localhost:3000 in your browser!" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Green
