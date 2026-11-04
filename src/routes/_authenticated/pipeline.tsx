import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/lib/org";
import { STAGES, type Stage } from "@/lib/constants";
import { DeadlineChip, DemoBadge } from "@/components/app/badges";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/pipeline")({
  head: () => ({ meta: [{ title: "Pipeline — Tender Radar" }, { name: "description", content: "Týmová Kanban pipeline zakázek." }, { property: "og:title", content: "Pipeline — Tender Radar" }, { property: "og:description", content: "Týmová Kanban pipeline zakázek." }] }),
  component: Pipeline,
});

function Pipeline() {
  const { orgId, canEdit } = useOrg();
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: items = [] } = useQuery({ queryKey: ["pipeline", orgId], queryFn: async () => (await supabase.from("pipeline_items").select("*, tenders(title, deadline, is_demo), tasks(id, done)").eq("organization_id", orgId)).data ?? [] });
  const { data: members = [] } = useQuery({ queryKey: ["members", orgId], queryFn: async () => (await supabase.from("organization_members").select("user_id, display_name, email").eq("organization_id", orgId)).data ?? [] });
  const move = useMutation({ mutationFn: async ({ id, stage }: { id: string; stage: Stage }) => { const { error } = await supabase.from("pipeline_items").update({ stage }).eq("id", id); if (error) throw error; }, onSuccess: () => qc.invalidateQueries({ queryKey: ["pipeline"] }), onError: () => toast.error("Přesun se nezdařil") });
  const name = (uid: string | null) => members.find((m) => m.user_id === uid)?.display_name ?? "—";
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pipeline</h1>
      {!items.length && <p className="text-muted-foreground">Pipeline je prázdná. <Link to="/tenders" className="text-primary underline">Přidejte zakázky</Link>.</p>}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((s) => (
          <div key={s.id} className="w-72 shrink-0 rounded-xl bg-muted p-3" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const id = e.dataTransfer.getData("id"); if (id && canEdit) move.mutate({ id, stage: s.id }); }}>
            <h2 className="mb-3 flex justify-between px-1 text-sm font-bold">{s.label}<span className="text-muted-foreground">{items.filter((i) => i.stage === s.id).length}</span></h2>
            <div className="min-h-24 space-y-2">
              {items.filter((i) => i.stage === s.id).map((i) => (
                <button key={i.id} draggable={canEdit} onDragStart={(e) => e.dataTransfer.setData("id", i.id)} onClick={() => setOpenId(i.id)} className="w-full space-y-2 rounded-lg bg-card p-3 text-left shadow-card hover:shadow-lift">
                  <div className="flex gap-2">{i.tenders?.is_demo && <DemoBadge />}<DeadlineChip deadline={i.tenders?.deadline ?? null} /></div>
                  <p className="text-sm font-medium leading-snug">{i.tenders?.title.replace("[DEMO] ", "")}</p>
                  <p className="text-xs text-muted-foreground">{name(i.owner_user_id)} · úkoly {i.tasks.filter((t) => t.done).length}/{i.tasks.length}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {openId && <ItemDialog id={openId} members={members} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function ItemDialog({ id, members, onClose }: { id: string; members: { user_id: string; display_name: string | null }[]; onClose: () => void }) {
  const { orgId, canEdit } = useOrg();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const { data } = useQuery({ queryKey: ["pipeline-item", id], queryFn: async () => (await supabase.from("pipeline_items").select("*, tenders(id, title), tasks(*)").eq("id", id).single()).data });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["pipeline-item", id] }); qc.invalidateQueries({ queryKey: ["pipeline"] }); qc.invalidateQueries({ queryKey: ["tasks-all"] }); };
  const run = async (p: PromiseLike<{ error: unknown }>) => { const { error } = await p; if (error) toast.error("Akce se nezdařila"); refresh(); };
  if (!data) return null;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{data.tenders?.title}</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1"><span className="text-muted-foreground">Fáze</span><select disabled={!canEdit} className="h-9 w-full rounded-md border bg-card px-2" value={data.stage} onChange={(e) => run(supabase.from("pipeline_items").update({ stage: e.target.value as Stage }).eq("id", id))}>{STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
            <label className="space-y-1"><span className="text-muted-foreground">Vlastník</span><select disabled={!canEdit} className="h-9 w-full rounded-md border bg-card px-2" value={data.owner_user_id ?? ""} onChange={(e) => run(supabase.from("pipeline_items").update({ owner_user_id: e.target.value || null }).eq("id", id))}><option value="">—</option>{members.map((m) => <option key={m.user_id} value={m.user_id}>{m.display_name}</option>)}</select></label>
          </div>
          <div>
            <h3 className="mb-2 font-bold">Checklist</h3>
            <ul className="space-y-1">
              {data.tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                  <input type="checkbox" disabled={!canEdit} checked={t.done} onChange={() => run(supabase.from("tasks").update({ done: !t.done }).eq("id", t.id))} />
                  <span className={t.done ? "flex-1 text-muted-foreground line-through" : "flex-1"}>{t.title}</span>
                  {t.due_date && <DeadlineChip deadline={t.due_date} />}
                  {canEdit && <button className="text-xs text-destructive" onClick={() => run(supabase.from("tasks").delete().eq("id", t.id))}>Smazat</button>}
                </li>
              ))}
            </ul>
            {canEdit && (
              <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; run(supabase.from("tasks").insert({ organization_id: orgId, pipeline_item_id: id, title: title.trim(), due_date: due || null })); setTitle(""); setDue(""); }}>
                <Input placeholder="Nový úkol" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} />
                <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-36" />
                <Button>Přidat</Button>
              </form>
            )}
          </div>
          {canEdit && <Button variant="ghost" className="text-destructive" onClick={async () => { await run(supabase.from("pipeline_items").delete().eq("id", id)); onClose(); }}>Odebrat z pipeline</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
