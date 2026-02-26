
$files = Get-ChildItem -Path . -Recurse -File -ErrorAction SilentlyContinue | Where-Object { 
    $_.FullName -notmatch 'node_modules|\.next|\.git|\.json|wp-content' 
}
foreach ($f in $files) {
    if ($f.Extension -match "png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|otf|db|sqlite") { continue }
    $matches = Select-String -Path $f.FullName -Pattern '[a-zA-Z0-9_\-]{80,}'
    if ($matches) {
        Write-Host "FOUND potential long token in $($f.FullName):"
        foreach ($m in $matches) {
            $line = $m.Line.Trim()
            if ($line.Length -gt 100) { $line = $line.Substring(0, 100) + "..." }
            Write-Host "  $($m.LineNumber): $line"
        }
    }
}
