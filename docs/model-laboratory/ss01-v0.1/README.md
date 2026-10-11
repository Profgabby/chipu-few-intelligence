# SS01 GardenLift research configuration v0.1

Proposed geometry for review, not an as-built survey, supplier specification, structural design or construction drawing. This package formalizes the configuration proposed in the conversation. It does not alter the deployed calculator or claim simulated performance.

- `SS01-dimensioned-layout.svg`: scalable drawing; plan, control plan and side elevation.
- `SS01-dimensioned-layout.png`: viewable drawing.
- `SS01-parameters.json`: SI parameters, 3D module corners, bed rectangles, derived geometry, provenance and unresolved inputs.
- `generate_layout.py`: reproducible generator (Python + matplotlib), with geometry assertions.

Each plot has its own southwest origin, x east, y north, z up. The two panels do not specify relative geographic placement. Array row centerlines are y=3 and y=9 m. Modules slope upward toward north; faces point south. Each module extends 1.722 m along the slope and 1.134 m east-west, with 0.020 m gaps along each row. Coordinates refer to ideal module surfaces and exclude frames, thickness, rails and structural obstructions.

The 2.400 m dimension is the lower module edge, not guaranteed head clearance under beams. Supports and foundations remain undesigned. Bed positions are proposals and may need adjustment after supports and services are designed. Blue plan rectangles are module projections, not predicted shadow footprints.

Both treatments use six 8 x 1 m beds (48 m² planted) inside a 12 x 12 m gross plot (144 m²). Keep planted and gross denominators distinct. Beds within one array are subsamples; this layout does not provide independent treatment replication. A replicated experiment needs additional independently assigned plots.

No module manufacturer, inverter, weather, site, soil, irrigation trigger, pump performance, cost or outcome is invented here. Missing inputs use JSON null or explicit unresolved status. The 430 Wp rating and dimensions are provisional procurement targets. DC target capacity is 12 x 430 / 1000 = 5.16 kWp, not generation. No predicted output is included.

Next: select site and hardware; check control shading exclusion; complete structural/electrical/hydraulic design; connect geometry and sourced weather to process calculations. Revisions to module dimensions must regenerate both JSON and drawing.
