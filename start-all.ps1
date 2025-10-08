# Start both backend (node) and frontend (http-server) in separate PowerShell windows
# Usage: .\start-all.ps1

$project = Split-Path -Parent $MyInvocation.MyCommand.Definition
cd $project

# Backend window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting backend...'; node .\server.js"

# Frontend window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting frontend static server...'; npx http-server -p 5500"

Write-Host 'Launched backend and frontend in separate windows.'
