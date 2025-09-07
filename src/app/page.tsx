import { PWABanner } from "@/components/pwa/PWAInstall";

export default function Home() {
  return (
    <div className="home p-4">
      {/* PWA Installation Banner */}
      <PWABanner />
      
      <section className="home__section mx-auto max-w-md">
        <h1 className="home__title text-xl font-semibold mb-2">Welcome</h1>
        <p className="home__intro text-sm opacity-80">Use the menu to open Settings and pick a technique. The breathing animation will appear here in the next step.</p>
        <div className="home__preview mt-6 h-[320px] rounded-[var(--radius)] bg-[radial-gradient(circle_at_50%_40%,_color-mix(in_oklab,_var(--primary)_20%,_transparent),_transparent_60%)] border border-black/5 dark:border-white/10 flex items-center justify-center">
          <span className="home__preview-label text-sm opacity-70">Breathing area</span>
        </div>
      </section>
    </div>
  );
}
