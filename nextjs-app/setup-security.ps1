# Script de configuración automática para Windows
# Ejecutar: .\setup-security.ps1

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔐 CONFIGURACIÓN DE SEGURIDAD - URBAN CDG           " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n"

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Debes ejecutar este script desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Paso 1: Generando claves secretas..." -ForegroundColor Yellow
Write-Host ""

# Ejecutar el generador de secretos
node scripts/generate-secrets.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Error al generar claves" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Claves generadas exitosamente`n" -ForegroundColor Green

# Preguntar si configurar automáticamente
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
$response = Read-Host "¿Deseas activar la configuración de seguridad ahora? (s/N)"

if ($response -eq "s" -or $response -eq "S") {
    Write-Host "`n📋 Paso 2: Activando configuraciones..." -ForegroundColor Yellow
    
    # Backup del archivo actual
    if (Test-Path "next.config.js") {
        Write-Host "  → Haciendo backup de next.config.js..." -ForegroundColor Cyan
        Copy-Item "next.config.js" "next.config.backup.js" -Force
        Write-Host "  ✅ Backup creado: next.config.backup.js" -ForegroundColor Green
    }
    
    # Copiar configuración de seguridad
    if (Test-Path "next.config.security.js") {
        Write-Host "  → Activando configuración de seguridad..." -ForegroundColor Cyan
        Copy-Item "next.config.security.js" "next.config.js" -Force
        Write-Host "  ✅ Configuración de seguridad activada" -ForegroundColor Green
    }
    
    # Backup de API de productos
    if (Test-Path "src\app\api\products\route.ts") {
        Write-Host "  → Haciendo backup de API de productos..." -ForegroundColor Cyan
        Copy-Item "src\app\api\products\route.ts" "src\app\api\products\route.backup.ts" -Force
        Write-Host "  ✅ Backup creado: route.backup.ts" -ForegroundColor Green
    }
    
    # Copiar API optimizada
    if (Test-Path "src\app\api\products\route.optimized.ts") {
        Write-Host "  → Activando API optimizada..." -ForegroundColor Cyan
        Copy-Item "src\app\api\products\route.optimized.ts" "src\app\api\products\route.ts" -Force
        Write-Host "  ✅ API optimizada activada" -ForegroundColor Green
    }
    
    Write-Host "`n✅ Configuraciones activadas exitosamente`n" -ForegroundColor Green
}

# Copiar .env.secrets a .env.local si no existe
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".env.local")) {
    $copyEnv = Read-Host "¿Deseas crear .env.local desde .env.secrets? (s/N)"
    
    if ($copyEnv -eq "s" -or $copyEnv -eq "S") {
        Write-Host "`n📋 Paso 3: Creando .env.local..." -ForegroundColor Yellow
        
        if (Test-Path ".env.secrets") {
            Copy-Item ".env.secrets" ".env.local" -Force
            Write-Host "  ✅ .env.local creado desde .env.secrets" -ForegroundColor Green
            Write-Host ""
            Write-Host "  ⚠️  IMPORTANTE: Edita .env.local y agrega:" -ForegroundColor Yellow
            Write-Host "     - NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor White
            Write-Host "     - NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor White
            Write-Host "     - NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY" -ForegroundColor White
            Write-Host "     - MERCADOPAGO_ACCESS_TOKEN" -ForegroundColor White
        } else {
            Write-Host "  ❌ No se encontró .env.secrets" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ℹ️  .env.local ya existe, no se modificará" -ForegroundColor Blue
}

# Preguntar si ejecutar build
Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
$build = Read-Host "¿Deseas ejecutar build de prueba ahora? (s/N)"

if ($build -eq "s" -or $build -eq "S") {
    Write-Host "`n📋 Paso 4: Ejecutando build..." -ForegroundColor Yellow
    Write-Host ""
    
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Build completado exitosamente`n" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Error en el build" -ForegroundColor Red
        Write-Host "  → Revisa los errores arriba" -ForegroundColor Red
        Write-Host "  → Verifica que .env.local tenga todas las variables necesarias`n" -ForegroundColor Red
    }
}

# Resumen final
Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ CONFIGURACIÓN COMPLETADA                          " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Edita .env.local con tus credenciales" -ForegroundColor White
Write-Host "  2. Ejecuta: npm run build" -ForegroundColor White
Write-Host "  3. Ejecuta: npm start" -ForegroundColor White
Write-Host "  4. Prueba en http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "  5. Sube a GitHub: git add . && git commit -m 'feat: security' && git push" -ForegroundColor White
Write-Host "  6. Configura variables en Vercel (ver vercel-env-variables.txt)" -ForegroundColor White
Write-Host ""

Write-Host "📚 Documentación:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  → QUICK-START.md              (Inicio rápido)" -ForegroundColor White
Write-Host "  → IMPLEMENTATION-CHECKLIST.md (Checklist completo)" -ForegroundColor White
Write-Host "  → README-COMPLETE.md          (Overview general)" -ForegroundColor White
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n"
Write-Host "🎉 ¡Tu tienda está lista para ser súper segura! 🔒" -ForegroundColor Green
Write-Host "`n"

# Advertencia de seguridad
Write-Host "⚠️  RECORDATORIO DE SEGURIDAD:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  • ELIMINA .env.secrets después de copiar a .env.local" -ForegroundColor Red
Write-Host "  • NUNCA subas .env.local a GitHub" -ForegroundColor Red
Write-Host "  • GUARDA las claves en un gestor de contraseñas seguro" -ForegroundColor Red
Write-Host "`n"
