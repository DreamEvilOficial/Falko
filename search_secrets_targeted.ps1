
$paths = "nextjs-app/scripts", "admin", "wp-content"
foreach ($p in $paths) {
    if (Test-Path $p) {
        $files = Get-ChildItem -Path $p -Recurse -File
        foreach ($f in $files) {
            $matches = Select-String -Path $f.FullName -Pattern "supabaseKey|supabase_anon_key|SUPABASE_ANON_KEY|eyJhbGci"
            if ($matches) {
                Write-Host "$($f.FullName):"
                $matches | ForEach-Object { Write-Host "  $($_.LineNumber): $($_.Line)" }
            }
        }
    }
}
