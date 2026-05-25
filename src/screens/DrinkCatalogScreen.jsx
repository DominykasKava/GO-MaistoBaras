import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { getBalance } from '../api/points'
import { getDrinkImage } from '../utils/drinkImage'
import {
  getGerimoPasiulymai,
  getMyGerimoPasiulymai,
  getGerimoUzsakymai,
  placeGerimoUzsakymas,
} from '../api/gerimoPasiulymai'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const STATUS_LABELS = {
  laukiama_patvirtinimo: 'Laukia patvirtinimo',
  laukiama: 'Paruošta atsiimti',
  ivykdyta: 'Atsiimta',
  atmesta: 'Atmesta',
  atsaukta: 'Atšaukta',
}

// ─── Restorano vaizdas ────────────────────────────────────────────────────────

function RestoranasView() {
  const navigate = useNavigate()
  const [myOffers, setMyOffers] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMyGerimoPasiulymai(), getGerimoUzsakymai()])
      .then(([offers, ords]) => {
        setMyOffers(offers ?? [])
        setOrders(ords ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const pending = orders.filter((o) => o.statusas === 'laukiama_patvirtinimo')
  const ready   = orders.filter((o) => o.statusas === 'laukiama')
  const done    = orders.filter((o) => ['ivykdyta', 'atmesta', 'atsaukta'].includes(o.statusas))

  if (loading) return (
    <div>
      <TopBar title="Gėrimų valdymas" showBack />
      <p className="text-center text-primary/50 py-10">Kraunama...</p>
    </div>
  )

  return (
    <div className="pb-8">
      <TopBar title="Gėrimų valdymas" showBack />
      <div className="px-4 py-4 flex flex-col gap-5">

        {/* Laukia patvirtinimo */}
        {pending.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Laukia patvirtinimo ({pending.length})
            </p>
            <div className="flex flex-col gap-2">
              {pending.map((o) => (
                <div key={o.id}
                  onClick={() => navigate(`/gerimo-uzsakymai/${o.id}`)}
                  className="bg-primary/5 border border-primary/20 rounded-2xl p-4 cursor-pointer active:bg-primary/10">
                  <p className="font-semibold text-sm text-primary">🍹 {o.pavadinimas}</p>
                  <p className="text-xs text-gray-500 mt-0.5">👤 {o.gavejas_name}</p>
                  <p className="text-xs font-bold text-accent mt-1">⭐ {o.taskai_nuskaityti} taškai</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Paruošta atsiimti */}
        {ready.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Paruošta atsiimti ({ready.length})
            </p>
            <div className="flex flex-col gap-2">
              {ready.map((o) => (
                <div key={o.id}
                  onClick={() => navigate(`/gerimo-uzsakymai/${o.id}`)}
                  className="bg-accent/10 border border-accent/30 rounded-2xl p-4 cursor-pointer active:bg-accent/20">
                  <p className="font-semibold text-sm text-primary">🍹 {o.pavadinimas}</p>
                  <p className="text-xs text-gray-500 mt-0.5">👤 {o.gavejas_name}</p>
                  <p className="text-xs font-bold text-accent mt-1">⭐ {o.taskai_nuskaityti} taškai</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {pending.length === 0 && ready.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <span className="text-4xl block mb-2">🍹</span>
            <p className="text-sm">Šiuo metu aktyvių gėrimų užsakymų nėra</p>
          </div>
        )}

        {/* Mano gėrimų pasiūlymai */}
        <section>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Mano gėrimų pasiūlymai ({myOffers.length})
          </p>
          {myOffers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Dar nėra sukurtų gėrimų pasiūlymų</p>
          ) : (
            <div className="flex flex-col gap-2">
              {myOffers.map((p) => (
                <div key={p.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm text-primary">{p.pavadinimas}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Kiekis: {p.kiekis}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.statusas === 'aktyvus' ? 'bg-accent/10 text-accent' :
                      p.statusas === 'rezervuotas' ? 'bg-primary/10 text-primary' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {p.statusas === 'aktyvus' ? 'Aktyvus' : p.statusas === 'rezervuotas' ? 'Rezervuotas' : 'Pabaigtas'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-accent mt-1.5">⭐ {p.kaina_taskais} taškai</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Istorija */}
        {done.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Istorija</p>
            <div className="flex flex-col gap-2">
              {done.slice(0, 5).map((o) => (
                <div key={o.id}
                  onClick={() => navigate(`/gerimo-uzsakymai/${o.id}`)}
                  className="bg-surface border border-border rounded-2xl p-4 cursor-pointer opacity-70">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">🍹 {o.pavadinimas}</p>
                    <span className="text-xs text-gray-400">{STATUS_LABELS[o.statusas] ?? o.statusas}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

// ─── Gavejas / transportuotojas vaizdas ──────────────────────────────────────

export default function DrinkCatalogScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()
  const [pasiulymai, setPasiulymai] = useState([])
  const [myOrders, setMyOrders] = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(null)

  const isRestoranas = user?.role === 'restoranas'

  useEffect(() => {
    if (isRestoranas) return
    Promise.allSettled([getGerimoPasiulymai(), getBalance(), getGerimoUzsakymai()])
      .then(([pRes, balRes, ordRes]) => {
        if (pRes.status === 'fulfilled') setPasiulymai(pRes.value ?? [])
        if (balRes.status === 'fulfilled') {
          const bal = balRes.value
          setBalance(bal?.balance ?? bal?.points ?? bal ?? 0)
        }
        if (ordRes.status === 'fulfilled') {
          setMyOrders((ordRes.value ?? []).filter((o) => ['laukiama_patvirtinimo', 'laukiama'].includes(o.statusas)))
        }
      })
      .finally(() => setLoading(false))
  }, [isRestoranas])

  if (isRestoranas) return <RestoranasView />

  const handleOrder = async (pasiulymas) => {
    if (balance !== null && balance < pasiulymas.kaina_taskais) {
      showToast('Nepakanka taškų šiam gėrimui', 'error')
      return
    }
    setOrdering(pasiulymas.id)
    try {
      const order = await placeGerimoUzsakymas({ pasiulymas_id: pasiulymas.id })
      setBalance((b) => b - pasiulymas.kaina_taskais)
      showToast('Užsakymas pateiktas! Taškai nuskaičiuoti.', 'success')
      navigate(`/gerimo-uzsakymai/${order.id}`)
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Klaida pateikiant užsakymą', 'error')
    } finally {
      setOrdering(null)
    }
  }

  return (
    <div className="pb-8">
      <TopBar title="Taškų panaudojimas" showBack />

      <div className="bg-accent px-4 py-3 flex items-center justify-between">
        <span className="text-white text-sm font-medium">Jūsų balansas</span>
        <span className="text-white font-bold">⭐ {balance ?? '...'} taškai</span>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <p className="text-center text-primary/50 py-10">Kraunama...</p>
        ) : (
          <>
            {myOrders.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mano aktyvūs užsakymai</p>
                <div className="flex flex-col gap-2">
                  {myOrders.map((o) => (
                    <div key={o.id}
                      onClick={() => navigate(`/gerimo-uzsakymai/${o.id}`)}
                      className="bg-accent/10 border border-accent/30 rounded-2xl p-4 cursor-pointer active:bg-accent/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm text-primary">🍹 {o.pavadinimas}</p>
                          <p className="text-xs text-primary/60 mt-0.5">{o.restoranas_name}</p>
                        </div>
                        <span className="text-xs font-semibold text-accent bg-accent/10 px-2.5 py-1 rounded-full">
                          {STATUS_LABELS[o.statusas] ?? o.statusas}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 mt-4 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Galimi gėrimai</p>
                </div>
              </div>
            )}

            {pasiulymai.length === 0 ? (
              <p className="text-center text-primary/50 py-10">Šiuo metu gėrimų pasiūlymų nėra</p>
            ) : (
              pasiulymai.map((p) => {
                const canAfford = balance === null || balance >= p.kaina_taskais
                const isOrdering = ordering === p.id
                const image = getDrinkImage(p.pavadinimas, p.id)
                return (
                  <div key={p.id} className="bg-white rounded-3xl border border-border shadow-sm mb-4 overflow-hidden">
                    {image && (
                      <img src={`/${image}`} alt={p.pavadinimas} className="w-full h-52 object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-primary text-base leading-tight">{p.pavadinimas}</p>
                          <p className="text-xs text-primary/50 mt-0.5">{p.restoranas_name}</p>
                          {p.adresas && <p className="text-xs text-primary/40 mt-0.5">{p.adresas}</p>}
                          {p.aprasymas && <p className="text-xs text-primary/60 mt-1.5 leading-relaxed">{p.aprasymas}</p>}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="inline-block bg-accent/10 text-accent font-bold text-xs rounded-full px-2.5 py-0.5">
                              ⭐ {p.kaina_taskais} taškai
                            </span>
                            <span className="inline-block bg-primary/5 text-primary/60 text-xs rounded-full px-2.5 py-0.5">
                              Kiekis: {p.kiekis}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOrder(p)}
                          disabled={!canAfford || isOrdering}
                          className="shrink-0 bg-accent text-white px-4 py-2 rounded-pill font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed active:opacity-80 transition-opacity"
                        >
                          {isOrdering ? '...' : canAfford ? 'Užsakyti' : 'Mažai taškų'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}
      </div>
    </div>
  )
}
