import { useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Save, RefreshCw, Calculator, QrCode, Download, X, Layers, Ruler, Weight, Tag, ChevronDown, Hash } from 'lucide-react';

// ── Density table (g/cm³). Dimensions input in mm → weight output in kg
const DENSITY_MAP: Record<string, number> = {
  // Aluminium
  'AL': 2.70, 'ALUMINIUM': 2.70, 'ALUMINUM': 2.70,
  'AL6061': 2.70, '6061': 2.70, 'AL6063': 2.69, '6063': 2.69,
  'AL7075': 2.81, '7075': 2.81, 'AL2024': 2.78, '2024': 2.78,
  // Stainless Steel
  'SS': 7.93, 'SS304': 7.93, '304': 7.93,
  'SS316': 7.98, '316': 7.98, 'SS316L': 7.98, '316L': 7.98,
  'SS202': 7.92, '202': 7.92, 'SS430': 7.74, '430': 7.74,
  'SS410': 7.74, '410': 7.74, 'SS201': 7.93, '201': 7.93,
  'STAINLESS STEEL': 7.93, 'STAINLESSSTEEL': 7.93, 'STANLESS STEEL': 7.93,
  // Mild / Carbon Steel
  'MS': 7.85, 'MILD STEEL': 7.85, 'MILDSTEEL': 7.85,
  'CS': 7.85, 'CARBON STEEL': 7.85, 'EN8': 7.85, 'EN24': 7.83,
  // Copper
  'CU': 8.96, 'COPPER': 8.96,
  // Brass
  'BRASS': 8.50, 'BRASS360': 8.49, 'BRASS260': 8.53,
  // Bronze
  'BRONZE': 8.80, 'PHOSPHOR BRONZE': 8.80,
  // Titanium
  'TI': 4.51, 'TITANIUM': 4.51,
  // Cast Iron
  'CI': 7.20, 'CAST IRON': 7.20, 'CASTIRON': 7.20,
  // Zinc / Nickel / Lead
  'ZINC': 7.13, 'ZN': 7.13,
  'NICKEL': 8.90, 'NI': 8.90,
  'LEAD': 11.34, 'PB': 11.34,
};

function getDensity(matType: string, matGrade: string): number {
  const t = matType.toUpperCase().replace(/\s+/g, ' ').trim();
  const g = matGrade.toUpperCase().replace(/[-\s]/g, '').trim();
  return DENSITY_MAP[`${t}${g}`] ?? DENSITY_MAP[g] ?? DENSITY_MAP[t] ?? 7.85;
}

// ── Grade options per material type
const GRADE_MAP: Record<string, string[]> = {
  'ALUMINIUM': ['1100','2011','2014','2024','3003','5052','5083','5086','6061','6063','6082','6351','7050','7075','7068'],
  'ALUMINUM':  ['1100','2011','2014','2024','3003','5052','5083','5086','6061','6063','6082','6351','7050','7075','7068'],
  'AL':        ['1100','2011','2014','2024','3003','5052','5083','5086','6061','6063','6082','6351','7050','7075','7068'],
  'STAINLESS STEEL': ['201','202','301','304','304L','309','310','316','316L','317','321','347','410','416','420','430','440C','904L','2205','2507'],
  'STANLESS STEEL':  ['201','202','304','316','316L','410','430'],
  'SS': ['201','202','301','304','304L','309','310','316','316L','317','321','347','410','416','420','430','440C','904L','2205','2507'],
  'MS':         ['IS2062 E250','IS2062 E350','EN8','EN9','EN24','EN36','A36','A572 GR50','S275','S355'],
  'MILD STEEL': ['IS2062 E250','IS2062 E350','EN8','EN9','EN24','EN36','A36','S275','S355'],
  'CS':         ['EN8','EN24','EN31','C45','C55','C60','1018','1045','4140'],
  'COPPER': ['C10100','C10200 (ETP)','C12000','C12200 (DHP)','C14500','C17200 (BeCu)'],
  'CU':     ['C10100','C10200 (ETP)','C12000','C12200 (DHP)','C14500','C17200 (BeCu)'],
  'BRASS':  ['C26000 (260)','C27000 (270)','C28000 (280)','C33000','C36000 (360)','C37700'],
  'BRONZE': ['C51000 (Phosphor)','C52100','C54400','C86300','C95400 (Al Bronze)','C93200'],
  'TITANIUM': ['Grade 1','Grade 2','Grade 4','Grade 5 (Ti-6Al-4V)','Grade 7','Grade 9','Grade 23'],
  'TI':       ['Grade 1','Grade 2','Grade 4','Grade 5 (Ti-6Al-4V)','Grade 7','Grade 9','Grade 23'],
  'CAST IRON': ['Gray CI','White CI','Malleable CI','Ductile (SG) CI','FC150','FC200','FC250','FC300'],
  'CI':        ['Gray CI','FC150','FC200','FC250','FC300','SG Iron'],
};

