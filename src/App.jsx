import { useEffect, useState } from 'react'
import {
  Activity,
  AlertCircle,
  BarChart3,
  Globe2,
  History,
  Loader2,
  MapPin,
  Package,
  Search,
  ShieldAlert,
  Wind,
} from 'lucide-react'

import {
  buildFallbackAnalysis,
  CARGO_PROFILES,
  cleanJSON,
  formatCurrency,
  formatHours,
  formatShortDate,
  normalizeModelResult,
} from './lib/resilienceEngine'
import GoogleRouteMap from './components/GoogleRouteMap'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim() || ''
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || ''

export default function App() {
  const [origin, setOrigin] = useState('Kochi')
  const [destination, setDestination] = useState('Chennai')
  const [weight, setWeight] = useState(500)
  const [cargoClass, setCargoClass] = useState('Standard Freight')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [systemNotice, setSystemNotice] = useState(null)
  const [liveTelemetry, setLiveTelemetry] = useState(false)
  const [activeSimulation, setActiveSimulation] = useState(null)
  const [incidentHistory, setIncidentHistory] = useState([
    {
      id: 1,
      date: 'Mar 28',
      event: 'North Atlantic Storm Reroute',
      savedHours: 4.2,
      roiDollars: 1240,
      status: 'Recovered',
    },
    {
      id: 2,
      date: 'Mar 30',
      event: 'Suez Canal Congestion Bypass',
      savedHours: 12,
      roiDollars: 3100,
      status: 'Critical',
    },
  ])

  useEffect(() => {
    let interval

    if (liveTelemetry) {
      interval = setInterval(() => {
        setWeight((previousWeight) =>
          Math.max(100, previousWeight + (Math.floor(Math.random() * 11) - 5)),
        )
      }, 1500)
    }

    return () => clearInterval(interval)
  }, [liveTelemetry])

  const aggregatePreventedLoss = incidentHistory.reduce(
    (sum, entry) => sum + entry.roiDollars,
    0,
  )

  const resultContext = results?.context || {
    cargoClass,
    liveTelemetry,
    simulatedIncident: activeSimulation,
  }
  const resultCargoProfile =
    CARGO_PROFILES[resultContext.cargoClass] || CARGO_PROFILES['Standard Freight']

  const recordIncident = (scenarioName, roiAnalysis) => {
    if (!scenarioName) {
      return
    }

    setIncidentHistory((previousHistory) => [
      {
        id: Date.now(),
        date: formatShortDate(),
        event: `${scenarioName} Recovery Playbook`,
        savedHours: roiAnalysis.hoursSaved,
        roiDollars: roiAnalysis.costAvoided,
        status: 'Recovered',
      },
      ...previousHistory,
    ].slice(0, 6))
  }

  const handleOptimize = async (event, simulatedIncident = null) => {
    if (event) {
      event.preventDefault()
    }

    const context = {
      origin,
      destination,
      weight,
      cargoClass,
      simulatedIncident,
      liveTelemetry,
    }

    setLoading(true)
    setSystemNotice(null)
    setResults(null)
    setActiveSimulation(simulatedIncident)

    const promptText = `
      Act as a resilient supply chain intelligence engine.
      Analyze the route from "${origin}" to "${destination}" for a ${weight}kg shipment.
      Cargo class: "${cargoClass}".
      Live telemetry available: ${liveTelemetry ? 'yes' : 'no'}.
      Active disruption drill: ${simulatedIncident || 'none'}.

      Return valid JSON with this exact structure:
      {
        "distanceKm": Number,
        "originCoords": [lat, lng],
        "destinationCoords": [lat, lng],
        "routePath": [[lat, lng], ...],
        "resilienceReport": {
          "status": String,
          "summary": String,
          "signals": [String, ...],
          "riskNodes": [{ "lat": Number, "lng": Number, "reason": String, "severity": String }],
          "roiAnalysis": { "hoursSaved": Number, "costAvoided": Number }
        },
        "options": [
          {
            "mode": String,
            "isResilientChoice": Boolean,
            "isGreenest": Boolean,
            "emissionsKg": Number,
            "etaHours": Number,
            "riskScore": Number,
            "logic": String
          }
        ]
      }
    `

    try {
      if (!API_KEY) {
        throw new Error('Fallback mode')
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 0.2,
              response_mime_type: 'application/json',
            },
          }),
        },
      )

      if (!response.ok) {
        throw new Error('Gemini request failed')
      }

      const data = await response.json()
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
      const parsed = JSON.parse(cleanJSON(rawText || ''))
      const normalized = normalizeModelResult(parsed, context)

      setResults(normalized)
      if (simulatedIncident) {
        recordIncident(simulatedIncident, normalized.resilienceReport.roiAnalysis)
      }
    } catch (error) {
      console.warn('Resilience fallback engaged.', error)

      const fallbackResults = buildFallbackAnalysis(context)
      setResults(fallbackResults)
      setSystemNotice(
        API_KEY
          ? 'Gemini was unavailable, so the local resilience engine kept the demo running.'
          : 'No Gemini key detected, so the local resilience engine is powering the demo.',
      )

      if (simulatedIncident) {
        recordIncident(
          simulatedIncident,
          fallbackResults.resilienceReport.roiAnalysis,
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-emerald-500/30">
      <nav className="fixed z-[1000] flex w-full items-center justify-between nav-blur px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2">
            <Globe2 className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <span className="block text-2xl font-black leading-none tracking-tight text-white">
              Eco-Track <span className="text-emerald-400">Resilient</span>
            </span>
            <span className="ml-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Global Tactical Suite
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden flex-col items-end md:flex">
            <div className="flex items-center gap-2">
              <div className="status-pulse">
                <span className="dot"></span>
                <span className="dot-inner"></span>
              </div>
              <span className="text-xs font-bold uppercase leading-none tracking-widest text-emerald-400">
                Global Active
              </span>
            </div>
            <span className="mt-1 font-mono text-[9px] text-slate-500">
              SECURE-NODE-01
            </span>
          </div>
          <div className="h-10 w-[1px] bg-slate-800"></div>
          <button className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-2 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-slate-700">
            Command Center
          </button>
        </div>
      </nav>

      <main className="mx-auto grid max-w-[1700px] grid-cols-12 gap-8 px-6 pb-12 pt-28">
        <div className="col-span-12 space-y-6 lg:col-span-3">
          <div className="enterprise-panel sticky top-28 rounded-3xl p-6">
            <h2 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-[0.15em] text-white">
              <Search className="h-4 w-4 text-emerald-400" />
              Global Dispatch
            </h2>

            <form onSubmit={handleOptimize} className="space-y-5">
              <div className="space-y-1.5">
                <label className="ml-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  Origin
                </label>
                <div className="group/input relative">
                  <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-600 group-focus-within/input:text-emerald-400" />
                  <input
                    type="text"
                    value={origin}
                    onChange={(event) => setOrigin(event.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-[#020617] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  Terminal
                </label>
                <div className="group/input relative">
                  <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-600 group-focus-within/input:text-cyan-400" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-[#020617] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="ml-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                    Payload (KG)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(event) => setWeight(Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-[#020617] px-4 py-3 font-mono text-sm text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="ml-1 flex items-center justify-between">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                      IoT Sync
                    </label>
                    <button
                      type="button"
                      onClick={() => setLiveTelemetry(!liveTelemetry)}
                      className={`relative h-4 w-8 rounded-full transition-all ${
                        liveTelemetry ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`absolute top-1 h-2 w-2 rounded-full bg-white transition-all ${
                          liveTelemetry ? 'right-1' : 'left-1'
                        }`}
                      ></div>
                    </button>
                  </div>

                  <div className="flex h-[46px] items-center justify-center rounded-xl border border-dashed border-slate-800">
                    <Activity
                      className={`h-4 w-4 ${
                        liveTelemetry
                          ? 'animate-pulse text-emerald-400'
                          : 'text-slate-700'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  <Package className="h-3.5 w-3.5" />
                  Cargo Class
                </label>
                <select
                  value={cargoClass}
                  onChange={(event) => setCargoClass(event.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-[#020617] px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                >
                  {Object.keys(CARGO_PROFILES).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 font-black uppercase tracking-widest transition-all hover:bg-emerald-500"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Globe2 className="h-4 w-4" />
                    Initialize Analysis
                  </>
                )}
              </button>
            </form>

            {systemNotice && (
              <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[11px] font-medium leading-relaxed text-amber-100">
                {systemNotice}
              </div>
            )}

            {activeSimulation && (
              <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Active Drill
                </div>
                <p className="mt-2 text-sm font-semibold text-white">
                  {activeSimulation}
                </p>
              </div>
            )}

            <div className="mt-10 border-t border-slate-800/50 pt-8">
              <h3 className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                <ShieldAlert className="h-3.5 w-3.5" />
                War Room Simulations
              </h3>
              <div className="grid gap-3">
                <button
                  onClick={() => handleOptimize(null, 'Monsoon Surge')}
                  className="enterprise-card group flex items-center justify-between px-4 py-3 text-left text-[11px] font-bold uppercase transition-all hover:text-emerald-400"
                >
                  Trigger Monsoon Surge
                  <Wind className="h-4 w-4 text-slate-600 group-hover:text-emerald-400" />
                </button>
                <button
                  onClick={() => handleOptimize(null, 'Port Congestion')}
                  className="enterprise-card group flex items-center justify-between px-4 py-3 text-left text-[11px] font-bold uppercase transition-all hover:text-emerald-400"
                >
                  Trigger Port Congestion
                  <AlertCircle className="h-4 w-4 text-slate-600 group-hover:text-emerald-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-6">
          <div className="enterprise-panel group relative h-[450px] overflow-hidden rounded-[2rem]">
            <div className="absolute left-6 top-6 z-[999] flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#020617]/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
                Tactical Overlay
              </div>
              {results?.resilienceReport?.status === 'Critical Bypass' && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500 backdrop-blur-md animate-pulse">
                  <ShieldAlert className="h-3 w-3" />
                  Resilient Reroute Active
                </div>
              )}
            </div>

            <GoogleRouteMap
              apiKey={MAPS_API_KEY}
              originLabel={origin}
              destinationLabel={destination}
              originCoords={results?.originCoords}
              destinationCoords={results?.destinationCoords}
              routePath={results?.routePath}
              riskNodes={results?.resilienceReport?.riskNodes}
            />
          </div>

          {results && (
            <div className="animate-in slide-in-from-bottom-4 space-y-6 duration-700 fade-in">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="enterprise-panel rounded-2xl border-b-2 border-emerald-500 px-6 py-5">
                  <span className="mb-2 block text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Resilience Gain
                  </span>
                  <p className="text-2xl font-black text-emerald-400">
                    +{formatHours(results.resilienceReport.roiAnalysis.hoursSaved)}
                  </p>
                </div>
                <div className="enterprise-panel rounded-2xl border-b-2 border-cyan-500 px-6 py-5">
                  <span className="mb-2 block text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Profit Guarded
                  </span>
                  <p className="text-2xl font-black text-white">
                    {formatCurrency(results.resilienceReport.roiAnalysis.costAvoided)}
                  </p>
                </div>
                <div className="enterprise-panel rounded-2xl px-6 py-5">
                  <span className="mb-2 block text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Route Distance
                  </span>
                  <p className="text-2xl font-black text-white">
                    {results.distanceKm}
                    <span className="ml-1 text-sm text-slate-500">km</span>
                  </p>
                </div>
                <div className="enterprise-panel rounded-2xl px-6 py-5">
                  <span className="mb-2 block text-[9px] font-black uppercase tracking-widest text-slate-500">
                    Confidence
                  </span>
                  <p className="text-xs font-bold uppercase text-white">
                    {results.resilienceReport.status}
                  </p>
                  <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full w-[94%] bg-emerald-500"></div>
                  </div>
                </div>
              </div>

              <div className="enterprise-panel rounded-3xl p-8">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {results.resilienceReport.signals.map((signal) => (
                    <span
                      key={signal}
                      className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300"
                    >
                      {signal}
                    </span>
                  ))}
                </div>

                <p className="text-sm leading-relaxed text-slate-300">
                  {results.resilienceReport.summary}
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-[#020617] p-4">
                    <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">
                      Shipment Profile
                    </span>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {resultContext.cargoClass}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">
                      {resultCargoProfile.alert}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#020617] p-4">
                    <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">
                      Network State
                    </span>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {resultContext.simulatedIncident || 'No active disruption drill'}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">
                      {resultContext.liveTelemetry
                        ? 'IoT payload variance is actively feeding the route recommendation.'
                        : 'Manifest-first planning mode is active for scenario analysis.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="enterprise-panel rounded-3xl p-8">
                <h3 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-widest text-white">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  Tactical Intelligence Options
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {results.options.map((option) => (
                    <div
                      key={option.mode}
                      className={`rounded-2xl border p-6 transition-all ${
                        option.isResilientChoice
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-slate-800 bg-slate-900/40'
                      }`}
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-widest text-white">
                            {option.mode}
                          </h4>
                          <span className="text-[9px] font-bold uppercase text-slate-500">
                            {option.isResilientChoice
                              ? 'Optimized vector'
                              : 'Baseline lane'}
                          </span>
                        </div>
                        {option.isResilientChoice && (
                          <div className="rounded bg-emerald-500 px-2 py-1 text-[8px] font-black uppercase text-[#020617]">
                            Recommended
                          </div>
                        )}
                      </div>

                      <p className="min-h-[40px] text-xs italic text-slate-400">
                        "{option.logic}"
                      </p>

                      <div className="mt-6 grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-slate-800 bg-[#020617] p-2 text-center">
                          <span className="mb-1 block text-[8px] font-bold uppercase text-slate-500">
                            Transit
                          </span>
                          <span className="text-xs font-black text-white">
                            {formatHours(option.etaHours)}
                          </span>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-[#020617] p-2 text-center">
                          <span className="mb-1 block text-[8px] font-bold uppercase text-slate-500">
                            Risk
                          </span>
                          <span
                            className={`text-xs font-black ${
                              option.riskScore < 20
                                ? 'text-emerald-400'
                                : 'text-amber-500'
                            }`}
                          >
                            {option.riskScore}%
                          </span>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-[#020617] p-2 text-center">
                          <span className="mb-1 block text-[8px] font-bold uppercase text-slate-500">
                            Emissions
                          </span>
                          <span className="text-xs font-black text-slate-300">
                            {option.emissionsKg}kg
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-3">
          <div className="enterprise-panel sticky top-28 flex h-[calc(100vh-140px)] flex-col rounded-3xl p-6">
            <h2 className="mb-6 flex items-center gap-3 text-sm font-black uppercase tracking-[0.15em] text-white">
              <History className="h-4 w-4 text-emerald-400" />
              Intelligence Log
            </h2>

            <div className="scrollbar-hide flex-1 space-y-3 overflow-y-auto">
              {incidentHistory.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-4 transition-colors"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <span className="font-mono text-[9px] font-black uppercase text-slate-600">
                      {log.date}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase ${
                        log.status === 'Recovered'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>

                  <h4 className="mb-3 text-[11px] font-black uppercase leading-tight text-slate-300">
                    {log.event}
                  </h4>

                  <div className="flex items-center gap-4 border-t border-slate-800/50 pt-3">
                    <div>
                      <span className="mb-0.5 block text-[8px] font-bold uppercase text-slate-600">
                        Time Saved
                      </span>
                      <span className="text-[10px] font-black text-white">
                        {formatHours(log.savedHours)}
                      </span>
                    </div>
                    <div>
                      <span className="mb-0.5 block text-[8px] font-bold uppercase tracking-tighter text-emerald-400">
                        ROI
                      </span>
                      <span className="text-[10px] font-black text-emerald-400">
                        {formatCurrency(log.roiDollars)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto border-t border-slate-800/80 pt-6">
              <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-center">
                <span className="mb-1 block text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Prevented Loss Aggregate
                </span>
                <p className="text-2xl font-black text-emerald-400">
                  {formatCurrency(aggregatePreventedLoss)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
