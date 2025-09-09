import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, CalendarIcon, Download, Building2, Phone, Mail, Globe, Linkedin, Youtube, Facebook, Instagram, MessageCircle, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const appointmentSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  contact_person: z.string().min(2, "Contact person name must be at least 2 characters"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  linkedin_url: z.string().url("Please enter a valid LinkedIn URL").optional().or(z.literal("")),
  youtube_url: z.string().url("Please enter a valid YouTube URL").optional().or(z.literal("")),
  facebook_url: z.string().url("Please enter a valid Facebook URL").optional().or(z.literal("")),
  instagram_url: z.string().url("Please enter a valid Instagram URL").optional().or(z.literal("")),
  preferred_date: z.date({
    required_error: "Please select a preferred date",
  }),
  preferred_time: z.string().min(1, "Please select a preferred time"),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM"
];

const BusinessRegistration = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      business_name: "",
      contact_person: "",
      phone: "",
      whatsapp: "",
      email: "",
      website: "",
      linkedin_url: "",
      youtube_url: "",
      facebook_url: "",
      instagram_url: "",
      notes: "",
    },
  });

  const handleDownloadForm = () => {
    // For now, we'll create a simple PDF download link
    // In a real implementation, you'd have this hosted on Supabase Storage
    toast({
      title: "Download Starting",
      description: "Business registration form will be downloaded shortly.",
    });
    
    // Simulate download - replace with actual file URL from Supabase Storage
    const link = document.createElement('a');
    link.href = '/business-registration-form.pdf'; // This would be the actual file URL
    link.download = 'iCompass-Business-Registration-Form.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onSubmit = async (data: AppointmentFormData) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          business_name: data.business_name,
          contact_person: data.contact_person,
          phone: data.phone || null,
          whatsapp: data.whatsapp || null,
          email: data.email || null,
          website: data.website || null,
          linkedin_url: data.linkedin_url || null,
          youtube_url: data.youtube_url || null,
          facebook_url: data.facebook_url || null,
          instagram_url: data.instagram_url || null,
          preferred_date: data.preferred_date.toISOString(),
          preferred_time: data.preferred_time,
          notes: data.notes || null,
        });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Appointment Request Submitted",
        description: "We'll contact you shortly to confirm your appointment.",
      });

      // Trigger email notification (optional)
      try {
        await supabase.functions.invoke('send-business-email', {
          body: {
            type: 'appointment_request',
            data: {
              business_name: data.business_name,
              contact_person: data.contact_person,
              email: data.email,
              preferred_date: format(data.preferred_date, 'PPP'),
              preferred_time: data.preferred_time,
            }
          }
        });
      } catch (emailError) {
        console.log('Email notification failed:', emailError);
        // Don't show error to user as the main function succeeded
      }

    } catch (error: any) {
      console.error('Error submitting appointment:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit appointment request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Thank You!
            </h2>
            <p className="text-muted-foreground mb-6">
              Your appointment request has been submitted successfully. We'll contact you shortly to confirm your appointment and guide you through the business verification process.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Business: <span className="font-medium">{form.getValues('business_name')}</span></p>
              <p>Contact: <span className="font-medium">{form.getValues('contact_person')}</span></p>
              <p>Preferred Date: <span className="font-medium">{format(form.getValues('preferred_date'), 'PPP')}</span></p>
              <p>Preferred Time: <span className="font-medium">{form.getValues('preferred_time')}</span></p>
            </div>
            <Button 
              onClick={() => {
                setSubmitted(false);
                form.reset();
              }}
              variant="outline"
              className="mt-6"
            >
              Submit Another Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Register Your Business
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Join the iCompass Business Directory and connect with customers across Seychelles. Complete our verification process to get started.
        </p>
      </div>

      {/* Download Form Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download Registration Form
          </CardTitle>
          <CardDescription>
            Download and review our business registration form before scheduling your appointment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDownloadForm} size="lg" className="w-full md:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Download Business Registration Form (PDF)
          </Button>
        </CardContent>
      </Card>

      {/* Appointment Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule Verification Appointment
          </CardTitle>
          <CardDescription>
            Book an appointment with our team to verify your business and complete the registration process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="business_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your business name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact_person"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact person name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone Number
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+248 XXXXXXX" {...field} />
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
                        <FormLabel className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-green-600" />
                          WhatsApp Number
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+248 XXXXXXX" {...field} />
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
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="business@example.com" {...field} />
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
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Website URL
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.yourbusiness.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Social Media Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Social Media & Online Presence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="linkedin_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Linkedin className="w-4 h-4 text-blue-700" />
                          LinkedIn Profile
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.linkedin.com/company/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="facebook_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Facebook className="w-4 h-4 text-blue-600" />
                          Facebook Page
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.facebook.com/..." {...field} />
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
                        <FormLabel className="flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-pink-600" />
                          Instagram Profile
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.instagram.com/..." {...field} />
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
                        <FormLabel className="flex items-center gap-2">
                          <Youtube className="w-4 h-4 text-red-600" />
                          YouTube Channel
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.youtube.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Appointment Scheduling */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Preferred Appointment Time</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="preferred_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          Preferred Date *
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferred_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Preferred Time *
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a time slot" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeSlots.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes or Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional information you'd like to share..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Request Appointment"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessRegistration;