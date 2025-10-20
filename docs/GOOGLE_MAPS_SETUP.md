# Google Maps Integration Setup Guide

## 🌍 Google Maps API Configuration

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 2. Google Cloud Console Setup

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Required APIs**:
   - Navigate to "APIs & Services" > "Library"
   - Enable the following APIs:
     - **Maps Embed API** (for embedded maps)
     - **Maps JavaScript API** (for interactive maps)
     - **Places API** (for location search)
     - **Geocoding API** (for address conversion)

3. **Create API Key**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

4. **Secure Your API Key**:
   - Click on your API key to configure restrictions
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: Add your domain(s):
     - `http://localhost:5173/*` (development)
     - `https://yourdomain.com/*` (production)
   - **API restrictions**: Select only the APIs you need

### 3. API Key Restrictions (Recommended)

For production, restrict your API key to:

```
HTTP referrers:
- https://yourdomain.com/*
- https://www.yourdomain.com/*

APIs:
- Maps Embed API
- Maps JavaScript API
- Places API
- Geocoding API
```

### 4. Usage Limits and Billing

- **Free Tier**: $200 monthly credit (covers most small to medium applications)
- **Embed API**: Free for most use cases
- **JavaScript API**: $7 per 1,000 requests
- **Places API**: $17 per 1,000 requests
- **Geocoding API**: $5 per 1,000 requests

### 5. Testing Your Configuration

1. **Development Testing**:
   ```bash
   # Start your development server
   npm run dev
   
   # Check browser console for any API key errors
   # Test map loading on business detail pages
   ```

2. **Production Testing**:
   - Deploy with your API key
   - Test map functionality on live site
   - Monitor Google Cloud Console for usage

### 6. Troubleshooting

#### Common Issues:

1. **"Map unavailable" message**:
   - Check if API key is correctly set in `.env`
   - Verify API key has proper restrictions
   - Ensure required APIs are enabled

2. **"This page can't load Google Maps correctly"**:
   - Check browser console for specific errors
   - Verify API key permissions
   - Check if domain is added to restrictions

3. **Maps not loading in production**:
   - Ensure production domain is in API key restrictions
   - Check if API key is properly deployed
   - Verify HTTPS is enabled (required for production)

#### Debug Steps:

1. **Check API Key**:
   ```javascript
   console.log('Google Maps API Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
   ```

2. **Test API Key**:
   ```bash
   curl "https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY"
   ```

3. **Check Console Errors**:
   - Open browser developer tools
   - Look for Google Maps related errors
   - Check network tab for failed requests

### 7. Security Best Practices

1. **Never commit API keys to version control**
2. **Use environment variables for all API keys**
3. **Restrict API keys by domain and API type**
4. **Monitor usage in Google Cloud Console**
5. **Set up billing alerts for unexpected usage**

### 8. Performance Optimization

1. **Lazy Loading**: Maps load only when needed
2. **Caching**: Implement caching for repeated requests
3. **Debouncing**: Limit API calls during user input
4. **Error Handling**: Graceful fallbacks when maps fail

### 9. Cost Management

1. **Monitor Usage**: Check Google Cloud Console regularly
2. **Set Quotas**: Configure daily/monthly quotas
3. **Optimize Requests**: Cache results when possible
4. **Use Free APIs**: Prefer Embed API over JavaScript API when possible

## 🚀 Implementation Complete

Your Google Maps integration is now ready for production use with:

- ✅ **Embedded Maps**: Fast, reliable map display
- ✅ **Error Handling**: Graceful fallbacks for missing API keys
- ✅ **Security**: Proper API key restrictions
- ✅ **Performance**: Optimized loading and caching
- ✅ **User Experience**: Clean, intuitive interface

For any issues or questions, refer to the [Google Maps Platform documentation](https://developers.google.com/maps/documentation).
