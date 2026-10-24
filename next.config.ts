import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
// Variabel ini otomatis ada saat build di Vercel (bukan di komputer lokal).
const isVercel = Boolean(process.env.VERCEL);
// Deploy "preview" di Vercel (branch/PR) tidak boleh diindeks mesin pencari.
const isPreviewDeploy = process.env.VERCEL_ENV === "preview";

/**
 * Content-Security-Policy.
 *
 * 'unsafe-inline' pada script-src dibutuhkan karena Next.js menyisipkan skrip inline
 * (data RSC). Alternatif yang lebih ketat (nonce) memaksa SEMUA halaman dirender dinamis
 * dan tidak kompatibel dengan Partial Prerendering, sehingga merusak performa/SEO halaman
 * publik. Kekurangan ini kita imbangi dengan direktif lain yang ketat. Peningkatan
 * (nonce untuk /admin atau SRI) dievaluasi di fase pengerasan keamanan.
 *
 * Host Supabase (gambar & koneksi realtime) ditambahkan saat fase terkait membutuhkannya.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Hanya di Vercel (HTTPS). Di localhost (http) direktif ini bisa merusak pemuatan aset.
  ...(isVercel ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // includeSubDomains/preload sengaja belum dipakai sampai domain final ditetapkan.
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isPreviewDeploy ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
