import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok-free.app"],

  // El proxy /api -> Laravel local sirve en desarrollo. Por defecto apunta a
  // http://127.0.0.1:8000 (puerto estándar de Laravel) o al BACKEND_URL configurado.
  async rewrites() {
    if (!isDev) return [];
    const backendUrl = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ?? "http://127.0.0.1:8000").replace(/\/$/, "");
    return [
      { source: "/api/:path*", destination: `${backendUrl}/api/:path*` },
      { source: "/sanctum/:path*", destination: `${backendUrl}/sanctum/:path*` },
    ];
  },

  // El CDN de Hostinger (hcdn) cachea el HTML de las paginas prerenderizadas
  // con el `s-maxage=31536000` que emite Next, pero NO purga ese cache al
  // redeployar. Resultado: tras cada deploy sigue sirviendo HTML viejo que
  // apunta a chunks `_next/static/*` ya borrados -> 404 en JS/CSS -> pantalla
  // "This page couldn't load". Forzamos que el documento se revalide en cada
  // carga. Se excluye `_next/` (assets con hash en el nombre, ya immutable) y
  // `api/` para no tocar sus cabeceras propias.
  async headers() {
    // CSP parcial: bloquea clickjacking, plugins e inyeccion de <base>
    // sin tocar la carga de scripts (eso necesita nonces por request; pendiente).
    // OJO: el LiteSpeed de Hostinger FUERZA `Content-Security-Policy:
    // upgrade-insecure-requests` y pisa este header en prod (solo sobrevive
    // en local / otro hosting). El clickjacking igual queda cubierto por
    // X-Frame-Options: DENY de abajo. Una CSP real aqui necesita config a
    // nivel de hPanel.
    const csp = [
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "upgrade-insecure-requests",
    ].join("; ");

    const securityHeaders = [
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: csp },
    ];

    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/:path((?!_next/|api/).*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
