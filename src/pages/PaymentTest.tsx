import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface MockPayment {
  id: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  provider: 'visa_mastercard' | 'stripe';
  business_name: string;
  customer_email: string;
  created_at: string;
}

const PaymentTest = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<MockPayment[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    provider: 'visa_mastercard',
    business_name: '',
    customer_email: ''
  });

  const demoBusinesses = [
    'Café des Arts',
    'Paradise Diving Center',
    'Le Nautique Hotel',
    'Island Transport Services',
    'Coco de Mer Souvenirs',
    'Praslin Island Tours',
    'La Digue Bike Rentals',
    'Seychelles Wellness Spa'
  ];

  const processMockPayment = async () => {
    if (!formData.amount || !formData.business_name || !formData.customer_email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock payment result (80% success rate)
      const isSuccess = Math.random() > 0.2;
      const status = isSuccess ? 'success' : 'failed';
      
      const mockPayment: MockPayment = {
        id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        status,
        provider: formData.provider as 'visa_mastercard' | 'stripe',
        business_name: formData.business_name,
        customer_email: formData.customer_email,
        created_at: new Date().toISOString()
      };

      // Store in local state
      setPayments(prev => [mockPayment, ...prev]);

      // Try to store in database (will work if RLS allows)
      try {
        const { error } = await supabase
          .from('payments')
          .insert({
            amount: mockPayment.amount,
            currency: mockPayment.currency,
            status: mockPayment.status,
            payment_provider: mockPayment.provider,
            provider_payment_id: mockPayment.id,
            provider_session_id: `cs_${mockPayment.id}`,
            user_id: '00000000-0000-0000-0000-000000000001', // Demo user ID
            metadata: {
              business_name: mockPayment.business_name,
              customer_email: mockPayment.customer_email,
              test_payment: true
            }
          });

        if (error) {
          console.warn('Could not store payment in database:', error.message);
        }
      } catch (dbError) {
        console.warn('Database storage failed, but payment processed locally');
      }

      toast({
        title: status === 'success' ? "Payment Successful!" : "Payment Failed",
        description: status === 'success' 
          ? `$${mockPayment.amount} ${mockPayment.currency} payment to ${mockPayment.business_name} completed.`
          : `Payment to ${mockPayment.business_name} failed. Please try again.`,
        variant: status === 'success' ? "default" : "destructive"
      });

      // Reset form
      setFormData({
        amount: '',
        currency: 'USD',
        provider: 'visa_mastercard',
        business_name: '',
        customer_email: ''
      });

    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An error occurred while processing the payment.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Payment Testing</h1>
          <p className="text-muted-foreground">
            Test mock payment flows for Visa/Mastercard and Stripe integration.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Mock Payment Form
              </CardTitle>
              <CardDescription>
                Simulate payment processing with demo businesses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="business">Business</Label>
                <Select 
                  value={formData.business_name} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, business_name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a business" />
                  </SelectTrigger>
                  <SelectContent>
                    {demoBusinesses.map((business) => (
                      <SelectItem key={business} value={business}>
                        {business}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="email">Customer Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="customer@example.com"
                  value={formData.customer_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="SCR">SCR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="provider">Payment Provider</Label>
                <Select 
                  value={formData.provider} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, provider: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa_mastercard">Visa/Mastercard (Default)</SelectItem>
                    <SelectItem value="stripe">Stripe (Optional)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={processMockPayment} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  'Process Mock Payment'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Recent mock payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No payments processed yet. Try making a test payment!
                </p>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          <span className="font-medium">
                            ${payment.amount} {payment.currency}
                          </span>
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Business:</strong> {payment.business_name}</p>
                        <p><strong>Customer:</strong> {payment.customer_email}</p>
                        <p><strong>Provider:</strong> {payment.provider}</p>
                        <p><strong>Time:</strong> {new Date(payment.created_at).toLocaleString()}</p>
                        <p><strong>ID:</strong> {payment.id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment System Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Payment System Configuration</CardTitle>
            <CardDescription>
              Current payment provider setup and testing information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold text-green-600">Visa/Mastercard</h3>
                <p className="text-sm text-muted-foreground">Primary Payment Method</p>
                <Badge className="mt-2">Default</Badge>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold text-blue-600">Stripe</h3>
                <p className="text-sm text-muted-foreground">Optional Integration</p>
                <Badge variant="secondary" className="mt-2">Optional</Badge>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold text-purple-600">PayPal</h3>
                <p className="text-sm text-muted-foreground">Future Implementation</p>
                <Badge variant="outline" className="mt-2">Planned</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentTest;
