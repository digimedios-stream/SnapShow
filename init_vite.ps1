$projectName = "my-app"
Remove-Item -Path $projectName -Recurse -Force -ErrorAction SilentlyContinue
Start-Process -FilePath "npm.cmd" -ArgumentList "create", "vite@latest", $projectName, "--", "--template", "react-ts" -Wait
if (Test-Path $projectName) {
    Move-Item -Path "$projectName\*" -Destination ".\" -Force
    Remove-Item -Path $projectName -Recurse -Force
}
