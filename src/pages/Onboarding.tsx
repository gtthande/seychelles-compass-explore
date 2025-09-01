import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2, X, Building2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type BusinessCategory = Database["public"]["Enums"]["business_category"];
type BusinessStatus = Database["public"]["Enums"]["business_status"];

const businessSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  category: z.enum(["restaurants", "hotels", "tourism", "retail", "services", "entertainment", "health", "education", "finance", "transport", "real_estate", "technology"] as const),
  description: z.string().min(10, "Description must be at least 10 characters"),
  phone: z.string().min(7, "Please enter a valid phone number"),
  whatsapp: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  facebook_url: z.string().url("Please enter a valid Facebook URL").optional().or(z.literal("")),
  linkedin_url: z.string().url("Please enter a valid LinkedIn URL").optional().or(z.literal("")),
  youtube_url: z.string().url("Please enter a valid YouTube URL").optional().or(z.literal("")),
  address: z.string().min(5, "Please enter a complete address"),
  island: z.string().min(1, "Please select an island"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  opening_hours: z.record(z.string()).optional(),
});

type BusinessFormData = z.infer<typeof businessSchema>;

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);

  const categories = [
    { value: "restaurants", label: "Restaurants" },
    { value: "hotels", label: "Hotels & Accommodation" },
    { value: "tourism", label: "Tourism & Tours" },
    { value: "retail", label: "Retail & Shopping" },
    { value: "services", label: "Professional Services" },
    { value: "entertainment", label: "Entertainment" },
    { value: "health", label: "Health & Wellness" },
    { value: "education", label: "Education" },
    { value: "finance", label: "Finance & Insurance" },
    { value: "transport", label: "Transportation" },
    { value: "real_estate", label: "Real Estate" },
    { value: "technology", label: "Technology" },
  ];

  const islands = [
    "Mahé", "Praslin", "La Digue", "Silhouette", "Denis", "Bird", 
    "Frégate", "North", "Félicité", "Cousine", "Other"
  ];

  const form = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: "",
      category: "restaurants" as BusinessCategory,
      description: "",
      phone: "",
      whatsapp: "",
      email: user?.email || "",
      website: "",
      facebook_url: "",
      linkedin_url: "",
      youtube_url: "",
      address: "",
      island: "",
      latitude: 0,
      longitude: 0,
    },
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Please enter coordinates manually",
        variant: "destructive",
      });
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue("latitude", position.coords.latitude);
        form.setValue("longitude", position.coords.longitude);
        setLocationLoading(false);
        toast({
          title: "Location captured",
          description: "GPS coordinates have been set successfully",
        });
      },
      (error) => {
        setLocationLoading(false);
        toast({
          title: "Location access denied",
          description: "Please enter coordinates manually",
          variant: "destructive",
        });
      }
    );
  };

  const addService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService("");
    }
  };

  const removeService = (service: string) => {
    setServices(services.filter(s => s !== service));
  };

  const onSubmit = async (data: BusinessFormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to continue",
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
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Profile not found. Please try logging in again.");
      }

      // Create business record
      const businessData = {
        owner_id: profile.id,
        name: data.name,
        category: data.category as BusinessCategory,
        description: data.description,
        phone: data.phone,
        whatsapp: data.whatsapp || null,
        email: data.email,
        website: data.website || null,
        facebook_url: data.facebook_url || null,
        linkedin_url: data.linkedin_url || null,
        youtube_url: data.youtube_url || null,
        address: data.address,
        island: data.island,
        latitude: data.latitude,
        longitude: data.longitude,
        services: services.length > 0 ? services : null,
        status: 'pending' as BusinessStatus,
        opening_hours: data.opening_hours || null,
      };

      const { error: businessError } = await supabase
        .from('businesses')
        .insert(businessData);

      if (businessError) {
        throw businessError;
      }

      // Update profile to mark as business owner
      await supabase
        .from('profiles')
        .update({ is_business_owner: true })
        .eq('id', profile.id);

      // Send notification email to iCompass
      try {
        await supabase.functions.invoke('send-business-email', {
          body: {
            businessName: data.name,
            email: data.email,
            phone: data.phone,
            whatsapp: data.whatsapp,
            category: data.category,
            description: data.description,
            services: services,
            address: data.address,
            island: data.island,
            website: data.website,
            facebook_url: data.facebook_url,
            linkedin_url: data.linkedin_url,
            youtube_url: data.youtube_url,
            latitude: data.latitude,
            longitude: data.longitude,
          },
        });
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
        // Don't fail the entire process if email fails
      }

      toast({
        title: "Business registered successfully!",
        description: "Your business registration is pending approval. You'll receive an email confirmation shortly.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container max-w-2xl mx-auto">
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Building2 className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Register Your Business
            </CardTitle>
            <p className="text-muted-foreground">
              Join the iCompass Seychelles business directory
            </p>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your business name" {...field} />
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
                              <SelectValue placeholder="Select a category" />
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

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your business..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Services */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Services Offered</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a service"
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                    />
                    <Button type="button" onClick={addService}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {services.map((service) => (
                      <Badge key={service} variant="secondary" className="flex items-center gap-1">
                        {service}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeService(service)} />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+248 123 4567" {...field} />
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
                            <Input placeholder="+248 123 4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="business@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Location</h3>
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter complete address" {...field} />
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
                        <FormLabel>Island</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an island" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {islands.map((island) => (
                              <SelectItem key={island} value={island}>
                                {island}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <Label>GPS Coordinates</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                      className="w-full"
                    >
                      {locationLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <MapPin className="w-4 h-4 mr-2" />
                      )}
                      {locationLoading ? "Getting location..." : "Get Current Location"}
                    </Button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="any"
                                placeholder="-4.619143"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitude</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="any"
                                placeholder="55.451315"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Online Presence */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Online Presence (Optional)</h3>
                  
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourbusiness.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="facebook_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook</FormLabel>
                          <FormControl>
                            <Input placeholder="https://facebook.com/yourbusiness" {...field} />
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
                          <FormLabel>LinkedIn</FormLabel>
                          <FormControl>
                            <Input placeholder="https://linkedin.com/company/yourbusiness" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="youtube_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>YouTube</FormLabel>
                        <FormControl>
                          <Input placeholder="https://youtube.com/@yourbusiness" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Registering Business...
                    </>
                  ) : (
                    "Register Business"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;