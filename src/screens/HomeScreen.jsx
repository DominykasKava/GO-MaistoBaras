import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import OrderCard from '../components/OrderCard'
import UserSearchModal from '../components/UserSearchModal'
import { useAuth } from '../context/AuthContext'
import { getOrders } from '../api/orders'
import { getBalance } from '../api/points'
import useAppMenu from '../hooks/useAppMenu'

export default function HomeScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [points, setPoints] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const menuItems = useAppMenu(() => setShowSearch(true))

  const load = useCallback(async () => {
    try {
      const [ordersData, pointsData] = await Promise.all([getOrders(), getBalance()])
      setOrders((ordersData?.orders ?? ordersData ?? []).slice(0, 3))
      setPoints(pointsData?.balance ?? pointsData?.points ?? pointsData)
    } catch {
      // silently fail — backend may not be running
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <div>
      <TopBar title="Maisto App" menuItems={menuItems} />
      <div className="screen-content px-4 py-4">
        {/* Welcome card */}
        <div className="bg-primary rounded-3xl p-5 text-white mb-6 shadow-md">
          <p className="text-sm opacity-80">Sveiki sugrįžę,</p>
          <h2 className="text-xl font-bold mt-0.5">{user?.name ?? 'Vartotojas'} 👋</h2>
          {user?.role !== 'restoranas' && (
            <div className="mt-4 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white/80 shrink-0">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <span className="text-2xl font-bold">{points ?? 0}</span>
              <span className="text-sm opacity-80">taškų</span>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {user?.role === 'restoranas' || user?.role === 'davejas' ? (
            <>
              <button
                onClick={() => navigate('/pasiulymai/sukurti')}
                className="bg-primary/10 rounded-2xl p-4 text-left active:bg-primary/20 transition-colors"
              >
                <span className="text-2xl block mb-2">➕</span>
                <p className="text-sm font-semibold text-primary">Naujas pasiūlymas</p>
                <p className="text-xs text-gray-500 mt-0.5">Pridėti maisto</p>
              </button>
              <button
                onClick={() => navigate('/pasiulymai')}
                className="bg-danger/10 rounded-2xl p-4 text-left active:bg-danger/20 transition-colors"
              >
                <span className="text-2xl block mb-2">📋</span>
                <p className="text-sm font-semibold text-danger">Mano pasiūlymai</p>
                <p className="text-xs text-gray-500 mt-0.5">Peržiūrėti / šalinti</p>
              </button>
            </>
          ) : user?.role === 'transportuotojas' ? (
            <>
              <button
                onClick={() => navigate('/uzsakymai')}
                className="bg-primary/10 rounded-2xl p-4 text-left active:bg-primary/20 transition-colors"
              >
                <span className="text-2xl block mb-2">📬</span>
                <p className="text-sm font-semibold text-primary">Laukiantys užsakymai</p>
                <p className="text-xs text-gray-500 mt-0.5">Priimti pristatymą</p>
              </button>
              <button
                onClick={() => navigate('/uzsakymai')}
                className="bg-accent/10 rounded-2xl p-4 text-left active:bg-accent/20 transition-colors"
              >
                <span className="text-2xl block mb-2">🚚</span>
                <p className="text-sm font-semibold text-accent">Mano pristatymai</p>
                <p className="text-xs text-gray-500 mt-0.5">Stebėti būseną</p>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/pasiulymai')}
                className="bg-primary/10 rounded-2xl p-4 text-left active:bg-primary/20 transition-colors"
              >
                <span className="text-2xl block mb-2">🔍</span>
                <p className="text-sm font-semibold text-primary">Rasti pasiūlymų</p>
                <p className="text-xs text-gray-500 mt-0.5">Peržiūrėti maistą</p>
              </button>
              <button
                onClick={() => navigate('/uzsakymai')}
                className="bg-accent/10 rounded-2xl p-4 text-left active:bg-accent/20 transition-colors"
              >
                <span className="text-2xl block mb-2">📦</span>
                <p className="text-sm font-semibold text-accent">Mano užsakymai</p>
                <p className="text-xs text-gray-500 mt-0.5">Stebėti būseną</p>
              </button>
            </>
          )}
        </div>

        {/* Recent orders */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Paskutiniai užsakymai</h3>
          <button
            onClick={handleRefresh}
            className={`text-primary text-sm font-medium ${refreshing ? 'opacity-50' : ''}`}
            disabled={refreshing}
          >
            {refreshing ? '...' : 'Atnaujinti'}
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <span className="text-4xl block mb-2">📭</span>
            <p className="text-sm">Užsakymų dar nėra</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
            <button
              onClick={() => navigate('/uzsakymai')}
              className="text-primary text-sm font-medium text-center py-2"
            >
              Visi užsakymai →
            </button>
          </div>
        )}
      </div>

      {showSearch && <UserSearchModal onClose={() => setShowSearch(false)} />}
    </div>
  )
}
