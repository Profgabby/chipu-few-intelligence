# Recorded NASA POWER forcing checkpoint

`nasa-power-aurora-20240701-07.json` contains an actual NASA POWER daily response retrieved on 2026-10-21 for 45.28 N, 122.75 W, July 1–7, 2024. The exact request URL, retrieval time and complete response metadata are preserved. Coordinates are an Aurora-area example, not a verified experimental station location.

The agricultural-community response reports solar radiation in MJ/m²/day. Divide by 3.6 to obtain kWh/m²/day. Rainfall is mm/day. The regression test replays this response without network access; it catches the previously incorrect unit labeling. Cache keys are versioned to avoid reusing old converted values.

Reproduce: `node --experimental-strip-types --test tests/power-real-fixture.test.mjs`.

This is external meteorological forcing, not independent field validation. No colocated soil moisture, measured pumping electricity, irrigation volumes or independently reviewed crop/ETo inputs were supplied in this repository. A field comparison therefore remains pending; do not treat synthetic fixtures as observations.

Next acceptance run: document the research site's coordinates and instruments; pair timestamped measured irrigation volumes and pumping kWh with head/efficiency; reserve an independent period; calculate bias, MAE and RMSE with missing measurements excluded explicitly. For water storage, document root depth and measured volumetric water content before converting to mm. Preserve raw data, units, quality flags and checksums with the run. Report forcing provenance separately from model validation evidence.
