# Chart Arcade - Development Server Script
# This script sets up the Node.js environment and starts the dev server

$vsNodePath = "C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Microsoft\VisualStudio\NodeJs"

if (Test-Path $vsNodePath) {
    $env:PATH = "$vsNodePath;$env:PATH"
} else {
    Write-Host "ERROR: Visual Studio Node.js not found at $vsNodePath" -ForegroundColor Red
    exit 1
}

Set-Location $PSScriptRoot\..
npm run dev
