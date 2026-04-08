import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Settlements from './pages/Settlements'
import Jobs from './pages/Jobs'
import Notifications from './pages/Notifications'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
        {/* Sidebar */}
        <nav style={{
          width: '220px', background: '#1e293b', color: 'white',
          padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: '#38bdf8' }}>
            📦 CleverBooks
          </div>
          {[
            { to: '/', label: '🏠 Dashboard' },
            { to: '/settlements', label: '📋 Settlements' },
            { to: '/jobs', label: '⚙️ Jobs' },
            { to: '/notifications', label: '🔔 Notifications' },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                padding: '10px 14px', borderRadius: '8px', textDecoration: 'none',
                color: isActive ? '#38bdf8' : '#cbd5e1',
                background: isActive ? '#0f172a' : 'transparent',
                fontWeight: isActive ? '600' : '400',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, background: '#f8fafc', padding: '32px', overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settlements" element={<Settlements />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}