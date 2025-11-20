import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

console.log("🩺 Running iCompass Health Check…\n");

let allHealthy = true;

// Check Node.js version
try {
  const nodeVersion = execSync("node -v", { encoding: "utf8" }).trim();
  console.log(`✅ Node.js: ${nodeVersion}`);
} catch (err) {
  console.error("❌ Node.js not found");
  allHealthy = false;
}

// Check npm
try {
  const npmVersion = execSync("npm -v", { encoding: "utf8" }).trim();
  console.log(`✅ npm: ${npmVersion}`);
} catch (err) {
  console.error("❌ npm not found");
  allHealthy = false;
}

// Check .env file
const envPath = join(projectRoot, ".env");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf8");
  const requiredVars = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
    "VITE_GOOGLE_MAPS_API_KEY",
    "VITE_SITE_URL"
  ];
  
  const missing = requiredVars.filter(v => !envContent.includes(`${v}=`));
  if (missing.length === 0) {
    console.log("✅ .env file: All required variables present");
  } else {
    console.error(`❌ .env file: Missing variables: ${missing.join(", ")}`);
    allHealthy = false;
  }
} else {
  console.error("❌ .env file: Not found");
  allHealthy = false;
}

// Check Supabase migrations folder
const migrationsDir = join(projectRoot, "supabase", "migrations");
if (existsSync(migrationsDir)) {
  try {
    const migrations = execSync(`ls "${migrationsDir}"/*.sql 2>nul || echo ""`, { 
      encoding: "utf8",
      cwd: projectRoot 
    }).trim().split("\n").filter(f => f);
    console.log(`✅ Supabase migrations: ${migrations.length} files found`);
  } catch (err) {
    console.warn("⚠️  Supabase migrations: Could not list files");
  }
} else {
  console.warn("⚠️  Supabase migrations: Directory not found");
}

// Check Supabase types
const typesFile = join(projectRoot, "src", "types", "supabase.types.ts");
if (existsSync(typesFile)) {
  const typesContent = readFileSync(typesFile, "utf8");
  if (typesContent.length > 100) {
    console.log("✅ Supabase types: File exists and has content");
  } else {
    console.warn("⚠️  Supabase types: File exists but seems empty");
  }
} else {
  console.warn("⚠️  Supabase types: File not found (run: npm run refresh:types)");
}

// Check node_modules
const nodeModulesDir = join(projectRoot, "node_modules");
if (existsSync(nodeModulesDir)) {
  console.log("✅ node_modules: Directory exists");
} else {
  console.error("❌ node_modules: Not found (run: npm install)");
  allHealthy = false;
}

// Check package.json scripts
try {
  const packageJson = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8"));
  const requiredScripts = ["dev", "prestart"];
  const missingScripts = requiredScripts.filter(s => !packageJson.scripts?.[s]);
  
  if (missingScripts.length === 0) {
    console.log("✅ package.json: Required scripts present");
  } else {
    console.error(`❌ package.json: Missing scripts: ${missingScripts.join(", ")}`);
    allHealthy = false;
  }
} catch (err) {
  console.error("❌ package.json: Could not read");
  allHealthy = false;
}

// Check Supabase CLI (optional)
try {
  execSync("npx supabase --version", { stdio: "pipe" });
  console.log("✅ Supabase CLI: Available");
} catch (err) {
  console.warn("⚠️  Supabase CLI: Not available (optional, but recommended)");
}

// Check prestart script
const prestartScript = join(projectRoot, "scripts", "prestart.mjs");
if (existsSync(prestartScript)) {
  console.log("✅ prestart.mjs: Exists");
} else {
  console.error("❌ prestart.mjs: Not found");
  allHealthy = false;
}

console.log("\n" + "=".repeat(50));
if (allHealthy) {
  console.log("✅ Health Check: PASSED");
  process.exit(0);
} else {
  console.log("❌ Health Check: FAILED");
  console.log("\n💡 Run: npm run repair");
  process.exit(1);
}

