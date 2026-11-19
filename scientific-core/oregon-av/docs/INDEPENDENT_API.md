# Independent Oregon Python API — development branch

This is an isolated development path. The original `feature/oregon-av-digital-twin-v01` branch and `main` are unchanged.

## Run locally

```bash
cd scientific-core/oregon-av
python -m pip install -r requirements-api.txt
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000/docs and GET http://127.0.0.1:8000/health.
POST http://127.0.0.1:8000/simulate/coupled with JSON model parameters (see /models).
The endpoint executes the existing Python `chipu_oregon.coupled.simulate` function, not browser-side TypeScript.

## Scientific limitations
Only the existing illustrative coupled baseline is exposed. It uses assumed ground transmission, constant PV efficiency, assumed ET shade factor, and user-specified irrigation. It is **not** validated ray tracing, a field-calibrated twin, or a production deployment. Other scientific modules must pass independent verification before being exposed as production endpoints.

## Separation gates
1. Create a dedicated Oregon repository and move only Oregon-specific UI, weather provenance, Python models, and tests into it.
2. Connect the Oregon dashboard to this API; remove the browser-only run path.
3. Run scientific unit tests, API integration tests, build checks, and end-to-end verification.
4. Deploy an independent Oregon frontend and backend, with explicit origin/security configuration.
5. Only after the standalone app works, remove the Oregon card/link from the main platform in a separate reviewed change.

Do not upload unpublished or sensitive field datasets to GitHub or Vercel.
