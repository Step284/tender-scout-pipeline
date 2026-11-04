import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hmacHex } from "@/lib/signing";

/**
 * trigger-make-profile (scenario 01).
 * 1. Validates the session (middleware) and org membership with edit rights (RLS-scoped query).
 * 2. Creates/reuses an idempotent automation_event (key = org + profile version).
 * 3. POSTs a minimal envelope to Make ONLY if MAKE_PROFILE_WEBHOOK_URL secret exists.
 * Never returns the webhook URL or keys; never sends profile content in the envelope.
 */
export const triggerMakeProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ organizationId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: member } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", data.organizationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!member || member.role === "viewer") {
      return { ok: false as const, code: "forbidden", message: "Nemáte oprávnění spustit analýzu." };
    }

    const { data: profile } = await supabase
      .from("company_profiles")
      .select("updated_at")
      .eq("organization_id", data.organizationId)
      .maybeSingle();
    if (!profile) return { ok: false as const, code: "no_profile", message: "Profil firmy nebyl nalezen." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const eventType = "profile.analyze";
    const idempotencyKey = `${eventType}:${data.organizationId}:${profile.updated_at}`;

    let { data: event } = await supabaseAdmin
      .from("automation_events")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (event && (event.status === "sent" || event.status === "processed")) {
      return { ok: true as const, deduplicated: true, eventId: event.id, status: event.status };
    }
    if (!event) {
      const ins = await supabaseAdmin
        .from("automation_events")
        .insert({ organization_id: data.organizationId, event_type: eventType, idempotency_key: idempotencyKey, triggered_by: userId })
        .select("*")
        .single();
      if (ins.error) {
        // race: another request inserted the same key
        const again = await supabaseAdmin.from("automation_events").select("*").eq("idempotency_key", idempotencyKey).single();
        event = again.data;
      } else event = ins.data;
    }
    if (!event) return { ok: false as const, code: "db_error", message: "Událost se nepodařilo uložit." };

    const attempts = event.attempts + 1;
    const url = process.env["MAKE_PROFILE_WEBHOOK_URL"];
    if (!url) {
      await supabaseAdmin
        .from("automation_events")
        .update({ status: "failed", attempts, last_error: "make_not_configured" })
        .eq("id", event.id);
      return {
        ok: false as const,
        code: "make_not_configured",
        eventId: event.id,
        status: "failed" as const,
        message: "Make není připojen. Událost je uložena jako neodeslaná.",
      };
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify({
      event_id: event.id,
      event_type: eventType,
      organization_id: data.organizationId,
      timestamp: new Date().toISOString(),
    });
    const headers: Record<string, string> = { "content-type": "application/json", "x-tr-timestamp": timestamp };
    const signingSecret = process.env["MAKE_SIGNING_SECRET"];
    if (signingSecret) headers["x-tr-signature"] = await hmacHex(signingSecret, `${timestamp}.${body}`);
    const apiKey = process.env["MAKE_API_KEY"];
    if (apiKey) headers["x-make-apikey"] = apiKey;

    try {
      const res = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`http_${res.status}`);
      await supabaseAdmin.from("automation_events").update({ status: "sent", attempts, last_error: null }).eq("id", event.id);
      return { ok: true as const, deduplicated: false, eventId: event.id, status: "sent" as const };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      await supabaseAdmin.from("automation_events").update({ status: "failed", attempts, last_error: `delivery_failed:${msg}` }).eq("id", event.id);
      return { ok: false as const, code: "delivery_failed", eventId: event.id, status: "failed" as const, message: "Odeslání do Make selhalo. Zkuste to znovu později." };
    }
  });

/** Exposes only booleans — never secret values. */
export const getIntegrationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => ({
    makeWebhook: Boolean(process.env["MAKE_PROFILE_WEBHOOK_URL"]),
    makeSigning: Boolean(process.env["MAKE_SIGNING_SECRET"]),
    makeApiKey: Boolean(process.env["MAKE_API_KEY"]),
  }));
