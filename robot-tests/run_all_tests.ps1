# PowerShell script to run all Robot Framework tests
# Usage: .\run_all_tests.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "KU-SHEET Robot Framework Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Prefer virtualenv python if present
$venvPython = Join-Path -Path (Split-Path -Parent $MyInvocation.MyCommand.Definition) -ChildPath "..\.venv\Scripts\python.exe"
if (Test-Path $venvPython) {
    Write-Host "Using project virtualenv Python: $venvPython" -ForegroundColor Green
    $pythonCmd = "$venvPython"
} else {
    # Fallback to system python
    $pythonCmd = "python"
}

# Check python availability
$pythonVersion = & $pythonCmd --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}
Write-Host "Python version: $pythonVersion" -ForegroundColor Green

# Check Robot Framework availability using `python -m robot --version`
$robotCheck = & $pythonCmd -m robot --version 2>&1
if ($robotCheck -and $robotCheck -match 'Robot Framework') {
    Write-Host "Robot Framework: $robotCheck" -ForegroundColor Green
} else {
    Write-Host "ERROR: Robot Framework is not installed in the selected Python environment" -ForegroundColor Red
    Write-Host "Please run: $pythonCmd -m pip install -r requirements.txt" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Check if backend is running
Write-Host "Checking backend server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "Backend server is running on port 5000" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Backend server might not be running on port 5000" -ForegroundColor Yellow
    Write-Host "Tests may fail if backend is not running" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}
Write-Host ""

# Create results directory if it doesn't exist
if (-not (Test-Path "results")) {
    New-Item -ItemType Directory -Path "results" | Out-Null
}

# Run tests for each suite with separate results folders
Write-Host "Starting test execution..." -ForegroundColor Cyan
Write-Host ""

$testSuites = Get-ChildItem "tests" -Directory | Sort-Object Name
$totalSuites = $testSuites.Count
$currentSuite = 0
$failedSuites = @()
$passedSuites = @()
# Number of attempts to run a suite if it fails (helps recover from transient 429 rate-limits)
# Pause between suites to reduce request bursts (increase slightly for stability)
$interSuiteSleepSeconds = 5
# Suites that historically generate more requests and may need extra cooldown
$heavySuites = @('04_orders','05_groups','06_wishlist','07_reviews')

foreach ($suite in $testSuites) {
    $currentSuite++
    $suiteName = $suite.Name
    $resultsDir = "results\$suiteName"
    
    Write-Host "[$currentSuite/$totalSuites] Running suite: $suiteName" -ForegroundColor Cyan
    
    # Create suite results directory
    if (-not (Test-Path $resultsDir)) {
        New-Item -ItemType Directory -Path $resultsDir -Force | Out-Null
    }
    
    # Small random jitter to avoid perfectly regular bursts
    $jitterMs = Get-Random -Minimum 200 -Maximum 800
    Start-Sleep -Milliseconds $jitterMs

    # Before running each suite, wait for backend readiness to avoid transient failures
    $ready = $false
    $waitAttempts = 0
    $maxWaitAttempts = 30
    while (-not $ready -and $waitAttempts -lt $maxWaitAttempts) {
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:5000/api/ready" -Method GET -TimeoutSec 2 -ErrorAction Stop
            if ($r.StatusCode -eq 200) { $ready = $true; break }
        } catch {
            # ignore and wait
        }
        Start-Sleep -Seconds 1
        $waitAttempts++
    }
    if (-not $ready) {
        Write-Host "WARNING: Backend not ready after waiting $maxWaitAttempts seconds" -ForegroundColor Yellow
        $choice = Read-Host "Continue anyway? (y/n)"
        if ($choice -ne "y") { exit 1 }
    }

    # Run suite tests using the selected python (`python -m robot`) so it runs inside the venv
    & $pythonCmd -m robot --outputdir $resultsDir `
        --loglevel INFO `
        --name "$suiteName" `
        --report report.html `
        --log log.html `
        --output output.xml `
        "tests\$suiteName"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ $suiteName PASSED" -ForegroundColor Green
        $passedSuites += $suiteName
    } else {
        Write-Host "  ✗ $suiteName FAILED" -ForegroundColor Red
        $failedSuites += $suiteName
    }

    # Small delay between suites to reduce request bursts and avoid rate-limiting (HTTP 429)
    if ($heavySuites -contains $suiteName) {
        Start-Sleep -Seconds ($interSuiteSleepSeconds + 5)
    } else {
        Start-Sleep -Seconds $interSuiteSleepSeconds
    }
    Write-Host ""
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Execution Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total suites: $totalSuites" -ForegroundColor White
Write-Host "Passed: $($passedSuites.Count)" -ForegroundColor Green
Write-Host "Failed: $($failedSuites.Count)" -ForegroundColor Red
Write-Host ""

if ($passedSuites.Count -gt 0) {
    Write-Host "Passed suites:" -ForegroundColor Green
    foreach ($suite in $passedSuites) {
        Write-Host "  ✓ $suite" -ForegroundColor Green
    }
    Write-Host ""
}

if ($failedSuites.Count -gt 0) {
    Write-Host "Failed suites:" -ForegroundColor Red
    foreach ($suite in $failedSuites) {
        Write-Host "  ✗ $suite" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "Test results saved in: results/<suite_name>/" -ForegroundColor Cyan
Write-Host "Each suite has its own folder with report.html, log.html, and output.xml" -ForegroundColor White
Write-Host ""

# Ask which suite report to open
if ($passedSuites.Count -gt 0 -or $failedSuites.Count -gt 0) {
    Write-Host "Available suite reports:" -ForegroundColor Cyan
    $allSuites = $passedSuites + $failedSuites | Sort-Object
    $index = 1
    foreach ($suite in $allSuites) {
        Write-Host "  [$index] $suite" -ForegroundColor White
        $index++
    }
    Write-Host ""
    
    $choice = Read-Host "Open report for which suite? (1-$($allSuites.Count) or 'n' to skip)"
    if ($choice -ne "n" -and $choice -match '^\d+$' -and [int]$choice -ge 1 -and [int]$choice -le $allSuites.Count) {
        $selectedSuite = $allSuites[[int]$choice - 1]
        Start-Process "results\$selectedSuite\report.html"
    }
}
