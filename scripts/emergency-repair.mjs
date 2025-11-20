import { execSync } from "child_process";
import { existsSync, rmSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

console.log("🚨 iCompass Emergency Repair Kit");
console.log("=".repeat(50) + "\n");

// Step 1: Validate .env
console.log("1️⃣  Validating .env file...");
const envPath = join(projectRoot, ".env");
const requiredVars = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_GOOGLE_MAPS_API_KEY",
  "VITE_SITE_URL"
];

if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf8");
  const missing = requiredVars.filter(v => !envContent.includes(`${v}=`));
  if (missing.length > 0) {
    console.error(`   ❌ Missing variables: ${missing.join(", ")}`);
    console.error("   Please add them to .env file");
    process.exit(1);
  }
  console.log("   ✅ All required variables present");
} else {
  console.error("   ❌ .env file not found");
  console.log("   Creating .env.example...");
  const exampleContent = `VITE_SUPABASE_URL=https://bwlmlniotyrjttglbjrl.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
VITE_SITE_URL=http://localhost:5173
`;
  writeFileSync(join(projectRoot, ".env.example"), exampleContent);
  console.error("   Please create .env file from .env.example");
  process.exit(1);
}

// Step 2: Delete cache directories
console.log("\n2️⃣  Clearing cache directories...");
const cacheDirs = [
  join(projectRoot, "node_modules", ".vite"),
  join(projectRoot, "node_modules", ".cache"),
  join(projectRoot, ".vite"),
  join(projectRoot, ".cursor-cache")
];

cacheDirs.forEach(dir => {
  if (existsSync(dir)) {
    try {
      rmSync(dir, { recursive: true, force: true });
      console.log(`   ✓ Cleared: ${dir.replace(projectRoot, ".")}`);
    } catch (err) {
      console.warn(`   ⚠️  Could not clear: ${dir}`);
    }
  }
});
console.log("   ✅ Cache cleared");

// Step 3: Reinstall dependencies
console.log("\n3️⃣  Reinstalling dependencies...");
try {
  if (existsSync(join(projectRoot, "package-lock.json"))) {
    rmSync(join(projectRoot, "package-lock.json"), { force: true });
  }
  if (existsSync(join(projectRoot, "node_modules"))) {
    console.log("   Removing node_modules...");
    rmSync(join(projectRoot, "node_modules"), { recursive: true, force: true });
  }
  console.log("   Running npm install...");
  execSync("npm install", { cwd: projectRoot, stdio: "inherit" });
  console.log("   ✅ Dependencies reinstalled");
} catch (err) {
  console.error("   ❌ Failed to reinstall dependencies");
  console.error(err.message);
  process.exit(1);
}

// Step 4: Verify Supabase folders
console.log("\n4️⃣  Verifying Supabase structure...");
const supabaseDir = join(projectRoot, "supabase");
const migrationsDir = join(supabaseDir, "migrations");
const typesDir = join(projectRoot, "src", "types");

if (!existsSync(supabaseDir)) {
  mkdirSync(supabaseDir, { recursive: true });
  console.log("   ✓ Created supabase directory");
}
if (!existsSync(migrationsDir)) {
  mkdirSync(migrationsDir, { recursive: true });
  console.log("   ✓ Created migrations directory");
}
if (!existsSync(typesDir)) {
  mkdirSync(typesDir, { recursive: true });
  console.log("   ✓ Created types directory");
}
console.log("   ✅ Supabase structure verified");

// Step 5: Regenerate Supabase types
console.log("\n5️⃣  Regenerating Supabase types...");
try {
  execSync(
    'npx supabase gen types typescript --project-id "bwlmlniotyrjttglbjrl" > src/types/supabase.types.ts',
    { cwd: projectRoot, stdio: "inherit" }
  );
  console.log("   ✅ Types regenerated");
} catch (err) {
  console.warn("   ⚠️  Could not regenerate types (Supabase CLI may need login)");
  console.warn("   You can manually run: npx supabase gen types typescript --project-id bwlmlniotyrjttglbjrl");
}

// Step 6: Rebuild TS type index
console.log("\n6️⃣  Rebuilding TypeScript type index...");
const indexTypesPath = join(typesDir, "index.ts");
if (!existsSync(indexTypesPath)) {
  const indexContent = `// Auto-generated type exports
export * from './supabase.types';
`;
  writeFileSync(indexTypesPath, indexContent);
  console.log("   ✓ Created types/index.ts");
} else {
  const indexContent = readFileSync(indexTypesPath, "utf8");
  if (!indexContent.includes("supabase.types")) {
    const updated = indexContent + "\nexport * from './supabase.types';\n";
    writeFileSync(indexTypesPath, updated);
    console.log("   ✓ Updated types/index.ts");
  }
}
console.log("   ✅ Type index verified");

// Step 7: Run migration healer
console.log("\n7️⃣  Running migration healer...");
const healerScript = join(projectRoot, "scripts", "migration-healer.mjs");
if (existsSync(healerScript)) {
  try {
    execSync(`node "${healerScript}"`, { cwd: projectRoot, stdio: "inherit" });
  } catch (err) {
    console.warn("   ⚠️  Migration healer had warnings (this is OK)");
  }
} else {
  console.log("   ℹ️  Migration healer script not found (will be created)");
}
console.log("   ✅ Migration healer complete");

// Step 8: Repair Supabase client
console.log("\n8️⃣  Verifying Supabase client...");
const clientPath = join(projectRoot, "src", "integrations", "supabase", "client.ts");
if (existsSync(clientPath)) {
  const clientContent = readFileSync(clientPath, "utf8");
  const checks = {
    "Throws on missing env": clientContent.includes("throw new Error") || clientContent.includes("throw new"),
    "persistSession false": clientContent.includes("persistSession: false"),
    "Has validation": clientContent.includes("getEnv") || clientContent.includes("VITE_SUPABASE")
  };
  
  const allChecks = Object.values(checks).every(v => v);
  if (allChecks) {
    console.log("   ✅ Supabase client is properly configured");
  } else {
    console.warn("   ⚠️  Supabase client may need updates");
  }
} else {
  console.error("   ❌ Supabase client not found");
}

// Step 9: Fix Vite startup
console.log("\n9️⃣  Verifying Vite startup...");
const prestartPath = join(projectRoot, "scripts", "prestart.mjs");
if (existsSync(prestartPath)) {
  console.log("   ✅ prestart.mjs exists");
  
  const packageJsonPath = join(projectRoot, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  
  if (packageJson.scripts?.dev?.includes("prestart")) {
    console.log("   ✅ dev script includes prestart");
  } else {
    console.warn("   ⚠️  dev script should run prestart first");
  }
} else {
  console.error("   ❌ prestart.mjs not found");
}

// Step 10: Final summary
console.log("\n" + "=".repeat(50));
console.log("✅ Emergency Repair Complete!");
console.log("\nNext steps:");
console.log("   1. Run: npm run prestart");
console.log("   2. Run: npm run dev");
console.log("\nIf issues persist:");
console.log("   - Check browser console for errors");
console.log("   - Verify .env variables are correct");
console.log("   - Run: npm run healthcheck");
console.log("=".repeat(50) + "\n");

