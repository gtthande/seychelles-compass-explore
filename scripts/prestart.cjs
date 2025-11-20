const { execSync } = require("child_process");
const { readFileSync, existsSync, rmSync } = require("fs");
const { join } = require("path");

const projectRoot = process.cwd();

// Required environment variables
const REQUIRED_ENV = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_GOOGLE_MAPS_API_KEY",
  "VITE_SITE_URL"
];

function maskValue(value) {
  if (!value || value.length <= 6) return "****";
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

function checkEnv() {
  console.log("🔍 Validating environment variables...");
  
  // Load .env file if it exists
  const envPath = join(projectRoot, ".env");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf8");
    envContent.split(/\r?\n/).forEach((line) => {
      // Skip comments and empty lines
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        // Set in process.env if not already set
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    console.log("   ✓ Loaded .env file");
  } else {
    console.error("   ❌ .env file not found");
    process.exit(1);
  }

  const missing = [];
  for (const key of REQUIRED_ENV) {
    const actualValue = process.env[key];
    if (!actualValue || actualValue.trim() === "") {
      missing.push(key);
      console.error(`   ❌ ${key}: MISSING`);
    } else {
      console.log(`   ✓ ${key}: ${maskValue(actualValue)}`);
    }
  }

  if (missing.length > 0) {
    console.error("\n❌ FATAL: Missing required environment variables:", missing.join(", "));
    console.error("   Please create .env file with all required variables.");
    process.exit(1);
  }

  console.log("✅ All environment variables validated\n");
}

function clearViteCache() {
  console.log("🗑️  Clearing Vite cache...");
  const cacheDir = join(projectRoot, "node_modules", ".vite");
  
  if (existsSync(cacheDir)) {
    try {
      rmSync(cacheDir, { recursive: true, force: true });
      console.log(`   ✓ Cleared: node_modules/.vite`);
    } catch (err) {
      console.warn(`   ⚠️  Could not clear cache: ${err.message}`);
    }
  } else {
    console.log("   (No cache to clear)");
  }
  console.log("");
}

function regenerateTypes() {
  try {
    console.log("🔄 Regenerating Supabase types...");
    
    // Ensure types directory exists
    const typesDir = join(projectRoot, "src", "types");
    if (!existsSync(typesDir)) {
      require("fs").mkdirSync(typesDir, { recursive: true });
    }
    
    // Try to regenerate types
    execSync(
      'npx supabase gen types typescript --project-id "bwlmlniotyrjttglbjrl" > src/types/supabase.ts',
      { 
        cwd: projectRoot,
        stdio: "inherit"
      }
    );
    console.log("✅ Supabase types regenerated\n");
  } catch (err) {
    console.warn("⚠️  Could not regenerate types (this is OK if Supabase CLI is not installed)");
    console.warn("   You can manually run: npx supabase gen types typescript --project-id bwlmlniotyrjttglbjrl\n");
  }
}

// Main execution
console.log("========================================");
console.log("iCompass Pre-Start Validation");
console.log("========================================\n");

checkEnv();
clearViteCache();
regenerateTypes();

console.log("✅ Pre-start checks complete\n");

