import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api'
import TopBar from '../components/TopBar'
import OfferCard from '../components/OfferCard'
import UserSearchModal from '../components/UserSearchModal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getOffers, getMyOffers, deleteOffer } from '../api/offers'
import { getOrders, confirmDelivery, declineOrder } from '../api/orders'
import useGeolocation from '../hooks/useGeolocation'
import useAppMenu from '../hooks/useAppMenu'

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY ?? ''

// ─── Shared map components ───────────────────────────────────────────────────

function coordsFromPoint(point) {
  if (!point) return null
  if (typeof point === 'object' && point.lat != null && point.lng != null)
    return { lat: Number(point.lat), lng: Number(point.lng) }
  return null
}

async function geocode(address) {
  if (!address || typeof address !== 'string') return null
  return new Promise((resolve) => {
    const gc = new window.google.maps.Geocoder()
    gc.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location
        resolve({ lat: loc.lat(), lng: loc.lng() })
      } else {
        resolve(null)
      }
    })
  })
}

function LiveMap({ center, markers = [], onMarkerClick, routeFrom = null, routeTo = null }) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_KEY })
  const mapRef = React.useRef(null)
  const [fromPt, setFromPt] = useState(null)
  const [toPt, setToPt]     = useState(null)

  useEffect(() => {
    if (!isLoaded || !routeFrom) { setFromPt(null); return }
    const pt = coordsFromPoint(routeFrom)
    if (pt) { setFromPt(pt); return }
    geocode(routeFrom).then(setFromPt)
  }, [isLoaded, routeFrom])

  useEffect(() => {
    if (!isLoaded || !routeTo) { setToPt(null); return }
    const pt = coordsFromPoint(routeTo)
    if (pt) { setToPt(pt); return }
    geocode(routeTo).then(setToPt)
  }, [isLoaded, routeTo])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !fromPt || !toPt) return
    const bounds = new window.google.maps.LatLngBounds()
    bounds.extend(fromPt)
    bounds.extend(toPt)
    mapRef.current.fitBounds(bounds, 40)
  }, [isLoaded, fromPt, toPt])

  const hasRoute = fromPt && toPt

  if (!isLoaded) return (
    <div className="w-full h-[220px] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
      Žemėlapis kraunamas...
    </div>
  )
  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '220px' }}
      center={center}
      zoom={13}
      onLoad={(map) => { mapRef.current = map }}
    >
      {hasRoute ? (
        <>
          <Marker position={fromPt} label={{ text: 'A', color: 'white', fontWeight: 'bold' }} />
          <Marker position={toPt}   label={{ text: 'B', color: 'white', fontWeight: 'bold' }} />
          <Polyline
            path={[fromPt, toPt]}
            options={{ strokeColor: '#1976D2', strokeWeight: 4, strokeOpacity: 0.85 }}
          />
        </>
      ) : (
        markers.map((m) =>
          m.lat && m.lng ? (
            <Marker key={m.id} position={{ lat: Number(m.lat), lng: Number(m.lng) }}
              onClick={() => onMarkerClick?.(m.id)} />
          ) : null
        )
      )}
    </GoogleMap>
  )
}

function NoMapBanner() {
  return (
    <div className="w-full h-[220px] bg-gray-50 border-b border-gray-100 flex flex-col items-center justify-center gap-2">
      <span className="text-3xl">🗺️</span>
      <p className="text-gray-400 text-xs text-center px-6">
        Pridėkite <code className="bg-gray-100 px-1 rounded">VITE_GOOGLE_MAPS_KEY</code> į <code className="bg-gray-100 px-1 rounded">.env.local</code>
      </p>
    </div>
  )
}

// ─── Haversine atstumas ───────────────────────────────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Transportuotojas vaizas ──────────────────────────────────────────────────

