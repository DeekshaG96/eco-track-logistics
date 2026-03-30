# 🌍 Eco-Track AI: Predictive ESG Logistics Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)
![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-8E75B2?style=flat)
![Status](https://img.shields.io/badge/Status-Enterprise_Ready-brightgreen.svg)

Eco-Track AI is a military-grade, interactive supply chain visualization dashboard built for the **Google Solution Challenge 2026**. It transforms raw logistics data into actionable, map-driven ESG (Environmental, Social, and Governance) routing models.

## 🚀 Live Enterprise Application
- **Production URL:** [https://techspire-13303696-1c68d.web.app](https://techspire-13303696-1c68d.web.app)
- **Demo Video:** [ecotrack_final_demo.webp](demo/ecotrack_final_demo.webp)

---

## 🏗️ Core Architecture & Features

Eco-Track AI has evolved from a simple CO2 calculator into a deeply integrated SaaS platform modeled after industry leaders like Project44 and Flexport.

### 1. 🗺️ Live Leaflet Geo-Routing
Integrated `react-leaflet` to visualize real-time polyline routes over OpenStreetMap tiles. We use **Gemini 2.5 Flash** as an autonomous geocoding agent, returning exact coordinate arrays (`[lat, lng]`) for mapping without the need for external MAP APIs.

### 2. 🛡️ Scope 3 (GLEC) Emissions Compliance
The AI reasoning engine evaluates route options specifically against the **Global Logistics Emissions Council (GLEC)** standards, guaranteeing the sustainability matrix is audit-ready for ESG reporting.

### 3. 📡 Live Fleet Telemetry (IoT Sync)
Seamlessly mocks live onboard weigh-station scaling. Toggle the "IoT Sync" button on the dashboard to override manual inputs and watch the platform dynamically respond to shifting payload constraints in real-time.

### 4. 🔗 L2 Smart Contract ESG Anchoring (Mock)
To combat corporate "greenwashing", operators who select the "Greenest Choice" option can click the **Issue ESG Smart Contract** button. This mimics hashing the routing manifest (SHA-256) and anchoring it to a Layer-2 blockchain for an unalterable audit trail.

### 5. 🌡️ Cargo Classification & Compliance Overrides
Users can classify payloads as **Standard**, **Perishables / Cold Chain**, or **Hazardous Materials (HAZMAT)**. The AI dynamically adapts its risk heuristics, enforcing continuous thermal monitoring alerts and geopolitical risk overlays.

## 🛠️ Tech Stack
- **Frontend Core:** React.js, Vite, Tailwind CSS (Glassmorphism & "Terminal Dark Mode")
- **Mapping:** Leaflet, React-Leaflet
- **AI Infrastructure:** Google Gemini 2.5 Flash API (Structured JSON Inference)
- **Deployment:** Google Cloud (Firebase Hosting)
- **Resiliency:** Zero-Crash Offline Fallback Engine

---

## 💻 Local Development Setup

Clone the repository and install dependencies to run the Enterprise Logistics Platform locally:

```bash
git clone https://github.com/DeekshaG96/eco-track-logistics.git
cd eco-track-logistics
npm install
```

### Environment Variables
Create a `.env` file in the root directory and add your Gemini API key:
```env
VITE_GEMINI_API_KEY="your_api_key_here"
```
*(Note: If the key is omitted or the API rate limits, the application automatically pivots to the local Zero-Crash Fallback Engine, maintaining 100% demo uptime).*

### Booting the Development Server
```bash
npm run dev
```

---

*Architected and engineered autonomously for the Google Solution Challenge 2026.*
