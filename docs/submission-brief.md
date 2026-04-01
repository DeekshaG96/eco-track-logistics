# Eco-Track Resilient Submission Brief

## Problem Statement
Global supply chains move millions of shipments through volatile transport networks. Weather events, terminal congestion, and hidden operational bottlenecks are often detected only after delivery commitments begin to slip. When teams react too late, localized disruption spreads into missed SLAs, higher operating cost, and avoidable emissions.

Eco-Track Resilient addresses this gap by helping operators detect disruption risk earlier and compare recovery routes before a delay cascades.

## Solution Brief
Eco-Track Resilient is a resilient logistics intelligence prototype built for the Google Solution Challenge 2026. It combines AI-assisted route interpretation, disruption simulation, and dynamic tradeoff analysis in a single operator dashboard.

The prototype allows a planner to:

1. Analyze a shipment route using origin, destination, payload, cargo class, and live telemetry mode.
2. Surface disruption signals such as weather risk, terminal throughput issues, and shipment-specific constraints.
3. Compare a standard route against a resilient bypass with ETA, risk, emissions, and prevented-loss metrics.
4. Run war-room drills like monsoon surge and port congestion to demonstrate preemptive rerouting behavior.

## Why AI Matters Here
A simple rules engine can rank lanes, but it struggles to interpret unstructured disruption context quickly. Gemini is used here to turn messy route context into structured route intelligence, including summaries, risk nodes, and recovery options. When AI is unavailable, the local resilience engine keeps the prototype stable for demo reliability.

## Judging Alignment
### Technical Merit
The prototype combines React, Vite, Firebase Hosting, Gemini, and Leaflet into a working logistics control surface with simulated resilience analytics and graceful fallback behavior.

### User Experience
The interface is designed as an operator dashboard: shipment inputs on the left, live tactical map in the center, and historical recovery log on the right, which makes the story easy to demo under time pressure.

### Alignment With Cause
The app directly addresses resilient logistics and dynamic supply chain optimization by detecting disruption pressure early and recommending faster recovery routes before failures spread.

### Innovation and Creativity
The strongest differentiators are the war-room simulation flow, prevented-loss framing, and the combination of disruption signals, route tradeoffs, and resilience-specific KPIs in one prototype.

## Submission Assets
- Live MVP: [https://techspire-13303696-1c68d.web.app](https://techspire-13303696-1c68d.web.app)
- Project Deck: [Eco-Track-AI-Submission-Deck.pptx](./Eco-Track-AI-Submission-Deck.pptx)
- Demo Preview Asset: [ecotrack_final_demo.webp](../demo/ecotrack_final_demo.webp)
- Source Repository: `https://github.com/DeekshaG96/eco-track-logistics`

## Final Submission Gaps To Close
1. Export the walkthrough as an actual demo video file or hosted video link if the submission portal requires video rather than a preview asset.
2. If time allows, proxy Gemini requests through a backend endpoint before final judging to strengthen the security story around API keys.
3. Record one clean judge script that shows baseline route, triggered disruption, resilient reroute, and ROI impact in under two minutes.
