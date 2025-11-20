export async function geocode(lat: number, lng: number) {
  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!googleKey) {
    console.warn("Google Maps API key not configured");
    throw new Error("Google Maps API key missing");
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleKey}`;

    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Geocoding request failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    if (data.status !== "OK") {
      throw new Error("Geocoding failed: " + data.status);
    }

    return data;
  } catch (error) {
    console.error("Geocoding error:", error);
    throw error;
  }
}

