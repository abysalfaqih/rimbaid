import { connection } from "next/server";
import { checkDatabase } from "@/db/health";
import { getServerEnv } from "@/lib/env/server";

/**
 * Endpoint kesehatan untuk pemantauan uptime.
 * `connection()` memaksa handler berjalan pada saat ada request (bukan di-prerender saat build),
 * sehingga hasilnya benar-benar mencerminkan keadaan server saat itu.
 *
 * Status 200 hanya jika database menjawab; selain itu 503, supaya pemantau uptime bisa
 * memberi peringatan. Detail galat hanya ada di log server, tidak pernah di respons.
 */
export async function GET() {
  await connection();
  const env = getServerEnv();
  const database = await checkDatabase();
  const healthy = database === "ok";

  return Response.json(
    {
      status: healthy ? "ok" : "degraded",
      environment: env.VERCEL_ENV ?? env.NODE_ENV,
      database,
    },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
