# Gabriel S. Ayayia
PhD researcher in Biological & Ecological Engineering at Oregon State University; Founder & Executive Director of LIFEWS, Nigeria.

My research interests include agrivoltaics, irrigation–energy coupling, and food–energy–water decision systems.

## CHIPU-FEW Intelligence
**Research lead: Gabriel S. Ayayia**

I initiated and lead the development of CHIPU-FEW Intelligence, a research-stage decision-support prototype for investigating interactions among food production, irrigation water, solar energy, storage, and agricultural operating decisions.

My work focuses on defining the research questions, system architecture, modeling requirements, comparison scenarios, and interpretation of outputs. The prototype includes agrivoltaics scenario exploration, water and pumping-energy calculations, solar and battery analysis, techno-economic calculations, and resilience assessment.

The repository documents the prototype’s evolution through source code, methods documentation, tests, commits, and pull requests. These records make changes to calculations, assumptions, and interfaces traceable.

Current simulations use simplified models and editable assumptions. Software verification is distinguished from field validation, and simulated outputs are distinguished from measured observations.

[Source repository](https://github.com/Profgabby/chipu-few-intelligence) · [Interactive prototype](https://chipu-few-intelligence.vercel.app/app)

### Selected development records

| Component | Documented implementation | Development record |
| --- | --- | --- |
| Water planner | Seven-day soil-water balance, irrigation volume and runtime, tank supply, losses, shortages and open-sun comparison; editable inputs and JSON import/export. | [PR #53](https://github.com/Profgabby/chipu-few-intelligence/pull/53) |
| Energy planner | Hourly PV generation, inverter limits, battery reserve and losses, prioritized loads, grid imports, exports, curtailment and pump scheduling. | [PR #54](https://github.com/Profgabby/chipu-few-intelligence/pull/54) |
| Resilience analysis | Water and electricity continuity, critical-load service, crop-water buffer, financial buffer and assumed recovery coverage; sensitivity analysis and 300 sampled scenarios. | [PR #55](https://github.com/Profgabby/chipu-few-intelligence/pull/55) |
| Techno-economics | Annual energy, water and harvest quantities linked to prices, operating costs, cash flow, payback and net present value, with calculation breakdowns. | [PR #56](https://github.com/Profgabby/chipu-few-intelligence/pull/56) |

These records document software development and its stated checks. Commit counts alone do not establish scientific novelty, field performance, or individual authorship of every line. The research-lead role described above is distinct from code-level contribution attribution.

### Supporting documentation

- [Research architecture](https://github.com/Profgabby/chipu-few-intelligence/blob/main/docs/ARCHITECTURE.md)
- [Evidence and provenance](https://github.com/Profgabby/chipu-few-intelligence/blob/main/docs/EVIDENCE_AND_PROVENANCE.md)
- [Model and method matrix](https://github.com/Profgabby/chipu-few-intelligence/blob/main/docs/MODEL_METHOD_MATRIX.md)
- [Implementation status](https://github.com/Profgabby/chipu-few-intelligence/blob/main/docs/IMPLEMENTATION_STATUS.md)
- [CropSmart to CHIPU-FEW evolution](https://github.com/Profgabby/chipu-few-intelligence/blob/main/docs/CROPSMART_TO_CHIPU_FEW_EVOLUTION.md)
- [Commit history](https://github.com/Profgabby/chipu-few-intelligence/commits/main)
- [Pull requests](https://github.com/Profgabby/chipu-few-intelligence/pulls)
