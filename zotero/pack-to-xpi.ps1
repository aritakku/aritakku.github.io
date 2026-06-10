$from = $PWD
$dir = "zotero-layout-modifier"

if (Test-Path $dir -PathType Container) {
    Set-Location $dir

	if (Test-Path "..\$dir.xpi") {
		Remove-Item "..\$dir.xpi" -Force
	}

    Compress-Archive -Path .\* -DestinationPath "..\$dir.zip" -Force
    Rename-Item -Path "..\$dir.zip" -NewName "$dir.xpi" -Force
    Set-Location $from


    Write-Host "✅ Built $dir.xpi successfully"
}
else {
    Write-Error "❌ Directory '$dir' not found"
}