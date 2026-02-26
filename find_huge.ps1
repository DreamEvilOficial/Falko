
Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | Where-Object { 
    $_.FullName -notmatch 'node_modules|\.next|\.git' -and $_.Length -gt 50MB 
} | Select-Object FullName, Length
