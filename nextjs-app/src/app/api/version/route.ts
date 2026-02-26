import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Intentar obtener de la variable de entorno de Vercel (Producción)
    const vercelSha = process.env.VERCEL_GIT_COMMIT_SHA;
    if (vercelSha) {
      return NextResponse.json({ version: vercelSha.substring(0, 7) });
    }

    // 2. Fallback a comando git (Local)
    const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
    return NextResponse.json({ version: commitHash });
  } catch (error) {
    console.error('Error al obtener la versión:', error);
    return NextResponse.json({ version: 'v1.0.8-JAN' });
  }
}
