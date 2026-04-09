import { useEffect, useState } from 'react'
import { getSettlements, getJobs, getNotifications, triggerJob } from '../services/api'

const Card = ({ label, value, color }) => (
  <div style={{
    background: 'white', borderRadius: '12px', padding: '24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}`, minWidth: '180px'
  }}>
    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{label}</div>
    <div style={{ fontSize: '28px', fontWeight: '700', color }}>{value}</div>
  </div>
)

export default function Dashboard() {
  const [settlements, setSettlements] = useState([])
  const [jobs, setJobs] = useState([])
  const [notifications, setNotifications] = useState([])
  const [triggering, setTriggering] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    getSettlements().then(r => setSettlements(r.data))
    getJobs().then(r => setJobs(r.data))
    getNotifications().then(r => setNotifications(r.data))
  }, [])

  const matched = settlements.filter(s => s.status === 'MATCHED').length
  const discrepancy = settlements.filter(s => s.status === 'DISCREPANCY').length
  const pending = settlements.filter(s => s.status === 'PENDING_REVIEW').length

  const totalDiscrepancyValue = settlements
    .filter(s => s.status === 'DISCREPANCY')
    .reduce((sum, s) => {
      return sum + (s.discrepancies?.reduce((a, d) => a + Math.abs(d.expectedValue - d.actualValue), 0) || 0)
    }, 0)

  const handleTrigger = async () => {
    setTriggering(true)
    setMessage('')
    try {
      await triggerJob()
      setMessage('✅ Reconciliation job triggered! Refresh in a few seconds.')
    } catch {
      setMessage('❌ Failed to trigger job.')
    }
    setTriggering(false)
  }

  const lastJob = jobs[0]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Dashboard</h1>
        <button
          onClick={handleTrigger}
          disabled={triggering}
          style={{
            background: '#3b82f6', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
            fontWeight: '600', fontSize: '14px', opacity: triggering ? 0.7 : 1
          }}
        >
          {triggering ? '⏳ Running...' : '▶ Trigger Reconciliation'}
        </button>
      </div>

      {message && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f0fdf4', borderRadius: '8px', color: '#166534' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <Card label="Total Settlements" value={settlements.length} color="#3b82f6" />
        <Card label="Matched" value={matched} color="#22c55e" />
        <Card label="Discrepancies" value={discrepancy} color="#ef4444" />
        <Card label="Pending Review" value={pending} color="#f59e0b" />
        <Card label="Total Discrepancy Value" value={`₹${totalDiscrepancyValue.toFixed(0)}`} color="#8b5cf6" />
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Last Reconciliation Job</h2>
        {lastJob ? (
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            {[
              { label: 'Status', value: lastJob.status },
              { label: 'Triggered By', value: lastJob.triggeredBy },
              { label: 'Records Processed', value: lastJob.recordsProcessed },
              { label: 'Discrepancies Found', value: lastJob.discrepanciesFound },
              { label: 'Run At', value: new Date(lastJob.runAt).toLocaleString('en-IN') },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{label}</div>
                <div style={{ fontWeight: '600', marginTop: '4px' }}>{value}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#94a3b8' }}>No jobs run yet. Click Trigger Reconciliation above.</p>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Notification Summary</h2>
        <div style={{ display: 'flex', gap: '32px' }}>
          {['SENT', 'FAILED', 'RETRYING'].map(status => (
            <div key={status}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{status}</div>
              <div style={{ fontWeight: '700', fontSize: '24px', marginTop: '4px' }}>
                {notifications.filter(n => n.status === status).length}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}