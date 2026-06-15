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
$dir = "zotero-layout-lab"
$currentHost = $env:COMPUTERNAME  # Works cross-platform in pwsh
Write-Host "Current Hostname: $currentHost"

$manifest = Get-Content (Join-Path $dir "manifest.json") -Raw | ConvertFrom-Json
$extensionId = $manifest.applications.zotero.id
$custom = Get-Content (Join-Path $dir "zll.json") -Raw | ConvertFrom-Json

if (
    $custom.computer_specific_profiles.PSObject.Properties.Name -contains $currentHost
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

	$SrcDir = (Join-Path $PSScriptRoot $dir)

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
