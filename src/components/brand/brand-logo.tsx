import Image from "next/image";
import mark from "@/assets/brand/logo-mark.webp";
import { Link } from "@/i18n/navigation";

/** Logo header: ikon mahkota + nama. Tautan ke beranda sesuai bahasa aktif. */
export function BrandLogo({ label }: { label: string }) {
  return (
    <Link href="/" aria-label={label} className="group inline-flex items-center gap-2.5">
      {/* Berkas sudah berukuran pas (160px untuk tampilan 40px), jadi tak perlu dioptimasi ulang */}
      <Image
        src={mark}
        alt=""
        width={40}
        height={40}
        unoptimized
        className="size-10 transition-transform duration-300 group-hover:-rotate-6"
      />
      <span className="font-display text-xl font-extrabold tracking-tight text-fg">
        Rimba <span className="text-gold">ID</span>
      </span>
    </Link>
  );
}
