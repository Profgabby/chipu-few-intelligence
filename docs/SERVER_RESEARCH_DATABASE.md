# CropSmart server telemetry and persistent research database

This stage moves the durable scientific record boundary from browser-only IndexedDB to authenticated server functions backed by PostgreSQL/Supabase while retaining the existing CropSmart observation semantics.

## Required deployment configuration

Apply `supabase/migrations/20260909070000_server_telemetry.sql` to the selected Supabase PostgreSQL project. Configure Netlify server-only environment variables `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `CROPSMART_RESEARCH_ADMIN_KEY`. Never expose the service-role or research-admin keys through `VITE_*` variables or client code.

The migration enables RLS on all server research tables and deliberately creates no anonymous browser-write policies. Netlify Functions use the service-role credential. This separates public UI access from privileged scientific persistence.

## Telemetry endpoint

`POST /.netlify/functions/telemetry`

Header: `x-cropsmart-device-key: <device secret>`

Envelope: `deviceId`, globally unique `messageId`, ISO `sentAt`, `transport`, and `points[]`. Each point contains `sensorId`, `variable`, numeric `value`, exact registered `unit`, and ISO `timestamp`; uncertainty is optional.

The endpoint hashes the supplied key, verifies an active device key, rejects retries already represented by `messageId`, checks each point against its registered sensor variable/unit binding, writes accepted observations as `MEASURED`, records the ingestion transaction, updates heartbeat and clock drift, quarantines invalid content, and appends an audit event.

## Research-record endpoint

`GET /.netlify/functions/research-records?resource=observations|experiments|audit|quarantine|heartbeats|ingestion|sensors`

Header: `x-cropsmart-admin-key: <research admin secret>`

`POST` with `resource=experiments` persists a registered experiment manifest and its model versions, parameter versions, lineage and reproducibility key.

## Device provisioning

Device/key provisioning remains an administrative operation. Create the device row first, generate a high-entropy secret outside the browser, store only its SHA-256 digest in `cs_device_keys.key_hash`, and give the plaintext secret to the physical gateway once. Rotation creates a new key and revokes the old row.

## Scope boundary

The schema and functions constitute a deployable server persistence layer, but a database is not active until a specific Supabase project is selected, the migration is applied, and the three server environment variables are configured. The existing browser research demonstrator remains usable without those credentials. Production hardening should later add rate limiting, managed secret rotation, researcher identity/roles, structured schema validation, database backups, observability, and integration tests against an isolated database.
