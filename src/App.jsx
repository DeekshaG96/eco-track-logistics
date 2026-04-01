import React, { useState, useEffect } from 'react';
import { 
  Truck, MapPin, Package, AlertCircle, Loader2, Zap, Wind, Navigation, 
  Globe2, Link, Activity, Wifi, ShieldCheck, CheckCircle2, Thermometer, 
  AlertTriangle, Scale, Clock, ShieldAlert, BarChart3, History, 
  Play, RotateCcw, TrendingUp, DollarSign, Crosshair
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for React-Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim() || ""; 

export default function App() {
  // --- State Management ---
  const [origin, setOrigin] = useState('Bengaluru, KA');
  const [destination, setDestination] = useState('Chennai, TN');
  const [weight, setWeight] = useState(500);
  const [cargoClass, setCargoClass] = useState('Standard Freight');
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  const [liveTelemetry, setLiveTelemetry] = useState(false);
  const [mintState, setMintState] = useState(null);

  // --- Resiliency States ---
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [incidentHistory, setIncidentHistory] = useState([
    { id: 1, date: 'Mar 28', event: 'Monsoon Reroute', saved: '4.2h', roi: '$1,240', status: 'Optimal' },
    { id: 2, date: 'Mar 30', event: 'Port Congestion Bypass', saved: '12h', roi: '$3,100', status: 'Critical' }
  ]);
  const [disruptions, setDisruptions] = useState([]);

  // Mock live weight telemetry
  useEffect(() => {
    let interval;
    if (liveTelemetry) {
      interval = setInterval(() => {
        setWeight(prev => Math.max(100, prev + (Math.floor(Math.random() * 11) - 5)));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [liveTelemetry]);

  const cleanJSON = (text) => {
    const match = text.match(/```json\n([\s\S]*?)\n```/);
    return match ? match[1] : text;
  };

  const handleOptimize = async (e, simulatedIncident = null) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    setError(null);
    setResults(null);
    setMintState(null);
    setActiveSimulation(simulatedIncident);

    const promptText = `
      Act as a Tier-1 Resilient Supply Chain Intelligence Engine.
      Analyze the route from ${origin} to ${destination} for a ${weight}kg payload of "${cargoClass}".
      
      CURRENT CONTEXT: ${simulatedIncident ? `CRITICAL DISRUPTION DETECTED: ${simulatedIncident}.` : "Standard operational monitoring."}
      
      Calculate:
      1. Geometric route vectors.
      2. Resilience Intelligence: Identify potential bottlenecks (monsoons, strikes, road closures).
      3. Global risk weights (0.0 to 1.0).
      4. ROI Analysis: Estimated time/cost saved by choosing the most resilient path.

      Return strictly a JSON object:
      {
        "distanceKm": Number,
        "originCoords": [lat, lng],
        "destinationCoords": [lat, lng],
        "routePath": [[lat, lng], ...],
        "resilienceReport": {
          "status": "Stable" | "Elevated Risk" | "Critical Bypass",
          "summary": "String",
          "riskNodes": [{"lat": Number, "lng": Number, "reason": String, "severity": "low"|"mid"|"high"}],
          "roiAnalysis": {"hoursSaved": Number, "costAvoided": Number}
        },
        "options": [
          {
            "mode": "Diesel Freight" | "Electric Van" | "Resilient Hybrid Vector",
            "isResilientChoice": Boolean,
            "isGreenest": Boolean,
            "emissionsKg": Number,
            "etaHours": Number,
            "riskScore": Number, // 0-100
            "logic": "Refined business reasoning for this choice"
          }
        ]
      }
    `;

    try {
      if (!API_KEY) throw new Error("Fallback Mode");

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { temperature: 0.2, response_mime_type: "application/json" }
          })
        }
      );

      if (!response.ok) throw new Error("API Failure");
      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      setResults(JSON.parse(cleanJSON(rawText)));

      if (simulatedIncident) {
        const newIncident = {
          id: Date.now(),
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          event: simulatedIncident,
          saved: simulatedIncident === 'Monsoon Delta' ? '5.5h' : '8.2h',
          roi: simulatedIncident === 'Monsoon Delta' ? '$1,850' : '$2,400',
          status: 'Recovered'
        };
        setIncidentHistory(prev => [newIncident, ...prev]);
      }

    } catch (err) {
      console.warn("Enterprise Fallback Engaged.", err);
      setTimeout(() => {
        const mockResults = {
          distanceKm: 345,
          originCoords: [12.9716, 77.5946],
          destinationCoords: [13.0827, 80.2707],
          routePath: [[12.9716, 77.5946], [12.85, 78.5], [13.0, 79.5], [13.0827, 80.2707]],
          resilienceReport: {
            status: simulatedIncident ? "Critical Bypass" : "Stable",
            summary: simulatedIncident 
              ? `Dynamic rerouting executed to avoid ${simulatedIncident}. Rerouted via alternate logistics corridor.`
              : "Standard transit. Weather patterns optimal for high-capacity freight.",
            riskNodes: simulatedIncident ? [{ lat: 12.9, lng: 79.1, reason: simulatedIncident, severity: "high" }] : [],
            roiAnalysis: { hoursSaved: 4.5, costAvoided: 1200 }
          },
          options: [
            { mode: "Diesel Freight", isResilientChoice: false, isGreenest: false, emissionsKg: 48, etaHours: 7, riskScore: 65, logic: "High payload capacity but vulnerable to local traffic shocks." },
            { mode: "Resilient Hybrid Vector", isResilientChoice: true, isGreenest: true, emissionsKg: 12, etaHours: 6.2, riskScore: 12, logic: "AI-optimized resilient path bypassing identified risk zones." }
          ]
        };
        setResults(mockResults);
        if (simulatedIncident) {
          setIncidentHistory(prev => [{ id: Date.now(), date: 'Apr 01', event: simulatedIncident, saved: '4.5h', roi: '$1,200', status: 'Recovered' }, ...prev]);
        }
        setLoading(false);
      }, 1500);
    } finally {
      if(API_KEY) setLoading(false);
    }
  };

  const handleMintTx = () => {
    setMintState("Hashing Manifest...");
    setTimeout(() => setMintState("Anchoring (L2)..."), 800);
    setTimeout(() => setMintState(`Verified: 0x${Math.random().toString(16).substring(2, 8).toUpperCase()}`), 2000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-emerald-500/30">
      
      {/* Enterprise Header */}
      <nav className="fixed w-full z-[1000] nav-blur px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Globe2 className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white block leading-none">
              Eco-Track <span className="text-emerald-400">Resilient</span>
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-0.5">Supply Chain Optimization</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <div className="flex items-center gap-2">
              <div className="status-pulse"><span className="dot"></span><span className="dot-inner"></span></div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest leading-none">Systems Nominal</span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono mt-1">NODE: GSC-INDIA-SOUTH-01</span>
          </div>
          <div className="h-10 w-[1px] bg-slate-800"></div>
          <button className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest border border-slate-700 transition-all">
            Command Dashboard
          </button>
        </div>
      </nav>

      <main className="pt-28 pb-12 max-w-[1700px] mx-auto px-6 grid grid-cols-12 gap-8">
        
        {/* Left: Dispatch & War Room */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="enterprise-panel p-6 rounded-3xl sticky top-28">
            <h2 className="text-sm font-black flex items-center gap-3 mb-6 text-white uppercase tracking-[0.15em]">
              <Navigation className="h-4 w-4 text-emerald-400" />
              Dispatch Unit
            </h2>
            
            <form onSubmit={handleOptimize} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Origin Node</label>
                <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-4 py-3 bg-[#020617] border border-slate-800 rounded-xl focus:border-emerald-500 text-sm text-white outline-none transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Terminal Node</label>
                <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-4 py-3 bg-[#020617] border border-slate-800 rounded-xl focus:border-emerald-500 text-sm text-white outline-none transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Payload (KG)</label>
                  <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-[#020617] border border-slate-800 rounded-xl text-sm text-white outline-none font-mono" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">IoT Sync</label>
                    <button type="button" onClick={() => setLiveTelemetry(!liveTelemetry)}
                      className={`h-4 w-8 rounded-full transition-all relative ${liveTelemetry ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                      <div className={`absolute top-1 h-2 w-2 rounded-full bg-white transition-all ${liveTelemetry ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>
                  <div className="h-[46px] flex items-center justify-center border border-dashed border-slate-800 rounded-xl">
                    <Activity className={`w-4 h-4 ${liveTelemetry ? 'text-emerald-400 animate-pulse' : 'text-slate-700'}`} />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-[#020617] font-black uppercase tracking-widest py-4 rounded-xl transition-all flex justify-center items-center gap-2 group">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Crosshair className="w-4 h-4" /> Initialize Tactical Analysis</>}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-800/50">
              <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5" /> War Room Simulator
              </h3>
              <div className="grid gap-3">
                <button onClick={() => handleOptimize(null, "Monsoon Delta")}
                  className="flex items-center justify-between px-4 py-3 enterprise-card text-left text-[11px] font-bold uppercase transition-all group overflow-hidden">
                  <span className="z-10 group-hover:text-emerald-400">Trigger Monsoon Bypass</span>
                  <Wind className="w-4 h-4 text-slate-600 z-10 group-hover:text-emerald-400 group-hover:rotate-12 transition-all" />
                </button>
                <button onClick={() => handleOptimize(null, "Port Congestion 12h")}
                  className="flex items-center justify-between px-4 py-3 enterprise-card text-left text-[11px] font-bold uppercase transition-all group overflow-hidden">
                  <span className="z-10 group-hover:text-emerald-400">Trigger Port Strike</span>
                  <AlertCircle className="w-4 h-4 text-slate-600 z-10 group-hover:text-emerald-400 transition-all" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Mission View & Intelligence */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          {/* Main Map */}
          <div className="enterprise-panel h-[450px] rounded-[2rem] overflow-hidden relative group">
            <div className="absolute top-6 left-6 z-[999] flex flex-col gap-2">
              <div className="bg-[#020617]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Live Logistics Mesh
              </div>
              {results?.resilienceReport?.status === "Critical Bypass" && (
                <div className="bg-amber-500/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/30 flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse">
                  <ShieldAlert className="h-3 w-3" /> Tactical Reroute Active
                </div>
              )}
            </div>

            <MapContainer 
              center={results?.routePath ? results.routePath[0] : [12.9716, 77.5946]} 
              zoom={6} 
              className="h-full w-full z-10 grayscale-[0.2]"
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              {results && (
                <>
                  <Marker position={results.originCoords}><Popup>Origin: Dispatch Node Alpha</Popup></Marker>
                  <Marker position={results.destinationCoords}><Popup>Destination: Terminal Node Beta</Popup></Marker>
                  <Polyline positions={results.routePath} color="#10b981" weight={4} opacity={0.6} />
                  {results.resilienceReport.riskNodes.map((node, i) => (
                    <Circle key={i} center={[node.lat, node.lng]} radius={15000} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.2 }}>
                      <Popup><span className="font-bold text-amber-600">ALERT: {node.reason}</span></Popup>
                    </Circle>
                  ))}
                </>
              )}
            </MapContainer>
          </div>

          {/* Intelligence Matrix */}
          {results && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="enterprise-panel px-6 py-5 rounded-2xl">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <TrendingUp className="w-3 h-3" /> Resiliency Gain
                  </span>
                  <p className="text-2xl font-black text-emerald-400">+{results.resilienceReport.roiAnalysis.hoursSaved}h <span className="text-xs text-slate-500 block font-bold">Time Recovered</span></p>
                </div>
                <div className="enterprise-panel px-6 py-5 rounded-2xl">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <DollarSign className="w-3 h-3" /> Risk-Cost Avoided
                  </span>
                  <p className="text-2xl font-black text-white">${results.resilienceReport.roiAnalysis.costAvoided} <span className="text-xs text-slate-500 block font-bold">Estimated Savings</span></p>
                </div>
                <div className="enterprise-panel px-6 py-5 rounded-2xl border-l-2 border-l-emerald-500">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <History className="w-3 h-3" /> Resilience Status
                  </span>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">{results.resilienceReport.status}</p>
                  <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[85%]"></div>
                  </div>
                </div>
              </div>

              <div className="enterprise-panel p-8 rounded-3xl">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  Tactical Optimization Matrix
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.options.map((opt, i) => (
                    <div key={i} className={`p-6 rounded-2xl border transition-all ${opt.isResilientChoice ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-black text-white uppercase text-xs tracking-widest">{opt.mode}</h4>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{opt.isResilientChoice ? 'Preferred Resilience Vector' : 'Standard Baseline'}</span>
                        </div>
                        {opt.isResilientChoice && <div className="p-1 px-2 bg-emerald-500 text-[#020617] text-[8px] font-black rounded uppercase tracking-tighter">Recommended</div>}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed min-h-[40px]">{opt.logic}</p>
                      <div className="grid grid-cols-3 gap-2 mt-6">
                        <div className="bg-[#020617] p-2 rounded-lg text-center">
                          <span className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Time</span>
                          <span className="text-xs font-black text-white">{opt.etaHours}h</span>
                        </div>
                        <div className="bg-[#020617] p-2 rounded-lg text-center">
                          <span className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Risk</span>
                          <span className={`text-xs font-black ${opt.riskScore < 20 ? 'text-emerald-400' : 'text-amber-500'}`}>{opt.riskScore}%</span>
                        </div>
                        <div className="bg-[#020617] p-2 rounded-lg text-center">
                          <span className="block text-[8px] text-slate-500 font-bold uppercase mb-1">CO2</span>
                          <span className="text-xs font-black text-white">{opt.emissionsKg}kg</span>
                        </div>
                      </div>
                      {opt.isResilientChoice && (
                        <button onClick={handleMintTx} disabled={!!mintState}
                          className="w-full mt-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all">
                          {mintState ? <><Link className="w-3 h-3 animate-pulse" /> {mintState}</> : <><ShieldCheck className="w-3.5 h-3.5" /> Anchor Resilient Manifest</>}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Incident History & ROI */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="enterprise-panel p-6 rounded-3xl sticky top-28 h-[calc(100vh-140px)] flex flex-col">
            <h2 className="text-sm font-black flex items-center gap-3 mb-6 text-white uppercase tracking-[0.15em]">
              <History className="h-4 w-4 text-emerald-400" />
              Intelligence Log
            </h2>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {incidentHistory.map((log) => (
                <div key={log.id} className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/50 hover:bg-slate-900 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black text-slate-600 uppercase font-mono">{log.date}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${log.status === 'Recovered' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>
                      {log.status}
                    </span>
                  </div>
                  <h4 className="text-[11px] font-black text-slate-300 uppercase leading-tight mb-3">{log.event}</h4>
                  <div className="flex items-center gap-4 pt-3 border-t border-slate-800/50">
                    <div>
                      <span className="block text-[8px] font-bold text-slate-600 uppercase mb-0.5 tracking-tighter">Time Saved</span>
                      <span className="text-[10px] font-black text-white">{log.saved}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-slate-600 uppercase mb-0.5 tracking-tighter">Profit Guarded</span>
                      <span className="text-[10px] font-black text-emerald-400">{log.roi}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6 border-t border-slate-800/80">
              <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 text-center">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Total System ROI</span>
                <p className="text-2xl font-black text-emerald-400">$6,740.00</p>
                <span className="text-[8px] font-bold text-slate-600 uppercase block mt-1">Prevented Latency Loss</span>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
