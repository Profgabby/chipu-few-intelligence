# CHIPU-FEW Operational Domains

This release restores the complete CropSmart research capability inside the CHIPU-FEW information architecture and adds persistent People, Place, Resilience and Economics domains.

## Persistence

Production Supabase adds `cfew_places`, `cfew_stakeholders`, `cfew_stakeholder_preferences`, `cfew_resilience_scenarios`, `cfew_resilience_results`, `cfew_economic_cases`, and `cfew_economic_results`. Existing `cs_*` tables are unchanged. RLS is enabled with no anonymous policies; server service-role access remains the security boundary until researcher identity/organization policies are introduced.

## Existing capability retained

Twin State, Forecast, Water Intelligence, Energy Intelligence, Resource Allocation, Scenario Laboratory, Uncertainty Explorer, Crop & Harvest, Food Loss & Storage, Data & Provenance, Field Data & Sensors, Telemetry Gateway, Experiment Registry, Research Export, Models & Methods, and Model Calibration remain available. Legacy routes remain valid.

## Resilience

`CHIPU-RESILIENCE-0.1.0` consumes an actual Scenario Laboratory run and its existing water, energy, crop-risk, food-loss-risk and control-strategy outputs. The composite continuity indicator is transparent and research-stage. It is not represented as an independently field-validated resilience metric.

## Economics

`CHIPU-ECONOMICS-0.1.0` calculates annual net benefit, NPV, simple payback, discounted payback and lifecycle cost from researcher-entered assumptions. It does not invent IRR, LCOE, cost-of-water, revenues or project costs when required inputs are absent.

## UI

People, Place, Resilience and Economics use a FEW systems-cockpit visual language: editorial hero surfaces, protected-data ribbons, evidence ledgers, continuity tracks and assumption-first economic outputs rather than generic pre-populated KPI tiles.
