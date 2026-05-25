import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_LABELS = {
  gavejas:        { pasiulymai: 'Pasiūlymai',  uzsakymai: 'Užsakymai'  },
  transportuotojas:{ pasiulymai: 'Pristatymai', uzsakymai: 'Istorija'   },
  restoranas:     { pasiulymai: 'Pasiūlymai',  uzsakymai: 'Užsakymai'  },
  davejas:        { pasiulymai: 'Pasiūlymai',  uzsakymai: 'Užsakymai'  },
}

const DEFAULT_LABELS = { pasiulymai: 'Pasiūlymai', uzsakymai: 'Užsakymai' }

const HomeIcon = (active) => (
  <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? 'fill-primary' : 'fill-primary/40'}`}>
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
)

const MapIcon = (active) => (
  <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? 'fill-primary' : 'fill-primary/40'}`}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
)

const OrdersIcon = (active) => (
  <svg viewBox="0 0 24 24" className={`w-6 h-6 ${active ? 'fill-primary' : 'fill-primary/40'}`}>
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
  </svg>
)

export default function BottomNav() {
  const location = useLocation()
  const { user } = useAuth()
  const labels = ROLE_LABELS[user?.role] ?? DEFAULT_LABELS

  const tabs = [
    { path: '/',           label: 'Pagrindinis',          icon: HomeIcon   },
    { path: '/pasiulymai', label: labels.pasiulymai,      icon: MapIcon    },
    { path: '/uzsakymai',  label: labels.uzsakymai,       icon: OrdersIcon },
  ]

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-border z-40">
      <div className="flex">
        {tabs.map((tab) => {
          const active =
            tab.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(tab.path)
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 relative"
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-primary rounded-full" />
              )}
              {tab.icon(active)}
              <span className={`text-[10px] font-medium leading-tight ${active ? 'text-primary' : 'text-primary/50'}`}>
                {tab.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
