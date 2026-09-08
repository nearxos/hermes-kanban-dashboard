$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Task = "Hermes Kanban Dashboard"
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$Root\installers\start-hermes-kanban.ps1`"" -WorkingDirectory $Root
$Trigger = New-ScheduledTaskTrigger -AtLogOn
Register-ScheduledTask -TaskName $Task -Action $Action -Trigger $Trigger -Force | Out-Null
Start-ScheduledTask -TaskName $Task
Start-Process "http://127.0.0.1:4175"
Write-Host "Installed scheduled dashboard start: http://127.0.0.1:4175"
Write-Host "Start the Hermes Kanban API separately using Hermes documentation."
