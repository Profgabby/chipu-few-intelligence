# Reference verification and numerical evidence

## Authoritative method sources

Allen, R. G., Pereira, L. S., Raes, D., & Smith, M. (1998).
*Crop evapotranspiration: Guidelines for computing crop water requirements.*
FAO Irrigation and Drainage Paper 56, Chapters 7-8.

- Root-zone stress: Ks=(TAW-Dr)/((1-p)*TAW) for Dr>p*TAW.
- Crop evapotranspiration: ETc,adj=(Ks*Kcb+Ke)*ET0.
- Surface-layer total evaporable water: TEW=1000*(theta_FC-0.5*theta_WP)*Ze.
- Evaporation reduction: Kr=(TEW-De)/(TEW-REW) after readily evaporable water is depleted.
- Evaporation coefficient: Ke=min(Kr*(Kcmax-Kcb), few*Kcmax).

These are equation-level benchmarks from the published method, not
digitized FAO example datasets. A numerical unit test of a formula is not
an independent published-example replication.

## Known limitations to resolve before full FAO-56 claim

- Surface evaporation uses beginning-of-day Kr, not a within-day iterative
  evaporation/wetting sequence; evaporation fraction and partial wetting
  require rigorous temporal ordering.
- Kcmax, crop cover, wetted fraction, p adjustment, soil texture and
  evaporation layer depth must be parameterized from documented inputs.
- Surface evaporation and root-zone depletion are not yet stepped in a
  fully synchronized daily mass-conserving two-layer solver.
- Irrigation application loss, deep drainage, capillary rise and runoff
  require field-specific treatment and measured or defensible estimates.

## Required numerical evidence

Run the repository CI tests and retain job URL, commit SHA, test count,
Python version, pvlib version and generated baseline artifact SHA-256.
Pin dependencies and rerun from a clean environment before advisor review.

## No inference of measured effects

The current shade-to-ET sensitivity factor is an assumption. It is not
a physically calibrated irradiance-to-microclimate relation and must not
be used as evidence of agrivoltaic water savings.
