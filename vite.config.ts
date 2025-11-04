import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0", // allows localhost and LAN access
    port: 5173,
    strictPort: true, // fail instead of switching ports
    open: true, // automatically open browser
    https: false, // Disable HTTPS for local development
    // Local proxy for OSM tiles to avoid CORS or mixed-content issues
    proxy: {
      "/tiles": {
        target: "https://a.tile.openstreetmap.fr/hot/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tiles\//, ""),
        secure: true,
        // If the upstream tile server is unreachable, serve a local fallback
        configure: (proxy: any) => {
          proxy.on("error", (_err: any, _req: any, res: any) => {
            try {
              const pngPath = path.resolve(process.cwd(), "public/osm-tiles-fallback/blank.png");
              if (fs.existsSync(pngPath)) {
                res.writeHead(200, { "Content-Type": "image/png" });
                fs.createReadStream(pngPath).pipe(res);
                return;
              }
              // SVG gray tile fallback (no binary asset required)
              const svg = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"256\" height=\"256\"><rect width=\"256\" height=\"256\" fill=\"#e5e7eb\"/><text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"#9ca3af\" font-family=\"Arial, sans-serif\" font-size=\"14\">offline tile</text></svg>`;
              res.writeHead(200, { "Content-Type": "image/svg+xml" });
              res.end(svg);
            } catch {
              res.writeHead(500);
              res.end("Tile proxy failed");
            }
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mkcert(), // Enable HTTPS with trusted certificates
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'process.env': process.env,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-toast'],
          'supabase-vendor': ['@supabase/supabase-js']
        },
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // Image optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    cssCodeSplit: true,
    sourcemap: false, // Disable sourcemaps in production for smaller bundles
  },
  // Image optimization
  assetsInclude: ['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.gif', '**/*.webp', '**/*.svg'],
}));
