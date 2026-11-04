
-- ============ ENUMS ============
create type public.org_role as enum ('owner','admin','member','viewer');
create type public.pipeline_stage as enum ('nove','k_posouzeni','pripravujeme','ke_schvaleni','podano','uzavreno');
create type public.match_recommendation as enum ('go','consider','nogo');
create type public.automation_status as enum ('queued','sent','failed','processed');
create type public.suggestion_status as enum ('pending','accepted','rejected');

-- ============ TABLES ============
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  role public.org_role not null default 'member',
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index on public.organization_members(user_id);

create table public.company_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  description text not null default '' check (char_length(description) <= 4000),
  industry text not null default '',
  cpv_codes text[] not null default '{}',
  regions text[] not null default '{}',
  value_min numeric,
  value_max numeric,
  capabilities text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.tenders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade, -- null = public/shared
  is_demo boolean not null default false,
  source text not null default 'manual',
  external_ref text,
  title text not null,
  contracting_authority text not null,
  description text not null default '',
  cpv_codes text[] not null default '{}',
  region text,
  value_estimate numeric,
  currency text not null default 'CZK',
  procedure_type text,
  deadline timestamptz,
  published_at timestamptz not null default now(),
  url text,
  requirements text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index on public.tenders(organization_id);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tender_id uuid not null references public.tenders(id) on delete cascade,
  score int not null check (score between 0 and 100),
  recommendation public.match_recommendation not null,
  reasons jsonb not null default '[]',
  method text not null default 'rules_v1',
  computed_at timestamptz not null default now(),
  unique (organization_id, tender_id)
);

create table public.pipeline_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tender_id uuid not null references public.tenders(id) on delete cascade,
  stage public.pipeline_stage not null default 'nove',
  owner_user_id uuid,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, tender_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  pipeline_item_id uuid not null references public.pipeline_items(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  done boolean not null default false,
  assignee_user_id uuid,
  due_date date,
  created_at timestamptz not null default now()
);

create table public.automation_events (
  id uuid primary key default gen_random_uuid(), -- event_id
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_type text not null,
  idempotency_key text not null unique,
  status public.automation_status not null default 'queued',
  attempts int not null default 0,
  last_error text,
  triggered_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.automation_events(organization_id, created_at desc);

create table public.cpv_suggestions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid references public.automation_events(id) on delete set null,
  cpv_code text not null,
  label text,
  confidence numeric check (confidence between 0 and 1),
  status public.suggestion_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (organization_id, cpv_code, event_id)
);

-- ============ HELPER FUNCTIONS ============
create or replace function public.is_org_member(_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members where organization_id = _org and user_id = auth.uid())
$$;

create or replace function public.has_org_role(_org uuid, _roles public.org_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members where organization_id = _org and user_id = auth.uid() and role = any(_roles))
$$;

