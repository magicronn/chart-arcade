# Chart Arcade - Installation Script
# This script sets up the Node.js environment and installs dependencies

$vsNodePath = "C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Microsoft\VisualStudio\NodeJs"

if (Test-Path $vsNodePath) {
    Write-Host "Using Visual Studio Node.js from: $vsNodePath" -ForegroundColor Green
    $env:PATH = "$vsNodePath;$env:PATH"
} else {
    Write-Host "ERROR: Visual Studio Node.js not found at $vsNodePath" -ForegroundColor Red
    Write-Host "Please install Node.js 16+ or update the path in this script" -ForegroundColor Yellow
    exit 1
}

# Verify node and npm are accessible
Write-Host "`nNode version:" -ForegroundColor Cyan
node --version

Write-Host "npm version:" -ForegroundColor Cyan
npm --version

# Change to project directory
Set-Location $PSScriptRoot\..

Write-Host "`nInstalling dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nInstallation complete!" -ForegroundColor Green
    Write-Host "Run 'npm run dev' to start the development server" -ForegroundColor Yellow
} else {
    Write-Host "`nInstallation failed with exit code $LASTEXITCODE" -ForegroundColor Red
}
