import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app/AppShell";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Přihlášení — Tender Radar" },
      { name: "description", content: "Přihlaste se do Tender Radar a sledujte veřejné zakázky pro vaši firmu." },
      { property: "og:title", content: "Přihlášení — Tender Radar" },
      { property: "og:description", content: "Přihlaste se do Tender Radar a sledujte veřejné zakázky pro vaši firmu." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && navigate({ to: "/dashboard" }));
  }, [navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setInfo(null);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/dashboard" } });
        if (error) throw error;
        if (data.session) navigate({ to: "/dashboard" });
        else setInfo("Poslali jsme vám e-mail s potvrzovacím odkazem. Po potvrzení se přihlaste.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        setInfo("Pokud účet existuje, odeslali jsme odkaz pro obnovu hesla.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Akce se nezdařila");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Přihlášení přes Google se nezdařilo");
    else if (!r.redirected) navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-hero p-12 text-ink-foreground lg:flex lg:flex-col lg:justify-between">
        <Link to="/"><Logo light /></Link>
        <div className="absolute -right-40 top-1/3 size-[520px] rounded-full radar-ring opacity-70" />
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold">Méně hledání. Více podaných nabídek.</h2>
          <p className="mt-4 text-ink-foreground/80">Zakázky podle vašeho profilu, týmová pipeline a termíny pod kontrolou.</p>
        </div>
        <p className="relative text-xs text-ink-foreground/60">Studentský projekt · MVP</p>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden"><Logo /></div>
          <div>
            <h1 className="text-3xl font-bold">{mode === "in" ? "Přihlášení" : mode === "up" ? "Registrace" : "Obnova hesla"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{mode === "up" ? "Vytvořte si účet pro svou firmu." : "Vítejte zpět v Tender Radar."}</p>
          </div>
          {mode !== "forgot" && (
            <>
              <Button variant="outline" className="w-full" onClick={google} type="button">Pokračovat přes Google</Button>
              <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />nebo e-mailem<span className="h-px flex-1 bg-border" /></div>
            </>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="pw">Heslo</Label>
                <Input id="pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "up" ? "new-password" : "current-password"} />
              </div>
            )}
            {info && <p className="rounded-md bg-accent p-3 text-sm text-accent-foreground">{info}</p>}
            <Button className="w-full" disabled={busy}>
              {busy ? "Čekejte…" : mode === "in" ? "Přihlásit se" : mode === "up" ? "Zaregistrovat se" : "Odeslat odkaz"}
            </Button>
          </form>
          <div className="flex justify-between text-sm">
            {mode === "in" ? (
              <>
                <button className="text-primary hover:underline" onClick={() => setMode("up")}>Nemáte účet?</button>
                <button className="text-muted-foreground hover:underline" onClick={() => setMode("forgot")}>Zapomenuté heslo</button>
              </>
            ) : (
              <button className="text-primary hover:underline" onClick={() => setMode("in")}>← Zpět na přihlášení</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
