# Eco-Track Resilient: Dynamic Supply Chain Optimization

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)
![Gemini](https://img.shields.io/badge/Gemini_1.5_Flash-8E75B2?style=flat)
![Challenge](https://img.shields.io/badge/Google_Solution_Challenge-2026-brightgreen.svg)

**Eco-Track Resilient** is an AI-assisted logistics intelligence prototype for the **Google Solution Challenge 2026**. It helps operators detect disruption risk early, compare recovery routes, and quantify the time and cost saved before localized failures spread across the network.

## Live Prototype
- Production URL: [https://techspire-13303696-1c68d.web.app](https://techspire-13303696-1c68d.web.app)
- Submission Brief: [docs/submission-brief.md](docs/submission-brief.md)
- Project Deck: [docs/Eco-Track-AI-Submission-Deck.pptx](docs/Eco-Track-AI-Submission-Deck.pptx)
- Demo Preview Asset: [demo/ecotrack_final_demo.webp](demo/ecotrack_final_demo.webp)

## Problem Statement
Modern supply chains manage millions of concurrent shipments across volatile transport networks. Weather shocks, port congestion, and infrastructure failures are often detected too late, after delivery commitments have already been compromised. Teams need a system that continuously interprets transit signals, predicts disruption risk early, and recommends better routing choices before delays cascade.

## Solution Brief
Eco-Track Resilient acts as a resilience layer on top of existing logistics workflows. The prototype combines AI-assisted route analysis, disruption simulation, and operational tradeoff views so a planner can compare a default lane against a safer recovery lane in real time. The experience focuses on three questions that matter in operations:

1. Where is disruption risk forming?
2. What alternative route should the shipment take right now?
3. How much delay and cost did the intervention prevent?

## Core Features
### Resilience Intelligence Layer
Gemini is used to translate messy supply-chain context into route-level reasoning, including disruption summaries, risk nodes, and recommended actions. A local resilience engine keeps the prototype functional when the API is unavailable so the demo remains stable.

### War Room Simulation
Operators can trigger disruption drills such as monsoon surge and port congestion to show how the system responds before a bottleneck spreads.

### ROI and Delay Prevention
Each recovery route includes ETA, emissions, risk score, and prevented-loss metrics so the business case is visible during the demo.

### Tactical Map Experience
The dashboard overlays origins, destinations, route paths, and risk zones on an interactive map for faster operator comprehension.

## Tech Stack
- Frontend: React, Vite, Tailwind CSS
- AI: Google Gemini 1.5 Flash
- Mapping: Leaflet, React Leaflet
- Hosting: Firebase Hosting

## Local Quickstart
```bash
git clone https://github.com/DeekshaG96/eco-track-logistics.git
cd eco-track-logistics
npm install
```

Create a `.env` file:

```env
VITE_GEMINI_API_KEY="your_api_key"
```

Start the app:

```bash
npm run dev
```

## Submission Note
The repository already includes the live MVP, deck, and a demo preview asset. For final challenge upload, the remaining packaging item is an exported demo video link if the submission form requires a video file or hosted video URL rather than a preview asset.
