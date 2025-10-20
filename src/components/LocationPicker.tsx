'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Navigation, RotateCcw, AlertCircle, MapPin, Target, ExternalLink, Compass, Search } from 'lucide-react'

interface LocationPickerProps {
  lat?: number | null;
  lng?: number | null;
  onChange: (coordinates: { latitude: number; longitude: number }) => void;
  className?: string;
}

export default function LocationPicker({ lat = -4.6167, lng = 55.4500, onChange, className = '' }: LocationPickerProps) {
  const { toast } = useToast()
  const [position, setPosition] = useState<[number, number]>([lat ?? -4.6167, lng ?? 55.4500])
  const [geoError, setGeoError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Update position when lat/lng props change
  useEffect(() => {
    if (lat !== null && lng !== null && lat !== undefined && lng !== undefined) {
      const newPosition: [number, number] = [lat, lng]
      setPosition(newPosition)
    }
  }, [lat, lng])

  const handlePick = () => {
    if (!navigator.geolocation) {
      toast({ 
        title: 'Error', 
        description: 'Geolocation not supported by your browser', 
        variant: 'destructive' 
      })
      return
    }

    setIsLoading(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setPosition(coords)
        onChange({ latitude: coords[0], longitude: coords[1] })
        toast({ 
          title: 'Success', 
          description: 'Current location set successfully.' 
        })
        setIsLoading(false)
      },
      (err) => {
        let errorMessage = 'Unable to retrieve your location.'
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access and try again.'
            break
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please check your GPS settings.'
            break
          case err.TIMEOUT:
            errorMessage = 'Location request timed out. Please check your internet connection and try again.'
            break
          default:
            errorMessage = 'Unable to retrieve your location. Please try again.'
        }
        
        setGeoError(errorMessage)
        toast({ 
          title: 'Location Error', 
          description: errorMessage, 
          variant: 'destructive' 
        })
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // 15 seconds
        maximumAge: 300000, // 5 minutes
      }
    )
  }

  const resetToDefault = () => {
    const defaultPosition: [number, number] = [-4.6167, 55.4500] // Mahé, Seychelles
    setPosition(defaultPosition)
    onChange({ latitude: defaultPosition[0], longitude: defaultPosition[1] })
    toast({ 
      title: 'Location reset', 
      description: 'Reset to default Seychelles location' 
    })
  }

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${position[0]},${position[1]}`
    window.open(url, '_blank')
    toast({ 
      title: 'Opening in Google Maps', 
      description: 'Location opened in new tab' 
    })
  }

  const getDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${position[0]},${position[1]}`
    window.open(url, '_blank')
    toast({ 
      title: 'Getting directions', 
      description: 'Directions opened in new tab' 
    })
  }

  const copyCoordinates = () => {
    const coords = `${position[0]}, ${position[1]}`
    navigator.clipboard.writeText(coords).then(() => {
      toast({ 
        title: 'Coordinates copied', 
        description: `Copied: ${coords}` 
      })
    }).catch(() => {
      toast({ 
        title: 'Copy failed', 
        description: 'Unable to copy coordinates', 
        variant: 'destructive' 
      })
    })
  }

  const searchLocation = () => {
    // Open Google Maps with search functionality
    const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Seychelles')}`
    const popup = window.open(searchUrl, 'googleMapsSearch', 'width=800,height=600,scrollbars=yes,resizable=yes')
    
    if (popup) {
      toast({ 
        title: 'Search Location', 
        description: 'Google Maps search opened. Find your location and copy the coordinates to paste here.' 
      })
      
      // Listen for the popup to close and check if user wants to paste coordinates
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          // Show instructions for manual coordinate entry
          const userInput = prompt(
            'If you found your location in Google Maps, please enter the coordinates in the format "latitude,longitude" (e.g., -4.6167,55.4500):\n\n' +
            'To get coordinates from Google Maps:\n' +
            '1. Right-click on the location\n' +
            '2. Select the first number (latitude,longitude)\n' +
            '3. Paste it here'
          )
          
          if (userInput) {
            try {
              const [lat, lng] = userInput.split(',').map(coord => parseFloat(coord.trim()))
              if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                const newPosition: [number, number] = [lat, lng]
                setPosition(newPosition)
                onChange({ latitude: lat, longitude: lng })
                toast({ 
                  title: 'Location set', 
                  description: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}` 
                })
              } else {
                toast({ 
                  title: 'Invalid coordinates', 
                  description: 'Please enter valid latitude and longitude values', 
                  variant: 'destructive' 
                })
              }
            } catch (error) {
              toast({ 
                title: 'Invalid format', 
                description: 'Please enter coordinates in the format "latitude,longitude"', 
                variant: 'destructive' 
              })
            }
          }
        }
      }, 1000)
    } else {
      toast({ 
        title: 'Popup blocked', 
        description: 'Please allow popups for this site to use the search feature', 
        variant: 'destructive' 
      })
    }
  }


  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-3">
        {/* Primary Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={handlePick}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            Set Current Location
          </Button>
          
          <Button 
            variant="outline" 
            onClick={resetToDefault}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </Button>

          <div className="text-sm text-muted-foreground">
            Click map to set location
          </div>
        </div>

        {/* Map Viewing Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={searchLocation}
            className="flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search Location
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={openInGoogleMaps}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View in Google Maps
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={getDirections}
            className="flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            Get Directions
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={copyCoordinates}
            className="flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            Copy Coordinates
          </Button>
        </div>
      </div>

      {/* Coordinate Display Card */}
      <div className="h-32 rounded-lg border bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-800">Location Selected</h3>
            <p className="text-sm text-gray-600">
              {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </p>
            <p className="text-xs text-gray-500">
              Use buttons above to set or search for location
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>
          <strong>Current coordinates:</strong> {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </div>
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3" />
          <span>Coordinate-based location picker</span>
        </div>
      </div>

      {geoError && (
        <div className="text-red-500 text-sm bg-red-50 p-2 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {geoError}
        </div>
      )}

    </div>
  )
}