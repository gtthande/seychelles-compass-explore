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
    // Check admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // For now, we'll implement a simple check
    // In production, you'd verify the JWT token here
    const token = authHeader.substring(7);
    
    // Try Supabase migration first, fallback to Prisma if needed
    let output = '';
    let success = false;
    
    try {
      // Try Supabase migration
      const { stdout, stderr } = await execAsync('npx supabase db push');
      output = `$ npx supabase db push\n${stdout}${stderr ? '\n' + stderr : ''}`;
      success = true;
    } catch (supabaseError: any) {
      output += `Supabase migration failed: ${supabaseError.message}\n\n`;
      
      try {
        // Fallback to Prisma migration
        const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
        output += `$ npx prisma migrate deploy\n${stdout}${stderr ? '\n' + stderr : ''}`;
        success = true;
      } catch (prismaError: any) {
        output += `Prisma migration also failed: ${prismaError.message}`;
        success = false;
      }
    }
    
    return res.status(success ? 200 : 500).json({
      success,
      output: output.trim(),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Database migration error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      output: error.stdout || error.stderr || ''
    });
  }
}
