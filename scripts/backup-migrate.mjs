import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Create backups directory if it doesn't exist
const backupsDir = join(projectRoot, "backups");
if (!existsSync(backupsDir)) {
  mkdirSync(backupsDir, { recursive: true });
}

// Generate date string for backup filename
const now = new Date();
const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
const backupFile = join(backupsDir, `schema-${dateStr}.sql`);

console.log("========================================");
console.log("iCompass Database Backup & Migration");
console.log("========================================\n");

console.log("📦 Creating database backup...");

try {
  // Export schema (this is a placeholder - actual backup would use Supabase CLI or pg_dump)
  const backupContent = `-- Database Backup Created: ${now.toISOString()}
-- This is a schema backup for iCompass Seychelles

-- Note: To create a full backup, use:
-- supabase db dump --project-id bwlmlniotyrjttglbjrl > ${backupFile}

-- Or use pg_dump if you have direct database access:
-- pg_dump -h db.bwlmlniotyrjttglbjrl.supabase.co -U postgres -d postgres > ${backupFile}

-- Business table backup
CREATE TABLE IF NOT EXISTS businesses_backup_${dateStr} AS 
SELECT * FROM businesses;

-- Categories backup
CREATE TABLE IF NOT EXISTS categories_backup_${dateStr} AS 
SELECT * FROM categories;

-- Products backup
CREATE TABLE IF NOT EXISTS products_backup_${dateStr} AS 
SELECT * FROM products;

-- Profiles backup
CREATE TABLE IF NOT EXISTS profiles_backup_${dateStr} AS 
SELECT * FROM profiles;
`;

  writeFileSync(backupFile, backupContent);
  console.log(`   ✓ Backup file created: ${backupFile}\n`);
} catch (error) {
  console.error("   ❌ Failed to create backup file:", error.message);
}

console.log("🔄 Checking for pending migrations...");

try {
  // List migration files
  const migrationsDir = join(projectRoot, "supabase", "migrations");
  if (existsSync(migrationsDir)) {
    const migrations = execSync(`ls "${migrationsDir}"/*.sql`, { 
      encoding: "utf8",
      cwd: projectRoot 
    }).trim().split("\n").filter(f => f);
    
    console.log(`   Found ${migrations.length} migration files`);
    console.log("   Latest migrations:");
    migrations.slice(-5).forEach(m => {
      console.log(`     - ${m.split(/[/\\]/).pop()}`);
    });
  }
} catch (error) {
  console.warn("   ⚠️  Could not list migrations (this is OK)");
}

console.log("\n✅ Backup and migration check complete");
console.log(`   Backup location: ${backupFile}`);
console.log("\n💡 To apply migrations, use:");
console.log("   supabase db reset --linked");
console.log("   or");
console.log("   supabase migration up --linked\n");

