import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifySignature } from "@/lib/signing";

/**
 * Signed pull endpoint: Make fetches the NON-SENSITIVE profile fields for a pending event.
 * GET /api/public/make/profile?event_id=… with X-TR-Timestamp + X-TR-Signature over `${ts}.${event_id}`.
 * Only works while the event is queued/sent — closed events cannot be used to read data.
 */
export const Route = createFileRoute("/api/public/make/profile")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["MAKE_SIGNING_SECRET"];
        if (!secret) return Response.json({ error: "not_configured" }, { status: 503 });
        const eventId = new URL(request.url).searchParams.get("event_id") ?? "";
        if (!z.string().uuid().safeParse(eventId).success) return Response.json({ error: "invalid_event_id" }, { status: 400 });
        const ok = await verifySignature({
          secret,
          timestamp: request.headers.get("x-tr-timestamp"),
          signature: request.headers.get("x-tr-signature"),
          payload: eventId,
        });
        if (!ok) return Response.json({ error: "invalid_signature" }, { status: 401 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: event } = await supabaseAdmin
          .from("automation_events").select("organization_id, status, event_type").eq("id", eventId).maybeSingle();
        if (!event || event.event_type !== "profile.analyze" || !["queued", "sent"].includes(event.status))
          return Response.json({ error: "not_found" }, { status: 404 });

        const { data: p } = await supabaseAdmin
          .from("company_profiles")
          .select("industry, description, capabilities, regions, cpv_codes")
          .eq("organization_id", event.organization_id).single();
        return Response.json({ event_id: eventId, profile: p });
      },
    },
  },
});
