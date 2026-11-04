import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifySignature } from "@/lib/signing";

/**
 * Make → Tender Radar callback (scenario 01 result).
 * Auth: X-TR-Timestamp + X-TR-Signature = HMAC-SHA256(MAKE_SIGNING_SECRET, `${ts}.${rawBody}`).
 * The organization is ALWAYS taken from the stored event, never from the request body.
 */
const Body = z.object({
  event_id: z.string().uuid(),
  status: z.enum(["processed", "failed"]),
  error: z.string().max(500).optional(),
  suggestions: z
    .array(z.object({
      cpv_code: z.string().regex(/^\d{8}-\d$/),
      label: z.string().max(200).optional(),
      confidence: z.number().min(0).max(1).optional(),
    }))
    .max(50)
    .default([]),
});

export const Route = createFileRoute("/api/public/make/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["MAKE_SIGNING_SECRET"];
        if (!secret) return Response.json({ error: "callback_not_configured" }, { status: 503 });

        const raw = await request.text();
        if (raw.length > 50_000) return Response.json({ error: "payload_too_large" }, { status: 413 });
        const ok = await verifySignature({
          secret,
          timestamp: request.headers.get("x-tr-timestamp"),
          signature: request.headers.get("x-tr-signature"),
          payload: raw,
        });
        if (!ok) return Response.json({ error: "invalid_signature" }, { status: 401 });

        let parsed;
        try { parsed = Body.parse(JSON.parse(raw)); } catch { return Response.json({ error: "invalid_body" }, { status: 400 }); }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: event } = await supabaseAdmin
          .from("automation_events").select("id, organization_id, event_type, status")
          .eq("id", parsed.event_id).maybeSingle();
        if (!event || event.event_type !== "profile.analyze") return Response.json({ error: "unknown_event" }, { status: 404 });
        if (event.status === "processed") return Response.json({ ok: true, deduplicated: true });

        if (parsed.status === "processed" && parsed.suggestions.length) {
          const { error } = await supabaseAdmin.from("cpv_suggestions").upsert(
            parsed.suggestions.map((s) => ({
              organization_id: event.organization_id,
              event_id: event.id,
              cpv_code: s.cpv_code,
              label: s.label ?? null,
              confidence: s.confidence ?? null,
            })),
            { onConflict: "organization_id,cpv_code,event_id", ignoreDuplicates: true },
          );
          if (error) return Response.json({ error: "db_error" }, { status: 500 });
        }
        await supabaseAdmin.from("automation_events")
          .update({ status: parsed.status, last_error: parsed.status === "failed" ? (parsed.error ?? "make_failed") : null })
          .eq("id", event.id);
        return Response.json({ ok: true });
      },
    },
  },
});
