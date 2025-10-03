import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Starting database migration...');
    
    // Try Supabase migrations first, then fallback to Prisma
    let command = '';
    let output = '';
    let error = '';

    try {
      // Try Supabase migration
      console.log('🔄 Attempting Supabase migration...');
      const { stdout, stderr } = await execAsync('npx supabase db push', {
        cwd: process.cwd(),
        timeout: 60000, // 60 second timeout for DB operations
      });
      
      command = 'npx supabase db push';
      output = stdout;
      error = stderr || '';
      
    } catch (supabaseError: any) {
      console.log('⚠️ Supabase migration failed, trying Prisma...');
      
      try {
        // Fallback to Prisma migration
        console.log('🔄 Attempting Prisma migration...');
        const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
          cwd: process.cwd(),
          timeout: 60000,
        });
        
        command = 'npx prisma migrate deploy';
        output = stdout;
        error = stderr || '';
        
      } catch (prismaError: any) {
        console.log('⚠️ Prisma migration failed, trying basic migration...');
        
        // Final fallback - just run any migration command
        const { stdout, stderr } = await execAsync('npx prisma db push', {
          cwd: process.cwd(),
          timeout: 60000,
        });
        
        command = 'npx prisma db push';
        output = stdout;
        error = stderr || '';
      }
    }

    console.log('✅ Database migration completed');
    console.log(`Command: ${command}`);
    console.log('Output:', output);
    if (error) console.log('Error:', error);

    return res.status(200).json({
      success: true,
      output: output,
      error: error || null,
      command: command,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Database migration failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      output: error.stdout || '',
      timestamp: new Date().toISOString()
    });
  }
}
