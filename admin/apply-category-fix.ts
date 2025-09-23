import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwlmlniotyrjttglbjrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyCategoryFix() {
  console.log('🔧 Applying category search fix...');
  
  try {
    // Add category_text column
    console.log('1. Adding category_text column...');
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS category_text TEXT;
      `
    });
    
    if (addColumnError) {
      console.error('❌ Error adding column:', addColumnError);
      return;
    }
    console.log('✅ Added category_text column');
    
    // Copy enum values to text column
    console.log('2. Copying category values to category_text...');
    const { error: copyError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE public.businesses 
        SET category_text = category::text 
        WHERE category_text IS NULL;
      `
    });
    
    if (copyError) {
      console.error('❌ Error copying values:', copyError);
      return;
    }
    console.log('✅ Copied category values');
    
    // Update category_text with proper values
    console.log('3. Updating category_text with proper values...');
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE public.businesses 
        SET category_text = CASE 
          WHEN category::text = 'restaurants' THEN 'food'
          WHEN category::text = 'hotels' THEN 'accommodation'
          WHEN category::text = 'tourism' THEN 'tours'
          WHEN category::text = 'health' THEN 'health'
          WHEN category::text = 'education' THEN 'education'
          WHEN category::text = 'finance' THEN 'services'
          WHEN category::text = 'transport' THEN 'transport'
          WHEN category::text = 'real_estate' THEN 'services'
          WHEN category::text = 'technology' THEN 'services'
          ELSE 'other'
        END
        WHERE category_text IS NULL OR category_text = '';
      `
    });
    
    if (updateError) {
      console.error('❌ Error updating values:', updateError);
      return;
    }
    console.log('✅ Updated category_text values');
    
    // Make category_text NOT NULL
    console.log('4. Making category_text NOT NULL...');
    const { error: notNullError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.businesses ALTER COLUMN category_text SET NOT NULL;
        ALTER TABLE public.businesses ALTER COLUMN category_text SET DEFAULT 'other';
      `
    });
    
    if (notNullError) {
      console.error('❌ Error setting NOT NULL:', notNullError);
      return;
    }
    console.log('✅ Set category_text as NOT NULL');
    
    // Create index
    console.log('5. Creating index on category_text...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_businesses_category_text ON public.businesses(category_text);
      `
    });
    
    if (indexError) {
      console.error('❌ Error creating index:', indexError);
      return;
    }
    console.log('✅ Created index on category_text');
    
    // Test the fix
    console.log('6. Testing the fix...');
    const { data: testResults, error: testError } = await supabase
      .from('businesses')
      .select('id, name, category, category_text')
      .eq('status', 'active');
    
    if (testError) {
      console.error('❌ Error testing:', testError);
      return;
    }
    
    console.log('✅ Test results:');
    testResults?.forEach(business => {
      console.log(`  - ${business.name}: ${business.category} → ${business.category_text}`);
    });
    
    console.log('\n🎯 Category search fix applied successfully!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
applyCategoryFix();
