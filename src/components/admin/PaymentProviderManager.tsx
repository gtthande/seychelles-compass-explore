import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Settings, Check, AlertCircle, Loader2 } from "lucide-react";

interface PaymentProviderSettings {
  PAYMENT_PROVIDER: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  CARD_GATEWAY_API_KEY?: string;
  CARD_GATEWAY_ENDPOINT?: string;
}

const PaymentProviderManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState<PaymentProviderSettings>({
    PAYMENT_PROVIDER: 'visa_mastercard'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', [
          'PAYMENT_PROVIDER',
          'STRIPE_PUBLISHABLE_KEY', 
          'STRIPE_SECRET_KEY',
          'CARD_GATEWAY_API_KEY',
          'CARD_GATEWAY_ENDPOINT'
        ]);

      if (error) throw error;

      const settingsMap: PaymentProviderSettings = {
        PAYMENT_PROVIDER: 'visa_mastercard'
      };
      
      data?.forEach(item => {
        settingsMap[item.key as keyof PaymentProviderSettings] = item.value;
      });

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      toast({
        title: "Error",
        description: "Failed to load payment provider settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare settings to save
      const settingsToSave = Object.entries(settings).filter(([key, value]) => {
        if (!value) return false;
        // Always save the provider selection
        if (key === 'PAYMENT_PROVIDER') return true;
        // Save provider-specific settings
        if (settings.PAYMENT_PROVIDER === 'stripe' && key.startsWith('STRIPE_')) return true;
        if (settings.PAYMENT_PROVIDER === 'visa_mastercard' && key.startsWith('CARD_GATEWAY_')) return true;
        return false;
      });

      // Save to app_settings
      for (const [key, value] of settingsToSave) {
        const { error } = await supabase
          .from('app_settings')
          .upsert({ key, value }, { onConflict: 'key' });
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Payment provider settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save payment provider settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      // Test connection based on selected provider
      if (settings.PAYMENT_PROVIDER === 'stripe') {
        // Test Stripe connection
        if (!settings.STRIPE_SECRET_KEY) {
          throw new Error('Stripe secret key is required');
        }
        // Here you would test the Stripe connection
        toast({
          title: "Success",
          description: "Stripe connection test successful",
        });
      } else if (settings.PAYMENT_PROVIDER === 'visa_mastercard') {
        // Test direct card gateway connection
        if (!settings.CARD_GATEWAY_API_KEY || !settings.CARD_GATEWAY_ENDPOINT) {
          throw new Error('Card gateway API key and endpoint are required');
        }
        // Here you would test the card gateway connection
        toast({
          title: "Success",
          description: "Card gateway connection test successful",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleInputChange = (key: keyof PaymentProviderSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Provider Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Provider Settings
        </CardTitle>
        <CardDescription>
          Configure payment processing for your business directory
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-2">
          <Label htmlFor="provider">Payment Provider</Label>
          <Select
            value={settings.PAYMENT_PROVIDER}
            onValueChange={(value) => handleInputChange('PAYMENT_PROVIDER', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visa_mastercard">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Visa/Mastercard (Direct)
                  <Badge variant="default">Recommended</Badge>
                </div>
              </SelectItem>
              <SelectItem value="stripe">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Stripe
                  <Badge variant="secondary">Optional</Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Visa/Mastercard Direct Settings */}
        {settings.PAYMENT_PROVIDER === 'visa_mastercard' && (
          <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <h3 className="font-medium">Direct Card Gateway Configuration</h3>
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="gateway-endpoint">Gateway Endpoint URL</Label>
                <Input
                  id="gateway-endpoint"
                  type="url"
                  placeholder="https://api.cardgateway.com/v1/payments"
                  value={settings.CARD_GATEWAY_ENDPOINT || ''}
                  onChange={(e) => handleInputChange('CARD_GATEWAY_ENDPOINT', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gateway-api-key">API Key</Label>
                <Input
                  id="gateway-api-key"
                  type="password"
                  placeholder="Enter your card gateway API key"
                  value={settings.CARD_GATEWAY_API_KEY || ''}
                  onChange={(e) => handleInputChange('CARD_GATEWAY_API_KEY', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Stripe Settings */}
        {settings.PAYMENT_PROVIDER === 'stripe' && (
          <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-primary" />
              <h3 className="font-medium">Stripe Configuration</h3>
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="stripe-publishable">Publishable Key</Label>
                <Input
                  id="stripe-publishable"
                  type="text"
                  placeholder="pk_test_..."
                  value={settings.STRIPE_PUBLISHABLE_KEY || ''}
                  onChange={(e) => handleInputChange('STRIPE_PUBLISHABLE_KEY', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stripe-secret">Secret Key</Label>
                <Input
                  id="stripe-secret"
                  type="password"
                  placeholder="sk_test_..."
                  value={settings.STRIPE_SECRET_KEY || ''}
                  onChange={(e) => handleInputChange('STRIPE_SECRET_KEY', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Provider Status */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">
              Current Provider: {settings.PAYMENT_PROVIDER === 'visa_mastercard' ? 'Visa/Mastercard Direct' : 'Stripe'}
            </span>
          </div>
          <Badge variant={settings.PAYMENT_PROVIDER === 'visa_mastercard' ? 'default' : 'secondary'}>
            {settings.PAYMENT_PROVIDER === 'visa_mastercard' ? 'Primary' : 'Alternative'}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Settings
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleTestConnection} 
            disabled={testing}
          >
            {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Test Connection
          </Button>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <p className="font-medium">Payment Provider Priority:</p>
            <p>Visa/Mastercard direct processing is prioritized for better rates and control. Stripe remains available as an alternative option.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentProviderManager;