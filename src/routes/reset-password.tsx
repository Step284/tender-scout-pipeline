import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nové heslo — Tender Radar" },
      { name: "description", content: "Nastavte si nové heslo k účtu Tender Radar." },
      { property: "og:title", content: "Nové heslo — Tender Radar" },
      { property: "og:description", content: "Nastavte si nové heslo k účtu Tender Radar." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Heslo změněno");
    navigate({ to: "/dashboard" });
  }
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-8 shadow-card">
        <h1 className="text-2xl font-bold">Nastavit nové heslo</h1>
        <div className="space-y-2">
          <Label htmlFor="pw">Nové heslo</Label>
          <Input id="pw" type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <Button className="w-full">Uložit heslo</Button>
      </form>
    </div>
  );
}
