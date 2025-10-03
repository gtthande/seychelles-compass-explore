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

    // Execute git commands: add, commit, push
    const commands = [
      'git add .',
      'git commit -m "admin sync commit"',
      'git push origin main'
    ];
    
    let output = '';
    let success = true;
    
    for (const command of commands) {
      try {
        const { stdout, stderr } = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
          exec(command, (error, stdout, stderr) => {
            if (error) {
              reject(error);
            } else {
              resolve({ stdout, stderr });
            }
          });
        });
        output += `$ ${command}\n${stdout}${stderr ? '\n' + stderr : ''}\n\n`;
      } catch (error: any) {
        output += `$ ${command}\nError: ${error.message}\n\n`;
        success = false;
        // Continue with next command even if one fails
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
    console.error('Git push error:', error);
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
