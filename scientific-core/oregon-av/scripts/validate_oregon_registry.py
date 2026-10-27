"""Offline structural checks for Oregon data registry. No external data are downloaded."""
import json
from pathlib import Path

REGISTRY = Path(__file__).resolve().parents[1] / "data_sources" / "oregon_registry_v01.json"

def validate(path=REGISTRY):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    assert data["geographic_scope"] == "Oregon, USA"
    assert {r["id"] for r in data["focus_regions"]} == {"central_oregon", "willamette_valley"}
    assert len({s["id"] for s in data["sources"]}) == len(data["sources"])
    assert all(s["status"] == "registered_not_ingested" for s in data["sources"])
    assert all(s["url"].startswith("https://") and s["variables"] for s in data["sources"])
    required = {"checksum_sha256", "quality_flags", "units", "time_zone", "transformation_history"}
    assert required.issubset(data["provenance_required"])
    return data

if __name__ == "__main__":
    d = validate()
    print(f"Validated registry structure: {len(d['sources'])} sources; {len(d['focus_regions'])} reference regions; zero datasets ingested.")
