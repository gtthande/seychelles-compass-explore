"use client";
import { MapPin, Navigation, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { getDirectionsUrl, getViewUrl, isValidCoordinates } from "@/lib/maps";

// ✅ Initialize Supabase client (safe client-side)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function LocationCard({
  id,
  address,
  latitude,
  longitude,
  website,
  phone,
  isAdmin = false
}) {
  // --- State ---
  const [coords, setCoords] = useState({
    lat: null,
    lng: null
  });
  const [zoomed, setZoomed] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [mapError, setMapError] = useState(false);

  // ✅ Proper coordinate validation and initialization
  useEffect(() => {
    const lat = latitude ? parseFloat(latitude) : null;
    const lng = longitude ? parseFloat(longitude) : null;
    
    // Validate coordinates are within reasonable bounds
    const isValidLat = lat !== null && !isNaN(lat) && lat >= -90 && lat <= 90;
    const isValidLng = lng !== null && !isNaN(lng) && lng >= -180 && lng <= 180;
    
    if (isValidLat && isValidLng) {
      setCoords({ lat, lng });
      setMapError(false);
    } else {
      setCoords({ lat: null, lng: null });
    }
  }, [latitude, longitude]);

  const hasCoords = isValidCoordinates(coords.lat, coords.lng);

  // --- Map URL generation ---
  const mapUrl = hasCoords && !mapError
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${coords.lat},${coords.lng}&zoom=15&size=600x300&markers=color:red|${coords.lat},${coords.lng}`
    : "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/No_image_available.svg/600px-No_image_available.svg.png";

  const zoomMapUrl = hasCoords && !mapError
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${coords.lat},${coords.lng}&zoom=17&size=900x600&markers=color:red|${coords.lat},${coords.lng}`
    : "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/No_image_available.svg/900px-No_image_available.svg.png";

  // --- Detect My Location ---
  const handleDetect = () => {
    if (!navigator.geolocation) {
      alert("Your browser doesn't support location.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        setDetecting(false);
        await saveCoords(lat, lng);
      },
      (err) => {
        alert("Couldn't get location: " + err.message);
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // --- Save to Supabase ---
  const saveCoords = async (lat, lng) => {
    if (!id) return;
    const { error } = await supabase
      .from("businesses")
      .update({ latitude: lat, longitude: lng })
      .eq("id", id);
    if (error) console.error("Supabase update error:", error.message);
  };

  // --- UI ---
  return (
    <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Title */}
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="text-blue-500 w-5 h-5" />
        <h2 className="text-lg font-semibold text-gray-800">Location & Contact</h2>
      </div>

      {/* Address + Coords */}
      <div className="mb-3 text-sm text-gray-700">
        <p className="font-medium text-gray-800">{address}</p>
        {hasCoords && (
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-rose-500" />
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </p>
        )}
      </div>

      {/* Location Display - Coordinates Only */}
      {hasCoords && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Coordinates:</span>
            <span className="text-xs text-blue-600 font-mono">
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </span>
          </div>
        </div>
      )}

      {/* Detect My Location */}
      {isAdmin && (
        <div className="flex mb-4">
          <Button
            onClick={handleDetect}
            disabled={detecting}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            <Crosshair className="mr-2 h-4 w-4" />
            {detecting ? "Detecting..." : "Detect My Location"}
          </Button>
        </div>
      )}

      {/* Maps Buttons */}
      <div className="flex flex-wrap gap-3 mb-3">
        <a
          href={hasCoords ? getViewUrl(coords.lat, coords.lng) : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button
            disabled={!hasCoords}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            <MapPin className="mr-2 h-4 w-4" /> View in Maps
          </Button>
        </a>
        <a
          href={hasCoords ? getDirectionsUrl(coords.lat, coords.lng) : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button
            disabled={!hasCoords}
            className="w-full bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
          >
            <Navigation className="mr-2 h-4 w-4" /> Get Directions
          </Button>
        </a>
      </div>

      {/* Contact */}
      <div className="border-t border-gray-100 pt-3 text-sm text-gray-600 space-y-1">
        {phone && (
          <p>
            📞 <a href={`tel:${phone}`} className="text-blue-600 hover:underline">{phone}</a>
          </p>
        )}
        {website && (
          <p>
            🌐{" "}
            <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {website}
            </a>
          </p>
        )}
      </div>

      {/* Zoom Modal */}
      {zoomed && hasCoords && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setZoomed(false)}
        >
          <div className="relative">
            <button
              className="absolute top-2 right-2 text-white bg-black/40 rounded-full p-2 hover:bg-black/60"
              onClick={() => setZoomed(false)}
            >
              ✕
            </button>
            <img
              src={zoomMapUrl}
              alt="Zoomed map"
              className="rounded-xl border border-gray-200 shadow-lg"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src =
                  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/No_image_available.svg/900px-No_image_available.svg.png";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}