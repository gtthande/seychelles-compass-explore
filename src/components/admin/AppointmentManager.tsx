import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Calendar,
  Clock,
  User,
  Building2,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Check,
  X,
  Eye,
  ExternalLink
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface Appointment {
  id: string;
  business_name: string;
  contact_person: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const AppointmentManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();
      
      setIsAdmin(profile?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      fetchAppointments();
    }
  }, [user]);

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Appointment marked as ${newStatus}`,
      });
      
      fetchAppointments();
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'confirmed':
        return 'bg-blue-500 text-white';
      case 'completed':
        return 'bg-green-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{appointment.business_name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <User className="w-4 h-4" />
              {appointment.contact_person}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(appointment.status)}>
            {appointment.status}
          </Badge>
        </div>
        
        {appointment.preferred_date && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(appointment.preferred_date), 'PPP')}
            </div>
            {appointment.preferred_time && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {appointment.preferred_time}
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {appointment.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <a href={`tel:${appointment.phone}`} className="hover:text-foreground">
                {appointment.phone}
              </a>
            </div>
          )}
          
          {appointment.whatsapp && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageCircle className="w-4 h-4 text-green-600" />
              <a 
                href={`https://wa.me/${appointment.whatsapp.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                WhatsApp
              </a>
            </div>
          )}
          
          {appointment.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <a href={`mailto:${appointment.email}`} className="hover:text-foreground">
                {appointment.email}
              </a>
            </div>
          )}
          
          {appointment.website && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-4 h-4" />
              <a 
                href={appointment.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                Website
              </a>
            </div>
          )}
        </div>

        {appointment.notes && (
          <div className="text-sm text-muted-foreground">
            <strong>Notes:</strong> {appointment.notes}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{appointment.business_name}</DialogTitle>
                <DialogDescription>
                  Business registration appointment details
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Business:</strong> {appointment.business_name}</p>
                      <p><strong>Contact:</strong> {appointment.contact_person}</p>
                      <p><strong>Status:</strong> <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge></p>
                      <p><strong>Submitted:</strong> {format(new Date(appointment.created_at), 'PPp')}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Preferred Appointment</h4>
                    <div className="space-y-2 text-sm">
                      {appointment.preferred_date && (
                        <p><strong>Date:</strong> {format(new Date(appointment.preferred_date), 'PPP')}</p>
                      )}
                      {appointment.preferred_time && (
                        <p><strong>Time:</strong> {appointment.preferred_time}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {appointment.phone && <p><strong>Phone:</strong> {appointment.phone}</p>}
                    {appointment.whatsapp && <p><strong>WhatsApp:</strong> {appointment.whatsapp}</p>}
                    {appointment.email && <p><strong>Email:</strong> {appointment.email}</p>}
                    {appointment.website && <p><strong>Website:</strong> {appointment.website}</p>}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Social Media</h4>
                  <div className="flex flex-wrap gap-2">
                    {appointment.linkedin_url && (
                      <a href={appointment.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          LinkedIn <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </a>
                    )}
                    {appointment.facebook_url && (
                      <a href={appointment.facebook_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          Facebook <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </a>
                    )}
                    {appointment.instagram_url && (
                      <a href={appointment.instagram_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          Instagram <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </a>
                    )}
                    {appointment.youtube_url && (
                      <a href={appointment.youtube_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          YouTube <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
                
                {appointment.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Additional Notes</h4>
                    <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          {appointment.status === 'pending' && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
              >
                <Check className="w-4 h-4 mr-1" />
                Confirm
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this appointment request from {appointment.business_name}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Cancel Appointment
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          
          {appointment.status === 'confirmed' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
            >
              <Check className="w-4 h-4 mr-1" />
              Mark Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (!user || !isAdmin) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
          <p className="text-muted-foreground">
            Only administrators can manage appointment requests.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Appointment Requests</h2>
          <p className="text-muted-foreground">{appointments.length} total requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => {
          const count = appointments.filter(apt => apt.status === status).length;
          return (
            <Card key={status}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground capitalize">{status}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Appointments Grid */}
      {appointments.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {appointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Appointment Requests</h3>
            <p className="text-muted-foreground">
              No business registration appointment requests have been submitted yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AppointmentManager;