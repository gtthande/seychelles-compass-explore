import { execSync } from "child_process";
import { readFileSync, readdirSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

console.log("🔧 iCompass Migration Healer");
console.log("=".repeat(50) + "\n");

const migrationsDir = join(projectRoot, "supabase", "migrations");
if (!existsSync(migrationsDir)) {
  console.error("❌ Migrations directory not found");
  process.exit(1);
}

// Required business fields
const requiredBusinessFields = [
  "address",
  "latitude",
  "longitude",
  "gallery_images",
  "services",
  "opening_hours",
  "verified",
  "featured",
  "island",
  "verification_notes",
  "average_rating",
  "total_reviews"
];

// Check all migrations
const migrations = readdirSync(migrationsDir)
  .filter(f => f.endsWith(".sql"))
  .sort();

console.log(`📋 Found ${migrations.length} migration files\n`);

// Check if we have a comprehensive business fields migration
let hasBusinessFieldsFix = false;
let latestBusinessMigration = null;

migrations.forEach(migration => {
  const content = readFileSync(join(migrationsDir, migration), "utf8");
  if (content.includes("verification_notes") && content.includes("island")) {
    hasBusinessFieldsFix = true;
    latestBusinessMigration = migration;
  }
});

if (!hasBusinessFieldsFix) {
  console.log("⚠️  Business fields migration not found");
  console.log("   Creating comprehensive migration...\n");
  
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0].replace("T", "");
  const migrationName = `${timestamp}_heal_business_fields.sql`;
  const migrationPath = join(migrationsDir, migrationName);
  
  const migrationSQL = `-- Migration Healer: Ensure all business fields exist
-- Generated automatically by migration-healer.mjs

DO $$
BEGIN
    -- Add verification_notes if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'verification_notes'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN verification_notes TEXT;
    END IF;

    -- Add island if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'island'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN island TEXT;
    END IF;

    -- Add gallery_images if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'gallery_images'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN gallery_images TEXT[];
    END IF;

    -- Add services if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'services'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN services TEXT[];
    END IF;

    -- Add opening_hours if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'opening_hours'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN opening_hours JSONB;
    END IF;

    -- Add average_rating if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'average_rating'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN average_rating NUMERIC(3,2) DEFAULT 0;
    END IF;

    -- Add total_reviews if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'total_reviews'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN total_reviews INTEGER DEFAULT 0;
    END IF;

    -- Ensure latitude and longitude are NUMERIC
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'latitude'
        AND data_type != 'numeric'
    ) THEN
        ALTER TABLE public.businesses ALTER COLUMN latitude TYPE NUMERIC(10,8);
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'longitude'
        AND data_type != 'numeric'
    ) THEN
        ALTER TABLE public.businesses ALTER COLUMN longitude TYPE NUMERIC(11,8);
    END IF;

    RAISE NOTICE 'Business fields migration complete';
END $$;
`;

  writeFileSync(migrationPath, migrationSQL);
  console.log(`✅ Created: ${migrationName}`);
  console.log("   Run: supabase db reset --linked (or apply migration manually)\n");
} else {
  console.log(`✅ Business fields migration found: ${latestBusinessMigration}\n`);
}

console.log("✅ Migration healer complete");
console.log("\n💡 To apply migrations:");
console.log("   supabase db reset --linked");
console.log("   or");
console.log("   supabase migration up --linked\n");

