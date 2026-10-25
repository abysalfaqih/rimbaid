import localFont from "next/font/local";

/**
 * Font di-host sendiri: berkas .woff2 berasal dari paket fontsource di node_modules
 * (versinya terkunci di lockfile). Tidak ada permintaan ke Google saat build maupun saat
 * pengunjung membuka situs, sehingga CSP cukup `font-src 'self'` dan privasi pengunjung terjaga.
 *
 * - Display (judul): Bricolage Grotesque, varian `opsz`. Sumbu optical size membuat huruf
 *   tampil rapat dan berkarakter pada ukuran besar.
 * - Body (teks): Plus Jakarta Sans, dirancang di Indonesia dan sangat terbaca di layar kecil.
 *
 * Hanya subset Latin. Karakter di luar itu otomatis memakai font sistem.
 */
export const fontDisplay = localFont({
  src: "../../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2",
  variable: "--font-face-display",
  weight: "200 800",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const fontBody = localFont({
  src: "../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2",
  variable: "--font-face-body",
  weight: "200 800",
  display: "swap",
  adjustFontFallback: "Arial",
});
