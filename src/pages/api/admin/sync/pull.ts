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
    console.log('🔄 Starting git pull operation...');
    
    // Execute git pull
    const { stdout, stderr } = await execAsync('git pull origin main', {
      cwd: process.cwd(),
      timeout: 30000, // 30 second timeout
    });

    console.log('✅ Git pull completed successfully');
    console.log('STDOUT:', stdout);
    if (stderr) console.log('STDERR:', stderr);

    return res.status(200).json({
      success: true,
      output: stdout,
      error: stderr || null,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Git pull failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      output: error.stdout || '',
      timestamp: new Date().toISOString()
    });
  }
}
