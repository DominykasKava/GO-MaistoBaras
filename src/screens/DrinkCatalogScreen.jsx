import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { getBalance } from '../api/points'
import { getGerimoPasiulymai, getGerimoUzsakymai, placeGerimoUzsakymas } from '../api/gerimoPasiulymai'
import { useToast } from '../context/ToastContext'

const STATUS_LABELS = {
  laukiama_patvirtinimo: 'Laukia patvirtinimo',
  laukiama: 'Laukiama transportuotojo',
  pristatoma: 'Pristatoma',
  ivykdyta: 'Įvykdyta',
  atmesta: 'Atmesta',
  atsaukta: 'Atšaukta',
}

export default function DrinkCatalogScreen() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [pasiulymai, setPasiulymai] = useState([])
  const [myOrders, setMyOrders] = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(null)

  const load = async () => {
    try {
      const [pData, bal, orders] = await Promise.all([
        getGerimoPasiulymai(),
        getBalance(),
        getGerimoUzsakymai(),
      ])
      setPasiulymai(pData ?? [])
      setBalance(bal?.balance ?? bal?.points ?? bal ?? 0)
      setMyOrders((orders ?? []).filter((o) => ['laukiama_patvirtinimo', 'laukiama', 'pristatoma'].includes(o.statusas)))
    } catch {
      setPasiulymai([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleOrder = async (pasiulymas) => {
    if (balance < pasiulymas.kaina_taskais) {
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
                const canAfford = balance !== null && balance >= p.kaina_taskais
                const isOrdering = ordering === p.id
                return (
                  <div key={p.id} className="bg-white rounded-3xl border border-border shadow-sm p-4 mb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-primary text-base leading-tight">{p.pavadinimas}</p>
                        <p className="text-xs text-primary/50 mt-0.5">{p.restoranas_name}</p>
                        {p.adresas && (
                          <p className="text-xs text-primary/40 mt-0.5">{p.adresas}</p>
                        )}
                        {p.aprasymas && (
                          <p className="text-xs text-primary/60 mt-1.5 leading-relaxed">{p.aprasymas}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="inline-block bg-accent/10 text-accent font-bold text-xs rounded-full px-2.5 py-0.5">
                            ⭐ {p.kaina_taskais} taškai
                          </span>
                          <span className="inline-block bg-primary/5 text-primary/60 text-xs rounded-full px-2.5 py-0.5">
                            Kiekis: {p.kiekis}
                          </span>
                          <span className="inline-block bg-primary/5 text-primary/60 text-xs rounded-full px-2.5 py-0.5">
                            🚗 +{p.transporter_points} pristatytojui
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
                )
              })
            )}
          </>
        )}
      </div>
    </div>
  )
}
