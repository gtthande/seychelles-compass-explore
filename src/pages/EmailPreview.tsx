import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface EmailRequest {
  id: string;
  email: string;
  timestamp: string;
  resetLink: string;
  status: 'sent' | 'failed';
}

const EmailPreview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [emailRequests, setEmailRequests] = useState<EmailRequest[]>([]);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    // Load email requests from localStorage (for dev testing)
    const stored = localStorage.getItem('password-reset-requests');
    if (stored) {
      try {
        setEmailRequests(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading email requests:', error);
      }
    }

    // Listen for new email requests
    const handleStorageChange = () => {
      const stored = localStorage.getItem('password-reset-requests');
      if (stored) {
        try {
          setEmailRequests(JSON.parse(stored));
        } catch (error) {
          console.error('Error loading email requests:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(linkId);
      toast({
        title: "Copied!",
        description: "Reset link copied to clipboard",
      });
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const clearRequests = () => {
    localStorage.removeItem('password-reset-requests');
    setEmailRequests([]);
    toast({
      title: "Cleared",
      description: "Email request history cleared",
    });
  };

  // Hide this page in production
  if (import.meta.env.PROD) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
            <p className="text-muted-foreground mb-4">
              This page is only available in development mode.
            </p>
            <Button onClick={() => navigate('/')}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Email Preview (Dev Only)</h1>
            <Badge variant="secondary">Development</Badge>
          </div>
          <p className="text-muted-foreground">
            Preview password reset emails and copy reset links for testing
          </p>
        </div>

        {emailRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Email Requests Yet</h3>
              <p className="text-muted-foreground mb-4">
                Password reset emails will appear here when requested from the auth page.
              </p>
              <Button onClick={() => navigate('/auth')}>
                Go to Auth Page
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Recent Password Reset Requests ({emailRequests.length})
              </h2>
              <Button variant="outline" onClick={clearRequests}>
                Clear History
              </Button>
            </div>

            {emailRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.email}</CardTitle>
                      <CardDescription>
                        Requested at {new Date(request.timestamp).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge variant={request.status === 'sent' ? 'default' : 'destructive'}>
                      {request.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Reset Link:</h4>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-muted rounded text-sm break-all">
                          {request.resetLink}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(request.resetLink, request.id)}
                        >
                          {copiedLink === request.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Email Preview:</h4>
                      <div className="text-sm space-y-2">
                        <p><strong>To:</strong> {request.email}</p>
                        <p><strong>Subject:</strong> Reset your password - iCompass Seychelles</p>
                        <div className="border-l-2 border-primary pl-3">
                          <p className="font-medium">Email Content:</p>
                          <p className="text-muted-foreground">
                            Hi there,<br/><br/>
                            You requested a password reset for your iCompass Seychelles account.<br/><br/>
                            Click the link below to reset your password:<br/>
                            <a href={request.resetLink} className="text-primary underline">
                              Reset Password
                            </a><br/><br/>
                            If you didn't request this, you can safely ignore this email.<br/><br/>
                            Best regards,<br/>
                            The iCompass Seychelles Team
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => window.open(request.resetLink, '_blank')}
                      >
                        Test Reset Link
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(request.resetLink, request.id)}
                      >
                        Copy Link
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Development Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• This page is only visible in development mode</p>
            <p>• Password reset requests are stored in localStorage for testing</p>
            <p>• In production, emails are sent via Supabase or Resend</p>
            <p>• Use the reset links to test the password reset flow</p>
            <p>• Check the browser console for any email sending errors</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailPreview;