function getGrades(matType: string): string[] {
  const t = matType.toUpperCase().trim();

  // 1. Exact match first
  if (GRADE_MAP[t]) return GRADE_MAP[t];

  // 2. Keyword fallback — handles typos and variants in DB
  if (t.includes('ALUMIN') || t.includes('AL ') || t === 'AL')
    return GRADE_MAP['ALUMINIUM'];
  if (t.includes('STAIN') || t.includes('STEEL') || t.includes('STANL') || t.includes('STELL') || t === 'SS')
    return GRADE_MAP['SS'];
  if (t.includes('MILD') || t === 'MS' || t.includes('M.S'))
    return GRADE_MAP['MS'];
  if (t.includes('CARBON') || t === 'CS')
    return GRADE_MAP['CS'];
  if (t.includes('COPPER') || t === 'CU')
    return GRADE_MAP['COPPER'];
  if (t.includes('BRASS'))
    return GRADE_MAP['BRASS'];
  if (t.includes('BRONZE'))
    return GRADE_MAP['BRONZE'];
  if (t.includes('TITAN') || t === 'TI')
    return GRADE_MAP['TITANIUM'];
  if (t.includes('CAST') || t.includes('IRON') || t === 'CI')
    return GRADE_MAP['CAST IRON'];

  return [];
}


function calcVolumeAndWeight(
  shape: string, dim1: string, dim2: string, dim3: string,
  matType: string, matGrade: string
): { unitWeight: number; density: number; formula: string } | null {
  const L = parseFloat(dim1) || 0;
  const D2 = parseFloat(dim2) || 0;
  const D3 = parseFloat(dim3) || 0;
  if (!L || !matType) return null;

  const density = getDensity(matType, matGrade); // g/cm³
  let vol = 0; // mm³
  let formula = '';

  if (shape === 'Block') {
    if (!D2 || !D3) return null;
    vol = L * D2 * D3;
    formula = `L(${L}) × W(${D2}) × T(${D3}) × ρ(${density}) / 10⁶`;
  } else if (shape === 'Round') {
    if (!D2) return null;
    vol = Math.PI * Math.pow(D2 / 2, 2) * L;
    formula = `π/4 × D²(${D2}²) × L(${L}) × ρ(${density}) / 10⁶`;
  } else if (shape === 'Tube') {
    if (!D2 || !D3) return null;
    const ID = D2 - 2 * D3;
    if (ID <= 0) return null;
    vol = Math.PI * (Math.pow(D2 / 2, 2) - Math.pow(ID / 2, 2)) * L;
    formula = `π/4 × (OD²-ID²) × L × ρ(${density}) / 10⁶`;
  }

  const unitWeight = (vol * density) / 1_000_000; // kg
  return unitWeight > 0 ? { unitWeight, density, formula } : null;
}

