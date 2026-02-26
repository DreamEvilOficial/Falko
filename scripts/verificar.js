#!/usr/bin/env node

/**
 * Script de Verificación Pre-Despliegue
 * Verifica que todos los requisitos estén cumplidos antes de desplegar
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración del proyecto...\n');

let errores = 0;
let advertencias = 0;

// Verificar estructura de directorios
console.log('📁 Verificando estructura de directorios...');
const directoriosRequeridos = [
  'nextjs-app/src',
  'nextjs-app/src/app',
  'nextjs-app/src/components',
  'nextjs-app/src/lib',
  'nextjs-app/public'
];

directoriosRequeridos.forEach(dir => {
  if (fs.existsSync(path.join(__dirname, '..', dir))) {
    console.log(`  ✅ ${dir}`);
  } else {
    console.log(`  ❌ ${dir} - NO EXISTE`);
    errores++;
  }
});

// Verificar archivos críticos
console.log('\n📄 Verificando archivos críticos...');
const archivosRequeridos = [
  'nextjs-app/package.json',
  'nextjs-app/next.config.js',
  'nextjs-app/tsconfig.json',
  'SETUP-DATABASE.sql',
  '.env.example'
];

archivosRequeridos.forEach(archivo => {
  if (fs.existsSync(path.join(__dirname, '..', archivo))) {
    console.log(`  ✅ ${archivo}`);
  } else {
    console.log(`  ❌ ${archivo} - NO EXISTE`);
    errores++;
  }
});

// Verificar .env
console.log('\n🔐 Verificando variables de entorno...');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log('  ✅ Archivo .env existe');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const variablesRequeridas = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  variablesRequeridas.forEach(variable => {
    if (envContent.includes(variable) && !envContent.includes(`${variable}=your-`)) {
      console.log(`  ✅ ${variable} configurada`);
    } else {
      console.log(`  ⚠️  ${variable} - NO CONFIGURADA O USA VALOR DE EJEMPLO`);
      advertencias++;
    }
  });
} else {
  console.log('  ⚠️  Archivo .env no existe - Crea uno basado en .env.example');
  advertencias++;
}

// Verificar package.json
console.log('\n📦 Verificando dependencias...');
const packageJsonPath = path.join(__dirname, '..', 'nextjs-app', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const dependenciasRequeridas = [
    '@supabase/supabase-js',
    'next',
    'react',
    'react-dom',
    'framer-motion',
    'lucide-react',
    'zustand',
    'react-hot-toast'
  ];
  
  dependenciasRequeridas.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`  ✅ ${dep}`);
    } else {
      console.log(`  ❌ ${dep} - NO INSTALADA`);
      errores++;
    }
  });
} else {
  console.log('  ❌ package.json no encontrado');
  errores++;
}

// Verificar node_modules
console.log('\n📚 Verificando instalación de módulos...');
const nodeModulesPath = path.join(__dirname, '..', 'nextjs-app', 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('  ✅ node_modules existe');
} else {
  console.log('  ⚠️  node_modules no existe - Ejecuta "npm install"');
  advertencias++;
}

// Verificar .gitignore
console.log('\n🚫 Verificando .gitignore...');
const gitignorePath = path.join(__dirname, '..', '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  const patronesImportantes = ['.env', 'node_modules', '.next'];
  
  patronesImportantes.forEach(patron => {
    if (gitignoreContent.includes(patron)) {
      console.log(`  ✅ ${patron} está en .gitignore`);
    } else {
      console.log(`  ⚠️  ${patron} NO está en .gitignore`);
      advertencias++;
    }
  });
} else {
  console.log('  ⚠️  .gitignore no existe');
  advertencias++;
}

// Resumen
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN DE VERIFICACIÓN');
console.log('='.repeat(50));

if (errores === 0 && advertencias === 0) {
  console.log('✅ ¡Todo perfecto! El proyecto está listo para desplegar.');
  console.log('\n📝 Próximos pasos:');
  console.log('   1. Ejecuta "cd nextjs-app && npm run build" para verificar el build');
  console.log('   2. Sube el código a GitHub');
  console.log('   3. Despliega en Vercel');
  console.log('   4. Configura las variables de entorno en Vercel');
  process.exit(0);
} else {
  if (errores > 0) {
    console.log(`❌ ${errores} error(es) encontrado(s)`);
  }
  if (advertencias > 0) {
    console.log(`⚠️  ${advertencias} advertencia(s) encontrada(s)`);
  }
  
  console.log('\n🔧 Acciones recomendadas:');
  if (advertencias > 0 && errores === 0) {
    console.log('   - Revisa las advertencias antes de desplegar');
    console.log('   - El proyecto puede funcionar, pero hay configuraciones pendientes');
  }
  if (errores > 0) {
    console.log('   - Corrige los errores antes de continuar');
    console.log('   - Consulta la documentación en README.md');
  }
  
  process.exit(errores > 0 ? 1 : 0);
}
