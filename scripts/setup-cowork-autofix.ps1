# setup-cowork-autofix.ps1 - Setup manual do Cowork autofix
# Use quando o /setup nao rodou ou precisa reconfigurar
# Auto-eleva para admin (1 prompt UAC)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Auto-eleva se nao for admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Vai aparecer uma janela pedindo permissao. Clique SIM." -ForegroundColor Yellow
    Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`"" -Wait
    exit
}

Write-Host ""
Write-Host "=== Configurando Cowork Autofix ===" -ForegroundColor Cyan

# 1. Copia script para pasta permanente
$destDir = Join-Path $env:USERPROFILE "scripts"
if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
Copy-Item (Join-Path $scriptDir "fix-cowork.ps1") (Join-Path $destDir "fix-cowork.ps1") -Force
Copy-Item (Join-Path $scriptDir "register-task.ps1") (Join-Path $destDir "register-task.ps1") -Force
Write-Host "[OK] Scripts copiados para $destDir" -ForegroundColor Green

# 2. Instala modulo HNS
Write-Host "Instalando modulo HNS..." -ForegroundColor Yellow
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force -ErrorAction SilentlyContinue
Install-Module -Name HNS -Scope AllUsers -AllowClobber -Force -ErrorAction SilentlyContinue
Write-Host "[OK] Modulo HNS instalado" -ForegroundColor Green

# 3. Registra tarefa agendada via register-task.ps1
Write-Host "Registrando tarefa agendada..." -ForegroundColor Yellow
& (Join-Path $destDir "register-task.ps1")
$result = Get-Content (Join-Path $destDir "register-task.result") -ErrorAction SilentlyContinue
if ($result -match "OK") {
    Write-Host "[OK] Tarefa agendada registrada" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Falha ao registrar tarefa: $result" -ForegroundColor Red
}

# 4. Copia atalho para Desktop
$desktopPath = [Environment]::GetFolderPath("Desktop")
Copy-Item (Join-Path $scriptDir "fix-cowork.bat") (Join-Path $desktopPath "Consertar Cowork.bat") -Force
Write-Host "[OK] Atalho criado no Desktop" -ForegroundColor Green

Write-Host ""
Write-Host "=== Cowork Autofix configurado! ===" -ForegroundColor Green
Write-Host ""
Write-Host "A protecao roda automaticamente a cada 5 minutos." -ForegroundColor Gray
Write-Host "Voce nunca precisa fazer nada." -ForegroundColor Gray
Write-Host ""
