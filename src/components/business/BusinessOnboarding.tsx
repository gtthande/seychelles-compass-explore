import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, Upload, Plus, X } from "lucide-react";

const businessSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  category: z.string().min(1, "Please select a category"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  phone: z.string().min(7, "Please enter a valid phone number"),
  whatsapp: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  island: z.string().optional(),
  facebook_url: z.string().url().optional().or(z.literal("")),
  instagram_url: z.string().url().optional().or(z.literal("")),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  youtube_url: z.string().url().optional().or(z.literal("")),
});

type BusinessFormData = z.infer<typeof businessSchema>;

interface BusinessOnboardingProps {
  onComplete: () => void;
}

const BusinessOnboarding = ({ onComplete }: BusinessOnboardingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const form = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      phone: "",
      whatsapp: "",
      email: "",
      website: "",
      address: "",
      island: "",
      facebook_url: "",
      instagram_url: "",
      linkedin_url: "",
      youtube_url: "",
    },
  });

  const categories = [
    { value: "restaurants", label: "Restaurants" },
    { value: "hotels", label: "Hotels" },
    { value: "tourism", label: "Tourism" },
    { value: "retail", label: "Retail" },
    { value: "services", label: "Services" },
    { value: "entertainment", label: "Entertainment" },
    { value: "health", label: "Health" },
    { value: "education", label: "Education" },
    { value: "finance", label: "Finance" },
    { value: "transport", label: "Transport" },
    { value: "real_estate", label: "Real Estate" },
    { value: "technology", label: "Technology" },
  ];

  const islands = [
    { value: "Mahe", label: "Mahé" },
    { value: "Praslin", label: "Praslin" },
    { value: "La Digue", label: "La Digue" },
    { value: "Other", label: "Other Islands" },
  ];

  const addService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService("");
    }
  };

  const removeService = (serviceToRemove: string) => {
    setServices(services.filter(service => service !== serviceToRemove));
  };

  const uploadFile = async (file: File, bucket: string, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;
    
    return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
  };

  const onSubmit = async (data: BusinessFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error("Profile not found");
      }

      let logoUrl = null;
      let coverUrl = null;

      // Upload files if provided
      if (logoFile) {
        logoUrl = await uploadFile(logoFile, 'business-logos', user.id);
      }

      if (coverFile) {
        coverUrl = await uploadFile(coverFile, 'business-covers', user.id);
      }

      // Create business record
      const businessInsert = {
        name: data.name,
        category: data.category as any,
        description: data.description,
        phone: data.phone,
        email: data.email,
        website: data.website || null,
        address: data.address || null,
        island: data.island || null,
        facebook_url: data.facebook_url || null,
        instagram_url: data.instagram_url || null,
        linkedin_url: data.linkedin_url || null,
        youtube_url: data.youtube_url || null,
        owner_id: profile.id,
        services,
        logo_url: logoUrl,
        cover_image_url: coverUrl,
        status: 'pending' as any,
      };

      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert(businessInsert)
        .select()
        .single();

      if (businessError) throw businessError;

      // Update profile to mark as business owner
      await supabase
        .from('profiles')
        .update({ is_business_owner: true })
        .eq('id', profile.id);

      // Send email notification
      await supabase.functions.invoke('send-business-email', {
        body: {
          businessName: data.name,
          email: data.email,
          phone: data.phone,
          whatsapp: data.whatsapp,
          category: data.category,
          description: data.description,
          services,
          address: data.address,
          island: data.island,
          website: data.website,
          facebook_url: data.facebook_url,
          instagram_url: data.instagram_url,
          linkedin_url: data.linkedin_url,
          youtube_url: data.youtube_url,
        },
      });

      toast({
        title: "Business Registered!",
        description: "Your business registration has been submitted and iCompass has been notified.",
      });

      onComplete();
    } catch (error: any) {
      console.error('Error registering business:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register business. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Register Your Business</CardTitle>
          <CardDescription>
            Join the iCompass platform and showcase your business to the Seychelles community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your business name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your business, what you offer, and what makes you unique..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Services */}
              <div className="space-y-3">
                <FormLabel>Services Offered</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a service..."
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                  />
                  <Button type="button" onClick={addService} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {services.map((service, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {service}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-auto p-0"
                        onClick={() => removeService(service)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+248 xxx xxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+248 xxx xxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="business@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourbusiness.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="island"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Island (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select island" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {islands.map((island) => (
                            <SelectItem key={island.value} value={island.value}>
                              {island.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Social Media */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="facebook_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://facebook.com/yourbusiness" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instagram_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://instagram.com/yourbusiness" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkedin_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://linkedin.com/company/yourbusiness" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="youtube_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://youtube.com/yourbusiness" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel>Business Logo (Optional)</FormLabel>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="w-full"
                    />
                    {logoFile && (
                      <p className="text-sm text-green-600 mt-2">
                        Selected: {logoFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <FormLabel>Cover Image (Optional)</FormLabel>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                      className="w-full"
                    />
                    {coverFile && (
                      <p className="text-sm text-green-600 mt-2">
                        Selected: {coverFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Registering..." : "Register Business"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessOnboarding;