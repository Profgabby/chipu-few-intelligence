# CHIPU-FEW Migration Inventory

This document records the first-pass classification of legacy CropSmart identifiers found during the controlled migration. It is intentionally conservative: risky internal names remain until their dependencies are proven safe.

| Identifier / location | Classification | Action |
|---|---|---|
| Sidebar/mobile `CropSmart` brand | USER_FACING / SAFE_TO_RENAME | Replaced by CHIPU-FEW Intelligence / CHIPU-FEW |
| Browser title/description | USER_FACING / SAFE_TO_RENAME | Overridden at application startup with CHIPU-FEW identity |
| README active product name | USER_FACING / SAFE_TO_RENAME | Updated; historical origin retained in narrative |
| `CropSmartWorkspace` | CODE_IDENTIFIER / KEEP_TEMPORARILY | Retained; active module routes reuse it where appropriate |
| `src/lib/cropsmart-model.ts` | CODE_IDENTIFIER / KEEP_TEMPORARILY | Retained because research context and legacy views depend on it |
| `cropsmart-toast` browser event | CODE_IDENTIFIER / KEEP_TEMPORARILY | Retained to avoid breaking existing toast behavior |
| `cropsmart-*` IndexedDB names | DATABASE_IDENTIFIER / KEEP_TEMPORARILY | Retained to preserve browser-local persisted research records |
| `cs_*` Supabase tables | DATABASE_IDENTIFIER / KEEP_TEMPORARILY | Retained; production schema and foreign keys depend on them |
| `CROPSMART_RESEARCH_ADMIN_KEY` | ENVIRONMENT_VARIABLE / KEEP_TEMPORARILY | Retained; server deployment contract |
| `x-cropsmart-admin-key` / `x-cropsmart-device-key` | EXTERNAL/API CONTRACT / KEEP_TEMPORARILY | Retained for server/device backward compatibility |
| historical release notes containing CropSmart | HISTORICAL_REFERENCE | Retained unchanged where historically accurate |
| repository name `cropsmart-research-digital-twin` | EXTERNAL_REFERENCE / KEEP_TEMPORARILY | Retained to avoid breaking GitHub/Netlify linkage |
| Supabase migration filenames and history | HISTORICAL_REFERENCE / DATABASE_IDENTIFIER | Retained; never rewritten for branding |

## Database inspection summary

The production Supabase project currently contains these research tables:

- `cs_audit_log`
- `cs_device_heartbeats`
- `cs_device_keys`
- `cs_devices`
- `cs_experiments`
- `cs_ingestion_messages`
- `cs_observations`
- `cs_quarantine`
- `cs_sensors`

Observed foreign-key relationships include device keys/heartbeats/ingestion messages to devices, and observations to sensors and ingestion messages. The migration does not rename or drop any of these resources.

## Database migration decision for this stage

No production schema migration is required for the first information-architecture release. People, Place and Economics are introduced as typed application-domain foundations and evidence-safe UI modules. A later additive migration can persist those domains after tenant/project scoping and RLS behavior are designed explicitly. This avoids introducing unscoped production data structures prematurely.
