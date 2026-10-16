# Paired daily and HYDRUS atmospheric acceptance (research stage)

## Deterministic paired test
Run `npm run test:radiation` (also required by `npm run build`). The five-day matched fixture in `src/lib/paired-daily-acceptance.ts` changes **only** treatment ETo (5 to 4 mm/day), using identical soil, weather except ETo, application efficiency, irrigation target, area and pump settings. Results are synthetic, not empirical.

Expected control/treatment: irrigation 15/12 mm; gross volume 187.5/150 m3; pumping 25.546875/20.4375 kWh; actual ET 25/20 mm; drainage 3/4 mm; final storage 75/76 mm. Water residual near zero.

## HYDRUS boundary contract
`src/lib/hydrus-atmospheric-contract.ts` defines precipitation, irrigation, potential evaporation, potential transpiration, LAI, root depth, soil and boundary-condition provenance. Potential root transpiration is **not** actual root uptake. Partition using the optional Beer–Lambert illustration only if its assumption is explicitly disclosed.

`src/lib/hydrus-atmosph-exporter.ts` prepares daily cm/day flux rows with tAtm and named Prec/rSoil/rRoot values. It rejects unverified HYDRUS versions, units, sign assumptions and column order. **It does not write a native ATMOSPH.IN file.** Native file generation deliberately throws until an installed-version-matched sample project is available and the complete header, auxiliary columns, time conventions, atmospheric flags, and critical pressure head are validated. Never rename prepared JSON to ATMOSPH.IN.

## Next native export acceptance prerequisites
Obtain the installed HYDRUS-1D version and a known-working ATMOSPH.IN from that version (synthetic data acceptable), plus the corresponding project boundary flags. Build a strict template renderer and round-trip parser, run HYDRUS with open-field and AV test cases, compare flux totals and solver water balance. No actual HYDRUS coupling or field validation has occurred.
