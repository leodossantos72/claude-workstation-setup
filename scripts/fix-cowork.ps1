# fix-cowork.ps1 - Corrige problemas de inicializacao do Cowork no Windows
# Roda como SYSTEM a cada 5 min via tarefa agendada
# SEGURO: nunca interfere em sessao ativa do Cowork

$ErrorActionPreference = "SilentlyContinue"
$logFile = "C:\Windows\Temp\fix-cowork.log"

function Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts | $msg" | Out-File $logFile -Append -Encoding utf8
}

# Se CoworkVMService nao existe, nao e maquina com Cowork — sai
$svc = Get-Service CoworkVMService -ErrorAction SilentlyContinue
if (-not $svc) { exit 0 }

# REGRA DE OURO: se o servico esta rodando E tem rede, nao toca em nada
try {
    # Tenta carregar HNS de todos os locais possiveis (AllUsers e CurrentUser de cada perfil)
    $imported = $false
    foreach ($modPath in (Get-ChildItem "C:\Program Files\WindowsPowerShell\Modules\HNS" -ErrorAction SilentlyContinue),
                         (Get-ChildItem "C:\Users\*\Documents\WindowsPowerShell\Modules\HNS" -ErrorAction SilentlyContinue),
                         (Get-ChildItem "C:\Users\*\OneDrive\Documentos\WindowsPowerShell\Modules\HNS" -ErrorAction SilentlyContinue)) {
        if ($modPath) {
            Import-Module HNS -ErrorAction Stop
            $imported = $true
            break
        }
    }
    if (-not $imported) {
        Import-Module HNS -ErrorAction Stop
    }

    $net = Get-HnsNetwork | Where-Object { $_.Name -eq "cowork-vm-nat" }

    if ($net -and $svc.Status -eq "Running") {
        # Tudo OK — sessao pode estar ativa, nao mexe
        exit 0
    }

    # Se rede nao existe, Cowork JA esta quebrado — pode agir
    if (-not $net) {
        New-HnsNetwork -Type NAT -AddressPrefix "172.16.0.0/24" -Gateway "172.16.0.1" -Name "cowork-vm-nat" | Out-Null
        Log "Rede HNS criada (estava ausente)"

        Start-Sleep -Seconds 2
        $alias = 'vEthernet (cowork-vm-nat)'
        Set-DnsClientServerAddress -InterfaceAlias $alias -ServerAddresses @('8.8.8.8','1.1.1.1') -ErrorAction SilentlyContinue
        Clear-DnsClientCache
        Log "DNS configurado"
    }

    # Se servico parou mas rede existe, reinicia o servico
    if ($svc.Status -ne "Running") {
        $vms = hcsdiag.exe list 2>&1
        if ($vms -match "cowork") {
            hcsdiag.exe kill cowork-vm 2>&1 | Out-Null
            Log "VM presa eliminada"
        }
        Restart-Service CoworkVMService -Force -ErrorAction SilentlyContinue
        Log "Servico reiniciado"
    }

} catch {
    Log "Erro: $_"
}
