import { useEffect, useState } from 'react'
import { getSettlements, getSettlementById, uploadSettlements } from '../services/api'

const STATUS_COLORS = {
  MATCHED: { bg: '#f0fdf4', color: '#16a34a' },
  DISCREPANCY: { bg: '#fef2f2', color: '#dc2626' },
  PENDING_REVIEW: { bg: '#fffbeb', color: '#d97706' },
}

export default function Settlements() {
  const [settlements, setSettlements] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  const load = (status) => {
    getSettlements(status === 'ALL' ? '' : status).then(r => setSettlements(r.data))
  }

  useEffect(() => { load(filter) }, [filter])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setUploadMsg('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await uploadSettlements(fd)
      setUploadMsg(`✅ Uploaded! Batch: ${res.data.batchId} — ${res.data.count} records`)
      load(filter)
    } catch (err) {
      setUploadMsg(`❌ ${err.response?.data?.message || 'Upload failed'}`)
    }
    setUploading(false)
  }

  const handleRowClick = async (id) => {
    setSelected(id)
    const res = await getSettlementById(id)
    setDetail(res.data)
  }

  const exportCSV = () => {
    const rows = settlements.map(s =>
      [s.awbNumber, s.merchantId, s.status, s.settledCodAmount, s.chargedWeight, s.batchId].join(',')
    )
    const csv = ['AWB,Merchant,Status,SettledCOD,ChargedWeight,BatchID', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'settlements.csv'
    a.click()
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Settlements</h1>

      {/* Upload */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Upload Settlement File</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="file" accept=".csv,.json" onChange={e => setFile(e.target.files[0])}
            style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
          <button onClick={handleUpload} disabled={uploading || !file}
            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        {uploadMsg && <p style={{ marginTop: '12px', color: uploadMsg.startsWith('✅') ? '#16a34a' : '#dc2626' }}>{uploadMsg}</p>}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['ALL', 'MATCHED', 'DISCREPANCY', 'PENDING_REVIEW'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: filter === s ? '700' : '400',
              background: filter === s ? '#1e293b' : '#e2e8f0',
              color: filter === s ? 'white' : '#475569',
            }}>
            {s.replace('_', ' ')}
          </button>
        ))}
        <button onClick={exportCSV}
          style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: '8px', border: '1px solid #3b82f6', background: 'white', color: '#3b82f6', cursor: 'pointer', fontWeight: '600' }}>
          ⬇ Export CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['AWB Number', 'Merchant', 'Batch ID', 'Settled COD', 'Charged Weight', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {settlements.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No settlements found</td></tr>
            ) : settlements.map(s => (
              <tr key={s._id} onClick={() => handleRowClick(s._id)}
                style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selected === s._id ? '#f0f9ff' : 'white' }}>
                <td style={{ padding: '12px 16px', fontWeight: '600', color: '#3b82f6' }}>{s.awbNumber}</td>
                <td style={{ padding: '12px 16px' }}>{s.merchantId}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{s.batchId}</td>
                <td style={{ padding: '12px 16px' }}>₹{s.settledCodAmount}</td>
                <td style={{ padding: '12px 16px' }}>{s.chargedWeight} kg</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                    background: STATUS_COLORS[s.status]?.bg || '#f1f5f9',
                    color: STATUS_COLORS[s.status]?.color || '#475569',
                  }}>{s.status.replace('_', ' ')}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Discrepancy Detail Modal */}
      {detail && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => { setDetail(null); setSelected(null) }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '560px', width: '90%' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
              AWB: {detail.settlement?.awbNumber}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                ['Merchant', detail.settlement?.merchantId],
                ['Status', detail.settlement?.status],
                ['Batch ID', detail.settlement?.batchId],
                ['Settled COD', `₹${detail.settlement?.settledCodAmount}`],
                ['Charged Weight', `${detail.settlement?.chargedWeight} kg`],
                ['Order Status', detail.order?.orderStatus],
                ['Declared Weight', `${detail.order?.declaredWeight} kg`],
                ['Expected COD', `₹${detail.order?.codAmount}`],
              ].map(([label, value]) => (
                <div key={label} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontWeight: '600' }}>{value}</div>
                </div>
              ))}
            </div>
            {detail.settlement?.discrepancies?.length > 0 && (
              <>
                <h3 style={{ fontWeight: '700', marginBottom: '12px', color: '#dc2626' }}>⚠ Discrepancies</h3>
                {detail.settlement.discrepancies.map((d, i) => (
                  <div key={i} style={{ background: '#fef2f2', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                    <div style={{ fontWeight: '700', color: '#dc2626', marginBottom: '4px' }}>{d.type}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{d.description}</div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>
                      Expected: <b>₹{d.expectedValue}</b> | Actual: <b>₹{d.actualValue}</b>
                    </div>
                  </div>
                ))}
              </>
            )}
            <button onClick={() => { setDetail(null); setSelected(null) }}
              style={{ marginTop: '16px', padding: '10px 20px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}