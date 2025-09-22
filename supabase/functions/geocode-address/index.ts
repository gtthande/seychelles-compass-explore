import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, island } = await req.json();

    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Google Maps API key from environment variables
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!apiKey) {
      console.error('Google Maps API key not configured in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Google Maps API key not configured',
          details: 'Please set GOOGLE_MAPS_API_KEY environment variable in Supabase'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct full address with Seychelles context
    const fullAddress = `${address}, ${island || ''}, Seychelles`.replace(/,\s*,/, ',');
    
    console.log('Geocoding address:', fullAddress);

    // Use Google Geocoding API with proper API key
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&region=sc&key=${apiKey}`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const formattedAddress = data.results[0].formatted_address;
      
      return new Response(JSON.stringify({
        success: true,
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: formattedAddress,
        original_address: address
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // API error or no results - log and use fallback
      if (data.status === 'ZERO_RESULTS') {
        console.log('No geocoding results found, using island center');
      } else {
        console.error('Google Maps API error:', data.status, data.error_message);
      }
      
      // Fallback to Seychelles center coordinates if geocoding fails
      const seychellesCoords = {
        'Mahé': { lat: -4.6796, lng: 55.4920 },
        'Praslin': { lat: -4.3197, lng: 55.7370 },
        'La Digue': { lat: -4.3598, lng: 55.8275 }
      };

      const coords = seychellesCoords[island as keyof typeof seychellesCoords] || seychellesCoords['Mahé'];
      
      console.log('Geocoding failed, using island center:', coords);
      
      return new Response(JSON.stringify({
        success: true,
        latitude: coords.lat,
        longitude: coords.lng,
        formatted_address: `${address}, ${island}, Seychelles`,
        original_address: address,
        fallback: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Error in geocode-address function:', error);
    
    // Return Mahé center as ultimate fallback
    return new Response(JSON.stringify({
      success: false,
      latitude: -4.6796,
      longitude: 55.4920,
      formatted_address: 'Seychelles',
      original_address: '',
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});