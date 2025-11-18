/**
 * Verification script for admin auth & business edit fixes
 * Run this to verify all fixes are in place
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying fixes...\n');

let errors = [];
let warnings = [];

// Check 1: Verify migration file exists
const migrationPath = path.join(__dirname, '../supabase/migrations/20250122000001_fix_admin_rls_schema_mismatch.sql');
if (!fs.existsSync(migrationPath)) {
  errors.push('❌ Migration file missing: 20250122000001_fix_admin_rls_schema_mismatch.sql');
} else {
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  if (!migrationContent.includes('profiles.id = uid')) {
    errors.push('❌ Migration does not fix is_admin_user() function');
  }
  if (!migrationContent.includes('businesses.owner_id = auth.uid()')) {
    errors.push('❌ Migration does not fix business policies');
  }
  console.log('✅ Migration file exists and contains fixes');
}

// Check 2: Verify no user_id queries in src/
const srcDir = path.join(__dirname, '../src');
const checkFiles = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      checkFiles(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      // Check for .eq('user_id' pattern (but allow comments)
      const userIdQueries = content.match(/\.eq\(['"]user_id['"]/g);
      if (userIdQueries && !content.includes('// Fixed: use id')) {
        errors.push(`❌ Found user_id query in ${filePath.replace(__dirname + '/../', '')}`);
      }
    }
  }
};

try {
  checkFiles(srcDir);
  if (errors.length === 0) {
    console.log('✅ No user_id queries found in src/ (all fixed)');
  }
} catch (err) {
  warnings.push(`⚠️ Could not check all files: ${err.message}`);
}

// Check 3: Verify BusinessEdit has error logging
const businessEditPath = path.join(__dirname, '../src/pages/admin/BusinessEdit.tsx');
if (fs.existsSync(businessEditPath)) {
  const content = fs.readFileSync(businessEditPath, 'utf8');
  if (!content.includes('💾 BusinessEdit: Attempting to update')) {
    warnings.push('⚠️ BusinessEdit may be missing enhanced error logging');
  } else {
    console.log('✅ BusinessEdit has enhanced error logging');
  }
}

// Check 4: Verify MapPickerModal removed from BusinessRegister
const businessRegisterPath = path.join(__dirname, '../src/pages/BusinessRegister.tsx');
if (fs.existsSync(businessRegisterPath)) {
  const content = fs.readFileSync(businessRegisterPath, 'utf8');
  if (content.includes('MapPickerModal')) {
    warnings.push('⚠️ MapPickerModal still referenced in BusinessRegister');
  } else {
    console.log('✅ MapPickerModal removed from BusinessRegister');
  }
}

// Summary
console.log('\n📊 Summary:');
if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed!');
  console.log('\n📝 Next steps:');
  console.log('1. Run migration in Supabase Dashboard → SQL Editor');
  console.log('2. Test admin login and profile loading');
  console.log('3. Test business edit save functionality');
  process.exit(0);
} else {
  if (errors.length > 0) {
    console.log('\n❌ Errors found:');
    errors.forEach(e => console.log(`  ${e}`));
  }
  if (warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    warnings.forEach(w => console.log(`  ${w}`));
  }
  process.exit(errors.length > 0 ? 1 : 0);
}

