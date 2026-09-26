# scripts/package-saas.ps1
$ErrorActionPreference = "SilentlyContinue"

$ProjectRoot = (Get-Location).Path
$PluginsDir = Join-Path$ProjectRoot "dkp-proprietary-plugins"
$DownloadsDir = Join-Path$ProjectRoot "public\downloads"

Write-Host "📦 Scansione dinamica di tutti i moduli in corso..." -ForegroundColor Cyan

if (-not (Test-Path $DownloadsDir)) {
    New-Item -ItemType Directory -Path $DownloadsDir -Force | Out-Null
}

# Prende automaticamente TUTTE le cartelle presenti, senza liste scritte a mano
$Folders = Get-ChildItem -Path$PluginsDir -Directory

foreach ($Folder in$Folders) {
    $PluginName =$Folder.Name
    $SourcePath =$Folder.FullName
    $ZipFileName = "$PluginName-v2.0.zip"
    $TargetZipPath = Join-Path $DownloadsDir$ZipFileName

    Write-Host "⚡ Comprimo: $PluginName" -ForegroundColor Yellow
    
    if (Test-Path $TargetZipPath) {
        Remove-Item -Path $TargetZipPath -Force
    }

    # Forza la compressione
    Compress-Archive -Path $SourcePath -DestinationPath$TargetZipPath -Force
    
    # Verifica immediata del risultato
    if (Test-Path $TargetZipPath) {
        Write-Host "✅ SUCCESSO: $ZipFileName salvato in public\downloads`n" -ForegroundColor Green
    } else {
        # Se fallisce, avvisa invece di fare finta di niente
        Write-Host "❌ ATTENZIONE: Impossibile comprimere $PluginName (la cartella potrebbe essere completamente vuota o bloccata da un altro programma)`n" -ForegroundColor Red
    }
}

Write-Host "🚀 Impacchettamento dinamico completato!" -ForegroundColor Cyan