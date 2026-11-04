import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tender Radar — veřejné zakázky pro malé firmy" },
      { name: "description", content: "Najděte vhodné veřejné zakázky, vyhodnoťte Go/No-Go a řiďte nabídky v týmové pipeline." },
      { property: "og:title", content: "Tender Radar — veřejné zakázky pro malé firmy" },
      { property: "og:description", content: "Najděte vhodné veřejné zakázky, vyhodnoťte Go/No-Go a řiďte nabídky v týmové pipeline." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-hero text-ink-foreground">
      <div className="absolute -right-48 top-24 size-[640px] rounded-full radar-ring opacity-60" />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo light />
        <Button asChild variant="secondary"><Link to="/auth">Přihlásit se</Link></Button>
      </header>
      <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-16 sm:pt-28">
        <p className="font-mono text-xs uppercase tracking-widest text-signal">B2B SaaS · MVP</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-extrabold leading-tight sm:text-6xl">Veřejné zakázky, které dávají smysl vaší firmě.</h1>
        <p className="mt-6 max-w-xl text-lg text-ink-foreground/80">Profil firmy, skóre shody s doporučením Go / Zvážit / No-Go, týmová pipeline, úkoly a hlídání termínů.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-signal text-signal-foreground hover:bg-signal/90"><Link to="/auth">Začít zdarma</Link></Button>
        </div>
        <div className="mt-20 grid gap-4 sm:grid-cols-3">
          {[["Objevujte", "Zakázky filtrované podle CPV, regionu a hodnoty."], ["Vyhodnocujte", "Transparentní skóre a zdůvodnění doporučení."], ["Podávejte", "Kanban, vlastníci, checklisty a termíny."]].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-5"><h3 className="text-lg font-bold">{t}</h3><p className="mt-1 text-sm text-ink-foreground/75">{d}</p></div>
          ))}
        </div>
      </section>
    </div>
  );
}
