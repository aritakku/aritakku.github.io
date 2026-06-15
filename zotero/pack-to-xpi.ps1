function Write-Local-Dir-Plugin {
	param($pathToExtensionDir, $extensionId, $codebase)
	try {

		# Ensure the directory exists
		if (-not (Test-Path $pathToExtensionDir)) {
		    Write-Host "CRITICAL ERROR: Extension dir $pathToExtensionDir cound not be found." -ForegroundColor "Red"
			exit
		}

		$outputFileName = (Join-Path $pathToExtensionDir $extensionId)

		# Write text to file (overwrites existing content)
		Set-Content -Path $outputFileName -Value $codebase -Encoding UTF8

		Write-Host "Text '$codebase' written successfully to $outputFileName"
	}
	catch {
		Write-Host "Error writing to file: $($_.Exception.Message)" -ForegroundColor Red
	}
}

$from = $PWD
$dir = "zotero-layout-modifier"
$currentHost = $env:COMPUTERNAME  # Works cross-platform in pwsh
Write-Host "Current Hostname: $currentHost"

$manifest = Get-Content "zotero-layout-modifier\manifest.json" -Raw | ConvertFrom-Json
$extensionId = $manifest.applications.zotero.id
$custom = $manifest.__custom

if (
    $manifest.__custom -and
    $manifest.__custom.PSObject.Properties.Name -contains $currentHost
) {
    # ok
} else {
    Write-Host "ERROR: NO custom config for currentHost $currentHost" -ForegroundColor Red
    exit
}



$hostConfig = $manifest.__custom.$currentHost
$pathToExtensionDir = $hostConfig.zotero_extension_dir
$codebase = $hostConfig.codebase

Write-Local-Dir-Plugin -pathToExtensionDir "$pathToExtensionDir" -extensionId "$extensionId" -codebase "$codebase"



if (Test-Path $dir -PathType Container) {
    Set-Location $dir

	$custom = Get-Content "manifest.json" | ConvertFrom-Json
	$version = $custom.version

    if (Test-Path "..\$dir-*.xpi") {
        Remove-Item "..\$dir-*.xpi" -Force
    }

	$SrcDir = "$PSScriptRoot\zotero-layout-modifier\"

	$FileList = @(
		(Join-Path $SrcDir "bootstrap.js")
		(Join-Path $SrcDir "manifest.json")
		(Join-Path $SrcDir "up3.ico")
	)

    $dstPath = "..\$dir-$version.xpi"

    # Compress directly to .xpi
    Compress-Archive -Path $FileList -DestinationPath $dstPath -Force


    # Return to original directory
    Set-Location $from

    Write-Host "✅ Built $dir-$version.xpi successfully" -ForegroundColor Green
	
	$config.applications.zotero.id
}
else {
    Write-Error "❌ Directory '$dir' not found"
}
