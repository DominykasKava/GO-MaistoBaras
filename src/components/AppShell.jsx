import React from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import { useAuth } from '../context/AuthContext'

export default function AppShell() {
  const { user } = useAuth()
  return (
    <div className="app-shell" data-role={user?.role ?? ''}>
      <Outlet />
      <BottomNav />
    </div>
  )
}
