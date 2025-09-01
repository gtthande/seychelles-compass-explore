import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const businessData: BusinessEmailRequest = await req.json();

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