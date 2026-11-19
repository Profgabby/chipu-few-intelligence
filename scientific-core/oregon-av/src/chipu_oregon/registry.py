"""Local-only, versioned Oregon simulation registry with atomic writes."""
from __future__ import annotations
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path
import json
import os
import subprocess
import tempfile

def _git_revision() -> str | None:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], stderr=subprocess.DEVNULL,
            timeout=2, text=True).strip()
    except (OSError, subprocess.SubprocessError):
        return None

def save_run(root: str | Path, result: dict, *, label: str = "") -> dict:
    """Persist a result to a caller-controlled local directory, never cloud by default."""
    directory = Path(root).expanduser().resolve()
    directory.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(result, sort_keys=True, allow_nan=False, separators=(",", ":"))
    output_sha = sha256(payload.encode()).hexdigest()
    run_id = str(result.get("run_id", output_sha[:20]))
    if not run_id or not all(ch.isalnum() or ch in "-_" for ch in run_id):
        raise ValueError("Unsafe run ID")
    record = {"run_id": run_id, "label": label,
              "saved_utc": datetime.now(timezone.utc).isoformat(),
              "git_revision": _git_revision(), "output_sha256": output_sha,
              "result": result}
    target = directory / (run_id + ".json")
    if target.exists():
        previous = json.loads(target.read_text(encoding="utf-8"))
        if previous.get("output_sha256") != output_sha:
            raise ValueError("Run ID collision: existing result differs")
        return {"path": str(target), "run_id": run_id, "output_sha256": output_sha}
    fd, temporary = tempfile.mkstemp(dir=directory, prefix=".pending-", suffix=".json")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(record, stream, indent=2, allow_nan=False)
        os.replace(temporary, target)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    return {"path": str(target), "run_id": run_id, "output_sha256": output_sha}

def list_runs(root: str | Path) -> list[dict]:
    directory = Path(root).expanduser().resolve()
    if not directory.exists():
        return []
    return [{"run_id": r["run_id"], "label": r.get("label", ""),
             "saved_utc": r["saved_utc"], "git_revision": r.get("git_revision"),
             "output_sha256": r["output_sha256"]}
            for p in sorted(directory.glob("*.json"))
            for r in [json.loads(p.read_text(encoding="utf-8"))]]
