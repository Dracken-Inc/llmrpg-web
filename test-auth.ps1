# Phase 2 Authentication Testing Script
Write-Host "`n=== PHASE 2 AUTHENTICATION TESTS ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:3001"
$results = @()

# Test 1: Health Check
Write-Host "`n[Test 1] Health Check (Public)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET
    Write-Host "✅ PASS: Health check successful" -ForegroundColor Green
    $results += "✅ Test 1: Health check"
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $results += "❌ Test 1: Health check FAILED"
}

# Test 2: Register new user
Write-Host "`n[Test 2] Register new user" -ForegroundColor Yellow
try {
    $body = @{
        username = "testuser"
        password = "test123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body $body -ContentType "application/json"
    $token = $response.token
    Write-Host "✅ PASS: User registered, token received" -ForegroundColor Green
    Write-Host "   User: $($response.user.username), ID: $($response.user.id)" -ForegroundColor Gray
    $results += "✅ Test 2: Register new user"
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $results += "❌ Test 2: Register FAILED"
}

# Test 3: Register duplicate username
Write-Host "`n[Test 3] Register duplicate username (should fail)" -ForegroundColor Yellow
try {
    $body = @{
        username = "admin"
        password = "test"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "❌ FAIL: Should have rejected duplicate username" -ForegroundColor Red
    $results += "❌ Test 3: Duplicate username check FAILED"
} catch {
    if ($_.Exception.Message -match "400") {
        Write-Host "✅ PASS: Duplicate username correctly rejected (400)" -ForegroundColor Green
        $results += "✅ Test 3: Duplicate username rejected"
    } else {
        Write-Host "❌ FAIL: Wrong error: $($_.Exception.Message)" -ForegroundColor Red
        $results += "❌ Test 3: Duplicate username FAILED"
    }
}

# Test 4: Login with correct credentials
Write-Host "`n[Test 4] Login with correct credentials" -ForegroundColor Yellow
try {
    $body = @{
        username = "user"
        password = "user"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    $userToken = $response.token
    Write-Host "✅ PASS: Login successful, token received" -ForegroundColor Green
    Write-Host "   User: $($response.user.username), Permissions: $($response.user.permissions -join ', ')" -ForegroundColor Gray
    $results += "✅ Test 4: Login with valid credentials"
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $results += "❌ Test 4: Login FAILED"
}

# Test 5: Login with wrong password
Write-Host "`n[Test 5] Login with wrong password (should fail)" -ForegroundColor Yellow
try {
    $body = @{
        username = "user"
        password = "wrongpassword"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    Write-Host "❌ FAIL: Should have rejected wrong password" -ForegroundColor Red
    $results += "❌ Test 5: Wrong password check FAILED"
} catch {
    if ($_.Exception.Message -match "401") {
        Write-Host "✅ PASS: Wrong password correctly rejected (401)" -ForegroundColor Green
        $results += "✅ Test 5: Wrong password rejected"
    } else {
        Write-Host "❌ FAIL: Wrong error: $($_.Exception.Message)" -ForegroundColor Red
        $results += "❌ Test 5: Wrong password FAILED"
    }
}

# Test 6: Access protected route with token
Write-Host "`n[Test 6] Access protected route WITH token" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $userToken"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method GET -Headers $headers
    Write-Host "✅ PASS: Protected route accessible with token" -ForegroundColor Green
    Write-Host "   User: $($response.user.username)" -ForegroundColor Gray
    $results += "✅ Test 6: Protected route with token"
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $results += "❌ Test 6: Protected route FAILED"
}

# Test 7: Access protected route without token
Write-Host "`n[Test 7] Access protected route WITHOUT token (should fail)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method GET
    Write-Host "❌ FAIL: Should have rejected missing token" -ForegroundColor Red
    $results += "❌ Test 7: Missing token check FAILED"
} catch {
    if ($_.Exception.Message -match "401") {
        Write-Host "✅ PASS: Missing token correctly rejected (401)" -ForegroundColor Green
        $results += "✅ Test 7: Missing token rejected"
    } else {
        Write-Host "❌ FAIL: Wrong error: $($_.Exception.Message)" -ForegroundColor Red
        $results += "❌ Test 7: Missing token FAILED"
    }
}

# Test 8: Access campaigns route (protected)
Write-Host "`n[Test 8] Access protected campaigns route with token" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $userToken"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/campaigns" -Method GET -Headers $headers
    Write-Host "✅ PASS: Campaigns route accessible with token" -ForegroundColor Green
    Write-Host "   Campaigns found: $($response.Count)" -ForegroundColor Gray
    $results += "✅ Test 8: Campaigns route protected"
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $results += "❌ Test 8: Campaigns route FAILED"
}

# Summary
Write-Host "`n`n=== TEST SUMMARY ===" -ForegroundColor Cyan
$results | ForEach-Object { Write-Host $_ }

$passCount = ($results | Where-Object { $_ -match "✅" }).Count
$totalCount = $results.Count

Write-Host "`n$passCount / $totalCount tests passed" -ForegroundColor $(if ($passCount -eq $totalCount) { "Green" } else { "Yellow" })

if ($passCount -eq $totalCount) {
    Write-Host "`n🎉 ALL TESTS PASSED - Phase 2 Complete!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some tests failed - Review required" -ForegroundColor Yellow
}
