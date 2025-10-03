import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { exec } from "https://deno.land/std@0.168.0/node/child_process.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if user is admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try Supabase migration first, fallback to Prisma if needed
    let output = '';
    let success = false;
    
    try {
      // Try Supabase migration
      const { stdout, stderr } = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
        exec('npx supabase db push', (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve({ stdout, stderr });
          }
        });
      });
      output = `$ npx supabase db push\n${stdout}${stderr ? '\n' + stderr : ''}`;
      success = true;
    } catch (supabaseError: any) {
      output += `Supabase migration failed: ${supabaseError.message}\n\n`;
      
      try {
        // Fallback to Prisma migration
        const { stdout, stderr } = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
          exec('npx prisma migrate deploy', (error, stdout, stderr) => {
            if (error) {
              reject(error);
            } else {
              resolve({ stdout, stderr });
            }
          });
        });
        output += `$ npx prisma migrate deploy\n${stdout}${stderr ? '\n' + stderr : ''}`;
        success = true;
      } catch (prismaError: any) {
        output += `Prisma migration also failed: ${prismaError.message}`;
        success = false;
      }
    }
    
    return new Response(JSON.stringify({
      success,
      output: output.trim(),
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Database migration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      output: error.stdout || error.stderr || ''
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
