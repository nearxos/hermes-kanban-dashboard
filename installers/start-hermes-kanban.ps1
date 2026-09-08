$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Port = if ($env:KANBAN_PORT) { $env:KANBAN_PORT } else { "4175" }
if (-not (Test-Path (Join-Path $Root "dist\index.html"))) {
  throw "Missing dist\index.html. Run npm install and npm run build first."
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
  throw "npm is required to serve the dashboard."
}
# This serves the dashboard only. Start the Hermes Kanban API separately using
# Hermes documentation; this installer does not guess its executable.
Set-Location $Root
& npm.cmd run preview -- --host 127.0.0.1 --port $Port
exit $LASTEXITCODE
