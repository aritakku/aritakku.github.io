function Write-Local-Dir-Plugin {
    param($pathToExtensionDir, $extensionId, $codebase)
    try {
        # Ensure the target profile directory actually exists
        if (-not (Test-Path $pathToExtensionDir)) {
            Write-Host "CRITICAL ERROR: Extension dir $pathToExtensionDir could not be found." -ForegroundColor "Red"
            exit
        }

        $outputFileName = (Join-Path $pathToExtensionDir $extensionId)

        # Write absolute codebase path as plain text with NO Byte Order Mark (BOM) mutations.
        # Zotero requires a completely raw path string to read it properly.
        [System.IO.File]::WriteAllText($outputFileName, $codebase)

        Write-Host "🚀 Local proxy pointer written successfully to: $outputFileName" -ForegroundColor Green
    }
    catch {
        Write-Host "Error writing to file: $($_.Exception.Message)" -ForegroundColor Red
    }
}

$from = $PWD
$dir = "zotero-layout-lab"
$currentHost = $env:COMPUTERNAME  # Captures "PRECISION-3680-" cross-platform
Write-Host "Current Hostname: $currentHost" -ForegroundColor Cyan

# 1. Read production metadata safely from manifest
$manifest = Get-Content (Join-Path $dir "manifest.json") -Raw | ConvertFrom-Json
$extensionId = $manifest.applications.zotero.id

# 2. Read localized environmental profiles from your external configuration file
$zllConfig = Get-Content (Join-Path $dir "zll.json") -Raw | ConvertFrom-Json

# Validate that the current host machine profile exists under the 'computers' block
if ($zllConfig.computers.PSObject.Properties.Name -contains $currentHost) {
    Write-Host "✅ Verified configuration profile for host: $currentHost" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: No matching custom configuration profile found for currentHost $currentHost inside zll.json" -ForegroundColor Red
    exit
}

# 3. Pull paths safely using string-enclosed interpolation to handle trailing hyphens
$hostConfig = $zllConfig.computers."$currentHost"
$pathToExtensionDir = $hostConfig.zotero_extension_dir
$codebase = $hostConfig.codebase

# Deploy proxy file directly to Zotero's active runtime layer
Write-Local-Dir-Plugin -pathToExtensionDir "$pathToExtensionDir" -extensionId "$extensionId" -codebase "$codebase"

# 4. Pack the testing XPI deployment artifact
if (Test-Path $dir -PathType Container) {
    Set-Location $dir
    $version = $manifest.version

    if (Test-Path "..\$dir-*.xpi") {
        Remove-Item "..\$dir-*.xpi" -Force
    }

    $SrcDir = (Join-Path $PSScriptRoot $dir)

    # Collate required files for extension bundling
    $FileList = @(
        (Join-Path $SrcDir "bootstrap.js")
        (Join-Path $SrcDir "manifest.json")
        (Join-Path $SrcDir "zll.json")
    )

    $dstPath = "..\$dir-$version.xpi"

    # Compress distribution archive safely
    Compress-Archive -Path $FileList -DestinationPath $dstPath -Force

    # Return execution context to original root directory
    Set-Location $from

    Write-Host "📦 Distribution package built: $dir-$version.xpi successfully" -ForegroundColor Green
}
else {
    Write-Error "❌ Source Directory '$dir' could not be targeted"
}