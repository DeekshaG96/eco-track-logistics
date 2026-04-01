const DEFAULT_ORIGIN_COORDS = [40.7128, -74.006]
const DEFAULT_DESTINATION_COORDS = [51.5074, -0.1278]

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const LITE_GEO_DB = {
  kochi: [9.9312, 76.2673],
  chennai: [13.0827, 80.2707],
  bengaluru: [12.9716, 77.5946],
  mumbai: [19.076, 72.8777],
  delhi: [28.6139, 77.209],
  'new york': [40.7128, -74.006],
  london: [51.5074, -0.1278],
  tokyo: [35.6762, 139.6503],
  paris: [48.8566, 2.3522],
  singapore: [1.3521, 103.8198],
}

export const CARGO_PROFILES = {
  'Standard Freight': {
    alert: 'Balanced freight mode prioritizes network efficiency.',
    emissionsOffset: 0,
    etaOffset: 0,
    riskOffset: 0,
    signal: 'Manifest compliance',
  },
  'Perishables / Cold Chain': {
    alert: 'Cold-chain cargo needs faster bypasses and tighter dwell-time control.',
    emissionsOffset: 8,
    etaOffset: -0.4,
    riskOffset: 6,
    signal: 'Thermal telemetry',
  },
  'Hazardous Materials (HAZMAT)': {
    alert: 'Hazmat cargo prefers compliant corridors over the shortest path.',
    emissionsOffset: 10,
    etaOffset: 0.2,
    riskOffset: 9,
    signal: 'Safety compliance watch',
  },
}

export const SIMULATION_PROFILES = {
  'Monsoon Surge': {
    baselineDelay: 5.1,
    resilientDelay: 1.1,
    baselineRisk: 64,
    resilientRisk: 18,
    emissionsPenalty: 12,
    hoursSaved: 7.2,
    costAvoided: 2800,
    summary:
      'Weather disruption detected across the primary corridor. The resilient vector shifts traffic to a drier inland lane before bottlenecks spread.',
    reason: 'Flooded arterial corridor',
    severity: 'high',
    detourOffset: [0.55, 0.7],
  },
  'Port Congestion': {
    baselineDelay: 6.3,
    resilientDelay: 1.7,
    baselineRisk: 71,
    resilientRisk: 22,
    emissionsPenalty: 9,
    hoursSaved: 8.1,
    costAvoided: 3150,
    summary:
      'Terminal throughput dropped below threshold. The resilient vector reallocates the shipment before queue times cascade into regional delay.',
    reason: 'Terminal queue saturation',
    severity: 'high',
    detourOffset: [-0.35, 0.55],
  },
}

const isValidCoords = (coords) =>
  Array.isArray(coords) &&
  coords.length === 2 &&
  coords.every((value) => Number.isFinite(value))

const midpoint = (originCoords, destinationCoords, offset = [0.1, 0.1]) => [
  (originCoords[0] + destinationCoords[0]) / 2 + offset[0],
  (originCoords[1] + destinationCoords[1]) / 2 + offset[1],
]

const buildRiskNodes = (originCoords, destinationCoords, simulationProfile) => {
  if (!simulationProfile) {
    return []
  }

  const detourPoint = midpoint(
    originCoords,
    destinationCoords,
    simulationProfile.detourOffset,
  )

  return [
    {
      lat: detourPoint[0],
      lng: detourPoint[1],
      reason: simulationProfile.reason,
      severity: simulationProfile.severity,
    },
  ]
}

const getCoords = (location, fallback) =>
  LITE_GEO_DB[location.toLowerCase().trim()] || fallback

const buildDistanceEstimate = (originCoords, destinationCoords, weight) => {
  const latDelta = Math.abs(originCoords[0] - destinationCoords[0])
  const lngDelta = Math.abs(originCoords[1] - destinationCoords[1])
  return Math.max(240, Math.round(320 + latDelta * 42 + lngDelta * 18 + weight / 14))
}

const buildFallbackOptions = ({ cargoProfile, simulationProfile, distanceKm }) => {
  const standardEta = Number(
    (distanceKm / 48 + 1.7 + cargoProfile.etaOffset + (simulationProfile?.baselineDelay || 0)).toFixed(1),
  )
  const resilientEta = Number(
    (distanceKm / 58 + 1.1 + cargoProfile.etaOffset + (simulationProfile?.resilientDelay || 0)).toFixed(1),
  )
  const standardRisk = simulationProfile
    ? simulationProfile.baselineRisk + cargoProfile.riskOffset
    : 18 + cargoProfile.riskOffset
  const resilientRisk = simulationProfile
    ? simulationProfile.resilientRisk + Math.ceil(cargoProfile.riskOffset / 2)
    : 7 + Math.ceil(cargoProfile.riskOffset / 2)
  const baseEmissions = Math.round(distanceKm * 0.08 + cargoProfile.emissionsOffset)

  return [
    {
      mode: 'Standard Tactical',
      isResilientChoice: false,
      isGreenest: true,
      emissionsKg: Math.max(20, baseEmissions - 6),
      etaHours: standardEta,
      riskScore: standardRisk,
      logic: 'Cost-efficient routing that accepts higher disruption exposure.',
    },
    {
      mode: 'Resilient Vector',
      isResilientChoice: true,
      isGreenest: false,
      emissionsKg: baseEmissions + (simulationProfile?.emissionsPenalty || 6),
      etaHours: resilientEta,
      riskScore: resilientRisk,
      logic: 'Priority bypass that protects service levels before local failures cascade.',
    },
  ]
}

