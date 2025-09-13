import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function getApiKey(key: string): Promise<string | null> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      console.error(`Error fetching API key ${key}:`, error);
      return null;
    }

    return data?.value || null;
  } catch (error) {
    console.error(`Error in getApiKey for ${key}:`, error);
    return null;
  }
}
