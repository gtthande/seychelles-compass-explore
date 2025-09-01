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
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const businessData: BusinessEmailRequest = await req.json();

    const emailContent = `
      <h2>New Business Registration - iCompass Platform</h2>
      
      <h3>Business Details:</h3>
      <ul>
        <li><strong>Business Name:</strong> ${businessData.businessName}</li>
        <li><strong>Category:</strong> ${businessData.category}</li>
        <li><strong>Email:</strong> ${businessData.email}</li>
        <li><strong>Phone:</strong> ${businessData.phone}</li>
        ${businessData.whatsapp ? `<li><strong>WhatsApp:</strong> ${businessData.whatsapp}</li>` : ''}
        ${businessData.address ? `<li><strong>Address:</strong> ${businessData.address}</li>` : ''}
        ${businessData.island ? `<li><strong>Island:</strong> ${businessData.island}</li>` : ''}
      </ul>

      <h3>Description:</h3>
      <p>${businessData.description}</p>

      ${businessData.services.length > 0 ? `
      <h3>Services:</h3>
      <ul>
        ${businessData.services.map(service => `<li>${service}</li>`).join('')}
      </ul>
      ` : ''}

      <h3>Social Media & Website:</h3>
      <ul>
        ${businessData.website ? `<li><strong>Website:</strong> ${businessData.website}</li>` : ''}
        ${businessData.facebook_url ? `<li><strong>Facebook:</strong> ${businessData.facebook_url}</li>` : ''}
        ${businessData.instagram_url ? `<li><strong>Instagram:</strong> ${businessData.instagram_url}</li>` : ''}
        ${businessData.linkedin_url ? `<li><strong>LinkedIn:</strong> ${businessData.linkedin_url}</li>` : ''}
        ${businessData.youtube_url ? `<li><strong>YouTube:</strong> ${businessData.youtube_url}</li>` : ''}
      </ul>

      <p><strong>Contact iCompass:</strong> +2482588639</p>
    `;

    const emailResponse = await resend.emails.send({
      from: "iCompass Platform <onboarding@resend.dev>",
      to: ["info@icompass.sc"],
      subject: `New Business Registration: ${businessData.businessName}`,
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