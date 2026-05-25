import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api'

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY ?? ''

function decodePolyline(encoded) {
  const pts = []
  let index = 0, lat = 0, lng = 0
  while (index < encoded.length) {
    let shift = 0, val = 0, b
    do { b = encoded.charCodeAt(index++) - 63; val |= (b & 0x1f) << shift; shift += 5 } while (b >= 32)
    lat += (val & 1) !== 0 ? ~(val >> 1) : val >> 1
    shift = 0; val = 0
    do { b = encoded.charCodeAt(index++) - 63; val |= (b & 0x1f) << shift; shift += 5 } while (b >= 32)
    lng += (val & 1) !== 0 ? ~(val >> 1) : val >> 1
    pts.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }
  return pts
}

async function fetchRoute(origin, destination) {
  const waypoint = (pt) =>
    typeof pt === 'string'
      ? { address: pt }
      : { location: { latLng: { latitude: pt.lat, longitude: pt.lng } } }
  try {
    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_KEY,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
      },
      body: JSON.stringify({
        origin: waypoint(origin),
        destination: waypoint(destination),
        travelMode: 'DRIVE',
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const route = data.routes?.[0]
    if (!route) return null
    const secs = parseInt(route.duration) || 0
    const mins = Math.round(secs / 60)
    const dist = route.distanceMeters >= 1000
      ? `${(route.distanceMeters / 1000).toFixed(1)} km`
      : `${route.distanceMeters} m`
    const dur = mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} val ${mins % 60} min`
    const path = decodePolyline(route.polyline?.encodedPolyline ?? '')
    return { path, distance: dist, duration: dur, fromPt: path[0] ?? null, toPt: path[path.length - 1] ?? null }
  } catch { return null }
}

function mapsUrl(from, to) {
  const origin = typeof from === 'string' ? encodeURIComponent(from) : `${from.lat},${from.lng}`
  const dest   = typeof to   === 'string' ? encodeURIComponent(to)   : `${to.lat},${to.lng}`
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`
}

export default function RouteScreen() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { from, to, title } = state ?? {}

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_KEY })
  const mapRef = React.useRef(null)
  const [routeData, setRouteData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!from || !to) { setLoading(false); return }
    fetchRoute(from, to).then((data) => { setRouteData(data); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !routeData?.fromPt || !routeData?.toPt) return
    const bounds = new window.google.maps.LatLngBounds()
    bounds.extend(routeData.fromPt)
    bounds.extend(routeData.toPt)
    mapRef.current.fitBounds(bounds, 60)
  }, [isLoaded, routeData])

  if (!from || !to) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <p className="text-gray-500 text-sm">Maršruto duomenų nėra</p>
        <button onClick={() => navigate(-1)} className="text-primary font-medium text-sm">← Grįžti</button>
      </div>
    )
  }

  const defaultCenter = routeData?.fromPt ?? { lat: 54.6872, lng: 25.2797 }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* TopBar */}
      <div className="bg-primary text-white flex items-center gap-3 px-4 py-3 shrink-0" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-white/10">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <span className="font-semibold text-base truncate">{title ?? 'Maršrutas'}</span>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
            Žemėlapis kraunamas...
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={defaultCenter}
            zoom={13}
            onLoad={(map) => { mapRef.current = map }}
          >
            {routeData?.path?.length >= 2 && (
              <>
                <Marker position={routeData.fromPt} label={{ text: 'A', color: 'white', fontWeight: 'bold' }} />
                <Marker position={routeData.toPt}   label={{ text: 'B', color: 'white', fontWeight: 'bold' }} />
                <Polyline
                  path={routeData.path}
                  options={{ strokeColor: '#1976D2', strokeWeight: 5, strokeOpacity: 0.9 }}
                />
              </>
            )}
          </GoogleMap>
        )}
        {loading && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-full px-4 py-2 shadow text-xs text-gray-500">
            Maršrutas skaičiuojamas...
          </div>
        )}
      </div>

      {/* Bottom card */}
      <div className="shrink-0 bg-white border-t border-gray-100 px-4 pt-4 pb-6 flex flex-col gap-3">
        {routeData ? (
          <div className="flex justify-around py-2">
            <div className="text-center">
              <p className="text-[11px] text-gray-400 mb-0.5">Atstumas</p>
              <p className="font-bold text-primary text-lg">{routeData.distance}</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-[11px] text-gray-400 mb-0.5">Laikas</p>
              <p className="font-bold text-primary text-lg">{routeData.duration}</p>
            </div>
          </div>
        ) : !loading ? (
          <p className="text-center text-gray-400 text-sm py-2">Maršruto nepavyko gauti</p>
        ) : null}
        <a
          href={mapsUrl(from, to)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-primary text-white py-3.5 rounded-2xl text-sm font-semibold text-center active:opacity-80 transition-opacity"
        >
          Atidaryti Google Maps
        </a>
      </div>
    </div>
  )
}
