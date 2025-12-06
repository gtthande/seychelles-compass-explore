import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, Key, MapPin, Brain, Mail } from 'lucide-react';

interface SettingsData {
  GOOGLE_MAPS_API_KEY: string;
  OPENAI_API_KEY: string;
  RESEND_API_KEY: string;
}

const SettingsManager = () => {
  const [settings, setSettings] = useState<SettingsData>({
    GOOGLE_MAPS_API_KEY: '',
    OPENAI_API_KEY: '',
    RESEND_API_KEY: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch all settings for admin
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['GOOGLE_MAPS_API_KEY', 'OPENAI_API_KEY', 'RESEND_API_KEY']);

      if (error) {
        throw error;
      }

      const settingsData: SettingsData = {
        GOOGLE_MAPS_API_KEY: '',
        OPENAI_API_KEY: '',
        RESEND_API_KEY: '',
      };

      data?.forEach(({ key, value }) => {
        if (key in settingsData) {
          settingsData[key as keyof SettingsData] = value;
        }
      });

      setSettings(settingsData);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Call the update-settings edge function
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch('http://localhost:5055/api/update-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ settings }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update settings');
      }

      toast({
        title: 'Success',
        description: 'Settings updated successfully',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: keyof SettingsData, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Settings
          </CardTitle>
          <CardDescription>
            Manage external API keys and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          API Settings
        </CardTitle>
        <CardDescription>
          Manage external API keys and configuration. These settings are stored securely in the database.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google-maps-key" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Google Maps API Key
            </Label>
            <Input
              id="google-maps-key"
              type="password"
              value={settings.GOOGLE_MAPS_API_KEY}
              onChange={(e) => handleInputChange('GOOGLE_MAPS_API_KEY', e.target.value)}
              placeholder="Enter Google Maps API key"
            />
            <p className="text-sm text-muted-foreground">
              Used for map functionality and location services. This key is visible to all users.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai-key" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              OpenAI API Key
            </Label>
            <Input
              id="openai-key"
              type="password"
              value={settings.OPENAI_API_KEY}
              onChange={(e) => handleInputChange('OPENAI_API_KEY', e.target.value)}
              placeholder="Enter OpenAI API key"
            />
            <p className="text-sm text-muted-foreground">
              Used for AI-powered features. This key is kept secure and only accessible server-side.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resend-key" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Resend API Key
            </Label>
            <Input
              id="resend-key"
              type="password"
              value={settings.RESEND_API_KEY}
              onChange={(e) => handleInputChange('RESEND_API_KEY', e.target.value)}
              placeholder="Enter Resend API key"
            />
            <p className="text-sm text-muted-foreground">
              Used for sending emails. This key is kept secure and only accessible server-side.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsManager;
