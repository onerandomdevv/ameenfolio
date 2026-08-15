import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  experimental: { authInterrupts: true },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              // GitHub owns admin sign-in. MCP consent posts only to this
              // application; the browser then navigates to the validated,
              // dynamically registered client callback.
              "form-action 'self' https://github.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "connect-src 'self' https://*.neon.tech https://*.aws.neon.tech https://*.r2.cloudflarestorage.com",
            ].join("; "),
          },
        ],
      },
      // Viewing the résumé renders an uploaded file inside this origin, and a
      // PDF can carry script. `sandbox` costs the built-in viewer nothing.
      //
      // It has to live here rather than on the route: headers from this config
      // replace a Route Handler's own header of the same name, so the same line
      // written in the handler is silently dropped. Ordered after the blanket
      // rule above, and narrowed by the query, so only the inline view is
      // sandboxed — a download never executes anything.
      {
        source: "/resume",
        has: [{ type: "query", key: "inline", value: "1" }],
        headers: [{ key: "Content-Security-Policy", value: "sandbox" }],
      },
    ];
  },
};

export default nextConfig;
