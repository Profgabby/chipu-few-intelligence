"""Deterministic synthetic EPW for API smoke tests only; NOT meteorological data."""
from datetime import datetime, timedelta
from math import cos, pi, sin
from pathlib import Path
import argparse

HEADER = [
    "LOCATION,SYNTHETIC_NOT_OBSERVED,Oregon,USA,TEST,000000,45.3,-122.75,-8.0,75.0",
    "DESIGN CONDITIONS,0",
    "TYPICAL/EXTREME PERIODS,0",
    "GROUND TEMPERATURES,0",
    "HOLIDAYS/DAYLIGHT SAVINGS,No,0,0,0",
    "COMMENTS 1,GENERATED FOR SOFTWARE SMOKE TEST ONLY NOT FOR RESEARCH RESULTS",
    "COMMENTS 2,IDEALIZED FORCING; NOT MEASURED NOT TMY NOT VALIDATED",
    "DATA PERIODS,1,1,Data,Sunday,1/1,12/31",
]

def generate(path: str) -> None:
    start = datetime(2001, 1, 1)
    rows = list(HEADER)
    for h in range(8760):
        t = start + timedelta(hours=h)
        # Idealized daylight envelope; this is not a solar-position model.
        daylight = max(0., sin(pi * ((t.hour + .5) - 6) / 12))
        season = .7 + .3 * max(0., cos(2 * pi * (t.timetuple().tm_yday - 172) / 365))
        dni = round(650 * daylight * season)
        dhi = round(110 * daylight * season)
        ghi = round(dni * daylight + dhi)
        row = [
            2001, t.month, t.day, t.hour + 1, 60, "A0",
            18, 10, 65, 101325,
            0, 0, 0, ghi, dni, dhi,
            0, 0, 0, 0, 180, 2,
            5, 5, 20, 77777, 0, 0, 0, 0, 0, 0, .2, 0, 0
        ]
        assert len(row) == 35
        rows.append(",".join(map(str, row)))
    dest = Path(path)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text("\n".join(rows) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    generate(parser.parse_args().output)

if __name__ == "__main__":
    main()
