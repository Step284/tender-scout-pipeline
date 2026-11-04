# Tender Radar – setup & bezpečnost

## Multitenance
- Každá tabulka nese `organization_id`; RLS povoluje přístup jen členům (`is_org_member`, `can_edit_org`).
- Organizaci lze založit jen přes RPC `create_organization` (vytvoří vlastníka). Klient nemůže sám sebe přidat do cizí organizace.
- `organization_id` je po vložení neměnný (trigger).
- Veřejné/DEMO zakázky mají `organization_id = null` a jsou jen ke čtení.

## Make – scénář 01 (`trigger-make-profile` = server fn `triggerMakeProfile`)
Tajné hodnoty (Project Settings → Secrets):
- `MAKE_PROFILE_WEBHOOK_URL` – URL Make webhooku (povinné pro odeslání)
- `MAKE_SIGNING_SECRET` – HMAC klíč pro podpis odchozích i příchozích volání
- `MAKE_API_KEY` – volitelně, posílá se v hlavičce `x-make-apikey`

Odchozí tělo: `{ event_id, event_type: "profile.analyze", organization_id, timestamp }`, hlavičky `x-tr-timestamp`, `x-tr-signature = hex(HMAC_SHA256(secret, ts + "." + body))`.
Idempotence: klíč `profile.analyze:<org>:<profile.updated_at>`. Bez URL se událost uloží jako `failed` s `make_not_configured`.

Make pak:
1. `GET /api/public/make/profile?event_id=…` (podpis nad `ts.event_id`) – vrátí jen nesensitivní pole profilu.
2. `POST /api/public/make/callback` (podpis nad `ts.rawBody`) s `{ event_id, status: "processed"|"failed", suggestions: [{cpv_code, label, confidence}] }`.

## Demo test
1. Registrace → založení firmy → Profil firmy (vyplnit CPV 45000000-7, Středočeský kraj, 1–6 mil.) → Uložit.
2. Zakázky → „Přepočítat shodu“ → DEMO zakázky se skóre a Go/Zvážit/No-Go.
3. „Do pipeline“ → Pipeline: přetahování mezi fázemi, vlastník, checklist.
4. Profil → „Analyzovat profil“ → bez secretů zobrazí „Make není připojen“, v Nastavení je událost `failed`.

## Plánované scénáře
02 TED API, 03 AI Go/No-Go, 04 checklisty z dokumentace, 05 termíny a eskalace, 06 reporting. Nahrávání dokumentů zatím vypnuto (plán: soukromý bucket, PDF, max 10 MB).
