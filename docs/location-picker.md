# Location Picker Guide

This guide explains how to use the hybrid location picker in iCompass Seychelles, which provides multiple ways to select business locations without requiring Google API keys.

## 🎯 Two Ways to Set a Business Location

### Method 1: Google Maps Parser (Recommended)
- **Open Google Maps**: Click "🌍 Open Google Maps" to find your location
- **Get Coordinates**: Right-click on the exact spot → "What's here?" → copy coordinates
- **Paste & Parse**: Paste coordinates or Google Maps URL into the parser
- **Automatic Parsing**: The system extracts coordinates and displays a location card

### Method 2: Alternative Methods
- **GPS Location**: Use your device's current location
- **Interactive Map**: Pick location on an interactive map
- **Manual Entry**: Enter coordinates manually

## 🌍 Location Selection Methods

### 1. GPS Location (Use Current Location)
- **How it works**: Uses your device's GPS to get your exact location
- **Best for**: When you're physically at the business location
- **Requirements**: Device with GPS capability and location permissions
- **Feedback**: Toast notifications show progress and results

### 2. Interactive Map Picker
- **How it works**: Click anywhere on the OpenStreetMap to set location
- **Best for**: When you know the general area but need precise positioning
- **Features**: 
  - Drag the marker to fine-tune position
  - Search for places using the search bar
  - Works offline with cached tiles

### 3. Google Maps Integration (No API Key Required)
- **How it works**: Opens Google Maps in a new tab with current coordinates
- **Best for**: When you need Google Maps' superior search and navigation
- **Process**:
  1. Click "Open in Google Maps"
  2. Use Google Maps to find the exact location
  3. Copy the coordinates from Google Maps
  4. Paste them back into the form

## 📋 Copy/Paste Workflow

### Step-by-Step Guide:

1. **Click "🌍 Open Google Maps"**: This opens Google Maps centered on Seychelles
2. **Find Your Location**: Use Google Maps search or navigation to find your business
3. **Get Coordinates**: 
   - Right-click on the exact location in Google Maps
   - Select "What's here?" from the context menu
   - Copy the coordinates that appear (e.g., `-4.619000, 55.451000`)
4. **Paste in Form**: Return to the business form and paste the coordinates
5. **Click Parse**: The system will extract the coordinates and display a location card
6. **Need Help?**: Click "ℹ️ How to Get My Coordinates" for Google's official guide

### Alternative: Google Maps URL
1. **Share Location**: In Google Maps, click "Share" on your location
2. **Copy Link**: Copy the full Google Maps URL (e.g., `https://maps.google.com/...`)
3. **Paste in Form**: Paste the URL into the location input field
4. **Click Parse**: The system will extract coordinates from the URL

### Coordinate Format
- **Format**: `latitude, longitude` (e.g., `-4.619000, 55.451000`)
- **Decimal Places**: Use 4-6 decimal places for accuracy
- **Seychelles Range**: 
  - Latitude: approximately `-4.0` to `-10.0`
  - Longitude: approximately `55.0` to `56.0`

## 🗺️ Offline Support

The location picker works even when offline:

- **Cached Tiles**: Previously viewed map areas are cached for offline use
- **Fallback Tiles**: Gray fallback tiles appear when external servers are unreachable
- **GPS Still Works**: Location services work independently of internet connection
- **Google Maps**: Requires internet connection for the "Open in Google Maps" feature

## 🔧 Technical Details

### No API Keys Required
- **OpenStreetMap**: Free, no API key needed
- **Google Maps**: Uses public URLs, no API key required
- **Nominatim Search**: Free geocoding service
- **Service Worker**: Caches tiles for offline use

### Browser Compatibility
- **GPS**: Modern browsers with location permissions
- **Maps**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **Offline**: Service Worker support required

## 🚨 Troubleshooting

### GPS Not Working
- **Check Permissions**: Ensure location access is allowed
- **HTTPS Required**: GPS requires secure connection
- **Try Again**: GPS can take a few seconds to get accurate location

### Map Not Loading
- **Check Internet**: Ensure you have internet connection
- **Try Refresh**: Reload the page to retry tile loading
- **Offline Mode**: Gray tiles indicate offline mode (still functional)

### Google Maps Not Opening
- **Popup Blocker**: Ensure popups are allowed for the site
- **Browser Settings**: Check if external links are blocked

## 💡 Tips for Best Results

1. **Use GPS When Possible**: Most accurate for current location
2. **Google Maps for Research**: Best for finding exact business addresses
3. **Search Before Picking**: Use the search bar to find places quickly
4. **Verify Coordinates**: Always check that the location looks correct on the map
5. **Save Drafts**: Save your work frequently to avoid losing progress

## 🎯 Use Cases

### For Business Owners
- **Current Location**: Use GPS when at your business
- **Remote Setup**: Use Google Maps to find and set location remotely
- **Multiple Locations**: Use search to quickly switch between locations

### For Administrators
- **Bulk Updates**: Use coordinate copy/paste for multiple businesses
- **Verification**: Use Google Maps to verify business locations
- **Offline Work**: Continue working even without internet connection

## 📱 Mobile Usage

The location picker is fully responsive and works on mobile devices:

- **Touch Support**: Tap to set location, drag to move marker
- **GPS Integration**: Works with mobile GPS for accurate positioning
- **Mobile Maps**: Google Maps opens in mobile app if installed
- **Offline Maps**: Cached tiles work on mobile for offline use

---

*This guide covers the hybrid location picker system. For technical implementation details, see the main documentation.*