create or replace function public.can_edit_org(_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_org_role(_org, array['owner','admin','member']::public.org_role[])
$$;

-- Onboarding: the only way to create an org + owner membership
create or replace function public.create_organization(_name text, _display_name text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare _id uuid; _uid uuid := auth.uid(); _email text;
begin
  if _uid is null then raise exception 'not authenticated'; end if;
  if char_length(coalesce(_name,'')) < 2 then raise exception 'invalid name'; end if;
  select email into _email from auth.users where id = _uid;
  insert into public.organizations(name, created_by) values (_name, _uid) returning id into _id;
  insert into public.organization_members(organization_id, user_id, role, display_name, email)
    values (_id, _uid, 'owner', coalesce(_display_name, split_part(_email,'@',1)), _email);
  insert into public.company_profiles(organization_id) values (_id);
  return _id;
end $$;
revoke all on function public.create_organization(text, text) from public, anon;
grant execute on function public.create_organization(text, text) to authenticated;

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger trg_profiles_touch before update on public.company_profiles for each row execute function public.touch_updated_at();
create trigger trg_pipeline_touch before update on public.pipeline_items for each row execute function public.touch_updated_at();
create trigger trg_events_touch before update on public.automation_events for each row execute function public.touch_updated_at();

-- Prevent moving rows between orgs
create or replace function public.lock_org_id() returns trigger language plpgsql set search_path = public as $$
begin if new.organization_id is distinct from old.organization_id then raise exception 'organization_id is immutable'; end if; return new; end $$;
create trigger trg_lock_org_pipeline before update on public.pipeline_items for each row execute function public.lock_org_id();
create trigger trg_lock_org_tasks before update on public.tasks for each row execute function public.lock_org_id();
create trigger trg_lock_org_matches before update on public.matches for each row execute function public.lock_org_id();
create trigger trg_lock_org_members before update on public.organization_members for each row execute function public.lock_org_id();
create trigger trg_lock_org_sugg before update on public.cpv_suggestions for each row execute function public.lock_org_id();

-- ============ GRANTS ============
grant select, update on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, update on public.company_profiles to authenticated;
grant select, insert, update, delete on public.tenders to authenticated;
grant select, insert, update, delete on public.matches to authenticated;
grant select, insert, update, delete on public.pipeline_items to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select on public.automation_events to authenticated;
grant select, update on public.cpv_suggestions to authenticated;
grant all on public.organizations, public.organization_members, public.company_profiles, public.tenders,
  public.matches, public.pipeline_items, public.tasks, public.automation_events, public.cpv_suggestions to service_role;

-- ============ RLS ============
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.company_profiles enable row level security;
alter table public.tenders enable row level security;
alter table public.matches enable row level security;
alter table public.pipeline_items enable row level security;
alter table public.tasks enable row level security;
alter table public.automation_events enable row level security;
alter table public.cpv_suggestions enable row level security;

create policy "members read org" on public.organizations for select to authenticated using (public.is_org_member(id));
create policy "admins update org" on public.organizations for update to authenticated
  using (public.has_org_role(id, array['owner','admin']::public.org_role[]))
  with check (public.has_org_role(id, array['owner','admin']::public.org_role[]));

create policy "members read members" on public.organization_members for select to authenticated using (public.is_org_member(organization_id));
create policy "admins manage members insert" on public.organization_members for insert to authenticated
  with check (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]) and role <> 'owner');
create policy "admins manage members update" on public.organization_members for update to authenticated
  using (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]));
create policy "self update display" on public.organization_members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and role = (select m.role from public.organization_members m where m.id = organization_members.id));
create policy "admins delete members" on public.organization_members for delete to authenticated
  using (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]) and role <> 'owner');

create policy "members read profile" on public.company_profiles for select to authenticated using (public.is_org_member(organization_id));
create policy "editors update profile" on public.company_profiles for update to authenticated
  using (public.can_edit_org(organization_id)) with check (public.can_edit_org(organization_id));

create policy "read public or own tenders" on public.tenders for select to authenticated
  using (organization_id is null or public.is_org_member(organization_id));
create policy "editors insert own tenders" on public.tenders for insert to authenticated
  with check (organization_id is not null and is_demo = false and public.can_edit_org(organization_id));
create policy "editors update own tenders" on public.tenders for update to authenticated
  using (organization_id is not null and public.can_edit_org(organization_id))
  with check (organization_id is not null and public.can_edit_org(organization_id));
create policy "editors delete own tenders" on public.tenders for delete to authenticated
  using (organization_id is not null and public.can_edit_org(organization_id));

do $$ declare t text; begin
  foreach t in array array['matches','pipeline_items','tasks'] loop
    execute format('create policy "members read %1$s" on public.%1$I for select to authenticated using (public.is_org_member(organization_id))', t);
    execute format('create policy "editors insert %1$s" on public.%1$I for insert to authenticated with check (public.can_edit_org(organization_id))', t);
    execute format('create policy "editors update %1$s" on public.%1$I for update to authenticated using (public.can_edit_org(organization_id)) with check (public.can_edit_org(organization_id))', t);
    execute format('create policy "editors delete %1$s" on public.%1$I for delete to authenticated using (public.can_edit_org(organization_id))', t);
  end loop;
end $$;

create policy "members read events" on public.automation_events for select to authenticated using (public.is_org_member(organization_id));
create policy "members read suggestions" on public.cpv_suggestions for select to authenticated using (public.is_org_member(organization_id));
create policy "editors review suggestions" on public.cpv_suggestions for update to authenticated
  using (public.can_edit_org(organization_id)) with check (public.can_edit_org(organization_id));

