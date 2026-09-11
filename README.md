# CHIPU-FEW Intelligence

**Integrated Predictive Decision Systems for Food–Energy–Water Management**

CHIPU-FEW Intelligence is an integrated predictive decision-systems platform for food–energy–water management. The platform combines place and stakeholder context with food-production, energy and water systems; digital-twin modeling; forecasting; optimization; economic analysis; and resilience assessment.

CHIPU-FEW Intelligence evolved from the existing CropSmart research prototype. The migration preserves working research functions and backward-compatible internal identifiers while expanding the application into a modular FEW decision architecture.

## Core architecture

```text
People + Place
      ↓
Food ↔ Energy ↔ Water
      ↓
Twin
      ↓
Predict
      ↓
Control
      ↓
Economics + Resilience
      ↓
Decision Support
```

## Core modules

- CHIPU-FEW Twin — digital-twin and system-state engine
- CHIPU-FEW Predict — forecasting, uncertainty and predictive analytics
- CHIPU-FEW Food — crops, production, agronomy and food systems
- CHIPU-FEW Energy — photovoltaic generation, batteries, loads and dispatch
- CHIPU-FEW Water — crop-water demand, irrigation, pumping and storage
- CHIPU-FEW People — stakeholders, adoption, behavior and decision context
- CHIPU-FEW Place — location, land, infrastructure and contextual conditions
- CHIPU-FEW Control — optimization, scheduling and operational control
- CHIPU-FEW Economics — costs, revenues, TEA, affordability and investment analysis
- CHIPU-FEW Resilience — scenarios, vulnerability, recovery and adaptation

## Development

```bash
npm install
npm run dev
npm run build
```

The current repository contains research-demonstration models, browser-local scientific stores, Netlify server functions, and a production Supabase research schema. Synthetic and modeled records remain explicitly identified and must not be represented as measured production data.

## Backward compatibility

Legacy `CropSmart` code identifiers, `cropsmart-*` local database names, `cs_*` PostgreSQL tables, server credential names, historical releases, and migration history are intentionally retained where renaming could break persisted data or external contracts. They can be evaluated individually in a later cleanup release.
