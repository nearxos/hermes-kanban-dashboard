$ErrorActionPreference = "Stop"
$Task = "Hermes Kanban Dashboard"
Stop-ScheduledTask -TaskName $Task -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName $Task -Confirm:$false -ErrorAction SilentlyContinue
Write-Host "Removed dashboard startup entry. Repository, dist, Hermes Agent, API, boards, tasks, comments, credentials, and user data were left untouched."
