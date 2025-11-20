import { execSync } from "child_process";
import { readFileSync, existsSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Required environment variables
const REQUIRED_ENV = {
  VITE_SUPABASE_URL: "https://bwlmlniotyrjttglbjrl.supabase.co",
  VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDM3MDEsImV4cCI6MjA3MjI3OTcwMX0.Wx2ypE6AlTBe0vBqC_MvYc5IiwemMaxXGiHOmGM6MoI",
  VITE_GOOGLE_MAPS_API_KEY: "AIzaSyByNrxUDO-dODXwTaT6RINSbAfASZ-eGfY",
  VITE_SITE_URL: "http://localhost:5173"
};

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
    console.warn("   ⚠️  .env file not found");
  }

  const missing = [];
  for (const [key, expectedValue] of Object.entries(REQUIRED_ENV)) {
    const actualValue = process.env[key];
    if (!actualValue || actualValue.trim() === "") {
      missing.push(key);
      console.error(`   ❌ ${key}: MISSING`);
    } else {
      console.log(`   ✓ ${key}: ${maskValue(actualValue)}`);
      // Warn if value doesn't match expected
      if (key === "VITE_SUPABASE_URL" && actualValue !== expectedValue) {
        console.warn(`   ⚠️ ${key} does not match expected value`);
      }
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
  const cacheDirs = [
    join(projectRoot, "node_modules", ".vite"),
    join(projectRoot, ".vite"),
    join(projectRoot, "dist", ".vite")
  ];

  let cleared = false;
  cacheDirs.forEach((dir) => {
    if (existsSync(dir)) {
      try {
        rmSync(dir, { recursive: true, force: true });
        console.log(`   ✓ Cleared: ${dir.replace(projectRoot, ".")}`);
        cleared = true;
      } catch (err) {
        // Ignore errors
      }
    }
  });
  
  if (cleared) {
    console.log("✅ Vite cache cleared\n");
  } else {
    console.log("   (No cache to clear)\n");
  }
}

function regenerateTypes() {
  try {
    console.log("🔄 Regenerating Supabase types...");
    
    // Ensure types directory exists
    const typesDir = join(projectRoot, "src", "types");
    if (!existsSync(typesDir)) {
      execSync(`mkdir -p "${typesDir}"`, { cwd: projectRoot });
    }
    
    // Try to regenerate types
    execSync(
      'npx supabase gen types typescript --project-id "bwlmlniotyrjttglbjrl" > src/types/supabase.types.ts',
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

