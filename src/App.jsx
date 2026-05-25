import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import AppShell from './components/AppShell'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import HomeScreen from './screens/HomeScreen'
import OffersListScreen from './screens/OffersListScreen'
import OfferDetailScreen from './screens/OfferDetailScreen'
import CreateOfferScreen from './screens/CreateOfferScreen'
import OrdersListScreen from './screens/OrdersListScreen'
import OrderDetailScreen from './screens/OrderDetailScreen'
import ProfileScreen from './screens/ProfileScreen'
import EditProfileScreen from './screens/EditProfileScreen'
import LeaderboardScreen from './screens/LeaderboardScreen'
import UserProfileScreen from './screens/UserProfileScreen'
import DrinkCatalogScreen from './screens/DrinkCatalogScreen'
import DrinkOrderConfirmScreen from './screens/DrinkOrderConfirmScreen'
import CreateDrinkOfferScreen from './screens/CreateDrinkOfferScreen'
import DrinkOrderDetailScreen from './screens/DrinkOrderDetailScreen'
import RouteScreen from './screens/RouteScreen'

function ProtectedRoute() {
  const { token, loading } = useAuth()
  if (loading) return null
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

function PublicRoute() {
  const { token, loading } = useAuth()
  if (loading) return null
  return token ? <Navigate to="/" replace /> : <Outlet />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/register" element={<RegisterScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/marsrutas" element={<RouteScreen />} />
              <Route element={<AppShell />}>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/pasiulymai" element={<OffersListScreen />} />
                <Route path="/pasiulymai/sukurti" element={<CreateOfferScreen />} />
                <Route path="/pasiulymai/:id" element={<OfferDetailScreen />} />
                <Route path="/uzsakymai" element={<OrdersListScreen />} />
                <Route path="/uzsakymai/:id" element={<OrderDetailScreen />} />
                <Route path="/profilis" element={<ProfileScreen />} />
                <Route path="/profilis/redaguoti" element={<EditProfileScreen />} />
                <Route path="/profilis/lyderiai" element={<LeaderboardScreen />} />
                <Route path="/profilis/:id" element={<UserProfileScreen />} />
                <Route path="/taskai/gerimas" element={<DrinkCatalogScreen />} />
                <Route path="/taskai/gerimas/sukurti" element={<CreateDrinkOfferScreen />} />
                <Route path="/taskai/gerimas/patvirtinti" element={<DrinkOrderConfirmScreen />} />
                <Route path="/gerimo-uzsakymai/:id" element={<DrinkOrderDetailScreen />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  )
}
