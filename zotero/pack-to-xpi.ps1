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
function Increment-ManifestVersion {
    param(
        [Parameter(Mandatory)]
        [string]$ManifestPath
    )

    try {
        if (-not (Test-Path $ManifestPath)) {
            throw "Manifest not found at $ManifestPath"
        }

        # Read JSON as object
        $jsonText = Get-Content $ManifestPath -Raw
        $manifest = $jsonText | ConvertFrom-Json

        if (-not $manifest.version) {
            throw "manifest.json does not contain a version field"
        }

        $oldVersion = $manifest.version

        # Split version into parts
        $parts = $oldVersion -split '\.'

        if ($parts.Count -eq 0) {
            throw "Invalid version format: $oldVersion"
        }

        # Increment last segment safely
        $lastIndex = $parts.Count - 1
        if ($parts[$lastIndex] -notmatch '^\d+$') {
            throw "Last version segment is not numeric: $oldVersion"
        }

        $parts[$lastIndex] = ([int]$parts[$lastIndex] + 1).ToString()

        $newVersion = $parts -join '.'
        $manifest.version = $newVersion

        # Write JSON back WITHOUT BOM (critical for some tools)
        $updatedJson = $manifest | ConvertTo-Json -Depth 10
        [System.IO.File]::WriteAllText($ManifestPath, $updatedJson, (New-Object System.Text.UTF8Encoding($false)))

        Write-Host "✅ Version bumped: $oldVersion → $newVersion" -ForegroundColor Green

        return $newVersion
    }
    catch {
        Write-Host "❌ Failed to update manifest: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

$from = $PWD

$currentHost = $env:COMPUTERNAME  # Captures "PRECISION-3680-" cross-platform
Write-Host "Current Hostname: $currentHost" -ForegroundColor Cyan


$repoRoot = $PSScriptRoot
$dir = "zotero-layout-lab"

Write-Host "repoRoot: $repoRoot" -ForegroundColor Cyan
# exit

$manifestPath = Join-Path $repoRoot $dir
$manifestPath = Join-Path $manifestPath "manifest.json"


# 1. Read production metadata safely from manifest
$version = Increment-ManifestVersion -ManifestPath $manifestPath

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$extensionId = $manifest.applications.zotero.id


# 2. Read localized environmental profiles from your external configuration file
$zllPath = Join-Path $repoRoot $dir
$zllPath = Join-Path $zllPath "zll.json"

Write-Host "zllPath: $zllPath" -ForegroundColor Cyan


$zllConfig = Get-Content $zllPath -Raw | ConvertFrom-Json

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
#Write-Local-Dir-Plugin -pathToExtensionDir "$pathToExtensionDir" -extensionId "$extensionId" -codebase "$codebase"

# 4. Pack the testing XPI deployment artifact
$targetDir = Join-Path $repoRoot $dir
if (Test-Path $targetDir -PathType Container) {
    $version = $manifest.version

    $SrcDir = Join-Path $PSScriptRoot $dir

    if (Test-Path (Join-Path $PSScriptRoot "$dir-*.xpi")) {
        Remove-Item (Join-Path $PSScriptRoot "$dir-*.xpi") -Force
    }

    $dstPath = Join-Path $PSScriptRoot "$dir-$version.xpi"

    Push-Location $SrcDir
    try {
        # IMPORTANT: use relative paths here
        $FileList = @(
            "bootstrap.js"
            "manifest.json"
            "zll.json"
            "lib"
            "src"
            "icons"
        )

        Compress-Archive -Path $FileList -DestinationPath $dstPath -Force
    }
    finally {
        Pop-Location
    }

    Write-Host "📦 Distribution package built: $dir-$version.xpi successfully" -ForegroundColor Green
}
else {
    Write-Error "❌ Source Directory '$dir' could not be targeted"
}

Set-Location $from