import { useEffect, useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

interface ReportData {
  totals: { total_entries: string | number; total_kgs: string | number };
  breakdown: { uom: string; material_grade: string; total_kgs: number }[];
  shipments: any[];
  page: number;
}

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [page, setPage] = useState(0);
  const [qrModal, setQrModal] = useState<string | null>(null);

  useEffect(() => {
    loadData(page);
  }, [page]);

  const loadData = (p: number) => {
    axios.get(`/api/reports?page=${p}`).then(r => setData(r.data)).catch(console.error);
  };

  const handleRefresh = async () => {
    await axios.post('/api/reports/refresh');
    loadData(page);
  };

  const handleDownload = () => {
    window.location.href = 'http://localhost:3001/api/download';
  };

  if (!data) return <div>Loading...</div>;

  return (
    <div className="page-section">
      <div className="header">
        <h2>📈 Reports</h2>
      </div>
      <div className="card">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <button className="btn-download" onClick={handleDownload}>⬇ Download Excel</button>
          <button className="btn-primary" onClick={handleRefresh}>🔄 Refresh Report Data</button>
        </div>

        <div className="report-summary-row">
          <div><strong>Total entries:</strong> {data.totals.total_entries || 0}</div>
          <div><strong>Total kgs:</strong> {data.totals.total_kgs || 0}</div>
        </div>

        <table className="user-table">
          <thead>
            <tr><th>UOM</th><th>Material Grade</th><th>Total kgs</th></tr>
          </thead>
          <tbody>
            {data.breakdown.length === 0 ? (
              <tr><td colSpan={3}>No breakdown data</td></tr>
            ) : (
              data.breakdown.map((row, i) => (
                <tr key={i}>
                  <td>{row.uom || 'N/A'}</td>
                  <td>{row.material_grade || 'N/A'}</td>
                  <td>{row.total_kgs || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="header" style={{ marginTop: '20px' }}>
          <h2>📦 All entries</h2>
        </div>

        <table className="user-table">
          <thead>
            <tr><th>Rm Dimensions</th><th>Material Grade</th><th>Material</th><th>UOM</th><th>Kgs</th><th>Date</th><th>QR</th></tr>
          </thead>
          <tbody>
            {data.shipments.length === 0 ? (
              <tr><td colSpan={7}>No entries found</td></tr>
            ) : (
              data.shipments.map((row, i) => (
                <tr key={row.id}>
                  <td>{row.raw_material_dimensions || 'N/A'}</td>
                  <td>{row.material_grade || 'N/A'}</td>
                  <td>{row.material_type || 'N/A'}</td>
                  <td>{row.uom || ''}</td>
                  <td>{row.kgs || 0}</td>
                  <td>{new Date(row.shipment_date).toLocaleDateString()}</td>
                  <td>
                    {i === 0 && (
                      <button className="btn-download" onClick={() => setQrModal(
                        `Raw material details\nID: ${row.id}\nDimensions: ${row.raw_material_dimensions}\nMaterial Grade: ${row.material_grade}\nMaterial: ${row.material_type}\nUOM: ${row.uom}\nKgs: ${row.kgs}`
                      )}>QR</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end', alignItems: 'center' }}>
          <button className="btn-primary" disabled={page === 0} onClick={() => setPage(page - 1)}>&lt; Previous</button>
          <span>Showing page {page + 1}</span>
          <button className="btn-primary" disabled={(page + 1) * 10 >= Number(data.totals.total_entries)} onClick={() => setPage(page + 1)}>Next &gt;</button>
        </div>
      </div>

      {qrModal && (
        <div className="qr-modal" onClick={() => setQrModal(null)}>
          <div className="qr-modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Raw material QR</h3>
              <button className="btn-primary" onClick={() => setQrModal(null)}>Close</button>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <QRCodeSVG value={qrModal} size={200} />
              <pre style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap' }}>
                {qrModal}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