export const cleanJSON = (text) => {
  const match = text.match(/```json\n([\s\S]*?)\n```/)
  return match ? match[1] : text
}

export const formatCurrency = (amount) => USD_FORMATTER.format(amount)

export const formatHours = (hours) =>
  `${Number(hours).toFixed(1).replace(/\.0$/, '')}h`

export const formatShortDate = (date = new Date()) =>
  SHORT_DATE_FORMATTER.format(date)

export const buildFallbackAnalysis = ({
  origin,
  destination,
  weight,
  cargoClass,
  simulatedIncident,
  liveTelemetry,
}) => {
  const cargoProfile = CARGO_PROFILES[cargoClass] || CARGO_PROFILES['Standard Freight']
  const simulationProfile = simulatedIncident
    ? SIMULATION_PROFILES[simulatedIncident]
    : null
  const originCoords = getCoords(origin, DEFAULT_ORIGIN_COORDS)
  const destinationCoords = getCoords(destination, DEFAULT_DESTINATION_COORDS)
  const distanceKm = buildDistanceEstimate(originCoords, destinationCoords, weight)
  const routePath = [
    originCoords,
    midpoint(
      originCoords,
      destinationCoords,
      simulationProfile?.detourOffset || [0.1, 0.1],
    ),
    destinationCoords,
  ]
  const riskNodes = buildRiskNodes(
    originCoords,
    destinationCoords,
    simulationProfile,
  )
  const options = buildFallbackOptions({
    cargoProfile,
    simulationProfile,
    distanceKm,
  })
  const roiAnalysis = {
    hoursSaved: simulationProfile?.hoursSaved || 2.6 + Math.max(0, cargoProfile.riskOffset / 10),
    costAvoided: simulationProfile?.costAvoided || 960 + cargoProfile.riskOffset * 65,
  }
  const summary = simulationProfile
    ? `${simulationProfile.summary} ${cargoProfile.alert}`
    : `No active disruption detected. The resilience engine is scoring weather, terminal throughput, and shipment constraints for ${cargoClass.toLowerCase()} between ${origin} and ${destination}.`

  return {
    distanceKm,
    originCoords,
    destinationCoords,
    routePath,
    resilienceReport: {
      status: simulationProfile ? 'Critical Bypass' : 'Stable',
      summary,
      riskNodes,
      roiAnalysis,
      signals: [
        'Weather watch',
        'Terminal operations',
        cargoProfile.signal,
        liveTelemetry ? 'IoT payload stream' : 'Planned manifest',
      ],
    },
    options,
    context: {
      cargoClass,
      liveTelemetry,
      simulatedIncident,
    },
  }
}

const normalizeOption = (option, fallbackOption) => ({
  mode: option?.mode || fallbackOption.mode,
  isResilientChoice: Boolean(
    option?.isResilientChoice ?? fallbackOption.isResilientChoice,
  ),
  isGreenest: Boolean(option?.isGreenest ?? fallbackOption.isGreenest),
  emissionsKg: Number(option?.emissionsKg) || fallbackOption.emissionsKg,
  etaHours: Number(option?.etaHours) || fallbackOption.etaHours,
  riskScore: Number(option?.riskScore) || fallbackOption.riskScore,
  logic: option?.logic || fallbackOption.logic,
})

const normalizeRiskNode = (node) => ({
  lat: Number(node?.lat),
  lng: Number(node?.lng),
  reason: node?.reason || 'Detected disruption node',
  severity: node?.severity || 'medium',
})

export const normalizeModelResult = (payload, context) => {
  const fallback = buildFallbackAnalysis(context)

  if (!isValidCoords(payload?.originCoords) || !isValidCoords(payload?.destinationCoords)) {
    throw new Error('Incomplete AI response payload.')
  }

  const rawOptions =
    Array.isArray(payload?.options) && payload.options.length > 0
      ? payload.options
      : fallback.options
  const normalizedOptions = fallback.options.map((option, index) =>
    normalizeOption(rawOptions[index], option),
  )

  return {
    distanceKm: Number(payload?.distanceKm) || fallback.distanceKm,
    originCoords: payload.originCoords,
    destinationCoords: payload.destinationCoords,
    routePath:
      Array.isArray(payload?.routePath) &&
      payload.routePath.length >= 2 &&
      payload.routePath.every(isValidCoords)
        ? payload.routePath
        : fallback.routePath,
    resilienceReport: {
      status: payload?.resilienceReport?.status || fallback.resilienceReport.status,
      summary:
        payload?.resilienceReport?.summary || fallback.resilienceReport.summary,
      riskNodes:
        Array.isArray(payload?.resilienceReport?.riskNodes) &&
        payload.resilienceReport.riskNodes.length > 0
          ? payload.resilienceReport.riskNodes.map(normalizeRiskNode)
          : fallback.resilienceReport.riskNodes,
      roiAnalysis: {
        hoursSaved:
          Number(payload?.resilienceReport?.roiAnalysis?.hoursSaved) ||
          fallback.resilienceReport.roiAnalysis.hoursSaved,
        costAvoided:
          Number(payload?.resilienceReport?.roiAnalysis?.costAvoided) ||
          fallback.resilienceReport.roiAnalysis.costAvoided,
      },
      signals:
        Array.isArray(payload?.resilienceReport?.signals) &&
        payload.resilienceReport.signals.length > 0
          ? payload.resilienceReport.signals
          : fallback.resilienceReport.signals,
    },
    options: normalizedOptions,
    context: fallback.context,
  }
}
