import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { LayoutDashboard, Search, KanbanSquare, Building2, Settings, LogOut, Radar, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OrgProvider } from "@/lib/org";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Přehled", icon: LayoutDashboard },
  { to: "/tenders", label: "Zakázky", icon: Search },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/profile", label: "Profil firmy", icon: Building2 },
  { to: "/settings", label: "Nastavení", icon: Settings },
] as const;

export function Logo({ light }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-8 place-items-center rounded-lg bg-signal text-signal-foreground"><Radar className="size-5" /></span>
      <span className={cn("font-display text-lg font-bold", light && "text-sidebar-accent-foreground")}>Tender Radar</span>
    </div>
  );
}

export function AppShell() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["me-membership"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("no user");
      const { data: m, error } = await supabase
        .from("organization_members")
        .select("organization_id, role, organizations(name)")
        .eq("user_id", u.user.id)
        .order("created_at")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return { user: u.user, membership: m };
    },
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isLoading || !data) return <div className="grid min-h-screen place-items-center text-muted-foreground">Načítám…</div>;
  if (!data.membership) return <Onboarding email={data.user.email ?? ""} onDone={() => refetch()} onSignOut={signOut} />;

  const m = data.membership;
  const value = {
    orgId: m.organization_id,
    orgName: m.organizations?.name ?? "",
    role: m.role,
    userId: data.user.id,
    email: data.user.email ?? "",
    canEdit: m.role !== "viewer",
  };

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium" }}
        >
          <n.icon className="size-4" /> {n.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <OrgProvider value={value}>
      <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
        <aside className="sticky top-0 hidden h-screen flex-col justify-between bg-sidebar p-4 lg:flex">
          <div className="space-y-8">
            <Logo light />
            {nav}
          </div>
          <SidebarFooter orgName={value.orgName} email={value.email} onSignOut={signOut} />
        </aside>
        <header className="sticky top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 lg:hidden">
          <Logo light />
          <button onClick={() => setOpen(!open)} className="text-sidebar-accent-foreground" aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </header>
        {open && (
          <div className="fixed inset-x-0 top-14 z-20 space-y-6 bg-sidebar p-4 lg:hidden">
            {nav}
            <SidebarFooter orgName={value.orgName} email={value.email} onSignOut={signOut} />
          </div>
        )}
        <main className="min-w-0 px-4 py-6 sm:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>
    </OrgProvider>
  );
}

function SidebarFooter({ orgName, email, onSignOut }: { orgName: string; email: string; onSignOut: () => void }) {
  return (
    <div className="space-y-3 border-t border-sidebar-border pt-4">
      <div>
        <p className="truncate text-sm font-medium text-sidebar-accent-foreground">{orgName}</p>
        <p className="truncate text-xs text-sidebar-foreground">{email}</p>
      </div>
      <button onClick={onSignOut} className="flex items-center gap-2 text-sm text-sidebar-foreground hover:text-sidebar-accent-foreground">
        <LogOut className="size-4" /> Odhlásit se
      </button>
    </div>
  );
}

function Onboarding({ email, onDone, onSignOut }: { email: string; onDone: () => void; onSignOut: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("create_organization", { _name: name.trim() });
    setBusy(false);
    if (error) return toast.error("Organizaci se nepodařilo vytvořit.");
    toast.success("Organizace vytvořena");
    onDone();
  }
  return (
    <div className="grid min-h-screen place-items-center bg-hero px-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl bg-card p-8 shadow-card">
        <Logo />
        <div>
          <h1 className="text-2xl font-bold">Založte svou firmu</h1>
          <p className="mt-1 text-sm text-muted-foreground">Přihlášen jako {email}. Data vaší firmy uvidí jen členové organizace.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="org">Název firmy</Label>
          <Input id="org" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={120} required placeholder="např. Stavby Novák s.r.o." />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Vytvářím…" : "Pokračovat"}</Button>
        <button type="button" onClick={onSignOut} className="w-full text-center text-sm text-muted-foreground hover:underline">Odhlásit se</button>
      </form>
    </div>
  );
}
