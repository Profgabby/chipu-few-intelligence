-- Cover foreign keys introduced by CHIPU-FEW operational domains.
create index if not exists cfew_resilience_scenarios_place_idx on public.cfew_resilience_scenarios(place_id);
create index if not exists cfew_economic_cases_place_idx on public.cfew_economic_cases(place_id);
