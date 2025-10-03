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
    console.log('🔄 Starting git push operation...');
    
    // Execute git add, commit, and push
    const commands = [
      'git add .',
      'git commit -m "admin sync commit"',
      'git push origin main'
    ];

    let allOutput = '';
    let allErrors = '';

    for (const command of commands) {
      try {
        console.log(`🔄 Executing: ${command}`);
        const { stdout, stderr } = await execAsync(command, {
          cwd: process.cwd(),
          timeout: 30000, // 30 second timeout
        });
        
        allOutput += `\n${command}:\n${stdout}`;
        if (stderr) allErrors += `\n${command} (stderr):\n${stderr}`;
        
        console.log(`✅ ${command} completed`);
      } catch (cmdError: any) {
        console.error(`❌ ${command} failed:`, cmdError);
        allErrors += `\n${command} failed: ${cmdError.message}`;
        
        // If commit fails due to no changes, that's okay
        if (command.includes('commit') && cmdError.message.includes('nothing to commit')) {
          console.log('ℹ️ No changes to commit, continuing...');
          continue;
        }
        
        // For other errors, we might want to continue or stop
        if (command.includes('push')) {
          throw cmdError; // Push failure is critical
        }
      }
    }

    console.log('✅ Git push operation completed');
    console.log('Combined output:', allOutput);
    if (allErrors) console.log('Combined errors:', allErrors);

    return res.status(200).json({
      success: true,
      output: allOutput,
      error: allErrors || null,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Git push operation failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      output: error.stdout || '',
      timestamp: new Date().toISOString()
    });
  }
}
