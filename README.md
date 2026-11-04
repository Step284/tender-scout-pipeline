# Tender Scout Pipeline

Build a new app named Tender Radar, an attractive, functional, responsive Czech-language B2B SaaS MVP for small businesses handling public tenders. We are a 10-student university team. Build carefully in THIS newly created project only; do not touch other projects or publish. Product: a company signs in, sets company profile (company description, industry, CPV codes, regions, tender value ranges, non-sensitive capabilities), sees discoverable public tenders with demo items prominently labeled DEMO, reviews tender details, match score and reasoned Go/Consider/No-Go, moves tenders through team Kanban stages (Nové, K posouzení, Připravujeme, Ke schválení, Podáno, Uzavřeno), assigns owners and checklist tasks, deadline reminders, overview dashboard and settings. UI should be professional Czech, with navigation, cards, filters, meaningful demo content and working interactions. Integrate the default Lovable backend stack (database/auth) and set up multitenant isolation: organizations, organization_members with roles, company_profiles, tenders, matches, pipeline_items, tasks, automation_events, cpv_suggestions. Apply row level security and verify session/org membership on backend; no frontend-controlled org access; limit uploaded documents and keep company-specific data private. First automation: button 'Analyzovat profil' creates an idempotent queued event via secure backend function trigger-make-profile, after auth validation, with event_id, event_type='profile.analyze', organization_id and timestamp. Function should POST to Make webhook only if URL configured as backend secret, optionally signed API credential as secret, never put webhook URL/key in client or expose confidential firm data. With no Make endpoint configured, show transparent 'Make není připojen' error and preserve queued/failed status rather than claiming success. Make later will process CPV suggestions and update via authenticated callback backend. Provide secure documented setup and demo test path; no fictional successful external integrations. Future planned six scenarios: 01 profile CPV, 02 daily TED API discovery, 03 AI Go/NoGo, 04 public tender documentation checklists, 05 deadlines and escalations, 06 reporting. Keep code modular and prepared for GitHub collaboration. Build initial app and backend scaffolding as far as workspace credits permit.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6847240d-613e-4c3c-a075-0d54309cb8c3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
