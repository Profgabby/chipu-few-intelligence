"""Opt-in bifacial_radiance synthetic scene runner.

Requires bifacial_radiance, Radiance binaries, and a locally supplied EPW.
Never downloads weather silently. This is not field validation.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import shutil
from pathlib import Path
from .radiance_geometry import ArrayGeometry


def run(epw_path: str, output_dir: str) -> dict:
    from bifacial_radiance import RadianceObj, AnalysisObj
    epw = Path(epw_path).resolve()
    if not epw.is_file() or epw.suffix.lower() != ".epw":
        raise ValueError("Supply a local EPW weather file")
    for command in ("oconv", "rtrace"):
        if shutil.which(command) is None:
            raise RuntimeError("Radiance executable unavailable: " + command)
    geometry = ArrayGeometry()
    manifest = geometry.manifest()
    out = Path(output_dir).resolve()
    out.mkdir(parents=True, exist_ok=True)
    demo = RadianceObj(name="oregon_synthetic", path=str(out))
    demo.setGround(geometry.ground_albedo)
    demo.readWeatherFile(str(epw))
    demo.genCumSky()
    module = demo.makeModule(name="synthetic_oregon_module",
                             x=geometry.module_width_m, y=geometry.module_length_m)
    scene = demo.makeScene(module, {
        "tilt": geometry.tilt_deg, "pitch": geometry.row_pitch_m,
        "clearance_height": geometry.module_clearance_m,
        "azimuth": geometry.azimuth_deg,
        "nMods": geometry.modules_per_row, "nRows": geometry.number_of_rows})
    octfile = demo.makeOct(demo.getfilelist())
    analysis = AnalysisObj(octfile, demo.name)
    frontscan, backscan = analysis.moduleAnalysis(scene, sensorsy=9)
    analysis.analysis(octfile, demo.name, frontscan, backscan)
    front = [float(x) for x in analysis.Wm2Front]
    back = [float(x) for x in analysis.Wm2Back]
    if not front or len(front) != len(back):
        raise RuntimeError("Missing or mismatched irradiance scan outputs")
    if any(not (0 <= x < float("inf")) for x in front + back):
        raise RuntimeError("Nonphysical irradiance scan result")
    manifest.update({
        "weather_epw_sha256": hashlib.sha256(epw.read_bytes()).hexdigest(),
        "front_scan_w_m2": front, "rear_scan_w_m2": back,
        "simulation_kind": "cumulative_sky_module_scan_not_ground_irradiance",
        "radiance_executables": ["oconv", "rtrace"],
        "validation_status": "unvalidated_synthetic_scene"})
    (out / "run_manifest.json").write_text(
        json.dumps(manifest, sort_keys=True, indent=2) + "\n", encoding="utf-8")
    return manifest


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--epw", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    result = run(args.epw, args.output)
    print(json.dumps(result, sort_keys=True, indent=2))


if __name__ == "__main__":
    main()
