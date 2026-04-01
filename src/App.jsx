import React, { useState, useEffect } from 'react';
import { 
  Truck, MapPin, Package, AlertCircle, Loader2, Zap, Wind, Navigation, 
  Globe2, Link, Activity, Wifi, ShieldCheck, CheckCircle2, Thermometer, 
  AlertTriangle, Scale, Clock, ShieldAlert, BarChart3, History, 
  Play, RotateCcw, TrendingUp, DollarSign, Crosshair, Search
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for React-Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Lightweight geocoding dictionary for "Zero-Failure" demo mode
const LITE_GEO_DB = {
  'kochi': [9.9312, 76.2673],
  'chennai': [13.0827, 80.2707],
  'bengaluru': [12.9716, 77.5946],
  'mumbai': [19.0760, 72.8777],
  'delhi': [28.6139, 77.2090],
  'new york': [40.7128, -74.0060],
  'london': [51.5074, -0.1278],
  'tokyo': [35.6762, 139.6503],
  'paris': [48.8566, 2.3522],
  'singapore': [1.3521, 103.8198]
};

// Component to dynamically update map view
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 6, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim() || ""; 

export default function App() {
  const [origin, setOrigin] = useState('Kochi');
  const [destination, setDestination] = useState('Chennai');
  const [weight, setWeight] = useState(500);
  const [cargoClass, setCargoClass] = useState('Standard Freight');
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [liveTelemetry, setLiveTelemetry] = useState(false);
  const [mintState, setMintState] = useState(null);

  const [activeSimulation, setActiveSimulation] = useState(null);
  const [incidentHistory, setIncidentHistory] = useState([
    { id: 1, date: 'Mar 28', event: 'North Atlantic Storm Reroute', saved: '4.2h', roi: '$1,240', status: 'Optimal' },
    { id: 2, date: 'Mar 30', event: 'Suez Canal Congestion Bypass', saved: '12h', roi: '$3,100', status: 'Critical' }
  ]);

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
      Act as a Global Resilient Supply Chain Intelligence Engine.
      Analyze the international route from "${origin}" to "${destination}" for a ${weight}kg payload.
      Return JSON: { "distanceKm": Number, "originCoords": [lat, lng], "destinationCoords": [lat, lng], "routePath": [[lat, lng], ...], "resilienceReport": {...}, "options": [...] }
    `;

    try {
      if (!API_KEY) throw new Error("Fallback Mode");
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }], generationConfig: { temperature: 0.2, response_mime_type: "application/json" } })
      });
      if (!response.ok) throw new Error("API Failure");
      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      setResults(JSON.parse(cleanJSON(rawText)));
    } catch (err) {
      console.warn("Tactical Fail-Safe Engaged.", err);
      const originKey = origin.toLowerCase().trim();
      const destKey = destination.toLowerCase().trim();
      const originFallback = LITE_GEO_DB[originKey] || [40.7128, -74.0060];
      const destFallback = LITE_GEO_DB[destKey] || [51.5074, -0.1278];

      setTimeout(() => {
        setResults({
          distanceKm: 450,
          originCoords: originFallback,
          destinationCoords: destFallback,
          routePath: [originFallback, [ (originFallback[0]+destFallback[0])/2 + 0.1, (originFallback[1]+destFallback[1])/2 + 0.1 ], destFallback],
          resilienceReport: {
            status: simulatedIncident ? "Critical Bypass" : "Stable",
            summary: `Heuristic logic mapping ${origin} to ${destination}. System maintaining visual operationality via edge-cached geospatial DB.`,
            riskNodes: simulatedIncident ? [{ lat: (originFallback[0]+destFallback[0])/2, lng: (originFallback[1]+destFallback[1])/2, reason: simulatedIncident, severity: "high" }] : [],
            roiAnalysis: { hoursSaved: 5.5, costAvoided: 1400 }
          },
          options: [
            { mode: "Standard Tactical", isResilientChoice: false, isGreenest: true, emissionsKg: 45, etaHours: 12, riskScore: 15, logic: "Heuristic baseline." },
            { mode: "Resilient Vector", isResilientChoice: true, isGreenest: false, emissionsKg: 120, etaHours: 9.5, riskScore: 5, logic: "Optimized resilient corridor." }
          ]
        });
        setLoading(false);
      }, 600);
    } finally {
      if(API_KEY) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-emerald-500/30">
      <nav className="fixed w-full z-[1000] nav-blur px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20"><Globe2 className="h-6 w-6 text-emerald-400" /></div>
          <div><span className="text-2xl font-black tracking-tight text-white block leading-none">Eco-Track <span className="text-emerald-400">Resilient</span></span><span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-0.5">Global Tactical Suite</span></div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end"><div className="flex items-center gap-2"><div className="status-pulse"><span className="dot"></span><span className="dot-inner"></span></div><span className="text-xs font-bold text-emerald-400 uppercase tracking-widest leading-none">Global Active</span></div><span className="text-[9px] text-slate-500 font-mono mt-1">SECURE-NODE-01</span></div>
          <div className="h-10 w-[1px] bg-slate-800"></div>
          <button className="px-5 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-700 transition-all">Command Center</button>
        </div>
      </nav>

      <main className="pt-28 pb-12 max-w-[1700px] mx-auto px-6 grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="enterprise-panel p-6 rounded-3xl sticky top-28">
            <h2 className="text-sm font-black flex items-center gap-3 mb-6 text-white uppercase tracking-[0.15em]"><Search className="h-4 w-4 text-emerald-400" /> Global Dispatch</h2>
            <form onSubmit={handleOptimize} className="space-y-5">
              <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Origin</label><div className="relative group/input"><MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-600 group-focus-within/input:text-emerald-400" /><input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-[#020617] border border-slate-800 rounded-xl focus:border-emerald-500 text-sm text-white outline-none" /></div></div>
              <div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Terminal</label><div className="relative group/input"><MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-600 group-focus-within/input:text-cyan-400" /><input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-[#020617] border border-slate-800 rounded-xl focus:border-cyan-500 text-sm text-white outline-none" /></div></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Payload (KG)</label><input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full px-4 py-3 bg-[#020617] border border-slate-800 rounded-xl text-sm text-white font-mono" /></div><div className="space-y-1.5"><div className="flex items-center justify-between ml-1"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">IoT Sync</label><button type="button" onClick={() => setLiveTelemetry(!liveTelemetry)} className={`h-4 w-8 rounded-full transition-all relative ${liveTelemetry ? 'bg-emerald-500' : 'bg-slate-700'}`}><div className={`absolute top-1 h-2 w-2 rounded-full bg-white transition-all ${liveTelemetry ? 'right-1' : 'left-1'}`}></div></button></div><div className="h-[46px] flex items-center justify-center border border-dashed border-slate-800 rounded-xl"><Activity className={`w-4 h-4 ${liveTelemetry ? 'text-emerald-400 animate-pulse' : 'text-slate-700'}`} /></div></div></div>
              <button type="submit" disabled={loading} className="w-full bg-emerald-600 font-black uppercase tracking-widest py-4 rounded-xl transition-all flex justify-center items-center gap-2 hover:bg-emerald-500">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Globe2 className="w-4 h-4" /> Initialize Analysis</>}</button>
            </form>
            <div className="mt-10 pt-8 border-t border-slate-800/50"><h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><ShieldAlert className="w-3.5 h-3.5" /> War Room Simulations</h3><div className="grid gap-3"><button onClick={() => handleOptimize(null, "Monsoon Surge")} className="flex items-center justify-between px-4 py-3 enterprise-card text-left text-[11px] font-bold uppercase hover:text-emerald-400 group transition-all">Trigger Monsoon Surge <Wind className="w-4 h-4 text-slate-600 group-hover:text-emerald-400" /></button><button onClick={() => handleOptimize(null, "Port Congestion")} className="flex items-center justify-between px-4 py-3 enterprise-card text-left text-[11px] font-bold uppercase hover:text-emerald-400 group transition-all">Trigger Port Strike <AlertCircle className="w-4 h-4 text-slate-600 group-hover:text-emerald-400" /></button></div></div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 space-y-6">
          <div className="enterprise-panel h-[450px] rounded-[2rem] overflow-hidden relative group">
            <div className="absolute top-6 left-6 z-[999] flex flex-col gap-2"><div className="bg-[#020617]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest"><div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>Tactical Overlay</div>{results?.resilienceReport?.status === "Critical Bypass" && <div className="bg-amber-500/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/30 flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse"><ShieldAlert className="h-3 w-3" /> Resilient Reroute Active</div>}</div>
            <MapContainer center={[12.9716, 77.5946]} zoom={5} className="h-full w-full z-10 grayscale-[0.2]"><TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />{results && (<><MapController center={results.originCoords} /><Marker position={results.originCoords}><Popup>Origin: {origin}</Popup></Marker><Marker position={results.destinationCoords}><Popup>Terminal: {destination}</Popup></Marker><Polyline positions={results.routePath} color="#10b981" weight={4} opacity={0.6} />{results.resilienceReport.riskNodes.map((node, i) => (<Circle key={i} center={[node.lat, node.lng]} radius={30000} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.2 }}><Popup><span className="font-bold text-amber-600">ALERT: {node.reason}</span></Popup></Circle>))}</>)}</MapContainer>
          </div>

          {results && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6"><div className="grid grid-cols-3 gap-4"><div className="enterprise-panel px-6 py-5 rounded-2xl border-b-2 border-emerald-500"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Resilience Gain</span><p className="text-2xl font-black text-emerald-400">+{results.resilienceReport.roiAnalysis.hoursSaved}h</p></div><div className="enterprise-panel px-6 py-5 rounded-2xl border-b-2 border-cyan-500"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Profit Guarded</span><p className="text-2xl font-black text-white">${results.resilienceReport.roiAnalysis.costAvoided}</p></div><div className="enterprise-panel px-6 py-5 rounded-2xl"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Confidence</span><p className="text-xs font-bold text-white uppercase">{results.resilienceReport.status}</p><div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[94%]" /></div></div></div>
          <div className="enterprise-panel p-8 rounded-3xl"><h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3"><BarChart3 className="h-4 w-4 text-emerald-400" /> Tactical Intelligence Options</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{results.options.map((opt, i) => (<div key={i} className={`p-6 rounded-2xl border transition-all ${opt.isResilientChoice ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-900/40 border-slate-800'}`}><div className="flex justify-between items-start mb-4"><div><h4 className="font-black text-white uppercase text-xs tracking-widest">{opt.mode}</h4><span className="text-[9px] font-bold text-slate-500 uppercase">{opt.isResilientChoice ? 'Optimized Vector' : 'Baseline'}</span></div>{opt.isResilientChoice && <div className="p-1 px-2 bg-emerald-500 text-[#020617] text-[8px] font-black rounded uppercase">Recommended</div>}</div><p className="text-xs text-slate-400 min-h-[40px] italic">"{opt.logic}"</p><div className="grid grid-cols-3 gap-2 mt-6"><div className="bg-[#020617] p-2 rounded-lg text-center border border-slate-800"><span className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Transit</span><span className="text-xs font-black text-white">{opt.etaHours}h</span></div><div className="bg-[#020617] p-2 rounded-lg text-center border border-slate-800"><span className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Risk</span><span className={`text-xs font-black ${opt.riskScore < 20 ? 'text-emerald-400' : 'text-amber-500'}`}>{opt.riskScore}%</span></div><div className="bg-[#020617] p-2 rounded-lg text-center border border-slate-800"><span className="block text-[8px] text-slate-500 font-bold uppercase mb-1">Emissions</span><span className="text-xs font-black text-slate-300">{opt.emissionsKg}kg</span></div></div></div>))}</div></div></div>)}
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="enterprise-panel p-6 rounded-3xl sticky top-28 h-[calc(100vh-140px)] flex flex-col">
            <h2 className="text-sm font-black flex items-center gap-3 mb-6 text-white uppercase tracking-[0.15em]"><History className="h-4 w-4 text-emerald-400" /> Intelligence Log</h2>
            <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">{incidentHistory.map((log) => (<div key={log.id} className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/50 transition-colors"><div className="flex justify-between items-start mb-2"><span className="text-[9px] font-black text-slate-600 uppercase font-mono">{log.date}</span><span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${log.status === 'Recovered' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>{log.status}</span></div><h4 className="text-[11px] font-black text-slate-300 uppercase leading-tight mb-3">{log.event}</h4><div className="flex items-center gap-4 pt-3 border-t border-slate-800/50"><div><span className="block text-[8px] font-bold text-slate-600 uppercase mb-0.5">Time Saved</span><span className="text-[10px] font-black text-white">{log.saved}</span></div><div><span className="block text-[8px] font-bold text-slate-600 uppercase mb-0.5 tracking-tighter text-emerald-400">ROI</span><span className="text-[10px] font-black text-emerald-400">{log.roi}</span></div></div></div>))}</div>
            <div className="mt-auto pt-6 border-t border-slate-800/80"><div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 text-center"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Prevented Loss Aggregate</span><p className="text-2xl font-black text-emerald-400">$12,480.00</p></div></div>
          </div>
        </div>
      </main>
    </div>
  );
}
