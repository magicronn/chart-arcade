# Chart Arcade - TypeScript Check Script
$vsNodePath = "C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Microsoft\VisualStudio\NodeJs"
$env:PATH = "$vsNodePath;$env:PATH"
Set-Location $PSScriptRoot\..
node .\node_modules\typescript\bin\tsc --noEmit
