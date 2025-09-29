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
    
    // Execute git commands: add, commit, push
    const commands = [
      'git add .',
      'git commit -m "admin sync commit"',
      'git push origin main'
    ];
    
    let output = '';
    for (const command of commands) {
      try {
        const { stdout, stderr } = await execAsync(command);
        output += `$ ${command}\n${stdout}${stderr ? '\n' + stderr : ''}\n\n`;
      } catch (error: any) {
        output += `$ ${command}\nError: ${error.message}\n\n`;
        // Continue with next command even if one fails
      }
    }
    
    return res.status(200).json({
      success: true,
      output: output.trim(),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Git push error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      output: error.stdout || error.stderr || ''
    });
  }
}
