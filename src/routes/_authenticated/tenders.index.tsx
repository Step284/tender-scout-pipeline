import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { useOrg } from "@/lib/org";
import { fetchTendersWithMatches, addToPipeline } from "@/lib/queries";
import { recomputeMatches } from "@/server/matches.functions";
import { REGIONS, formatCZK } from "@/lib/constants";
import { DeadlineChip, DemoBadge, RecBadge, ScoreRing } from "@/components/app/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/tenders/")({
  head: () => ({ meta: [{ title: "Zakázky — Tender Radar" }, { name: "description", content: "Vyhledávání veřejných zakázek." }, { property: "og:title", content: "Zakázky — Tender Radar" }, { property: "og:description", content: "Vyhledávání veřejných zakázek." }] }),
  component: Tenders,
});

function Tenders() {
  const { orgId, userId, canEdit } = useOrg();
  const qc = useQueryClient();
  const recompute = useServerFn(recomputeMatches);
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [rec, setRec] = useState("");
  const { data = [], isLoading } = useQuery({ queryKey: ["tenders", orgId], queryFn: () => fetchTendersWithMatches(orgId) });
  const recalc = useMutation({ mutationFn: () => recompute({ data: { organizationId: orgId } }), onSuccess: (r) => { toast.success(`Přepočítáno ${r.count} zakázek`); qc.invalidateQueries({ queryKey: ["tenders"] }); }, onError: (e) => toast.error(e.message) });
  const add = useMutation({ mutationFn: (id: string) => addToPipeline(orgId, id, userId), onSuccess: () => { toast.success("Přidáno do pipeline"); qc.invalidateQueries({ queryKey: ["tenders"] }); }, onError: () => toast.error("Nepodařilo se přidat") });

  const list = data.filter((t) => (!q || `${t.title} ${t.contracting_authority} ${t.cpv_codes.join(" ")}`.toLowerCase().includes(q.toLowerCase())) && (!region || t.region === region) && (!rec || t.match?.recommendation === rec));
  const sel = "h-9 rounded-md border border-input bg-card px-3 text-sm";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-bold">Zakázky</h1><p className="text-sm text-muted-foreground">Položky označené DEMO jsou ukázková data, nikoli skutečné zakázky.</p></div>
        {canEdit && <Button onClick={() => recalc.mutate()} disabled={recalc.isPending}>{recalc.isPending ? "Počítám…" : "Přepočítat shodu"}</Button>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Hledat název, zadavatele, CPV…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs bg-card" />
        <select className={sel} value={region} onChange={(e) => setRegion(e.target.value)}><option value="">Všechny regiony</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select>
        <select className={sel} value={rec} onChange={(e) => setRec(e.target.value)}><option value="">Všechna doporučení</option><option value="go">Go</option><option value="consider">Zvážit</option><option value="nogo">No-Go</option></select>
      </div>
      {isLoading ? <p className="text-muted-foreground">Načítám…</p> : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((t) => (
            <article key={t.id} className="flex flex-col gap-3 rounded-xl bg-card p-5 shadow-card transition hover:shadow-lift">
              <div className="flex items-start gap-4">
                {t.match ? <ScoreRing score={t.match.score} /> : <div className="grid size-[52px] shrink-0 place-items-center rounded-full bg-muted text-xs text-muted-foreground">—</div>}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">{t.is_demo && <DemoBadge />}{t.match && <RecBadge rec={t.match.recommendation} />}<DeadlineChip deadline={t.deadline} /></div>
                  <Link to="/tenders/$id" params={{ id: t.id }} className="font-display font-bold leading-snug hover:underline">{t.title.replace("[DEMO] ", "")}</Link>
                  <p className="text-sm text-muted-foreground">{t.contracting_authority} · {t.region}</p>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <span className="font-medium">{formatCZK(t.value_estimate)}</span>
                {t.pipeline ? <span className="text-xs text-muted-foreground">V pipeline</span> : canEdit && <Button size="sm" variant="outline" onClick={() => add.mutate(t.id)}>Do pipeline</Button>}
              </div>
            </article>
          ))}
          {!list.length && <p className="text-muted-foreground">Žádné zakázky neodpovídají filtru.</p>}
        </div>
      )}
      {data.length > 0 && !data.some((t) => t.match) && <p className="text-sm text-muted-foreground">Tip: vyplňte profil firmy a klikněte na „Přepočítat shodu“.</p>}
    </div>
  );
}
