import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${import.meta.env.VITE_SITE_URL || 'http://localhost:5173'}/auth/callback`,
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Registration failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Registration successful!",
          description: "Please check your email to confirm your account.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Debug logging
    console.debug("[Auth] SignIn attempt", email);
    console.debug("[Auth] Supabase URL:", import.meta.env.VITE_SUPABASE_URL ? "Loaded" : "Missing");
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[Auth] Error", error);
        console.error("[Auth] response.error:", error.message);
        console.error("[Auth] Sign in failed:", {
          message: error.message,
          status: error.status,
          name: error.name
        });
        // Bubble up error message from Supabase
        toast({
          title: "Sign in failed",
          description: error.message || "Invalid login credentials",
          variant: "destructive",
        });
      } else {
        console.log("[Auth] Sign in successful:", {
          userId: data.user?.id,
          email: data.user?.email,
          sessionExists: !!data.session
        });
        
        // Verify session was created
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log("[Auth] Session verified:", {
            userId: session.user.id,
            expiresAt: session.expires_at
          });
        } else {
          console.warn("[Auth] Warning: Session not found after sign in");
        }
        
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        // Redirect to /admin for admin users, / for regular users
        navigate("/admin");
      }
    } catch (error: any) {
      console.error("[Auth] Unexpected error:", error);
      toast({
        title: "Error",
        description: error?.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePasswordReset = async () => {
    // Clear previous errors
    setEmailError("");
    
    // Validate email
    if (!email.trim()) {
      setEmailError("Please enter your email address");
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
      
      // Try using the enhanced edge function first
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-reset`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email, siteUrl }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Password reset sent via:', result.method);
        } else {
          throw new Error('Edge function failed');
        }
      } catch (edgeFunctionError) {
        console.log('Edge function failed, using direct Supabase:', edgeFunctionError);
        // Fallback to direct Supabase call
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${siteUrl}/auth/reset-password`,
        });
        
        if (error) throw error;
      }

      // If we reach here, the reset was successful
      setResetEmailSent(true);
      
      // Store successful request for dev preview
      if (import.meta.env.DEV) {
        const resetLink = `${siteUrl}/auth/callback?token=dev-token&type=recovery`;
        const request = {
          id: Date.now().toString(),
          email,
          timestamp: new Date().toISOString(),
          resetLink,
          status: 'sent' as const
        };
        const existing = JSON.parse(localStorage.getItem('password-reset-requests') || '[]');
        localStorage.setItem('password-reset-requests', JSON.stringify([request, ...existing.slice(0, 9)]));
      }
      
      toast({
        title: "Reset email sent!",
        description: "Check your email for password reset instructions. If you don't see it, check your spam folder.",
      });
    } catch (error) {
      console.error('Password reset error:', error);
      
      // Store failed request for dev preview
      if (import.meta.env.DEV) {
        const siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
        const resetLink = `${siteUrl}/auth/callback?token=dev-token&type=recovery`;
        const request = {
          id: Date.now().toString(),
          email,
          timestamp: new Date().toISOString(),
          resetLink,
          status: 'failed' as const
        };
        const existing = JSON.parse(localStorage.getItem('password-reset-requests') || '[]');
        localStorage.setItem('password-reset-requests', JSON.stringify([request, ...existing.slice(0, 9)]));
      }
      
      toast({
        title: "Reset failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              iCompass Seychelles
            </CardTitle>
            <CardDescription>
              Join the ultimate business directory for Seychelles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError(""); // Clear error when user types
                      }}
                      className={emailError ? "border-red-500" : ""}
                      required
                    />
                    {emailError && (
                      <p className="text-sm text-red-500">{emailError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  {resetEmailSent ? (
                    <div className="text-center p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-700">
                        ✅ Reset email sent! Check your inbox.
                      </p>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="text-xs mt-1" 
                        onClick={() => setResetEmailSent(false)}
                      >
                        Send another email
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="w-full text-sm" 
                      onClick={handlePasswordReset}
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Forgot Password?"}
                    </Button>
                  )}
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone (Optional)</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+248 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;