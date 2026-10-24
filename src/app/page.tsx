import { siteConfig } from "@/lib/site";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">{siteConfig.name}</h1>
      <p className="text-zinc-400">Sedang dibangun.</p>
    </main>
  );
}
