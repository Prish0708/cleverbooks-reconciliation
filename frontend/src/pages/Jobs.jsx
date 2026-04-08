import { useEffect, useState } from 'react'
import { getJobs, triggerJob } from '../services/api'

const STATUS_COLORS = {
  COMPLETED: { bg: '#f0fdf4', color: '#16a34a' },
  FAILED: { bg: '#fef2f2', color: '#dc2626' },
  RUNNING: { bg: '#eff6ff', color: '#2563eb' },
}

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [triggering, setTriggering] = useState(false)
  const [message, setMessage] = useState('')

  const load = () => getJobs().then(r => setJobs(r.data))

  useEffect(() => { load() }, [])

  const handleTrigger = async () => {
    setTriggering(true)
    setMessage('')
    try {
      await triggerJob()
      setMessage('✅ Job triggered! Refresh in a few seconds.')
      setTimeout(load, 3000)
    } catch {
      setMessage('❌ Failed to trigger job.')
    }
    setTriggering(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Reconciliation Jobs</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={load}
            style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: '600' }}>
            🔄 Refresh
          </button>
          <button onClick={handleTrigger} disabled={triggering}
            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            {triggering ? '⏳ Running...' : '▶ Trigger Job'}
          </button>
        </div>
      </div>

      {message && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f0fdf4', borderRadius: '8px', color: '#166534' }}>
          {message}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Run At', 'Triggered By', 'Status', 'Records Processed', 'Discrepancies', 'Matched', 'Pending'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No jobs run yet</td></tr>
            ) : jobs.map(j => (
              <tr key={j._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>{new Date(j.runAt).toLocaleString('en-IN')}</td>
                <td style={{ padding: '12px 16px' }}>{j.triggeredBy}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                    background: STATUS_COLORS[j.status]?.bg,
                    color: STATUS_COLORS[j.status]?.color,
                  }}>{j.status}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>{j.recordsProcessed}</td>
                <td style={{ padding: '12px 16px', color: '#dc2626', fontWeight: '600' }}>{j.discrepanciesFound}</td>
                <td style={{ padding: '12px 16px', color: '#16a34a', fontWeight: '600' }}>{j.matchedCount}</td>
                <td style={{ padding: '12px 16px', color: '#d97706', fontWeight: '600' }}>{j.pendingCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}