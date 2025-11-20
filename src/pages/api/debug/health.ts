import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';
import { supabase } from '@/integrations/supabase/client';

const execAsync = promisify(exec);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const health = {
    timestamp: new Date().toISOString(),
    server: {
      status: 'ok',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    },
    supabase: {
      status: 'unknown',
      error: null
    },
    git: {
      status: 'unknown',
      branch: null,
      lastCommit: null,
      error: null
    },
    environment: {
      nodeEnv: import.meta.env.MODE,
      hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasSupabaseAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      hasGoogleMapsKey: !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }
  };

  // Test Supabase connection
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      health.supabase.status = 'error';
      health.supabase.error = error.message;
    } else {
      health.supabase.status = 'ok';
    }
  } catch (error: any) {
    health.supabase.status = 'error';
    health.supabase.error = error.message;
  }

  // Test Git status
  try {
    const { stdout: branch } = await execAsync('git branch --show-current', { timeout: 5000 });
    const { stdout: lastCommit } = await execAsync('git log -1 --oneline', { timeout: 5000 });
    
    health.git.status = 'ok';
    health.git.branch = branch.trim();
    health.git.lastCommit = lastCommit.trim();
  } catch (error: any) {
    health.git.status = 'error';
    health.git.error = error.message;
  }

  // Determine overall health
  const isHealthy = health.supabase.status === 'ok' && health.git.status === 'ok';
  const statusCode = isHealthy ? 200 : 503;

  return res.status(statusCode).json(health);
}
