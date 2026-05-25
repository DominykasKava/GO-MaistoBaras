import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { placeDrinkOrder, confirmDrinkPickup } from '../api/drinks'

export default function DrinkOrderConfirmScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const showToast = useToast()

  const { cart, catalog, totalCost, restaurantId } = location.state ?? {}

  const [phase, setPhase] = useState('confirm')
  const [orderResult, setOrderResult] = useState(null)
  const [pickupLoading, setPickupLoading] = useState(false)

  useEffect(() => {
    if (!cart || !catalog) {
      navigate('/taskai/gerimas', { replace: true })
    }
  }, [])

  if (!cart || !catalog) return null

  const findDrink = (drinkId) => {
    for (const section of catalog) {
      const d = section.drinks.find((d) => d.id === Number(drinkId))
      if (d) return d
    }
    return null
  }

  const restaurantSection = catalog.find((s) => s.restaurant.id === restaurantId)
  const cartItems = Object.entries(cart).map(([id, qty]) => ({
    drink: findDrink(id),
    quantity: qty,
  })).filter((i) => i.drink)

  const handleConfirm = async () => {
    setPhase('loading')
    try {
      const items = Object.entries(cart).map(([drinkId, quantity]) => ({
        drink_id: Number(drinkId),
        quantity,
      }))
      const result = await placeDrinkOrder({ restaurant_id: restaurantId, items })
      setOrderResult(result)
      setPhase('success')
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Klaida pateikiant užsakymą', 'error')
      setPhase('confirm')
    }
  }

  const handlePickup = async () => {
    setPickupLoading(true)
    try {
      await confirmDrinkPickup(orderResult.order_id, orderResult.code)
      showToast('Taškai nuskaičiuoti! Mėgaukitės gėrimu 🍹', 'success')
      navigate('/')
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Klaida patvirtinant pasiėmimą', 'error')
    } finally {
      setPickupLoading(false)
    }
  }

  return (
    <div>
      <TopBar title="Patvirtinkite užsakymą" showBack={phase !== 'success'} />
      <div className="screen-content px-4 py-4">
        {(phase === 'confirm' || phase === 'loading') && (
          <>
            <div className="bg-white rounded-3xl border border-border shadow-sm p-5 mb-4">
              <p className="font-bold text-primary mb-1">{restaurantSection?.restaurant.name ?? 'Restoranas'}</p>
              {cartItems.map((item) => (
                <div key={item.drink.id} className="flex justify-between items-center py-2 border-t border-border first:border-t-0">
                  <div>
                    <p className="font-semibold text-sm">{item.drink.name}</p>
                    <p className="text-xs text-primary/50">× {item.quantity}</p>
                  </div>
                  <span className="text-accent font-bold text-sm">{item.drink.price_points * item.quantity} tašk.</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t border-border mt-2">
                <span className="font-bold">Iš viso</span>
                <span className="font-black text-accent text-lg">{totalCost} taškų</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-border shadow-sm p-5 mb-4">
              <p className="text-xs text-primary/50 mb-1">Užsakovas</p>
              <p className="font-semibold">{user?.name}</p>
              {user?.phone && <p className="text-sm text-primary/60 mt-0.5">{user.phone}</p>}
            </div>

            <button
              onClick={handleConfirm}
              disabled={phase === 'loading'}
              className="w-full bg-accent text-white py-4 rounded-pill font-semibold shadow-md disabled:opacity-50 active:opacity-80"
            >
              {phase === 'loading' ? 'Pateikiama...' : '🍹 Pateikti užsakymą'}
            </button>
          </>
        )}

        {phase === 'success' && orderResult && (
          <>
            <p className="text-center font-bold text-lg text-primary mb-2">Užsakymas priimtas!</p>
            <p className="text-center text-sm text-primary/60 mb-6">Parodykite šį kodą restorano darbuotojui</p>

            <div className="bg-primary/10 border-2 border-primary rounded-3xl p-8 mb-6 flex items-center justify-center">
              <span className="text-5xl font-black tracking-[0.2em] text-primary">
                {orderResult.code}
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-border shadow-sm p-4 mb-4 text-center">
              <p className="font-semibold text-primary">{restaurantSection?.restaurant.name}</p>
              <p className="text-sm text-primary/60 mt-1">Gėrimų kaina: <strong>{totalCost} taškų</strong></p>
            </div>

            <div className="bg-accent/10 rounded-2xl px-4 py-3 mb-6 flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <p className="text-sm text-accent font-medium">Taškai bus nuskaičiuoti kai paimsite gėrimą</p>
            </div>

            <button
              onClick={handlePickup}
              disabled={pickupLoading}
              className="w-full bg-accent text-white py-4 rounded-pill font-semibold shadow-md disabled:opacity-50 active:opacity-80 mb-3"
            >
              {pickupLoading ? 'Tvirtinama...' : '✓ Gėrimas paimtas'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 text-primary text-sm font-medium text-center"
            >
              ← Grįžti į pagrindinį
            </button>
          </>
        )}
      </div>
    </div>
  )
}
