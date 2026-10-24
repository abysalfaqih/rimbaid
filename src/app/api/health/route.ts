import { connection } from "next/server";
import { getServerEnv } from "@/lib/env/server";

/**
 * Endpoint kesehatan untuk pemantauan uptime.
 * `connection()` memaksa handler berjalan pada saat ada request (bukan di-prerender saat build),
 * sehingga hasilnya benar-benar mencerminkan keadaan server saat itu.
 * Di fase database, pengecekan koneksi DB ditambahkan di sini.
 */
export async function GET() {
  await connection();
  const env = getServerEnv();

  return Response.json(
    { status: "ok", environment: env.VERCEL_ENV ?? env.NODE_ENV },
    { headers: { "Cache-Control": "no-store" } },
  );
}
