# Offline Map System Documentation

## Overview

The Seychelles Compass Explore application implements a comprehensive offline map system using Vite proxy and Service Worker caching. This ensures map functionality works even in VM environments with limited internet access.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Leaflet Map   │───▶│   Vite Proxy    │───▶│   OSM CDN       │
│                 │    │  localhost:5173  │    │  tile.openstreetmap.fr │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │ Service Worker  │              │
         │              │   Cache Layer   │              │
         │              └─────────────────┘              │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │   Offline Tile Cache    │
                    │   (7-day TTL)           │
                    └─────────────────────────┘
```

## Components

### 1. Vite Proxy Configuration

**File**: `vite.config.ts`

```typescript
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

**Purpose**: Routes all `/tiles/*` requests through localhost to avoid CORS and network restrictions.

### 2. Service Worker Cache

**File**: `public/sw.js`

**Features**:
- Caches tile requests for 7 days
- Serves cached tiles when offline
- Automatic cache management
- Background sync for tile preloading

### 3. Map Component Integration

**File**: `src/components/MapPicker.tsx`

```typescript
<TileLayer
  url="/tiles/{z}/{x}/{y}.png"
  attribution="&copy; OpenStreetMap contributors"
  maxZoom={19}
  onError={handleTileError}
/>
```

## Workflow

### Online Mode
1. User opens map modal
2. Leaflet requests tiles from `/tiles/{z}/{x}/{y}.png`
3. Vite proxy forwards to OpenStreetMap CDN
4. Service Worker caches successful responses
5. Map displays with live tiles

### Offline Mode
1. User opens map modal (no internet)
2. Leaflet requests tiles from `/tiles/{z}/{x}/{y}.png`
3. Service Worker intercepts requests
4. Serves cached tiles from `osm-tiles-v1` cache
5. Map displays with cached tiles

## Testing

### Online Test
1. Start dev server: `npm run dev`
2. Open DevTools → Network tab
3. Navigate to map modal
4. **Expected**: See `200 OK` responses for `/tiles/*` requests
5. **Expected**: Console shows "Service Worker: Cached new tile"

### Offline Test
1. Disconnect internet (airplane mode)
2. Reload page
3. Open map modal
4. **Expected**: Map loads with cached tiles
5. **Expected**: Console shows "Service Worker: Serving cached tile"

### Cache Verification
1. Open DevTools → Application → Cache Storage
2. Look for `osm-tiles-v1` cache
3. **Expected**: See stored tile files with timestamps

## Benefits

### VM Environment Support
- ✅ Works in VirtualBox with Host-Only adapter
- ✅ Works in WSL2 with limited network access
- ✅ Works in Docker containers
- ✅ No direct internet connection required

### Offline Capabilities
- ✅ 7-day tile cache retention
- ✅ Automatic cache management
- ✅ Graceful fallback to cached tiles
- ✅ No API keys required

### Performance
- ✅ Faster tile loading (local cache)
- ✅ Reduced bandwidth usage
- ✅ Background tile preloading
- ✅ Optimized for Seychelles region

## Troubleshooting

### Map Shows Purple Background
**Cause**: Tiles not loading through proxy
**Solution**: 
1. Check Vite dev server is running
2. Verify proxy configuration in `vite.config.ts`
3. Check Network tab for `/tiles/*` requests

### Service Worker Not Registering
**Cause**: Browser security restrictions
**Solution**:
1. Ensure HTTPS is enabled (`https://localhost:5173`)
2. Check console for registration errors
3. Verify `/sw.js` is accessible

### Cache Not Working Offline
**Cause**: Service Worker not intercepting requests
**Solution**:
1. Check Application → Service Workers tab
2. Verify `sw.js` is active
3. Clear cache and reload to re-register

## Future Enhancements

### Tile Preloading
```javascript
// Preload Seychelles region tiles (zoom 4-15)
const seychellesBounds = {
  north: -4.0,
  south: -10.0,
  east: 56.0,
  west: 55.0
};
```

### Cache Management
- Automatic cache size limits
- Tile expiration policies
- Background cache cleanup

### Performance Optimization
- Tile compression
- Progressive loading
- Smart preloading based on user behavior

## Development Notes

### Adding New Tile Sources
1. Update `vite.config.ts` proxy configuration
2. Add fallback logic in Service Worker
3. Test with different tile providers

### Cache Debugging
```javascript
// Check cache contents
caches.open('osm-tiles-v1').then(cache => {
  cache.keys().then(keys => console.log('Cached tiles:', keys));
});
```

### Performance Monitoring
```javascript
// Monitor cache hit rate
const cacheHitRate = cachedRequests / totalRequests;
console.log('Cache hit rate:', cacheHitRate);
```

## Security Considerations

- Service Worker runs in secure context only
- Cache is isolated per origin
- No sensitive data stored in cache
- Automatic cache expiration prevents storage bloat

## Browser Support

- ✅ Chrome 40+
- ✅ Firefox 44+
- ✅ Safari 11.1+
- ✅ Edge 17+

## Related Files

- `vite.config.ts` - Proxy configuration
- `public/sw.js` - Service Worker implementation
- `src/main.tsx` - Service Worker registration
- `src/components/MapPicker.tsx` - Map integration
- `src/components/MapPickerModal.tsx` - Enhanced map picker
