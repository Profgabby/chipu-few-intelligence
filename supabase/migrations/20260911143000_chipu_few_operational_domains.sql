-- CHIPU-FEW Intelligence operational domains
-- Additive migration only. Legacy CropSmart/cs_* resources remain unchanged.

create extension if not exists pgcrypto;

create table if not exists public.cfew_places (
  id uuid primary key default gen_random_uuid(),
  project_id text,
  farm_id text not null,
  name text not null,
  administrative_area text,
  latitude double precision,
  longitude double precision,
  land_area_ha double precision check (land_area_ha is null or land_area_ha >= 0),
  land_use text,
  soil_context jsonb not null default '{}'::jsonb,
  elevation_m double precision,
  water_context jsonb not null default '{}'::jsonb,
  energy_context jsonb not null default '{}'::jsonb,
  infrastructure jsonb not null default '{}'::jsonb,
  cropping_system jsonb not null default '[]'::jsonb,
  regulatory_constraints jsonb not null default '[]'::jsonb,
  hazards jsonb not null default '[]'::jsonb,
  source text not null default 'MANUAL',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cfew_places_farm_idx on public.cfew_places (farm_id);
create index if not exists cfew_places_project_idx on public.cfew_places (project_id) where project_id is not null;

create table if not exists public.cfew_stakeholders (
  id uuid primary key default gen_random_uuid(),
  project_id text,
  farm_id text not null,
  place_id uuid references public.cfew_places(id) on delete set null,
  display_name text not null,
  stakeholder_type text not null,
  role text,
  decision_authority text,
  organization text,
  contact_reference text,
  adoption_readiness text,
  trust_notes text,
  decision_notes text,
  active boolean not null default true,
  source text not null default 'MANUAL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cfew_stakeholders_farm_idx on public.cfew_stakeholders (farm_id);
create index if not exists cfew_stakeholders_place_idx on public.cfew_stakeholders (place_id);

create table if not exists public.cfew_stakeholder_preferences (
  id uuid primary key default gen_random_uuid(),
  stakeholder_id uuid not null references public.cfew_stakeholders(id) on delete cascade,
  priority_domain text not null check (priority_domain in ('FOOD','ENERGY','WATER','COST','RELIABILITY','AUTONOMY','LAND','EQUITY','OTHER')),
  priority_label text not null,
  weight double precision check (weight is null or (weight >= 0 and weight <= 1)),
  constraint_text text,
  perceived_benefit text,
  perceived_risk text,
  evidence_note text,
  created_at timestamptz not null default now()
);

create index if not exists cfew_preferences_stakeholder_idx on public.cfew_stakeholder_preferences (stakeholder_id);

create table if not exists public.cfew_resilience_scenarios (
  id uuid primary key default gen_random_uuid(),
  project_id text,
  farm_id text not null,
  zone_id text,
  place_id uuid references public.cfew_places(id) on delete set null,
  name text not null,
  scenario_type text not null,
  stressors jsonb not null default '[]'::jsonb,
  assumptions jsonb not null default '{}'::jsonb,
  source_scenario_id text,
  model_version text not null default 'CHIPU-RESILIENCE-0.1.0',
  status text not null default 'CONFIGURED' check (status in ('CONFIGURED','RUNNING','COMPLETED','FAILED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cfew_resilience_scenarios_farm_idx on public.cfew_resilience_scenarios (farm_id, created_at desc);

create table if not exists public.cfew_resilience_results (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.cfew_resilience_scenarios(id) on delete cascade,
  state_id text,
  run_id text,
  strategy text,
  vulnerability_index double precision check (vulnerability_index is null or (vulnerability_index >= 0 and vulnerability_index <= 1)),
  resilience_index double precision check (resilience_index is null or (resilience_index >= 0 and resilience_index <= 100)),
  water_continuity double precision check (water_continuity is null or (water_continuity >= 0 and water_continuity <= 1)),
  energy_continuity double precision check (energy_continuity is null or (energy_continuity >= 0 and energy_continuity <= 1)),
  food_continuity double precision check (food_continuity is null or (food_continuity >= 0 and food_continuity <= 1)),
  critical_load_continuity double precision check (critical_load_continuity is null or (critical_load_continuity >= 0 and critical_load_continuity <= 1)),
  consequence_score double precision,
  dominant_risk text,
  recommended_adaptations jsonb not null default '[]'::jsonb,
  evidence_mode text,
  assumptions jsonb not null default '{}'::jsonb,
  model_version text not null,
  created_at timestamptz not null default now()
);

create index if not exists cfew_resilience_results_scenario_idx on public.cfew_resilience_results (scenario_id, created_at desc);

create table if not exists public.cfew_economic_cases (
  id uuid primary key default gen_random_uuid(),
  project_id text,
  farm_id text not null,
  place_id uuid references public.cfew_places(id) on delete set null,
  name text not null,
  currency text not null default 'USD',
  analysis_years integer not null check (analysis_years between 1 and 100),
  discount_rate double precision not null check (discount_rate >= 0 and discount_rate <= 1),
  assumptions jsonb not null default '{}'::jsonb,
  source text not null default 'USER_ENTERED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cfew_economic_cases_farm_idx on public.cfew_economic_cases (farm_id, created_at desc);

create table if not exists public.cfew_economic_results (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cfew_economic_cases(id) on delete cascade,
  capex double precision not null,
  annual_opex double precision not null,
  annual_energy_benefit double precision not null default 0,
  annual_water_benefit double precision not null default 0,
  annual_production_benefit double precision not null default 0,
  annual_avoided_loss double precision not null default 0,
  annual_other_benefit double precision not null default 0,
  annual_net_benefit double precision,
  npv double precision,
  irr double precision,
  simple_payback_years double precision,
  discounted_payback_years double precision,
  lifecycle_cost double precision,
  lcoe double precision,
  cost_of_water double precision,
  model_version text not null default 'CHIPU-ECONOMICS-0.1.0',
  calculation_notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cfew_economic_results_case_idx on public.cfew_economic_results (case_id, created_at desc);

alter table public.cfew_places enable row level security;
alter table public.cfew_stakeholders enable row level security;
alter table public.cfew_stakeholder_preferences enable row level security;
alter table public.cfew_resilience_scenarios enable row level security;
alter table public.cfew_resilience_results enable row level security;
alter table public.cfew_economic_cases enable row level security;
alter table public.cfew_economic_results enable row level security;

comment on table public.cfew_places is 'CHIPU-FEW Place context. Service-role access only until researcher auth/RLS policies are introduced.';
comment on table public.cfew_stakeholders is 'CHIPU-FEW People stakeholder records. Service-role access only until researcher auth/RLS policies are introduced.';
comment on table public.cfew_resilience_results is 'Scenario-derived research indices; values are model outputs, not field-validated resilience scores unless separately documented.';
comment on table public.cfew_economic_results is 'Transparent TEA outputs calculated from user-entered or documented assumptions.';
