# Six-subsystem laboratory — exploratory implementation

## Release scope

The 15-model catalogue and existing annual screening remain. A single selection can now be simulated. Each completed screening run opens six expandable workspaces with at least five outcomes and explanatory decision prompts: Water, Energy, Crop, Techno-economics, Microclimate & Soil, and Resilience & Environmental Performance. The dataset banner and card/laboratory gold accents use #D99A00.

Annual values remain in their own table and export. The optional daily mode changes the six-panel values only and has a separate export carrying its full forcing array, common settings, per-model assumptions, baseline/model daily traces, yearly outcomes and cash-flow series. Editing annual inputs removes these panels and their stale results. Editing daily inputs invalidates the daily run. No real site data are loaded automatically.

## Data and scientific assumptions

Daily JSON requires 365 or 366 unique, contiguous days within one calendar year. Full-year coverage is required so a partial season is never mislabeled as an annual cash flow. Dates, units, numerical ranges and required booleans are checked. The downloadable example is explicitly synthetic (2025), includes a water restriction and a grid outage, and is activated only through the example button or import. Imported files are labeled user-supplied with unverified provenance.

The daily POA series supplies a temporal shape normalized to each model's entered annual plane-of-array irradiation. No geometry, tracking gain or shading advantage is inferred from model names or images. Crop-level PAR transmission and air/soil temperature and RH offsets are hypotheses, not microclimate predictions. The ET multiplier and light-yield factor are independent inputs. PAR does not automatically drive yield; temperature/RH diagnostics do not recompute ET0.

The root-zone bucket starts at field capacity and has constant rooting depth. TAW = 1000 (theta_FC − theta_WP) Zr. Rain enters first; excess above field capacity drains. When depletion reaches the user threshold and Kc > 0, irrigation requests refill to field capacity. Gross irrigation is limited by supplied water and available pumping electricity. The stress coefficient reduces Kc ET0; soil water limits actual ET. No soil evaporation is represented outside the growing season. No runoff, interception, capillary rise, salinity, freezing or spatial redistribution is modeled. This is not HYDRUS.

The water-stress formulation and seasonal yield-response relationship are based on the simplified concepts described in FAO Irrigation and Drainage Paper 56, Chapter 8: https://www.fao.org/4/X0490E/x0490e0e.htm . Yield = potential annual harvest × max(0, 1 − Ky (1 − ETactual/ETpotential)) × an independent light-response factor. Applying a single stress factor to total crop ET is an approximation; this is not the dual crop coefficient method. Potential yield and Ky must be supplied for the crop and growing period; defaults have no calibration claim. Biomass, phenology and thermal yield response are not calculated.

Daily electricity allocation prioritizes pumping, then the provided critical load, then grid export up to a daily limit. Remaining PV is curtailed. When the grid is absent, unmet critical load is recorded and pumping is limited by PV. Daily netting assumes ideal within-day flexibility and can overestimate self-consumption and outage performance. There is no battery, hourly dispatch or automatic proof of islanding capability. Capital and operating costs must account for assumed infrastructure.

The open-sun reference uses identical land, weather, soil, crop, critical load and water availability, zero PV, baseline irrigation efficiency and no AV response offsets. Model irrigation efficiency is allowed to differ. Zero denominators produce N/A rather than invented ratios. Lower water use may result from unmet demand; inspect stress and reliability with savings.

## Economic transparency

Annual screening retains gross PV valued at the entered blended tariff, plus avoided pumping cost, minus OPEX. In daily mode that tariff becomes the import price: incremental cash flow = avoided grid-purchase cost + export revenue + change in crop contribution + water-cost savings − system OPEX. The crop contribution per kg must exclude separately accounted water and energy costs to avoid double counting. Other agronomic costs are represented only through that entered net contribution.

Capital = installed kW × USD/kW. Simple payback = capital / positive incremental annual cash flow. Nonpositive flow has no finite payback. NPV discounts the repeated annual flow; annualized benefit subtracts annualized capital cost. Rate zero uses the undiscounted limit. Payback beyond the project life is labeled. Each model has numeric substitution and a cumulative cash-flow plot. Degradation, replacement, finance, tax and price escalation are excluded.

Operational avoided emissions use only the change in grid imports times the supplied grid factor. Export credits and embodied emissions are excluded. LER uses model/open-sun crop yield plus PV per hectare divided by a supplied standalone-PV reference. This reference must be locally comparable; defaults are illustrative.

## Verification

Tests cover water and energy conservation, unrestricted neutral reference equality, no-grid/no-PV failure, export limits, economics, emissions boundary, explicit response propagation, equal-capacity normalization, missing data, invalid dates, full-year coverage, leap years, nonfinite values and invalid soil parameters. Existing tests remain in CI.

This increment provides a functioning exploratory calculation workflow. Observed-data validation, uncertainty, geometry-based radiation, hourly storage/dispatch and physically predicted microclimate remain future research work. Do not describe these outputs as validated yield forecasts or investment recommendations.
