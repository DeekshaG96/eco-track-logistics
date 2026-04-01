import { useEffect, useRef, useState } from 'react'

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }
const DEFAULT_ZOOM = 5
const MAP_PADDING = 72

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#0f766e' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#172554' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#082f49' }] },
]

let googleMapsPromise = null

const hasValidPoint = (value) =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every((entry) => Number.isFinite(entry))

const toLatLngLiteral = (value) => ({
  lat: value[0],
  lng: value[1],
})

const loadGoogleMaps = (apiKey) => {
  if (!apiKey) {
    return Promise.reject(new Error('Missing Google Maps API key.'))
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps)
  }

  if (googleMapsPromise) {
    return googleMapsPromise
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[data-google-maps-loader="true"]',
    )

    if (existingScript) {
      existingScript.addEventListener(
        'load',
        () => resolve(window.google.maps),
        { once: true },
      )
      existingScript.addEventListener(
        'error',
        () => {
          googleMapsPromise = null
          reject(new Error('Failed to load Google Maps.'))
        },
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`
    script.async = true
    script.defer = true
    script.dataset.googleMapsLoader = 'true'
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => {
      googleMapsPromise = null
      reject(new Error('Failed to load Google Maps.'))
    }

    document.head.appendChild(script)
  })

  return googleMapsPromise
}

const clearOverlays = (overlaysRef) => {
  overlaysRef.current.forEach((overlay) => overlay.setMap?.(null))
  overlaysRef.current = []
}

const buildInfoWindowContent = (label) => {
  const wrapper = document.createElement('div')
  wrapper.style.fontWeight = '700'
  wrapper.textContent = label
  return wrapper
}

export default function GoogleRouteMap({
  apiKey,
  originLabel,
  destinationLabel,
  originCoords,
  destinationCoords,
  routePath = [],
  riskNodes = [],
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const infoWindowRef = useRef(null)
  const overlaysRef = useRef([])
  const [mapState, setMapState] = useState(apiKey ? 'loading' : 'missing-key')

  useEffect(() => {
    if (!apiKey) {
      return
    }

    let cancelled = false

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (cancelled || !containerRef.current) {
          return
        }

        if (!mapRef.current) {
          mapRef.current = new maps.Map(containerRef.current, {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            clickableIcons: false,
            styles: DARK_MAP_STYLES,
          })
        }

        if (!infoWindowRef.current) {
          infoWindowRef.current = new maps.InfoWindow()
        }

        setMapState('ready')
      })
      .catch((error) => {
        console.error(error)
        if (!cancelled) {
          setMapState('error')
        }
      })

    return () => {
      cancelled = true
    }
  }, [apiKey])

  useEffect(() => {
    if (mapState !== 'ready' || !window.google?.maps || !mapRef.current) {
      return
    }

    const maps = window.google.maps
    const map = mapRef.current
    const infoWindow = infoWindowRef.current

    clearOverlays(overlaysRef)

    const bounds = new maps.LatLngBounds()

    if (hasValidPoint(originCoords)) {
      const position = toLatLngLiteral(originCoords)
      const marker = new maps.Marker({
        map,
        position,
        title: originLabel,
        label: {
          text: 'O',
          color: '#020617',
          fontWeight: '700',
        },
      })

      marker.addListener('click', () => {
        infoWindow.setContent(buildInfoWindowContent(`Origin: ${originLabel}`))
        infoWindow.open({ anchor: marker, map })
      })

      overlaysRef.current.push(marker)
      bounds.extend(position)
    }

    if (hasValidPoint(destinationCoords)) {
      const position = toLatLngLiteral(destinationCoords)
      const marker = new maps.Marker({
        map,
        position,
        title: destinationLabel,
        label: {
          text: 'D',
          color: '#020617',
          fontWeight: '700',
        },
      })

      marker.addListener('click', () => {
        infoWindow.setContent(
          buildInfoWindowContent(`Terminal: ${destinationLabel}`),
        )
        infoWindow.open({ anchor: marker, map })
      })

      overlaysRef.current.push(marker)
      bounds.extend(position)
    }

    const validRoutePath = routePath.filter(hasValidPoint).map(toLatLngLiteral)
    if (validRoutePath.length > 1) {
      const polyline = new maps.Polyline({
        map,
        path: validRoutePath,
        geodesic: true,
        strokeColor: '#10b981',
        strokeOpacity: 0.92,
        strokeWeight: 4,
      })

      overlaysRef.current.push(polyline)
      validRoutePath.forEach((point) => bounds.extend(point))
    }

    riskNodes.forEach((node) => {
      if (!Number.isFinite(node?.lat) || !Number.isFinite(node?.lng)) {
        return
      }

      const position = { lat: node.lat, lng: node.lng }
      const circle = new maps.Circle({
        map,
        center: position,
        radius: 30000,
        strokeColor: '#f59e0b',
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: '#f59e0b',
        fillOpacity: 0.2,
      })

      circle.addListener('click', () => {
        infoWindow.setPosition(position)
        infoWindow.setContent(
          buildInfoWindowContent(
            `Alert: ${node.reason || 'Detected disruption node'}`,
          ),
        )
        infoWindow.open({ map })
      })

      overlaysRef.current.push(circle)
      bounds.extend(position)
    })

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, MAP_PADDING)
      const listener = maps.event.addListenerOnce(map, 'idle', () => {
        if (map.getZoom() > 6) {
          map.setZoom(6)
        }
      })
      overlaysRef.current.push({ setMap: () => maps.event.removeListener(listener) })
      return
    }

    map.setCenter(DEFAULT_CENTER)
    map.setZoom(DEFAULT_ZOOM)
  }, [
    destinationCoords,
    destinationLabel,
    mapState,
    originCoords,
    originLabel,
    riskNodes,
    routePath,
  ])

  const effectiveMapState = apiKey ? mapState : 'missing-key'
  const showOverlay = effectiveMapState !== 'ready'

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full bg-[#020617]" />
      {showOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#020617]/90 px-8 text-center">
          {effectiveMapState === 'missing-key' && (
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-400">
                Google Maps Key Needed
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Add `VITE_GOOGLE_MAPS_API_KEY` to your local `.env.local` file to
                enable the tactical map.
              </p>
            </div>
          )}
          {effectiveMapState === 'loading' && (
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-400">
                Loading Tactical Map
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Initializing the Google Maps control surface.
              </p>
            </div>
          )}
          {effectiveMapState === 'error' && (
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-rose-400">
                Map Load Failed
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Verify that the browser key is active and restricted to your
                Firebase and localhost domains.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
