-- Create app_settings table for managing external API keys
CREATE TABLE IF NOT EXISTS app_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- Insert default seed values
INSERT INTO app_settings (key, value) VALUES
    ('GOOGLE_MAPS_API_KEY', 'test-maps-key'),
    ('OPENAI_API_KEY', 'test-openai-key'),
    ('RESEND_API_KEY', 'test-resend-key')
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Add RLS policies
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all settings
CREATE POLICY "Admins can read all settings" ON app_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Allow admins to insert new settings
CREATE POLICY "Admins can insert settings" ON app_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Allow admins to update settings
CREATE POLICY "Admins can update settings" ON app_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Allow admins to delete settings
CREATE POLICY "Admins can delete settings" ON app_settings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Allow public read access to Google Maps API key only
CREATE POLICY "Public can read Google Maps API key" ON app_settings
    FOR SELECT USING (key = 'GOOGLE_MAPS_API_KEY');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_app_settings_updated_at();
