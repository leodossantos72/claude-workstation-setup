# register-task.ps1 - Registra tarefa SYSTEM com polling de 5 minutos
# Requer admin (chamado uma vez durante o /setup)
# Depois disso, roda sozinha - sem interacao do usuario

# Detecta o home do usuario ANTES de elevar (RunAs pode mudar $env:USERPROFILE)
$userHome = $env:USERPROFILE
$script = Join-Path $userHome "scripts\fix-cowork.ps1"
$resultFile = Join-Path $userHome "scripts\register-task.result"

try {
    # Remove qualquer versao anterior
    Unregister-ScheduledTask -TaskName "Fix-Cowork" -Confirm:$false -ErrorAction SilentlyContinue

    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`""

    # Boot + logon + repeat a cada 5 min (cobre sleep/hibernate)
    $triggerBoot = New-ScheduledTaskTrigger -AtStartup
    $triggerLogon = New-ScheduledTaskTrigger -AtLogOn
    $triggerRepeat = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration ([TimeSpan]::MaxValue)

    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 2) -MultipleInstances IgnoreNew

    # SYSTEM com Highest - roda automaticamente, sem UAC, sem interacao
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest

    Register-ScheduledTask -TaskName "Fix-Cowork" -Action $action -Trigger $triggerBoot,$triggerLogon,$triggerRepeat -Settings $settings -Principal $principal -Description "Corrige rede HNS para Claude Cowork a cada 5 min" -Force

    # Instala modulo HNS para todos os usuarios (SYSTEM precisa encontrar)
    Install-Module -Name HNS -Scope AllUsers -AllowClobber -Force -ErrorAction SilentlyContinue

    "OK" | Out-File $resultFile -Force -Encoding utf8
} catch {
    "ERRO: $($_.Exception.Message)" | Out-File $resultFile -Force -Encoding utf8
}
