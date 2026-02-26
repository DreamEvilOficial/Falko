import simpleGit from 'simple-git';
import db from '@/lib/db';
import path from 'path';
import fs from 'fs/promises';

// Initialize git client. 
// We assume the process runs in nextjs-app, so the repo root might be one level up or current dir.
// simple-git automatically searches up for the .git directory.
const git = simpleGit();

async function exportDatabaseData() {
  console.log('[Backup] Exporting database data...');
  try {
    const data = {
      timestamp: new Date().toISOString(),
      productos: await db.all('SELECT * FROM productos ORDER BY id'),
      categorias: await db.all('SELECT * FROM categorias ORDER BY id'),
      subcategorias: await db.all('SELECT * FROM subcategorias ORDER BY id'),
      etiquetas: await db.all('SELECT * FROM etiquetas ORDER BY id'),
      ordenes: await db.all('SELECT * FROM ordenes ORDER BY created_at DESC'),
      orden_items: await db.all('SELECT * FROM orden_items ORDER BY id'),
      deudas: await db.all('SELECT * FROM deudas ORDER BY created_at DESC'),
      configuracion: await db.all('SELECT * FROM configuracion'),
    };

    const backupDir = path.join(process.cwd(), 'backups');
    try {
      await fs.access(backupDir);
    } catch {
      await fs.mkdir(backupDir, { recursive: true });
    }

    const filePath = path.join(backupDir, 'full_backup.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log('[Backup] Data exported to', filePath);
    return true;
  } catch (error) {
    console.error('[Backup] Failed to export data:', error);
    return false;
  }
}

export async function runBackup() {
  console.log('[Backup] Starting backup check...');
  try {
    // Check if backup is enabled
    const row = await db.get('SELECT valor FROM configuracion WHERE clave = ?', ['autobackup_enabled']);
    
    let enabled = false;
    if (row) {
      try {
        const val = JSON.parse(row.valor);
        enabled = val === true || val === 'true';
      } catch {
        enabled = row.valor === 'true';
      }
    }

    if (!enabled) {
      console.log('[Backup] Autobackup is disabled in config.');
      return;
    }

    console.log('[Backup] Autobackup enabled. Proceeding with data export and git operations...');
    
    // Export data first
    await exportDatabaseData();

    // Status check
    const status = await git.status();
    if (status.isClean()) {
        console.log('[Backup] No changes to commit.');
        return;
    }

    // Add all files
    await git.add('.');
    
    // Commit
    const date = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
    await git.commit(`Autobackup: ${date}`);
    
    // Push
    // Pushing to the default remote (usually origin) and currently checked out branch
    await git.push(); 
    
    console.log('[Backup] Backup completed successfully.');
    
    // Notify success (Optional: Implement notification system)
    // await db.run("INSERT INTO notificaciones ...");

  } catch (error) {
    console.error('[Backup] Backup failed:', error);
  }
}
