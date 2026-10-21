# scripts/package-saas.ps1
$ErrorActionPreference = "Stop"

$ProjectRoot = (Get-Location).Path
$PluginsDir = Join-Path $ProjectRoot "dkp-proprietary-plugins"
$DownloadsDir = Join-Path $ProjectRoot "public\downloads"

Write-Host "📦 [DKP Kernel v2.5-GOLD] Scansione dinamica e packaging in corso..." -ForegroundColor Cyan

if (-not (Test-Path $DownloadsDir)) {
    New-Item -ItemType Directory -Path $DownloadsDir -Force | Out-Null
}

# Prende automaticamente TUTTE le cartelle presenti nella directory dei plugin proprietari
$Folders = Get-ChildItem -Path $PluginsDir -Directory

if (-not $Folders) {
    Write-Host "⚠️ Nessuna cartella di plugin trovata in $PluginsDir" -ForegroundColor Yellow
    exit
}

foreach ($Folder in $Folders) {
    $PluginName = $Folder.Name
    $SourcePath = $Folder.FullName
    
    # Aggiornato allo standard v2.5-Gold
    $ZipFileName = "$PluginName-v2.5-gold.zip"
    $TargetZipPath = Join-Path $DownloadsDir $ZipFileName

    Write-Host "⚡ Comprimo il modulo: $PluginName -> $ZipFileName" -ForegroundColor Yellow
    
    if (Test-Path $TargetZipPath) {
        Remove-Item -Path $TargetZipPath -Force
    }

    try {
        # Forza la compressione pulita della cartella
        Compress-Archive -Path "$SourcePath\*" -DestinationPath $TargetZipPath -Force
        
        # Verifica immediata del risultato
        if (Test-Path $TargetZipPath) {
            Write-Host "✅ SUCCESSO: $ZipFileName salvato in public/downloads`n" -ForegroundColor Green
        } else {
            Write-Host "❌ ATTENZIONE: Impossibile creare l'archivio per $PluginName`n" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Errore critico durante la compressione di $PluginName : $_`n" -ForegroundColor Red
    }
}

Write-Host "🚀 Impacchettamento dinamico v2.5-GOLD completato con successo!" -ForegroundColor Cyan