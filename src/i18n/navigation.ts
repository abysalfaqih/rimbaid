import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Pembungkus tipis navigasi Next.js yang paham bahasa.
 * Selalu impor `Link`, `redirect`, `usePathname`, `useRouter` dari sini — bukan dari `next/*`.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
