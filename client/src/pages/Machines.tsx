import { useSearchParams } from 'react-router-dom';

export default function Machines() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selected = searchParams.get('selected');

  return (
    <div className="page-section">
      <div className="header">
        <h2>⚙️ Machines</h2>
      </div>
      <div className="card">
        <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
          Machine type
        </label>
        <select 
          value={selected || ''} 
          onChange={(e) => setSearchParams({ selected: e.target.value })}
        >
          <option value="" disabled>Select machine…</option>
          <option value="CMC">CMC — CNC machining center</option>
          <option value="VMC">VMC — Vertical machining center</option>
          <option value="TMC">TMC — Turn-mill / turning center</option>
        </select>
        
        {selected && (
          <div className="machine-detail-panel">
            {selected === 'CMC' && <><strong>CMC</strong> — CNC machining center for milling, drilling, and related operations.</>}
            {selected === 'VMC' && <><strong>VMC</strong> — Vertical machining center; vertical spindle for flat workpieces, pockets, and 3-axis programs.</>}
            {selected === 'TMC' && <><strong>TMC</strong> — Turn-mill / turning center with live tooling or mill-turn for shafts and rotational parts.</>}
          </div>
        )}
      </div>
    </div>
  );
}
