import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import OrderCard from '../components/OrderCard'
import UserSearchModal from '../components/UserSearchModal'
import { getOrders } from '../api/orders'
import { getDrinkOrders } from '../api/drinks'
import { getGerimoUzsakymai } from '../api/gerimoPasiulymai'
import { useAuth } from '../context/AuthContext'
import useAppMenu from '../hooks/useAppMenu'

export default function OrdersListScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [drinkOrders, setDrinkOrders] = useState([])
  const [gerimoUzsakymai, setGerimoUzsakymai] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const menuItems = useAppMenu(() => setShowSearch(true))

  const load = useCallback(async () => {
    try {
      const [data, drinks, gerimai] = await Promise.allSettled([
        getOrders(),
        user?.role === 'restoranas' ? getDrinkOrders() : Promise.resolve([]),
        user?.role !== 'gavejas' ? getGerimoUzsakymai() : Promise.resolve([]),
      ])
      setOrders(data.status === 'fulfilled' ? (data.value ?? []) : [])
      setDrinkOrders(drinks.status === 'fulfilled' ? (drinks.value ?? []) : [])
      setGerimoUzsakymai(gerimai.status === 'fulfilled' ? (gerimai.value ?? []) : [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [user?.role])

  useEffect(() => { load() }, [load])

  const handleRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const isRestoranas = user?.role === 'restoranas' || user?.role === 'davejas'

  // Gėrimų užsakymai: restoranas mato laukiančius patvirtinimo,
  // transportuotojas/gavejas mato aktyvius savo užsakymus
  const gerimoAktyvus = gerimoUzsakymai.filter((o) =>
    ['laukiama_patvirtinimo', 'laukiama'].includes(o.statusas)
  )
  const gerimoIvykdyti = gerimoUzsakymai.filter((o) =>
    ['ivykdyta', 'atmesta', 'atsaukta'].includes(o.statusas)
  )

  const pending = orders.filter((o) => o.status === 'laukiama_patvirtinimo')
  const rest = orders.filter((o) => o.status !== 'laukiama_patvirtinimo')

  return (
    <div>
      <TopBar
        title="Užsakymai"
        menuItems={menuItems}
        actions={
          <button onClick={handleRefresh} disabled={refreshing}
            className={`p-2 rounded-full hover:bg-white/10 ${refreshing ? 'opacity-50' : ''}`}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </button>
        }
      />
      <div className="screen-content px-4 py-4">
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Kraunama...</div>
        ) : (
          <div className="flex flex-col gap-3">
            {isRestoranas && pending.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <p className="text-sm font-semibold text-gray-700">
                    Laukia patvirtinimo ({pending.length})
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {pending.map((o) => (
                    <div key={o.id}
                      onClick={() => navigate(`/uzsakymai/${o.id}`)}
                      className="bg-accent/10 rounded-2xl border border-accent/30 p-4 cursor-pointer active:bg-accent/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{o.offer?.title ?? '—'}</p>
                          {o.gavejas_name && <p className="text-xs text-gray-500 mt-1">👤 {o.gavejas_name}</p>}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(o.created_at).toLocaleString('lt-LT')}
                          </p>
                        </div>
                        <span className="bg-accent/20 text-accent text-xs font-semibold px-2.5 py-1 rounded-full">
                          Sprendžiama
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {rest.length > 0 && <div className="border-t border-gray-100 mt-3 pt-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Visi užsakymai</p>
                </div>}
              </div>
            )}

            {isRestoranas && drinkOrders.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <p className="text-sm font-semibold text-primary">
                    Gėrimų užsakymai ({drinkOrders.length})
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {drinkOrders.map((o) => (
                    <div key={o.order_id} className="bg-accent/5 rounded-2xl border border-accent/30 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-sm">{o.orderer_name}</p>
                          {o.orderer_phone && (
                            <p className="text-xs text-primary/60 mt-0.5">📞 {o.orderer_phone}</p>
                          )}
                        </div>
                        <span className="bg-accent/10 text-accent text-xs font-bold px-2.5 py-1 rounded-full">
                          {o.total_cost} tašk.
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 mb-2">
                        {(o.items ?? []).map((item, i) => (
                          <p key={i} className="text-xs text-primary/70">
                            {item.name} × {item.quantity}
                          </p>
                        ))}
                      </div>
                      <div className="bg-primary/10 rounded-xl px-3 py-2 flex items-center justify-between">
                        <span className="text-xs text-primary/60">Laukiamas kodas</span>
                        <span className="font-black text-primary tracking-widest text-sm">{o.pickup_code}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {(rest.length > 0 || pending.length > 0) && (
                  <div className="border-t border-border mt-3 pt-3">
                    <p className="text-sm font-semibold text-primary/70 mb-2">Maisto užsakymai</p>
                  </div>
                )}
              </div>
            )}

            {user?.role !== 'gavejas' && (gerimoAktyvus.length > 0 || gerimoIvykdyti.length > 0) && (
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🍹</span>
                  <p className="text-sm font-semibold text-primary">
                    Gėrimų užsakymai ({user?.role === 'transportuotojas' ? gerimoAktyvus.length : gerimoAktyvus.length + gerimoIvykdyti.length})
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {(user?.role === 'transportuotojas' ? gerimoAktyvus : [...gerimoAktyvus, ...gerimoIvykdyti]).map((o) => {
                    const active = ['laukiama_patvirtinimo', 'laukiama'].includes(o.statusas)
                    const statusLabel = {
                      laukiama_patvirtinimo: 'Laukia',
                      laukiama: 'Paruošta',
                      ivykdyta: 'Atsiimta',
                      atmesta: 'Atmesta',
                      atsaukta: 'Atšaukta',
                    }[o.statusas] ?? o.statusas
                    return (
                      <div key={o.id}
                        onClick={() => navigate(`/gerimo-uzsakymai/${o.id}`)}
                        className={`rounded-2xl border p-4 cursor-pointer ${active ? 'bg-accent/10 border-accent/30 active:bg-accent/20' : 'bg-surface border-border opacity-70'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{o.pavadinimas ?? '—'}</p>
                            {o.restoranas_name && <p className="text-xs text-gray-500 mt-0.5">🏪 {o.restoranas_name}</p>}
                            {o.gavejas_name && isRestoranas && <p className="text-xs text-gray-500 mt-0.5">👤 {o.gavejas_name}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(o.created_at).toLocaleString('lt-LT')}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${active ? 'bg-accent/20 text-accent' : 'bg-gray-100 text-gray-500'}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {(rest.length > 0 || pending.length > 0 || drinkOrders.length > 0) && (
                  <div className="border-t border-border mt-3 pt-3">
                    <p className="text-sm font-semibold text-primary/70 mb-2">Maisto užsakymai</p>
                  </div>
                )}
              </div>
            )}

            {rest.length === 0 && pending.length === 0 && drinkOrders.length === 0 && gerimoAktyvus.length === 0 && gerimoIvykdyti.length === 0 ? (
              <div className="text-center py-10 text-primary/40">
                <span className="text-4xl block mb-2">📦</span>
                <p className="text-sm">Užsakymų dar nėra</p>
              </div>
            ) : rest.length === 0 && pending.length === 0 ? null : (
              rest.map((o) => <OrderCard key={o.id} order={o} />)
            )}
          </div>
        )}
      </div>

      {showSearch && <UserSearchModal onClose={() => setShowSearch(false)} />}
    </div>
  )
}
