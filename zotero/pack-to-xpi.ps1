$from = $PWD
$dir = "zotero-layout-modifier"

if (Test-Path $dir -PathType Container) {
    Set-Location $dir

	$config = Get-Content "manifest.json" | ConvertFrom-Json
	$version = $config.version

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
}
else {
    Write-Error "❌ Directory '$dir' not found"
}
