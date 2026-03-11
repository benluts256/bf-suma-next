import type { NextConfig } from "next";

// Capacitor static export mode — set CAPACITOR_BUILD=true to build for iOS/Android
const isCapacitor = process.env.CAPACITOR_BUILD === 'true';

const nextConfig: NextConfig = {
  // ===========================================
  // CAPACITOR / STATIC EXPORT
  // ===========================================
  // When building for Capacitor (iOS/Android), export as static HTML
  ...(isCapacitor && {
    output: 'export',
  }),

  // ===========================================
  // PRODUCTION SETTINGS
  // ===========================================
  
  // Enable React strict mode for development
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    // Capacitor static export requires unoptimized images
    ...(isCapacitor && { unoptimized: true }),
    // Allow images from Supabase storage
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
    // Increase default limit for image optimization
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Enable powered-by-header to remove Vercel branding (optional)
  poweredByHeader: false,

  // Compression - enabled by default in production
  
  // ===========================================
  // SECURITY HEADERS
  // ===========================================
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // API routes - more restrictive
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },

  // ===========================================
  // TRAILING SLASH CONFIGURATION
  // ===========================================
  // Use trailing slashes for better compatibility
  trailingSlash: false,

  // ===========================================
  // EXPERIMENTAL FEATURES (Optional)
  // ===========================================
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react', 'recharts'],
  },

  // ===========================================
  // TYPESCRIPT CONFIG
  // ===========================================
  // TypeScript error tracking
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
