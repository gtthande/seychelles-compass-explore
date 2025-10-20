# Development Environment Setup

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern browser with Service Worker support
- HTTPS enabled for local development

## Quick Start

```bash
# Clone repository
git clone <repository-url>
cd seychelles-compass-explore

# Install dependencies
npm install

# Start development server
npm run dev
```

## Vite Development Server

### Configuration
The development server is configured with:
- **Host**: `0.0.0.0` (allows LAN access)
- **Port**: `5173` (HTTPS enabled)
- **Proxy**: `/tiles` → OpenStreetMap CDN
- **HTTPS**: Required for Service Worker

### Proxy Setup
```typescript
// vite.config.ts
server: {
  proxy: {
    "/tiles": {
      target: "https://a.tile.openstreetmap.fr/hot/",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/tiles\//, ""),
      secure: true,
    },
  },
}
```

**Purpose**: Routes map tile requests through localhost to avoid CORS issues and VM network restrictions.

## Service Worker Requirements

### HTTPS Requirement
Service Workers require HTTPS in production and secure context in development.

**Development**: Vite automatically generates trusted certificates via `vite-plugin-mkcert`
**Production**: Ensure SSL certificates are properly configured

### Registration
Service Worker is automatically registered in `src/main.tsx`:
```typescript
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("✅ Service Worker registered for offline tiles"))
      .catch((err) => console.warn("SW registration failed:", err));
  });
}
```

## VM Environment Support

### VirtualBox
- ✅ Host-Only adapter supported
- ✅ No direct internet required
- ✅ Proxy handles external requests

### WSL2
- ✅ Windows Subsystem for Linux supported
- ✅ Network restrictions handled by proxy
- ✅ Service Worker works in WSL2 browsers

### Docker
- ✅ Container-friendly proxy configuration
- ✅ Service Worker cache persists
- ✅ No external dependencies

## Development Scripts

### Available Commands
```bash
npm run dev          # Start development server
npm run dev:clean    # Clean cache and restart
npm run dev:debug    # Start with debug logging
npm run build        # Production build
npm run preview      # Preview production build
```

### Cache Management
```bash
# Clear Vite cache
npm run clean

# Full reset (cache + dependencies)
npm run clean:full

# Reset development environment
npm run reset:interactive
```

## Browser Requirements

### Service Worker Support
- ✅ Chrome 40+
- ✅ Firefox 44+
- ✅ Safari 11.1+
- ✅ Edge 17+

### Map Features
- ✅ Leaflet.js support
- ✅ Geolocation API
- ✅ Canvas rendering
- ✅ Touch events (mobile)

## Troubleshooting

### Common Issues

#### "Map Loading Error" Toast
**Cause**: Tiles not loading through proxy
**Solution**:
1. Verify Vite dev server is running
2. Check `vite.config.ts` proxy configuration
3. Test proxy manually: `curl http://localhost:5173/tiles/0/0/0.png`

#### Service Worker Not Registering
**Cause**: HTTPS not enabled or browser restrictions
**Solution**:
1. Ensure using `https://localhost:5173`
2. Check browser console for errors
3. Verify `/sw.js` is accessible

#### Purple Map Background
**Cause**: Tile requests failing
**Solution**:
1. Check Network tab for failed requests
2. Verify proxy is working
3. Test with different tile sources

### Debug Tools

#### Network Tab
- Look for `/tiles/*` requests
- Verify 200 OK responses
- Check for CORS errors

#### Application Tab
- Service Workers: Check registration status
- Cache Storage: Verify `osm-tiles-v1` cache
- Storage: Monitor cache usage

#### Console Logs
```
✅ Service Worker registered for offline tiles
Service Worker: Cached new tile: /tiles/13/4421/3287.png
Service Worker: Serving cached tile: /tiles/13/4421/3287.png
```

## Environment Variables

### Required
```bash
# .env.local
VITE_SITE_URL=https://localhost:5173
```

### Optional
```bash
# Google Maps API (if using Google Maps fallback)
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

## Production Deployment

### Build Configuration
```bash
npm run build
```

### Service Worker
- Automatically included in build
- Cache strategies optimized for production
- Offline functionality preserved

### Proxy Configuration
For production, configure reverse proxy:
```nginx
location /tiles/ {
    proxy_pass https://a.tile.openstreetmap.fr/hot/;
    proxy_set_header Host a.tile.openstreetmap.fr;
}
```

## Performance Optimization

### Tile Caching
- 7-day cache retention
- Automatic cache cleanup
- Background tile preloading

### Network Optimization
- Proxy reduces external requests
- Service Worker reduces bandwidth
- Cached tiles load instantly

### Memory Management
- Cache size limits
- Automatic expiration
- Garbage collection

## Security Considerations

### Service Worker Security
- Runs in secure context only
- Cache isolated per origin
- No sensitive data stored

### Proxy Security
- HTTPS only for external requests
- No authentication required
- Public tile data only

## Monitoring and Analytics

### Cache Performance
```javascript
// Monitor cache hit rate
const cacheHitRate = cachedRequests / totalRequests;
```

### Tile Usage
```javascript
// Track tile requests
console.log('Tile requests:', tileRequestCount);
```

### Offline Usage
```javascript
// Track offline usage
navigator.onLine ? 'online' : 'offline';
```

## Related Documentation

- [Offline Map System](./offline-map.md) - Detailed offline functionality
- [Technical Documentation](./TECHNICAL_DOCUMENTATION.md) - Overall system architecture
- [User Manual](./UserManual.md) - End-user features
