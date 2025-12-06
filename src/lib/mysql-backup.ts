/**
 * MySQL Backup Utility
 * Syncs data from Supabase (PostgreSQL) to MySQL for backup purposes
 * Supports both local (XAMPP) and remote (Hostinger) MySQL connections
 */

export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: boolean;
}

export interface BackupStatus {
  success: boolean;
  message: string;
  tablesBackedUp?: number;
  recordsBackedUp?: number;
  errors?: string[];
}

export interface SchemaDiff {
  table: string;
  missingColumns: string[];
  extraColumns: string[];
  typeMismatches: Array<{ column: string; supabaseType: string; mysqlType: string }>;
}

/**
 * Get MySQL configuration from environment variables
 */
export function getMySQLConfig(): MySQLConfig | null {
  const host = import.meta.env.VITE_MYSQL_HOST || import.meta.env.MYSQL_HOST;
  const port = parseInt(import.meta.env.VITE_MYSQL_PORT || import.meta.env.MYSQL_PORT || '3306');
  const user = import.meta.env.VITE_MYSQL_USER || import.meta.env.MYSQL_USER;
  const password = import.meta.env.VITE_MYSQL_PASSWORD || import.meta.env.MYSQL_PASSWORD;
  const database = import.meta.env.VITE_MYSQL_DATABASE || import.meta.env.MYSQL_DATABASE || 'icompass';
  const ssl = import.meta.env.VITE_MYSQL_SSL === 'true' || import.meta.env.MYSQL_SSL === 'true';

  if (!host || !user || !password) {
    return null;
  }

  return { host, port, user, password, database, ssl };
}

/**
 * Check if MySQL backup is enabled
 */
export function isMySQLBackupEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_MYSQL_BACKUP === 'true' || 
         import.meta.env.ENABLE_MYSQL_BACKUP === 'true';
}

/**
 * Sync a single table from Supabase to MySQL
 * This is a client-side helper that calls a backend function
 */
export async function syncTableToMySQL(
  tableName: string,
  supabaseData: any[]
): Promise<BackupStatus> {
  try {
    // This would typically call a Supabase Edge Function or backend API
    // For now, we'll return a placeholder that indicates the function should be implemented
    const response = await fetch('http://localhost:5055/api/mysql-backup/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table: tableName,
        data: supabaseData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backup failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to sync table to MySQL',
      errors: [error.message],
    };
  }
}

/**
 * Get schema differences between Supabase and MySQL
 */
export async function getSchemaDiff(): Promise<SchemaDiff[]> {
  try {
    const response = await fetch('http://localhost:5055/api/mysql-backup/schema-diff');
    if (!response.ok) {
      throw new Error(`Failed to get schema diff: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error getting schema diff:', error);
    return [];
  }
}

/**
 * Sync all tables from Supabase to MySQL
 */
export async function syncAllTablesToMySQL(): Promise<BackupStatus> {
  try {
    const response = await fetch('http://localhost:5055/api/mysql-backup/sync-all', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Backup failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to sync all tables to MySQL',
      errors: [error.message],
    };
  }
}

/**
 * Test MySQL connection
 */
export async function testMySQLConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('http://localhost:5055/api/mysql-backup/test-connection');
    if (!response.ok) {
      throw new Error(`Connection test failed: ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to test MySQL connection',
    };
  }
}

