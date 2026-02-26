#!/usr/bin/env node

/**
 * Script para generar claves secretas seguras
 * Uso: node scripts/generate-secrets.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generatePassword() {
  const words = [
    'Aurora', 'Blizzard', 'Cascade', 'Diamond', 'Eclipse',
    'Falcon', 'Galaxy', 'Hurricane', 'Infinity', 'Jupiter',
    'Kraken', 'Lightning', 'Meteor', 'Neptune', 'Odyssey',
    'Phoenix', 'Quantum', 'Raptor', 'Storm', 'Thunder',
    'Universe', 'Vortex', 'Warrior', 'Xenon', 'Zenith'
  ];
  
  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const numbers = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const special = ['!', '@', '#', '$', '%', '^', '&', '*'][Math.floor(Math.random() * 8)];
  
  return `${word1}${word2}${numbers}${special}`;
}

console.log(`\n${colors.bright}${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.bright}${colors.blue}║  🔐  GENERADOR DE CLAVES SECRETAS - URBAN CDG           ║${colors.reset}`);
console.log(`${colors.bright}${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

// Generar secretos
const secrets = {
  WEBHOOK_SECRET: generateSecret(32),
  REVALIDATE_SECRET: generateSecret(32),
  ENCRYPTION_PASSWORD: generatePassword(),
  JWT_SECRET: generateSecret(32),
  SESSION_SECRET: generateSecret(32),
};

console.log(`${colors.cyan}📝 Claves generadas con éxito:${colors.reset}\n`);

// Mostrar secretos
Object.entries(secrets).forEach(([key, value]) => {
  console.log(`${colors.green}${key}${colors.reset}=${value}`);
});

// Preguntar si guardar en .env.local
console.log(`\n${colors.yellow}────────────────────────────────────────────────────────────${colors.reset}\n`);

// Crear contenido del archivo
const envContent = `# Claves de Seguridad - Generadas automáticamente el ${new Date().toISOString()}

# IMPORTANTE: No compartir estas claves ni subirlas a GitHub

# Webhook Secret (para verificar requests de Supabase)
WEBHOOK_SECRET=${secrets.WEBHOOK_SECRET}

# Revalidate Secret (para revalidación manual de páginas)
REVALIDATE_SECRET=${secrets.REVALIDATE_SECRET}

# Encryption Password (para encriptar datos sensibles)
ENCRYPTION_PASSWORD=${secrets.ENCRYPTION_PASSWORD}

# JWT Secret (para firma de tokens)
JWT_SECRET=${secrets.JWT_SECRET}

# Session Secret (para manejo de sesiones)
SESSION_SECRET=${secrets.SESSION_SECRET}

# Domain Lock (separados por coma, sin espacios)
# NEXT_PUBLIC_DOMAIN_LOCK=tudominio.com,www.tudominio.com

# Environment
NODE_ENV=production
`;

// Guardar en archivo
const envPath = path.join(process.cwd(), '.env.secrets');
fs.writeFileSync(envPath, envContent);

console.log(`${colors.green}✅ Claves guardadas en: ${colors.bright}.env.secrets${colors.reset}`);
console.log(`\n${colors.cyan}📋 Próximos pasos:${colors.reset}\n`);
console.log(`   1. ${colors.yellow}Copiar${colors.reset} el contenido de ${colors.bright}.env.secrets${colors.reset} a ${colors.bright}.env.local${colors.reset}`);
console.log(`   2. ${colors.yellow}Agregar${colors.reset} tus credenciales de Supabase y MercadoPago`);
console.log(`   3. ${colors.yellow}Configurar${colors.reset} NEXT_PUBLIC_DOMAIN_LOCK con tus dominios`);
console.log(`   4. ${colors.yellow}Agregar${colors.reset} estas mismas variables en Vercel (Settings → Environment Variables)`);
console.log(`   5. ${colors.yellow}Eliminar${colors.reset} el archivo ${colors.bright}.env.secrets${colors.reset} después de copiar (seguridad)`);

console.log(`\n${colors.cyan}🔒 Configuración en Vercel:${colors.reset}\n`);
console.log(`   Ir a: https://vercel.com/tu-proyecto/settings/environment-variables`);
console.log(`   Agregar cada variable con su valor correspondiente`);

console.log(`\n${colors.cyan}🔗 Configurar Webhooks en Supabase:${colors.reset}\n`);
console.log(`   1. Ir a: Database → Webhooks`);
console.log(`   2. Crear webhook para tabla 'productos':`);
console.log(`      ${colors.yellow}URL:${colors.reset} https://tudominio.com/api/revalidate`);
console.log(`      ${colors.yellow}Method:${colors.reset} POST`);
console.log(`      ${colors.yellow}Headers:${colors.reset} Authorization: Bearer ${secrets.WEBHOOK_SECRET.substring(0, 20)}...`);

console.log(`\n${colors.green}${colors.bright}🎉 ¡Listo! Tu plataforma ahora está protegida.${colors.reset}\n`);

// Crear también un archivo de ejemplo para Vercel
const vercelEnvExample = `# Copiar estas variables a Vercel
# Settings → Environment Variables

WEBHOOK_SECRET=${secrets.WEBHOOK_SECRET}
REVALIDATE_SECRET=${secrets.REVALIDATE_SECRET}
ENCRYPTION_PASSWORD=${secrets.ENCRYPTION_PASSWORD}
JWT_SECRET=${secrets.JWT_SECRET}
SESSION_SECRET=${secrets.SESSION_SECRET}

# Agregar también:
# NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=your-mp-key
# MERCADOPAGO_ACCESS_TOKEN=your-mp-token
# NEXT_PUBLIC_DOMAIN_LOCK=tudominio.com,www.tudominio.com
`;

const vercelEnvPath = path.join(process.cwd(), 'vercel-env-variables.txt');
fs.writeFileSync(vercelEnvPath, vercelEnvExample);

console.log(`${colors.blue}📄 También se creó: ${colors.bright}vercel-env-variables.txt${colors.reset}`);
console.log(`   ${colors.yellow}→${colors.reset} Copiar y pegar directamente en Vercel\n`);

// Instrucciones de seguridad
console.log(`${colors.yellow}⚠️  IMPORTANTE - SEGURIDAD:${colors.reset}\n`);
console.log(`   • ${colors.yellow}NUNCA${colors.reset} subir ${colors.bright}.env.secrets${colors.reset} o ${colors.bright}.env.local${colors.reset} a Git`);
console.log(`   • ${colors.yellow}NUNCA${colors.reset} compartir estas claves públicamente`);
console.log(`   • ${colors.yellow}ROTAR${colors.reset} las claves cada 3-6 meses`);
console.log(`   • ${colors.yellow}USAR${colors.reset} diferentes claves para desarrollo y producción\n`);

console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
