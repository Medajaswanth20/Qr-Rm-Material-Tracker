import { useEffect, useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Download, RefreshCw, QrCode, Search, TrendingUp, ChevronLeft, ChevronRight, X, Hash } from 'lucide-react';

interface ReportData {
  totals: { total_entries: string | number; total_kgs: string | number };
  breakdown: { uom: string; material_type: string; material_shape: string; material_grade: string; total_kgs: number }[];
  shipments: any[];
  page: number;
}

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [page, setPage] = useState(0);
  const [qrModal, setQrModal] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(page); }, [page]);

  const loadData = (p: number) => {
    axios.get(`/api/reports?page=${p}`).then(r => setData(r.data)).catch(console.error);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    loadData(page);
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleDownload = () => { window.location.href = 'http://localhost:3001/api/download'; };

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem', color: '#374151' }}>
      <div style={{ width: 28, height: 28, border: '3px solid #1e2635', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: '0.875rem' }}>Loading reports...</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics Reports</h1>
          <p className="page-subtitle">Inventory summary and shipment history</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
          <button className="btn-ghost" onClick={handleRefresh} style={{ gap: '0.5rem' }}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="btn-emerald" onClick={handleDownload}>
            <Download size={14} /> Export Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', maxWidth: '640px' }}>
        <div className="kpi-card">
          <div className="kpi-icon indigo"><Search size={18} /></div>
          <div>
            <div className="kpi-label">Total Entries</div>
            <div className="kpi-value">{Number(data.totals.total_entries || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon emerald"><TrendingUp size={18} /></div>
          <div>
            <div className="kpi-label">Total Weight</div>
            <div className="kpi-value" style={{ fontSize: '1.5rem' }}>
              {Number(data.totals.total_kgs || 0).toLocaleString()}
              <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 500, marginLeft: '0.35rem' }}>kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Material Type Breakdown */}
      <div className="rm-card" style={{ overflow: 'hidden' }}>
        <div className="section-header">
          <span className="section-title">Material Type — Total Weight</span>
          <span style={{ fontSize: '0.72rem', color: '#374151', background: '#1a2035', padding: '0.25rem 0.65rem', borderRadius: '999px' }}>
            {data.breakdown.length} types
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="rm-table">
            <thead>
              <tr>
                <th>Material Type</th>
                <th>Total Kgs</th>
              </tr>
            </thead>
            <tbody>
              {data.breakdown.length === 0 ? (
                <tr><td colSpan={2} style={{ padding: '2.5rem', color: '#374151' }}>No breakdown data</td></tr>
              ) : (
                data.breakdown.map((row: any, i: number) => (
                  <tr key={`breakdown-${i}`}>
                    <td style={{ fontWeight: 700, color: '#cbd5e1' }}>{row.material_type || 'N/A'}</td>
                    <td style={{ color: '#34d399', fontWeight: 700 }}>
                      {Number(row.total_kgs).toLocaleString()}
                      <span style={{ color: '#374151', fontSize: '0.72rem', fontWeight: 500, marginLeft: '0.3rem' }}>kg</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Shipment Entries */}
      <div className="rm-card" style={{ overflow: 'hidden' }}>
        <div className="section-header">
          <span className="section-title">Recent Shipment Entries</span>
          <span style={{ fontSize: '0.72rem', color: '#374151', background: '#1a2035', padding: '0.25rem 0.65rem', borderRadius: '999px' }}>
            Page {page + 1}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="rm-table" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                {['RM Code', 'Dimensions', 'Shape', 'Grade', 'Material', 'Weight', 'Date', 'Label'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.shipments.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '3rem', color: '#374151' }}>No entries found</td></tr>
              ) : (
                data.shipments.map((row, i) => (
                  <tr key={row.rm_code ?? `row-${i}`}>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(99,102,241,0.1)', color: '#818cf8', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }}>
                        <Hash size={10} />{row.rm_code || '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{row.raw_material_dimensions || 'N/A'}</td>
                    <td>{row.material_shape || '--'}</td>
                    <td>{row.material_grade || 'N/A'}</td>
                    <td style={{ fontWeight: 700, color: '#cbd5e1' }}>{row.material_type || 'N/A'}</td>
                    <td style={{ color: '#34d399', fontWeight: 700 }}>{row.kgs || 0} <span style={{ color: '#374151', fontSize: '0.72rem' }}>{row.uom}</span></td>
                    <td style={{ fontSize: '0.78rem' }}>{new Date(row.shipment_date).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => setQrModal(`Raw material details\nRM ID: ${row.rm_code}\nDimensions: ${row.raw_material_dimensions}\nShape: ${row.material_shape || 'N/A'}\nMaterial Grade: ${row.material_grade}\nMaterial: ${row.material_type}\nUOM: ${row.uom}\nKgs: ${row.kgs}`)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', padding: '0.3rem 0.7rem', borderRadius: '7px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                      >
                        <QrCode size={12} /> Scan
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid #1a2035', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn-ghost" disabled={page === 0} onClick={() => setPage(page - 1)} style={{ gap: '0.35rem', fontSize: '0.8rem', padding: '0.5rem 1rem', opacity: page === 0 ? 0.4 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer' }}>
            <ChevronLeft size={14} /> Previous
          </button>
          <span style={{ color: '#374151', fontSize: '0.78rem', fontWeight: 600 }}>Page {page + 1}</span>
          <button className="btn-ghost" disabled={(page + 1) * 10 >= Number(data.totals.total_entries)} onClick={() => setPage(page + 1)}
            style={{ gap: '0.35rem', fontSize: '0.8rem', padding: '0.5rem 1rem', opacity: (page + 1) * 10 >= Number(data.totals.total_entries) ? 0.4 : 1, cursor: (page + 1) * 10 >= Number(data.totals.total_entries) ? 'not-allowed' : 'pointer' }}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div className="qr-modal" onClick={() => setQrModal(null)}>
          <div className="qr-modal-content animate-fade-up" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1e2635', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: 'rgba(99,102,241,0.15)', padding: '0.45rem', borderRadius: '8px', display: 'flex' }}>
                  <QrCode size={18} color="#818cf8" />
                </div>
                <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>Digital Label Preview</span>
              </div>
              <button onClick={() => setQrModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', padding: '0.3rem', borderRadius: '6px' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px' }}>
                  <QRCodeSVG value={qrModal} size={155} level="H" />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Scan to verify</span>
              </div>
              <div style={{ flex: 1, minWidth: 220, background: '#0f1117', border: '1px solid #1e2635', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {qrModal.split('\n').map((line, i) => {
                  const splitIdx = line.indexOf(':');
                  if (i === 0 || splitIdx === -1) return <div key={i} style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem', marginBottom: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid #1e2635' }}>{line}</div>;
                  const key = line.substring(0, splitIdx);
                  const val = line.substring(splitIdx + 1).trim();
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0.5rem', fontSize: '0.82rem' }}>
                      <span style={{ color: '#475569', fontWeight: 500 }}>{key}</span>
                      <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #1e2635', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn-ghost" onClick={() => setQrModal(null)}>Close</button>
              <button className="btn-primary" onClick={() => window.print()}><Download size={14} /> Download Label</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
