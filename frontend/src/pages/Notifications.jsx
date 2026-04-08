import { useEffect, useState } from 'react'
import { getNotifications } from '../services/api'

const STATUS_COLORS = {
  SENT: { bg: '#f0fdf4', color: '#16a34a' },
  FAILED: { bg: '#fef2f2', color: '#dc2626' },
  RETRYING: { bg: '#fffbeb', color: '#d97706' },
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    getNotifications().then(r => setNotifications(r.data))
  }, [])

  const filtered = filter === 'ALL' ? notifications : notifications.filter(n => n.status === filter)

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Notification Delivery Log</h1>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['ALL', 'SENT', 'FAILED', 'RETRYING'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: filter === s ? '700' : '400',
              background: filter === s ? '#1e293b' : '#e2e8f0',
              color: filter === s ? 'white' : '#475569',
            }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['AWB Number', 'Merchant', 'Discrepancy Type', 'Expected', 'Actual', 'Attempts', 'Status', 'Last Attempt'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No notifications yet</td></tr>
            ) : filtered.map(n => (
              <tr key={n._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontWeight: '600', color: '#3b82f6' }}>{n.awbNumber}</td>
                <td style={{ padding: '12px 16px' }}>{n.merchantId}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{n.discrepancyType}</td>
                <td style={{ padding: '12px 16px' }}>₹{n.expectedValue}</td>
                <td style={{ padding: '12px 16px' }}>₹{n.actualValue}</td>
                <td style={{ padding: '12px 16px' }}>{n.attempts}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                    background: STATUS_COLORS[n.status]?.bg,
                    color: STATUS_COLORS[n.status]?.color,
                  }}>{n.status}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                  {n.lastAttemptAt ? new Date(n.lastAttemptAt).toLocaleString('en-IN') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}