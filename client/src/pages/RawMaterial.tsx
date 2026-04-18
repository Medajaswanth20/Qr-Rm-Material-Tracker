import { useEffect, useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Save, RefreshCw, Calculator, QrCode, Download, X, Layers, Ruler, Weight, Tag, ChevronDown } from 'lucide-react';

export default function RawMaterial() {
  const [qrModal, setQrModal] = useState<string | null>(null);
  const [materialTypes, setMaterialTypes] = useState<{name: string}[]>([]);
  const [showNewMat, setShowNewMat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [shape, setShape] = useState('Block');
  const [dim1, setDim1] = useState('');
  const [dim2, setDim2] = useState('');
  const [dim3, setDim3] = useState('');
  const [matGrade, setMatGrade] = useState('');
  const [matType, setMatType] = useState('');
  const [newMatType, setNewMatType] = useState('');
  const [uom, setUom] = useState('KG');
  const [weight, setWeight] = useState('');
  const [shipDate, setShipDate] = useState(new Date().toISOString().split('T')[0]);

  const resolvedMatType = showNewMat ? newMatType.toUpperCase() : matType;

  let formattedDimensions = '';
  if (shape === 'Block') formattedDimensions = `L ${dim1} × W ${dim2} × H/T ${dim3}`;
  else if (shape === 'Round') formattedDimensions = `L ${dim1} × Dia ${dim2}`;
  else if (shape === 'Tube') formattedDimensions = `L ${dim1} × OD ${dim2} × WT ${dim3}`;

  const qrData = JSON.stringify({
    rm_code: '(preview)',
    dimensions: formattedDimensions,
    grade: matGrade,
    material: resolvedMatType,
    weight: weight ? `${weight} ${uom}` : '',
    date: shipDate
  });

  useEffect(() => { loadTypes(); }, []);

  const loadTypes = () => {
    axios.get('/api/dashboard').then(r => setMaterialTypes(r.data.materialTypes || [])).catch(console.error);
  };

  const handleCalculateWeight = () => {
    if (!dim1 || !resolvedMatType) {
      toast.error('Enter dimensions and material type to auto-calculate');
      return;
    }
    const densityMap: Record<string, number> = { 'AL': 2.7, 'SS': 8.0, 'CU': 8.96, 'BRASS': 8.73, 'ALUMINIUM': 2.7 };
    let vol = 0;
    const l = parseFloat(dim1) || 0;
    const d2 = parseFloat(dim2) || 0;
    const d3 = parseFloat(dim3) || 0;

    if (shape === 'Block') vol = l * d2 * d3;
    else if (shape === 'Round') vol = Math.PI * Math.pow(d2 / 2, 2) * l;
    else if (shape === 'Tube') {
      const innerDia = d2 - 2 * d3;
      vol = Math.PI * Math.pow(d2 / 2, 2) * l - Math.PI * Math.pow(innerDia / 2, 2) * l;
    }
    const density = densityMap[resolvedMatType.toUpperCase()] || 7.8;
    const calculatedKg = (vol * density) / 1000000;
    if (calculatedKg > 0) { setWeight(calculatedKg.toFixed(3)); toast.success('Weight auto-calculated!'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || parseFloat(weight) <= 0) { toast.error('Please enter a valid weight'); return; }
    setIsSubmitting(true);
    const pendingToast = toast.loading('Saving entry...');
    try {
      const payload = {
        raw_material_dimensions: formattedDimensions,
        material_shape: shape,
        material_grade: matGrade,
        material_type: resolvedMatType,
        uom,
        kgs: weight,
        shipment_date: shipDate
      };
      const response = await axios.post('/api/add', payload);
      const rmCode = response.data.rm_code;
      toast.success('Entry saved successfully!', { id: pendingToast });
      setDim1(''); setDim2(''); setDim3('');
      setMatGrade(''); setWeight('');
      if (showNewMat) { setShowNewMat(false); setNewMatType(''); loadTypes(); }
      const qrContent = `Raw material details\nRM ID: ${rmCode}\nDimensions: ${formattedDimensions}\nShape: ${shape}\nMaterial Grade: ${matGrade}\nMaterial: ${resolvedMatType}\nUOM: ${uom}\nKgs: ${weight}`;
      setQrModal(qrContent);
    } catch (err: any) {
      toast.error(`Error: ${err.response?.data?.error || 'Failed to save'}`, { id: pendingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const shapeLabel = shape === 'Block' ? 'Block / Plate / Sheet'
    : shape === 'Round' ? 'Round / Solid Rod' : 'Tube / Pipe';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>

      {/* QR Modal */}
      {qrModal && (
        <div className="qr-modal" onClick={() => setQrModal(null)}>
          <div className="qr-modal-content animate-fade-up" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1e2635', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: 'rgba(99,102,241,0.15)', padding: '0.45rem', borderRadius: '8px', display: 'flex' }}>
                  <QrCode size={18} color="#818cf8" />
                </div>
                <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>Digital Label Preview</span>
              </div>
              <button onClick={() => setQrModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', padding: '0.3rem', borderRadius: '6px', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* QR Code */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', display: 'inline-block' }}>
                  <QRCodeSVG value={qrModal} size={155} level="H" />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  Scan to verify
                </span>
              </div>

              {/* Details */}
              <div style={{ flex: 1, minWidth: 220, background: '#0f1117', border: '1px solid #1e2635', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {qrModal.split('\n').map((line, i) => {
                  const splitIdx = line.indexOf(':');
                  if (i === 0 || splitIdx === -1) {
                    return <div key={i} style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem', marginBottom: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid #1e2635' }}>{line}</div>;
                  }
                  const key = line.substring(0, splitIdx);
                  const val = line.substring(splitIdx + 1).trim();
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0.5rem', fontSize: '0.82rem', alignItems: 'center' }}>
                      <span style={{ color: '#475569', fontWeight: 500 }}>{key}</span>
                      <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #1e2635', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn-ghost" onClick={() => setQrModal(null)}>Close</button>
              <button className="btn-primary" onClick={() => window.print()}>
                <Download size={15} /> Download Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Raw Material</h1>
          <p className="page-subtitle">Record incoming RM stock and generate a digital label</p>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── FORM PANEL ── */}
        <div className="rm-card" style={{ flex: '1 1 420px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #1e2635' }}>
            <Layers size={16} color="#6366f1" />
            <span style={{ fontWeight: 700, color: '#cbd5e1', fontSize: '0.875rem' }}>Material Details</span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Shape */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                Material Shape
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  className="rm-select"
                  value={shape}
                  onChange={e => { setShape(e.target.value); setDim1(''); setDim2(''); setDim3(''); }}
                >
                  <option value="Block">Block / Plate / Sheet</option>
                  <option value="Round">Round / Solid Rod</option>
                  <option value="Tube">Tube / Pipe</option>
                </select>
                <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#374151', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                <Ruler size={12} /> Dimensions (mm)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: shape === 'Round' ? '1fr 1fr' : '1fr 1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <input type="number" placeholder="Length" className="rm-input" required value={dim1} onChange={e => setDim1(e.target.value)} />
                  <div style={{ fontSize: '0.65rem', color: '#374151', marginTop: '0.25rem', textAlign: 'center' }}>Length</div>
                </div>
                {shape === 'Block' && (<>
                  <div>
                    <input type="number" placeholder="Width" className="rm-input" required value={dim2} onChange={e => setDim2(e.target.value)} />
                    <div style={{ fontSize: '0.65rem', color: '#374151', marginTop: '0.25rem', textAlign: 'center' }}>Width</div>
                  </div>
                  <div>
                    <input type="number" placeholder="Thickness" className="rm-input" required value={dim3} onChange={e => setDim3(e.target.value)} />
                    <div style={{ fontSize: '0.65rem', color: '#374151', marginTop: '0.25rem', textAlign: 'center' }}>Thickness / H</div>
                  </div>
                </>)}
                {shape === 'Round' && (
                  <div>
                    <input type="number" placeholder="Diameter" className="rm-input" required value={dim2} onChange={e => setDim2(e.target.value)} />
                    <div style={{ fontSize: '0.65rem', color: '#374151', marginTop: '0.25rem', textAlign: 'center' }}>Diameter</div>
                  </div>
                )}
                {shape === 'Tube' && (<>
                  <div>
                    <input type="number" placeholder="Outer Dia" className="rm-input" required value={dim2} onChange={e => setDim2(e.target.value)} />
                    <div style={{ fontSize: '0.65rem', color: '#374151', marginTop: '0.25rem', textAlign: 'center' }}>Outer Dia</div>
                  </div>
                  <div>
                    <input type="number" placeholder="Wall Thick" className="rm-input" required value={dim3} onChange={e => setDim3(e.target.value)} />
                    <div style={{ fontSize: '0.65rem', color: '#374151', marginTop: '0.25rem', textAlign: 'center' }}>Wall Thick</div>
                  </div>
                </>)}
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #1a2035' }} />

            {/* Material Type & Grade */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>Material Type</label>
                <div style={{ position: 'relative' }}>
                  <select
                    className="rm-select"
                    required
                    value={showNewMat ? '__new__' : matType}
                    onChange={(e) => {
                      if (e.target.value === '__new__') setShowNewMat(true);
                      else { setShowNewMat(false); setMatType(e.target.value); }
                    }}
                  >
                    <option value="" disabled>Select type</option>
                    {materialTypes.map(k => <option key={k.name} value={k.name}>{k.name}</option>)}
                    <option value="__new__">+ Add New...</option>
                  </select>
                  <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#374151', pointerEvents: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>Material Grade</label>
                <input type="text" placeholder="e.g. 6061-T6" className="rm-input" required value={matGrade} onChange={e => setMatGrade(e.target.value)} />
              </div>
            </div>

            {/* New Material Input */}
            {showNewMat && (
              <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                  New Material Acronym
                </label>
                <input type="text" placeholder="e.g. AL, SS, MS" className="rm-input" required value={newMatType} onChange={e => setNewMatType(e.target.value.toUpperCase())} style={{ borderColor: 'rgba(99,102,241,0.3)' }} />
              </div>
            )}

            {/* Divider */}
            <div style={{ borderTop: '1px solid #1a2035' }} />

            {/* Weight & Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.65rem', alignItems: 'start' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Weight size={12} /> Weight</span>
                  <button type="button" onClick={handleCalculateWeight} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', textTransform: 'none', letterSpacing: 0, padding: 0 }}>
                    <Calculator size={11} /> Auto-calc
                  </button>
                </label>
                <div style={{ display: 'flex' }}>
                  <input type="number" step="any" placeholder="0.000" className="rm-input" required value={weight} onChange={e => setWeight(e.target.value)} style={{ borderRadius: '8px 0 0 8px', borderRight: 'none' }} />
                  <select className="rm-select" value={uom} onChange={e => setUom(e.target.value)} style={{ width: 'auto', borderRadius: '0 8px 8px 0', minWidth: '64px', flexShrink: 0 }}>
                    <option>KG</option>
                    <option>MT</option>
                    <option>PCS</option>
                  </select>
                </div>
              </div>
              <div style={{ width: 1, background: '#1a2035', alignSelf: 'stretch', marginTop: '1.4rem' }} />
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>Shipment Date</label>
                <input type="date" className="rm-input" required value={shipDate} onChange={e => setShipDate(e.target.value)} />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ marginTop: '0.5rem', width: '100%', padding: '0.8rem' }}>
              {isSubmitting ? <RefreshCw size={17} className="animate-spin" /> : <Save size={17} />}
              {isSubmitting ? 'Saving Entry...' : 'Save RM Entry & Generate Label'}
            </button>
          </form>
        </div>

        {/* ── LIVE PREVIEW PANEL ── */}
        <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* QR Preview Card */}
          <div className="rm-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            {/* Glow bg */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ textAlign: 'center', width: '100%', borderBottom: '1px solid #1e2635', paddingBottom: '1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6366f1', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Live Preview</div>
            </div>

            {/* QR */}
            <div style={{ background: '#fff', padding: '0.875rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
              {(resolvedMatType || dim1 || weight) ? (
                <QRCodeSVG value={qrData} size={135} level="H" />
              ) : (
                <div style={{ width: 135, height: 135, background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', gap: '0.5rem' }}>
                  <QrCode size={36} color="#cbd5e1" />
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center' }}>Awaiting input</span>
                </div>
              )}
            </div>

            {/* Meta info */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Shape', value: shapeLabel, color: '#818cf8' },
                { label: 'Material', value: resolvedMatType || '--', color: '#f8fafc' },
                { label: 'Grade', value: matGrade || '--', color: '#f8fafc' },
                { label: 'Dims', value: dim1 ? formattedDimensions : '--', color: '#94a3b8', small: true },
                { label: 'Weight', value: weight ? `${weight} ${uom}` : '--', color: '#34d399' },
              ].map(({ label, value, color, small }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: small ? '0.75rem' : '0.8rem' }}>
                  <span style={{ color: '#374151', fontWeight: 500 }}>{label}</span>
                  <span style={{ color, fontWeight: 700, maxWidth: '55%', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info card */}
          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', padding: '1rem 1.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Tag size={13} color="#818cf8" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>About Labels</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
              Each entry generates a unique <strong style={{ color: '#818cf8' }}>RM-XXXXX</strong> code and QR label.
              The QR encodes all material metadata for instant scanning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