function TransportuotojasView() {
  const navigate = useNavigate()
  const { lat, lng } = useGeolocation()
  const showToast = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [routeOrigin, setRouteOrigin] = useState(null)
  const [routeDest, setRouteDest] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [radius, setRadius] = useState(20)
  const [actionLoading, setActionLoading] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const mapRef = React.useRef(null)
  const hasAutoShown = React.useRef(false)
  const menuItems = useAppMenu(() => setShowSearch(true))

  const reload = useCallback(async () => {
    try {
      const data = await getOrders()
      setOrders(data ?? [])
    } catch {}
  }, [])

  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [reload])

  // Auto-show route for active delivery on first load
  useEffect(() => {
    if (hasAutoShown.current) return
    const pristatoma = orders.filter((o) => o.status === 'pristatoma')
    if (pristatoma.length > 0) {
      hasAutoShown.current = true
      const active = pristatoma[0]
      const origin = active.offer_lat && active.offer_lng
        ? { lat: Number(active.offer_lat), lng: Number(active.offer_lng) }
        : active.pickup_address ?? null
      const dest = active.delivery_lat && active.delivery_lng
        ? { lat: Number(active.delivery_lat), lng: Number(active.delivery_lng) }
        : active.delivery_address ?? null
      if (origin && dest) {
        setRouteOrigin(origin)
        setRouteDest(dest)
        setActiveId(active.id)
      }
    }
  }, [orders])

  const showRoute = (origin, dest, id) => {
    setRouteOrigin(origin)
    setRouteDest(dest)
    setActiveId(id)
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const clearRoute = () => { setRouteOrigin(null); setRouteDest(null); setActiveId(null) }

  const handleAccept = async (id) => {
    setActionLoading(id)
    try {
      await confirmDelivery(id)
      showToast('Užsakymas priimtas! Pristatykite maistą.', 'success')
      await reload()
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Klaida', 'error')
    } finally { setActionLoading(null) }
  }

  const handleDecline = async (id) => {
    setActionLoading(id)
    try {
      await declineOrder(id)
      showToast('Užsakymas atmestas.', 'info')
      await reload()
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Klaida', 'error')
    } finally { setActionLoading(null) }
  }

  const handleDelivered = async (id) => {
    setActionLoading(id)
    try {
      await confirmDelivery(id)
      showToast('Pristatymas patvirtintas! Taškai pridėti.', 'success')
      clearRoute()
      hasAutoShown.current = false
      await reload()
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Klaida', 'error')
    } finally { setActionLoading(null) }
  }

  const laukiama = orders
    .filter((o) => o.status === 'laukiama')
    .map((o) => ({
      ...o,
      _dist: lat && lng && o.offer_lat && o.offer_lng
        ? haversineKm(lat, lng, Number(o.offer_lat), Number(o.offer_lng))
        : null,
    }))
    .sort((a, b) => (a._dist ?? Infinity) - (b._dist ?? Infinity))
  const mano = orders.filter((o) => o.status === 'pristatoma')
  const center  = lat && lng ? { lat, lng } : { lat: 54.6872, lng: 25.2797 }
  const markers = laukiama
    .filter((o) => o.offer_lat && o.offer_lng)
    .map((o) => ({ id: o.id, lat: o.offer_lat, lng: o.offer_lng }))

  return (
    <div>
      <TopBar title="Užsakymai" menuItems={menuItems} />
      <div className="screen-content">

        <div ref={mapRef}>
          {GOOGLE_MAPS_KEY
            ? <LiveMap
                center={center}
                markers={routeOrigin ? [] : markers}
                onMarkerClick={(id) => {
                  const o = laukiama.find((x) => x.id === id)
                  if (!o) return
                  const dest = o.offer_lat && o.offer_lng
                    ? { lat: Number(o.offer_lat), lng: Number(o.offer_lng) }
                    : o.pickup_address ?? ''
                  showRoute(lat && lng ? { lat, lng } : dest, dest, id)
                }}
                routeFrom={routeOrigin}
                routeTo={routeDest}
              />
            : <NoMapBanner />
          }
        </div>

        {activeId && (
          <div className="mx-4 mt-2 flex items-center justify-between bg-primary/10 border border-primary/30 rounded-xl px-3 py-2">
            <p className="text-xs text-primary font-medium">📍 Maršrutas rodomas žemėlapyje</p>
            <button onClick={clearRoute} className="text-xs text-primary font-bold">✕</button>
          </div>
        )}

        <div className="px-4 pt-3 pb-1 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Rekomenduojamas spindulys</span>
            <span className="text-sm font-semibold text-primary">{radius} km</span>
          </div>
          <input type="range" min={1} max={100} value={radius}
            onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-primary" />
          <p className="text-[11px] text-gray-400 mt-1">Visi užsakymai rodomi — tolimi pažymėti pilkai</p>
        </div>

        <div className="px-4 py-4 flex flex-col gap-5">

          {/* Mano aktyvūs pristatymai */}
          {mano.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">🚚 Mano pristatymai ({mano.length})</h3>
              <div className="flex flex-col gap-3">
                {mano.map((o) => (
                  <div key={o.id} className={`rounded-2xl border p-4 ${activeId === o.id ? 'bg-primary/10 border-primary' : 'bg-accent/10 border-accent/20'}`}>
                    <p className="font-semibold text-gray-900 text-sm">{o.offer_title}</p>
                    {o.pickup_address && <p className="text-xs text-gray-500 mt-1">📍 {o.pickup_address}</p>}
                    {o.delivery_address && <p className="text-xs text-gray-500 mt-0.5">🏠 {o.delivery_address}</p>}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          const origin = o.offer_lat && o.offer_lng
                            ? { lat: Number(o.offer_lat), lng: Number(o.offer_lng) }
                            : o.pickup_address ?? null
                          const dest = o.delivery_lat && o.delivery_lng
                            ? { lat: Number(o.delivery_lat), lng: Number(o.delivery_lng) }
                            : o.delivery_address ?? null
                          if (origin && dest) showRoute(origin, dest, o.id)
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${activeId === o.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary border border-primary/20'}`}
                      >
                        🗺️ Maršrutas
                      </button>
                      <button
                        onClick={() => handleDelivered(o.id)}
                        disabled={actionLoading === o.id}
                        className="flex-1 bg-accent text-white py-2 rounded-xl text-xs font-semibold active:opacity-80 disabled:opacity-50"
                      >
                        {actionLoading === o.id ? '...' : '✓ Pristatyta'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Laukiantys paėmimo */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">📬 Laukia paėmimo ({laukiama.length})</h3>
            {loading ? (
              <p className="text-sm text-gray-400 text-center py-6">Kraunama...</p>
            ) : laukiama.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <span className="text-4xl block mb-2">✅</span>
                <p className="text-sm">Šiuo metu nėra laukiančių užsakymų</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {laukiama.map((o) => {
                  const farAway = o._dist != null && o._dist > radius
                  const isActive = activeId === o.id
                  const busy = actionLoading === o.id
                  return (
                  <div key={o.id} className={`rounded-2xl border shadow-sm p-4 ${isActive ? 'border-primary bg-white' : farAway ? 'border-border bg-surface opacity-60' : 'border-border bg-white'}`}>
                    <div className="flex items-start justify-between gap-2" onClick={() => navigate(`/uzsakymai/${o.id}`)}>
                      <p className="font-semibold text-gray-900 text-sm">{o.offer_title}</p>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {o._dist != null && (
                          <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {o._dist < 1 ? `${Math.round(o._dist * 1000)} m` : `${o._dist.toFixed(1)} km`}
                          </span>
                        )}
                        {o.transporter_points != null && (
                          <span className="text-[10px] font-bold bg-accent text-white px-2 py-0.5 rounded-full">
                            ⭐ {o.transporter_points} t.
                          </span>
                        )}
                      </div>
                    </div>
                    {o.pickup_address && <p className="text-xs text-gray-500 mt-1.5">📍 {o.pickup_address}</p>}
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          const dest = o.offer_lat && o.offer_lng
                            ? { lat: Number(o.offer_lat), lng: Number(o.offer_lng) }
                            : o.pickup_address ?? ''
                          showRoute(lat && lng ? { lat, lng } : dest, dest, o.id)
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-semibold transition-colors mb-2 ${isActive ? 'bg-primary text-white' : 'bg-primary/10 text-primary border border-primary/20'}`}
                      >
                        🗺️ Rodyti žemėlapyje
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDecline(o.id)}
                          disabled={busy}
                          className="flex-1 bg-danger/10 text-danger border border-danger/20 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 active:bg-danger/20"
                        >
                          {busy ? '...' : '✕ Atmesti'}
                        </button>
                        <button
                          onClick={() => handleAccept(o.id)}
                          disabled={busy}
                          className="flex-1 bg-primary text-white py-2 rounded-xl text-xs font-semibold active:bg-primary-dark disabled:opacity-50"
                        >
                          {busy ? '...' : '✓ Priimti'}
                        </button>
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {showSearch && <UserSearchModal onClose={() => setShowSearch(false)} />}
    </div>
  )
}

// ─── Restoranas vaizas ────────────────────────────────────────────────────────

const STATUS_COLORS = { aktyvus: 'bg-accent/10 text-accent', rezervuotas: 'bg-primary/20 text-primary', pabaigtas: 'bg-surface text-primary/40' }
const STATUS_LABELS = { aktyvus: 'Aktyvus', rezervuotas: 'Rezervuotas', pabaigtas: 'Pabaigtas' }

function MyOffersView() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const menuItems = useAppMenu(() => setShowSearch(true))

  const load = useCallback(async () => {
    try { setOffers(await getMyOffers() ?? []) }
    catch { setOffers([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    if (!window.confirm('Tikrai ištrinti šį pasiūlymą?')) return
    setDeletingId(id)
    try {
      await deleteOffer(id)
      showToast('Pasiūlymas ištrintas', 'success')
      setOffers((prev) => prev.filter((o) => o.id !== id))
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Klaida trinant', 'error')
    } finally { setDeletingId(null) }
  }

  return (
    <div>
      <TopBar title="Mano pasiūlymai" menuItems={menuItems} />
      <div className="screen-content px-4 py-4">
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Kraunama...</div>
        ) : offers.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <span className="text-5xl block mb-3">📋</span>
            <p className="text-sm font-medium">Dar nėra pasiūlymų</p>
            <p className="text-xs mt-1">Sukurkite pirmąjį pasiūlymą</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {offers.map((offer) => (
              <div key={offer.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{offer.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Kiekis: {offer.quantity}</p>
                    {offer.address && <p className="text-xs text-gray-400 mt-0.5">📍 {offer.address}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Galioja iki: {new Date(offer.expires_at).toLocaleString('lt-LT')}
                    </p>
                    <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[offer.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[offer.status] ?? offer.status}
                    </span>
                  </div>
                  <button onClick={() => handleDelete(offer.id)} disabled={deletingId === offer.id}
                    className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-danger/10 text-danger active:bg-danger/20 disabled:opacity-40">
                    {deletingId === offer.id ? '...' : (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-danger">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => navigate('/pasiulymai/sukurti')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center z-30 active:bg-primary-dark transition-colors">
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
      </button>
      {showSearch && <UserSearchModal onClose={() => setShowSearch(false)} />}
    </div>
  )
}

// ─── Gavėjas vaizas (pagrindinis) ─────────────────────────────────────────────

export default function OffersListScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { lat, lng, loading: geoLoading } = useGeolocation()
  const [offers, setOffers] = useState([])
  const [radius, setRadius] = useState(10)
  const [loading, setLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const menuItems = useAppMenu(() => setShowSearch(true))

  const load = useCallback(async () => {
    if (!lat || !lng) return
    setLoading(true)
    try {
      const data = await getOffers(lat, lng, radius)
      setOffers(data?.offers ?? data ?? [])
    } catch { setOffers([]) }
    finally { setLoading(false) }
  }, [lat, lng, radius])

  useEffect(() => {
    if (user?.role === 'gavejas') load()
  }, [load, user?.role])

  if (user?.role === 'restoranas') return <MyOffersView />
  if (user?.role === 'transportuotojas') return <TransportuotojasView />

  // Gavėjas
  const center = lat && lng ? { lat, lng } : { lat: 54.6872, lng: 25.2797 }
  const markers = offers.filter((o) => o.lat && o.lng).map((o) => ({ id: o.id, lat: o.lat, lng: o.lng }))

  return (
    <div>
      <TopBar title="Pasiūlymai" menuItems={menuItems} />
      <div className="screen-content">
        {GOOGLE_MAPS_KEY
          ? <LiveMap center={center} markers={markers} onMarkerClick={(id) => navigate(`/pasiulymai/${id}`)} />
          : <NoMapBanner />
        }

        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Spindulys</span>
            <span className="text-sm font-semibold text-primary">{radius} km</span>
          </div>
          <input type="range" min={1} max={50} value={radius}
            onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-primary" />
        </div>

        <div className="px-4 py-4">
          <h3 className="font-semibold text-gray-800 mb-3">
            {loading ? 'Kraunama...' : `${offers.length} pasiūlymų`}
          </h3>
          {geoLoading ? (
            <div className="text-center py-10 text-gray-400 text-sm">Nustatoma vieta...</div>
          ) : offers.length === 0 && !loading ? (
            <div className="text-center py-10 text-gray-400">
              <span className="text-4xl block mb-2">🍽️</span>
              <p className="text-sm">Pasiūlymų nerasta šioje vietovėje</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {offers.map((o) => <OfferCard key={o.id} offer={o} />)}
            </div>
          )}
        </div>
      </div>
      {showSearch && <UserSearchModal onClose={() => setShowSearch(false)} />}
    </div>
  )
}
