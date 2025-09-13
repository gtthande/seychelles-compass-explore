import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { getApiKey } from './_shared/get-api-key.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BusinessEmailRequest {
  businessName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  category: string;
  description: string;
  services: string[];
  address?: string;
  island?: string;
  website?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  latitude?: number;
  longitude?: number;
}

interface AppointmentEmailRequest {
  type: 'appointment_request';
  data: {
    business_name: string;
    contact_person: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    preferred_date?: string;
    preferred_time?: string;
    notes?: string;
    website?: string;
    linkedin_url?: string;
    facebook_url?: string;
    instagram_url?: string;
    youtube_url?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = await getApiKey('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('Resend API key not configured in admin settings');
    }

    const resend = new Resend(resendApiKey);
    const requestData = await req.json();

    // Handle appointment request emails
    if (requestData.type === 'appointment_request') {
      const { data }: AppointmentEmailRequest = requestData;

      // Send email to admin about new appointment request
      const adminEmailResponse = await resend.emails.send({
        from: "iCompass Business Directory <onboarding@resend.dev>",
        to: ["admin@icompass.sc"], // Replace with actual admin email
        subject: `New Business Registration Appointment - ${data.business_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb; margin-bottom: 24px;">New Business Registration Appointment Request</h1>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <h2 style="color: #1e293b; margin-top: 0;">Business Information</h2>
              <p><strong>Business Name:</strong> ${data.business_name}</p>
              <p><strong>Contact Person:</strong> ${data.contact_person}</p>
            </div>

            ${data.preferred_date || data.preferred_time ? `
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <h3 style="color: #1e293b; margin-top: 0;">Preferred Appointment Time</h3>
              ${data.preferred_date ? `<p><strong>Date:</strong> ${data.preferred_date}</p>` : ''}
              ${data.preferred_time ? `<p><strong>Time:</strong> ${data.preferred_time}</p>` : ''}
            </div>
            ` : ''}

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <h3 style="color: #1e293b; margin-top: 0;">Contact Information</h3>
              ${data.email ? `<p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>` : ''}
              ${data.phone ? `<p><strong>Phone:</strong> <a href="tel:${data.phone}">${data.phone}</a></p>` : ''}
              ${data.whatsapp ? `<p><strong>WhatsApp:</strong> <a href="https://wa.me/${data.whatsapp.replace(/\D/g, '')}">${data.whatsapp}</a></p>` : ''}
              ${data.website ? `<p><strong>Website:</strong> <a href="${data.website}" target="_blank">${data.website}</a></p>` : ''}
            </div>

            ${(data.linkedin_url || data.facebook_url || data.instagram_url || data.youtube_url) ? `
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <h3 style="color: #1e293b; margin-top: 0;">Social Media & Online Presence</h3>
              ${data.linkedin_url ? `<p><strong>LinkedIn:</strong> <a href="${data.linkedin_url}" target="_blank">${data.linkedin_url}</a></p>` : ''}
              ${data.facebook_url ? `<p><strong>Facebook:</strong> <a href="${data.facebook_url}" target="_blank">${data.facebook_url}</a></p>` : ''}
              ${data.instagram_url ? `<p><strong>Instagram:</strong> <a href="${data.instagram_url}" target="_blank">${data.instagram_url}</a></p>` : ''}
              ${data.youtube_url ? `<p><strong>YouTube:</strong> <a href="${data.youtube_url}" target="_blank">${data.youtube_url}</a></p>` : ''}
            </div>
            ` : ''}

            ${data.notes ? `
            <div style="background-color: #fefce8; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <h3 style="color: #1e293b; margin-top: 0;">Additional Notes</h3>
              <p style="white-space: pre-wrap;">${data.notes}</p>
            </div>
            ` : ''}

            <div style="background-color: #1e293b; color: white; padding: 20px; border-radius: 8px; text-align: center;">
              <p style="margin: 0;"><strong>Please log into the admin panel to manage this appointment request.</strong></p>
            </div>
          </div>
        `,
      });

      // If customer provided email, send confirmation to them too
      if (data.email) {
        await resend.emails.send({
          from: "iCompass Business Directory <onboarding@resend.dev>",
          to: [data.email],
          subject: "Thank you for your business registration appointment request",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb; margin-bottom: 24px;">Thank you for your appointment request!</h1>
              
              <p>Dear ${data.contact_person},</p>
              
              <p>We have received your business registration appointment request for <strong>${data.business_name}</strong>.</p>
              
              ${data.preferred_date || data.preferred_time ? `
              <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <h3 style="color: #1e293b; margin-top: 0;">Your Preferred Appointment Time</h3>
                ${data.preferred_date ? `<p><strong>Date:</strong> ${data.preferred_date}</p>` : ''}
                ${data.preferred_time ? `<p><strong>Time:</strong> ${data.preferred_time}</p>` : ''}
              </div>
              ` : ''}
              
              <p>Our team will review your request and contact you shortly to confirm your appointment and guide you through the business verification process.</p>
              
              <p>If you have any urgent questions, please don't hesitate to contact us.</p>
              
              <div style="background-color: #1e293b; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 32px;">
                <p style="margin: 0;"><strong>iCompass Business Directory</strong><br/>
                Your trusted business directory for Seychelles</p>
              </div>
            </div>
          `,
        });
      }

      return new Response(JSON.stringify({
        success: true,
        adminEmailId: adminEmailResponse.data?.id
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Handle legacy business registration emails
    const businessData: BusinessEmailRequest = requestData;

    const emailContent = `
      <h2>New Business Registration - iCompass Seychelles</h2>
      
      <h3>Business Details:</h3>
      <ul>
        <li><strong>Business Name:</strong> ${businessData.businessName}</li>
        <li><strong>Category:</strong> ${businessData.category}</li>
        <li><strong>Email:</strong> ${businessData.email}</li>
        <li><strong>Phone:</strong> ${businessData.phone}</li>
        ${businessData.whatsapp ? `<li><strong>WhatsApp:</strong> ${businessData.whatsapp}</li>` : ''}
        ${businessData.address ? `<li><strong>Address:</strong> ${businessData.address}</li>` : ''}
        ${businessData.island ? `<li><strong>Island:</strong> ${businessData.island}</li>` : ''}
        ${businessData.latitude && businessData.longitude ? `<li><strong>GPS Coordinates:</strong> ${businessData.latitude}, ${businessData.longitude}</li>` : ''}
      </ul>

      <h3>Description:</h3>
      <p>${businessData.description}</p>

      ${businessData.services && businessData.services.length > 0 ? `
      <h3>Services:</h3>
      <ul>
        ${businessData.services.map(service => `<li>${service}</li>`).join('')}
      </ul>
      ` : ''}

      <h3>Online Presence:</h3>
      <ul>
        ${businessData.website ? `<li><strong>Website:</strong> <a href="${businessData.website}">${businessData.website}</a></li>` : ''}
        ${businessData.facebook_url ? `<li><strong>Facebook:</strong> <a href="${businessData.facebook_url}">${businessData.facebook_url}</a></li>` : ''}
        ${businessData.instagram_url ? `<li><strong>Instagram:</strong> <a href="${businessData.instagram_url}">${businessData.instagram_url}</a></li>` : ''}
        ${businessData.linkedin_url ? `<li><strong>LinkedIn:</strong> <a href="${businessData.linkedin_url}">${businessData.linkedin_url}</a></li>` : ''}
        ${businessData.youtube_url ? `<li><strong>YouTube:</strong> <a href="${businessData.youtube_url}">${businessData.youtube_url}</a></li>` : ''}
      </ul>

      <hr style="margin: 20px 0;">
      
      <p><strong>iCompass Support Team</strong><br>
      Phone: +2482588639<br>
      Email: support@icompass.sc</p>

      <p><em>This business registration requires review and approval.</em></p>
    `;

    const emailResponse = await resend.emails.send({
      from: "iCompass Seychelles <onboarding@resend.dev>",
      to: ["support@icompass.sc"],
      subject: `New Business Registration: ${businessData.businessName} - ${businessData.island}`,
      html: emailContent,
    });

    console.log("Business registration email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-business-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);