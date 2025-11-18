import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface BucketConfig {
  id: string;
  name: string;
  public: boolean;
  description?: string;
}

const requiredBuckets: BucketConfig[] = [
  {
    id: 'category-images',
    name: 'category-images',
    public: true,
    description: 'Category images for the frontend category grid'
  },
  {
    id: 'product-images',
    name: 'product-images',
    public: true,
    description: 'Product images'
  },
  {
    id: 'business-logos',
    name: 'business-logos',
    public: true,
    description: 'Business logo images'
  },
  {
    id: 'business-covers',
    name: 'business-covers',
    public: true,
    description: 'Business cover images'
  },
  {
    id: 'business-documents',
    name: 'business-documents',
    public: false,
    description: 'Business documents (private)'
  },
  {
    id: 'product-catalogues',
    name: 'product-catalogues',
    public: false,
    description: 'Product catalogue PDFs (private)'
  }
];

async function checkAndCreateBuckets() {
  console.log('🔍 Checking Supabase Storage buckets...\n');

  for (const bucket of requiredBuckets) {
    try {
      // Check if bucket exists
      const { data: existingBucket, error: checkError } = await supabase.storage
        .getBucket(bucket.id);

      if (checkError && checkError.message.includes('not found')) {
        console.log(`❌ Bucket "${bucket.id}" does not exist. Creating...`);
        
        // Create bucket
        const { data, error } = await supabase.storage.createBucket(bucket.id, {
          public: bucket.public,
          allowedMimeTypes: bucket.public 
            ? ['image/*'] 
            : ['image/*', 'application/pdf'],
          fileSizeLimit: 5242880 // 5MB
        });

        if (error) {
          console.error(`❌ Failed to create bucket "${bucket.id}":`, error.message);
          
          // Try alternative method via SQL
          console.log(`   Attempting alternative method via SQL...`);
          const { error: sqlError } = await supabase.rpc('create_storage_bucket', {
            bucket_id: bucket.id,
            bucket_name: bucket.name,
            is_public: bucket.public
          });

          if (sqlError) {
            console.error(`   SQL method also failed:`, sqlError.message);
          } else {
            console.log(`   ✅ Bucket "${bucket.id}" created via SQL`);
          }
        } else {
          console.log(`✅ Bucket "${bucket.id}" created successfully`);
          if (bucket.description) {
            console.log(`   Description: ${bucket.description}`);
          }
        }
      } else if (existingBucket) {
        console.log(`✅ Bucket "${bucket.id}" already exists`);
        console.log(`   Public: ${existingBucket.public}, Created: ${existingBucket.created_at}`);
      } else {
        console.log(`⚠️  Bucket "${bucket.id}" check returned:`, checkError?.message || 'Unknown error');
      }
    } catch (error: any) {
      console.error(`❌ Error checking bucket "${bucket.id}":`, error.message);
    }
  }

  console.log('\n📋 Summary:');
  console.log('If any buckets are missing, you may need to create them manually in the Supabase Dashboard:');
  console.log('1. Go to Storage in your Supabase Dashboard');
  console.log('2. Click "New bucket"');
  console.log('3. Enter the bucket name and set public/private as required');
  console.log('4. Save the bucket');
}

checkAndCreateBuckets().catch(console.error);