-- ============ DEMO DATA (public, clearly labeled) ============
insert into public.tenders (is_demo, source, external_ref, title, contracting_authority, description, cpv_codes, region, value_estimate, procedure_type, deadline, published_at, requirements) values
(true,'demo','DEMO-2026-001','[DEMO] Rekonstrukce sociálních zařízení ZŠ Komenského','Město Kolín','Kompletní rekonstrukce sociálních zařízení ve dvou patrech základní školy včetně rozvodů vody a odpadů. Realizace o letních prázdninách.','{45000000-7,45330000-9}','Středočeský kraj',3200000,'Zjednodušené podlimitní řízení', now() + interval '12 days', now() - interval '3 days','{"Reference: 3 obdobné zakázky za 5 let","Pojištění odpovědnosti min. 5 mil. Kč","Výpis z obchodního rejstříku"}'),
(true,'demo','DEMO-2026-002','[DEMO] Dodávka a implementace docházkového systému','Krajská nemocnice Liberec, a.s.','Dodávka SW pro evidenci docházky pro cca 1 800 zaměstnanců, integrace na mzdový systém, školení a 4 roky podpory.','{48000000-8,72260000-5}','Liberecký kraj',2450000,'Otevřené řízení', now() + interval '21 days', now() - interval '5 days','{"ISO 27001 výhodou","Reference implementace min. 500 uživatelů","Garance SLA 99,5 %"}'),
(true,'demo','DEMO-2026-003','[DEMO] Úklidové služby administrativních budov','Úřad práce ČR – krajská pobočka Brno','Pravidelný úklid 4 budov o celkové ploše 9 500 m² na dobu 36 měsíců.','{90910000-9,90919200-4}','Jihomoravský kraj',7800000,'Otevřené řízení', now() + interval '5 days', now() - interval '10 days','{"Min. 20 zaměstnanců","Certifikát ISO 9001","Prohlídka místa plnění"}'),
(true,'demo','DEMO-2026-004','[DEMO] Webový portál pro turistický region','Destinační společnost Šumava, z.s.','Návrh a vývoj responzivního webového portálu s CMS, mapovými podklady a vícejazyčnou verzí (CZ/DE/EN).','{72413000-8,72212000-4}','Jihočeský kraj',890000,'Zakázka malého rozsahu', now() + interval '9 days', now() - interval '2 days','{"Portfolio min. 3 weby","Přístupnost WCAG 2.1 AA"}'),
(true,'demo','DEMO-2026-005','[DEMO] Oprava místní komunikace Na Výsluní','Obec Dolní Břežany','Oprava povrchu komunikace v délce 640 m včetně odvodnění a obnovy vodorovného dopravního značení.','{45233140-2,45233142-6}','Středočeský kraj',5600000,'Zjednodušené podlimitní řízení', now() + interval '16 days', now() - interval '1 day','{"Reference silničních staveb","Autorizovaná osoba – dopravní stavby"}'),
(true,'demo','DEMO-2026-006','[DEMO] Dodávka kancelářského nábytku','Statutární město Ostrava','Dodávka a montáž kancelářského nábytku pro nové administrativní centrum (cca 220 pracovních míst).','{39130000-2,39110000-6}','Moravskoslezský kraj',4100000,'Otevřené řízení', now() + interval '28 days', now() - interval '4 days','{"Vzorky vybraných kusů","Záruka 5 let"}'),
(true,'demo','DEMO-2026-007','[DEMO] Kybernetický audit a penetrační testy','Kraj Vysočina','Provedení auditu kybernetické bezpečnosti dle ZKB a penetrační testy 12 aplikací.','{72800000-8,79212000-3}','Kraj Vysočina',1350000,'Zjednodušené podlimitní řízení', now() + interval '3 days', now() - interval '12 days','{"Auditor KB s certifikací","Reference z veřejné správy"}'),
(true,'demo','DEMO-2026-008','[DEMO] Catering pro konference 2027','Technologická agentura ČR','Zajištění občerstvení pro cca 25 akcí ročně v Praze, kapacita 50–400 osob.','{55520000-1}','Hlavní město Praha',1900000,'Zakázka malého rozsahu', now() + interval '34 days', now() - interval '6 days','{"Reference akcí nad 200 osob","HACCP"}');
