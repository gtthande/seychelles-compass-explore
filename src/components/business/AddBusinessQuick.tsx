/**
 * Quick-Add Business Component
 * Allows users to quickly add a business with just a name
 * Implements Hybrid Option C: pending (users) / approved (admins)
 */

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { createBusinessQuick } from "@/lib/business-create-api";
import { supabase } from "@/integrations/supabase/client";

interface AddBusinessQuickProps {
  onBusinessAdded?: (businessId: string) => void;
  className?: string;
}

export default function AddBusinessQuick({ onBusinessAdded, className }: AddBusinessQuickProps) {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) {
      e.preventDefault();
    }

    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Business name is required",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add a business",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('User profile not found. Please complete your profile first.');
      }

      // Create business using centralized API
      const result = await createBusinessQuick(name.trim(), profile.id, isAdmin);

      if (!result.success) {
        throw new Error(result.error || "Failed to add business");
      }

      // Success message based on verification status
      const successMessage = isAdmin
        ? "Business created successfully and is now active."
        : "Business added successfully! It is now pending approval by an administrator.";

      toast({
        title: "Success",
        description: successMessage,
      });

      // Clear form
      setName("");

      // Callback if provided
      if (onBusinessAdded && result.business) {
        onBusinessAdded(result.business.id);
      }
    } catch (error: any) {
      console.error('Error creating business:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add business",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Quick Add Business
        </CardTitle>
        <CardDescription>
          Add a new business quickly. {!isAdmin && "It will be reviewed by an administrator."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-business-name">
              Business Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="quick-business-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter business name"
              disabled={loading}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Business
              </>
            )}
          </Button>

          {!isAdmin && (
            <p className="text-xs text-muted-foreground text-center">
              Your business will be reviewed before being published.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

