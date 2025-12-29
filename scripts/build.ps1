# Chart Arcade - Build Script
$vsNodePath = "C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Microsoft\VisualStudio\NodeJs"
$env:PATH = "$vsNodePath;$env:PATH"
Set-Location $PSScriptRoot\..
npm run build