export default function RawMaterial() {
  const [qrModal, setQrModal] = useState<string | null>(null);
  const [materialTypes, setMaterialTypes] = useState<{name: string}[]>([]);
  const [showNewMat, setShowNewMat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomGrade, setShowCustomGrade] = useState(false);

  const [shape, setShape] = useState('Block');
  const [dim1, setDim1] = useState('');
  const [dim2, setDim2] = useState('');
  const [dim3, setDim3] = useState('');
  const [matGrade, setMatGrade] = useState('');
  const [matType, setMatType] = useState('');
  const [newMatType, setNewMatType] = useState('');
  const [uom, setUom] = useState('KG');
  const [weight, setWeight] = useState('');
  const [qty, setQty] = useState('1');
  const [shipDate, setShipDate] = useState(new Date().toISOString().split('T')[0]);

  const resolvedMatType = showNewMat ? newMatType.toUpperCase() : matType;

  // ── Real-time calc result ──────────────────────────────
  const calcResult = useMemo(
    () => calcVolumeAndWeight(shape, dim1, dim2, dim3, resolvedMatType, matGrade),
    [shape, dim1, dim2, dim3, resolvedMatType, matGrade]
  );

  const qtyNum = parseFloat(qty) || 1;
  const totalWeight = calcResult ? calcResult.unitWeight * qtyNum : null;

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

  const applyCalcWeight = () => {
    if (!calcResult) {
      toast.error('Enter dimensions + material type to calculate');
      return;
    }
    const w = totalWeight ?? calcResult.unitWeight;
    setWeight(w.toFixed(3));
    toast.success(`Weight set: ${w.toFixed(3)} kg`);
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
      setMatGrade(''); setWeight(''); setQty('1');
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
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                  <QRCodeSVG value={qrModal} size={155} level="H" />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Scan to verify</span>
              </div>
              <div style={{ flex: 1, minWidth: 220, background: '#0f1117', border: '1px solid #1e2635', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {qrModal.split('\n').map((line, i) => {
                  const splitIdx = line.indexOf(':');
                  if (i === 0 || splitIdx === -1) return <div key={i} style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem', marginBottom: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid #1e2635' }}>{line}</div>;
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0.5rem', fontSize: '0.82rem' }}>
                      <span style={{ color: '#475569', fontWeight: 500 }}>{line.substring(0, splitIdx)}</span>
                      <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{line.substring(splitIdx + 1).trim()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #1e2635', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn-ghost" onClick={() => setQrModal(null)}>Close</button>
              <button className="btn-primary" onClick={() => window.print()}><Download size={15} /> Print Label</button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT LABEL — portaled to document.body (outside #root) ── */}
      {qrModal && ReactDOM.createPortal(
        <div className="print-label">
          <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', border: '2px solid #000', borderRadius: '8px', padding: '20px', background: '#fff', maxWidth: '100%' }}>
            {/* QR */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <QRCodeSVG value={qrModal} size={160} level="H" />
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', color: '#555', textTransform: 'uppercase' }}>Scan to verify</div>
            </div>
            {/* Details */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#000', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Raw Material Label
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <tbody>
                  {qrModal.split('\n').slice(1).map((line, i) => {
                    const splitIdx = line.indexOf(':');
                    if (splitIdx === -1) return null;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '4px 8px 4px 0', color: '#555', fontWeight: 600, whiteSpace: 'nowrap', width: '40%' }}>
                          {line.substring(0, splitIdx).trim()}
                        </td>
                        <td style={{ padding: '4px 0', color: '#000', fontWeight: 700 }}>
                          {line.substring(splitIdx + 1).trim()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body
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
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>Material Shape</label>
              <div style={{ position: 'relative' }}>
                <select className="rm-select" value={shape} onChange={e => { setShape(e.target.value); setDim1(''); setDim2(''); setDim3(''); }}>
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

            <div style={{ borderTop: '1px solid #1a2035' }} />

            {/* Material Type & Grade */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>Material Type</label>
                <div style={{ position: 'relative' }}>
                  <select className="rm-select" required value={showNewMat ? '__new__' : matType}
                    onChange={(e) => {
                      if (e.target.value === '__new__') { setShowNewMat(true); }
                      else { setShowNewMat(false); setMatType(e.target.value); setMatGrade(''); setShowCustomGrade(false); }
                    }}>
                    <option value="" disabled>Select type</option>
                    {materialTypes.map(k => <option key={k.name} value={k.name}>{k.name}</option>)}
                    <option value="__new__">+ Add New...</option>
                  </select>
                  <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#374151', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Smart Grade Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                  Material Grade
                  {getGrades(resolvedMatType).length > 0 && (
                    <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', color: '#6366f1', fontWeight: 600, letterSpacing: 0, textTransform: 'none' }}>
                      ({getGrades(resolvedMatType).length} grades available)
                    </span>
                  )}
                </label>
                {getGrades(resolvedMatType).length > 0 && !showCustomGrade ? (
                  <div style={{ position: 'relative' }}>
                    <select
                      className="rm-select"
                      required
                      value={matGrade}
                      onChange={e => {
                        if (e.target.value === '__custom__') { setShowCustomGrade(true); setMatGrade(''); }
                        else setMatGrade(e.target.value);
                      }}
                    >
                      <option value="" disabled>Select grade</option>
                      {getGrades(resolvedMatType).map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                      <option value="__custom__">Other / Custom...</option>
                    </select>
                    <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#374151', pointerEvents: 'none' }} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      placeholder="e.g. 6061, 304"
                      className="rm-input"
                      required
                      value={matGrade}
                      onChange={e => setMatGrade(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    {showCustomGrade && getGrades(resolvedMatType).length > 0 && (
                      <button type="button" onClick={() => { setShowCustomGrade(false); setMatGrade(''); }}
                        style={{ background: '#1a2035', border: '1px solid #1e2635', borderRadius: '8px', color: '#475569', cursor: 'pointer', padding: '0 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        ← List
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {showNewMat && (
              <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>New Material Acronym</label>
                <input type="text" placeholder="e.g. AL, SS, MS" className="rm-input" required value={newMatType} onChange={e => setNewMatType(e.target.value.toUpperCase())} style={{ borderColor: 'rgba(99,102,241,0.3)' }} />
              </div>
            )}

            <div style={{ borderTop: '1px solid #1a2035' }} />

            {/* ── WEIGHT CALCULATOR ── */}
            <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Calculator size={14} color="#34d399" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Weight Calculator</span>
                  {calcResult && (
                    <span style={{ fontSize: '0.67rem', color: '#475569', background: '#1a2035', padding: '0.1rem 0.45rem', borderRadius: '999px' }}>
                      ρ = {calcResult.density} g/cm³
                    </span>
                  )}
                </div>
                <button type="button" onClick={applyCalcWeight}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', padding: '0.25rem 0.7rem', borderRadius: '7px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                  <Weight size={11} /> Use This Weight
                </button>
              </div>

              {/* Qty + result */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.67rem', color: '#475569', marginBottom: '0.3rem', fontWeight: 600 }}>Quantity (Pcs)</label>
                  <input type="number" min="1" placeholder="1" className="rm-input" value={qty} onChange={e => setQty(e.target.value)} style={{ borderColor: 'rgba(16,185,129,0.2)' }} />
                </div>
                <div style={{ background: '#0f1117', border: '1px solid #1e2635', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                  <div style={{ fontSize: '0.65rem', color: '#374151', fontWeight: 600, marginBottom: '0.2rem' }}>Unit Weight</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: calcResult ? '#34d399' : '#374151' }}>
                    {calcResult ? calcResult.unitWeight.toFixed(4) : '—'}
                    <span style={{ fontSize: '0.68rem', color: '#475569', marginLeft: '0.25rem' }}>kg</span>
                  </div>
                </div>
                <div style={{ background: '#0f1117', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                  <div style={{ fontSize: '0.65rem', color: '#374151', fontWeight: 600, marginBottom: '0.2rem' }}>Total Weight</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: totalWeight ? '#34d399' : '#374151' }}>
                    {totalWeight ? totalWeight.toFixed(3) : '—'}
                    <span style={{ fontSize: '0.68rem', color: '#475569', marginLeft: '0.25rem' }}>kg</span>
                  </div>
                </div>
              </div>

              {/* Formula hint */}
              {calcResult && (
                <div style={{ marginTop: '0.6rem', fontSize: '0.68rem', color: '#374151', fontFamily: 'monospace' }}>
                  {calcResult.formula}
                </div>
              )}
              {!calcResult && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#374151' }}>
                  Fill dimensions + material type to auto-calculate
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #1a2035' }} />

            {/* Manual Weight & Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.65rem', alignItems: 'start' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Weight size={12} /> Final Weight (kg)</span>
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

            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ marginTop: '0.5rem', width: '100%', padding: '0.8rem' }}>
              {isSubmitting ? <RefreshCw size={17} /> : <Save size={17} />}
              {isSubmitting ? 'Saving Entry...' : 'Save RM Entry & Generate Label'}
            </button>
          </form>
        </div>

        {/* ── LIVE PREVIEW PANEL ── */}
        <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div className="rm-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ textAlign: 'center', width: '100%', borderBottom: '1px solid #1e2635', paddingBottom: '1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6366f1', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Live Preview</div>
            </div>
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
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Shape', value: shapeLabel, color: '#818cf8' },
                { label: 'Material', value: resolvedMatType || '--', color: '#f8fafc' },
                { label: 'Grade', value: matGrade || '--', color: '#f8fafc' },
                { label: 'Dims', value: dim1 ? formattedDimensions : '--', color: '#94a3b8', small: true },
                { label: 'Density', value: resolvedMatType ? `${getDensity(resolvedMatType, matGrade)} g/cm³` : '--', color: '#fbbf24' },
                { label: 'Unit Wt', value: calcResult ? `${calcResult.unitWeight.toFixed(4)} kg` : '--', color: '#34d399' },
                { label: 'Total Wt', value: totalWeight ? `${totalWeight.toFixed(3)} kg` : '--', color: '#34d399' },
              ].map(({ label, value, color, small }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: small ? '0.75rem' : '0.8rem' }}>
                  <span style={{ color: '#374151', fontWeight: 500 }}>{label}</span>
                  <span style={{ color, fontWeight: 700, maxWidth: '55%', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', padding: '1rem 1.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Tag size={13} color="#818cf8" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>About Labels</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
              Each entry generates a unique <strong style={{ color: '#818cf8' }}>RM-XXXXX</strong> code.
              The QR encodes all material metadata for instant scanning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
