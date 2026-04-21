import { useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import {
  Save, RefreshCw, Calculator, QrCode, Download, X,
  Layers, Ruler, Weight, Tag, ChevronDown, Hash
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────
interface MaterialType {
  id: number;
  name: string;
  category_id: number | null;
  category_name: string | null;
}

interface DimField {
  key: string;
  label: string;
  unit: string;
  type: 'number' | 'text';
}

interface RmShape {
  id: number;
  category_id: number;
  shape_name: string;
  dim_format: string;
  dim_fields: DimField[];
  calc_type: string;
}

interface Grade {
  id: number;
  grade: string;
}

// ── Density table (g/cm³) — stays on client for calc ─────────
const DENSITY_MAP: Record<string, number> = {
  'AL': 2.70, 'ALUMINIUM': 2.70, 'ALUMINUM': 2.70,
  'AL6061': 2.70, '6061': 2.70, 'AL6063': 2.69, '6063': 2.69,
  'AL7075': 2.81, '7075': 2.81, 'AL2024': 2.78, '2024': 2.78,
  'SS': 7.93, 'SS304': 7.93, '304': 7.93,
  'SS316': 7.98, '316': 7.98, 'SS316L': 7.98, '316L': 7.98,
  'SS202': 7.92, '202': 7.92, 'SS430': 7.74, '430': 7.74,
  'SS410': 7.74, '410': 7.74, 'SS201': 7.93, '201': 7.93,
  'STAINLESS STEEL': 7.93, 'STAINLESSSTEEL': 7.93, 'STANLESS STEEL': 7.93,
  'MS': 7.85, 'MILD STEEL': 7.85, 'MILDSTEEL': 7.85,
  'CS': 7.85, 'CARBON STEEL': 7.85, 'EN8': 7.85, 'EN24': 7.83,
  'CU': 8.96, 'COPPER': 8.96,
  'BRASS': 8.50, 'BRASS360': 8.49, 'BRASS260': 8.53,
  'BRONZE': 8.80, 'PHOSPHOR BRONZE': 8.80,
  'TI': 4.51, 'TITANIUM': 4.51,
  'CI': 7.20, 'CAST IRON': 7.20, 'CASTIRON': 7.20,
  'ZINC': 7.13, 'ZN': 7.13,
  'NICKEL': 8.90, 'NI': 8.90,
  'LEAD': 11.34, 'PB': 11.34,
  'GLASS': 2.50, 'PVC': 1.40, 'HDPE': 0.95,
  'PP': 0.90, 'ABS': 1.05, 'NYLON': 1.15, 'PC': 1.20,
  'RUBBER': 1.20, 'SILICONE': 1.25, 'EPDM': 0.87,
  'WOOD': 0.75, 'TEAK': 0.65, 'PINE': 0.55, 'PLYWOOD': 0.65,
};

function getDensity(matType: string, matGrade: string): number {
  const t = matType.toUpperCase().replace(/\s+/g, ' ').trim();
  const g = matGrade.toUpperCase().replace(/[-\s]/g, '').trim();
  return DENSITY_MAP[`${t}${g}`] ?? DENSITY_MAP[g] ?? DENSITY_MAP[t] ?? 7.85;
}

// ── Universal weight calculator ───────────────────────────────
function calcWeight(
  calcType: string,
  dims: Record<string, string>,
  matType: string,
  matGrade: string
): { unitWeight: number; density: number; formula: string } | null {
  const d = (key: string) => parseFloat(dims[key] || '0') || 0;
  const density = getDensity(matType, matGrade);
  let vol = 0; // mm³
  let formula = '';

  switch (calcType) {
    case 'rod': {
      const od = d('od'), l = d('l');
      if (!od || !l) return null;
      vol = Math.PI * Math.pow(od / 2, 2) * l;
      formula = `π/4 × D²(${od}²) × L(${l}) × ρ(${density})`;
      break;
    }
    case 'pipe': {
      const od = d('od'), id = d('id'), l = d('l');
      if (!od || !id || !l || id >= od) return null;
      vol = Math.PI * (Math.pow(od / 2, 2) - Math.pow(id / 2, 2)) * l;
      formula = `π/4 × (OD²-ID²)(${od}²-${id}²) × L(${l}) × ρ(${density})`;
      break;
    }
    case 'sheet':
    case 'flat_bar': {
      const l = d('l'), w = d('w'), t = d('t');
      if (!l || !w || !t) return null;
      vol = l * w * t;
      formula = `L(${l}) × W(${w}) × T(${t}) × ρ(${density})`;
      break;
    }
    case 'square_bar': {
      const a = d('a'), l = d('l');
      if (!a || !l) return null;
      vol = a * a * l;
      formula = `A²(${a}²) × L(${l}) × ρ(${density})`;
      break;
    }
    case 'rect_bar': {
      const w = d('w'), h = d('h') || d('t'), l = d('l');
      if (!w || !h || !l) return null;
      vol = w * h * l;
      formula = `W(${w}) × H(${h}) × L(${l}) × ρ(${density})`;
      break;
    }
    case 'angle': {
      const a = d('a'), b = d('b'), t = d('t'), l = d('l');
      if (!a || !b || !t || !l) return null;
      vol = (a + b - t) * t * l;
      formula = `(A+B−T)(${a}+${b}−${t}) × T(${t}) × L(${l}) × ρ(${density})`;
      break;
    }
    case 'channel': {
      const w = d('w'), h = d('h'), t = d('t'), l = d('l');
      if (!w || !h || !t || !l) return null;
      vol = (w + 2 * h) * t * l;
      formula = `(W+2H)(${w}+2×${h}) × T(${t}) × L(${l}) × ρ(${density})`;
      break;
    }
    case 'beam': {
      const h = d('h'), w = d('w'), t = d('t'), l = d('l');
      if (!h || !w || !t || !l) return null;
      vol = (h * t + 2 * w * t) * l;
      formula = `(H×T + 2×W×T)(${h}×${t}+2×${w}×${t}) × L(${l}) × ρ(${density})`;
      break;
    }
    case 'ring': {
      const od = d('od'), id = d('id'), t = d('t');
      if (!od || !id || !t || id >= od) return null;
      vol = Math.PI * (Math.pow(od / 2, 2) - Math.pow(id / 2, 2)) * t;
      formula = `π/4 × (OD²−ID²)(${od}²-${id}²) × T(${t}) × ρ(${density})`;
      break;
    }
    case 'textile_roll': {
      // W(m) × GSM(g/m²) × L(m) → weight in kg
      const w = d('w'), gsm = d('gsm'), l = d('l');
      if (!w || !gsm || !l) return null;
      const unitWeight = (w * gsm * l) / 1000;
      return { unitWeight, density, formula: `W(${w}m) × GSM(${gsm}) × L(${l}m) / 1000` };
    }
    case 'weight_only': {
      const wt = d('wt');
      if (!wt) return null;
      return { unitWeight: wt, density, formula: 'Direct weight entry' };
    }
    default:
      return null;
  }

  const unitWeight = (vol * density) / 1_000_000;
  return unitWeight > 0 ? { unitWeight, density, formula } : null;
}

// ── Build formatted dimension string ──────────────────────────
function buildDimString(dimFields: DimField[], dims: Record<string, string>, dimFormat: string): string {
  if (!dimFields.length) return '';
  return dimFields
    .filter(f => dims[f.key])
    .map(f => `${f.label}: ${dims[f.key]}${f.unit ? ' ' + f.unit : ''}`)
    .join(' × ');
}

// ─────────────────────────────────────────────────────────────
export default function RawMaterial() {
  // Modal state
  const [qrModal, setQrModal] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category state
  const [categories, setCategories] = useState<{id: number; name: string}[]>([]);

  // Material type state
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [matType, setMatType] = useState<MaterialType | null>(null);
  const [showNewMat, setShowNewMat] = useState(false);
  const [newMatType, setNewMatType] = useState('');
  const [newMatCategory, setNewMatCategory] = useState<{id: number; name: string} | null>(null);

  // Shape state
  const [shapes, setShapes] = useState<RmShape[]>([]);
  const [selectedShape, setSelectedShape] = useState<RmShape | null>(null);
  const [shapesLoading, setShapesLoading] = useState(false);

  // Grade state
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [showCustomGrade, setShowCustomGrade] = useState(false);
  const [customGradeText, setCustomGradeText] = useState('');
  const [gradesLoading, setGradesLoading] = useState(false);

  // Dimension state
  const [dims, setDims] = useState<Record<string, string>>({});

  // Weight / misc
  const [uom, setUom] = useState('KG');
  const [weight, setWeight] = useState('');
  const [qty, setQty] = useState('1');
  const [shipDate, setShipDate] = useState(new Date().toISOString().split('T')[0]);

  // Derived values
  const resolvedMatTypeName = showNewMat ? newMatType.toUpperCase() : (matType?.name || '');
  const resolvedGrade = showCustomGrade ? customGradeText : (selectedGrade?.grade || '');
  const dimFields: DimField[] = selectedShape?.dim_fields || [];

  const calcResult = useMemo(
    () => selectedShape ? calcWeight(selectedShape.calc_type, dims, resolvedMatTypeName, resolvedGrade) : null,
    [selectedShape, dims, resolvedMatTypeName, resolvedGrade]
  );

  const qtyNum = parseFloat(qty) || 1;
  const totalWeight = calcResult ? calcResult.unitWeight * qtyNum : null;

  const formattedDimensions = selectedShape
    ? buildDimString(dimFields, dims, selectedShape.dim_format)
    : '';

  const qrData = JSON.stringify({
    rm_code: '(preview)',
    shape: selectedShape?.shape_name || '',
    dimensions: formattedDimensions,
    grade: resolvedGrade,
    material: resolvedMatTypeName,
    weight: weight ? `${weight} ${uom}` : '',
    date: shipDate
  });

  // ── Load material types + categories on mount ───────────────
  useEffect(() => { loadTypes(); loadCategories(); }, []);

  const loadTypes = async () => {
    try {
      const r = await axios.get('/api/material-types');
      setMaterialTypes(r.data || []);
    } catch { console.error('Failed to load material types'); }
  };

  const loadCategories = async () => {
    try {
      const r = await axios.get('/api/rm-categories');
      setCategories(r.data || []);
    } catch { console.error('Failed to load categories'); }
  };

  // ── When NEW material category is picked ────────────────────
  const handleNewMatCategoryChange = async (catId: string) => {
    const found = categories.find(c => String(c.id) === catId) || null;
    setNewMatCategory(found);
    setSelectedShape(null); setDims({});
    if (!found) { setShapes([]); return; }
    setShapesLoading(true);
    try {
      const r = await axios.get(`/api/rm-shapes?category_id=${found.id}`);
      setShapes(r.data || []);
    } catch { toast.error('Failed to load shapes'); }
    finally { setShapesLoading(false); }
  };

  // ── When material type changes: load shapes + grades ─────────
  const handleMatTypeChange = async (typeId: string) => {
    if (typeId === '__new__') {
      setShowNewMat(true);
      setMatType(null);
      setNewMatCategory(null);
      setShapes([]); setGrades([]);
      setSelectedShape(null); setSelectedGrade(null); setDims({});
      return;
    }
    setShowNewMat(false);
    const found = materialTypes.find(t => String(t.id) === typeId) || null;
    setMatType(found);
    setSelectedShape(null); setSelectedGrade(null);
    setDims({}); setCustomGradeText(''); setShowCustomGrade(false);

    if (!found) return;

    // Fetch shapes for this category
    if (found.category_id) {
      setShapesLoading(true);
      try {
        const r = await axios.get(`/api/rm-shapes?category_id=${found.category_id}`);
        setShapes(r.data || []);
      } catch { toast.error('Failed to load shapes'); }
      finally { setShapesLoading(false); }
    } else {
      setShapes([]);
    }

    // Fetch grades for this material type
    setGradesLoading(true);
    try {
      const r = await axios.get(`/api/material-grades?material_type_id=${found.id}`);
      setGrades(r.data || []);
    } catch { toast.error('Failed to load grades'); }
    finally { setGradesLoading(false); }
  };

  // ── When shape changes ────────────────────────────────────────
  const handleShapeChange = (shapeId: string) => {
    const found = shapes.find(s => String(s.id) === shapeId) || null;
    setSelectedShape(found);
    setDims({});
  };

  // ── Apply calculator weight ───────────────────────────────────
  const applyCalcWeight = () => {
    if (!calcResult) { toast.error('Fill in dimensions + material type to calculate'); return; }
    const w = totalWeight ?? calcResult.unitWeight;
    setWeight(w.toFixed(3));
    toast.success(`Weight set: ${w.toFixed(3)} kg`);
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || parseFloat(weight) <= 0) { toast.error('Please enter a valid weight'); return; }
    if (!resolvedMatTypeName) { toast.error('Please select a material type'); return; }

    setIsSubmitting(true);
    const pendingToast = toast.loading('Saving entry...');
    try {
      const payload = {
        raw_material_dimensions: formattedDimensions,
        material_shape: selectedShape?.shape_name || '',
        material_grade: resolvedGrade,
        material_type: resolvedMatTypeName,
        uom,
        kgs: weight,
        shipment_date: shipDate,
        // FK IDs
        category_id: showNewMat ? (newMatCategory?.id || null) : (matType?.category_id || null),
        material_type_id: matType?.id || null,
        material_shape_id: selectedShape?.id || null,
        material_grade_id: selectedGrade?.id || null,
        // For new material type creation
        new_material_category_id: showNewMat ? (newMatCategory?.id || null) : null,
      };
      const response = await axios.post('/api/add', payload);
      const rmCode = response.data.rm_code;
      toast.success('Entry saved successfully!', { id: pendingToast });

      // Reset form
      setDims({}); setWeight(''); setQty('1');
      setSelectedGrade(null); setCustomGradeText('');
      if (showNewMat) { 
        setShowNewMat(false); setNewMatType(''); 
        setNewMatCategory(null); setShapes([]); setGrades([]);
        loadTypes(); 
      }

      const qrContent = [
        'Raw Material Label',
        `RM ID: ${rmCode}`,
        `Shape: ${selectedShape?.shape_name || ''}`,
        `Dimensions: ${formattedDimensions}`,
        `Material: ${resolvedMatTypeName}`,
        `Grade: ${resolvedGrade}`,
        `UOM: ${uom}`,
        `Weight: ${weight} ${uom}`,
        `Date: ${shipDate}`,
      ].join('\n');
      setQrModal(qrContent);
    } catch (err: any) {
      toast.error(`Error: ${err.response?.data?.error || 'Failed to save'}`, { id: pendingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Dimension grid columns ────────────────────────────────────
  const dimCols = Math.min(dimFields.length, 4);

  // ─────────────────────────────────────────────────────────────
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

      {/* Print Portal */}
      {qrModal && ReactDOM.createPortal(
        <div className="print-label">
          <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', border: '2px solid #000', borderRadius: '8px', padding: '20px', background: '#fff', maxWidth: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <QRCodeSVG value={qrModal} size={160} level="H" />
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', color: '#555', textTransform: 'uppercase' }}>Scan to verify</div>
            </div>
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

            {/* ── Row 1: Material Type + Category badge ── */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                Material Type
                {matType?.category_name && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: '#6366f1', fontWeight: 700, textTransform: 'none', background: 'rgba(99,102,241,0.12)', padding: '0.1rem 0.45rem', borderRadius: '999px' }}>
                    {matType.category_name}
                  </span>
                )}
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  className="rm-select"
                  required
                  value={showNewMat ? '__new__' : (matType ? String(matType.id) : '')}
                  onChange={e => handleMatTypeChange(e.target.value)}
                >
                  <option value="" disabled>Select material type</option>
                  {materialTypes.map(t => (
                    <option key={t.id} value={String(t.id)}>{t.name}{t.category_name ? ` (${t.category_name})` : ''}</option>
                  ))}
                  <option value="__new__">+ Add New...</option>
                </select>
                <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#374151', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* New material type input */}
            {showNewMat && (
              <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>New Material Type</div>

                {/* Category picker */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 600, color: '#6366f1', marginBottom: '0.3rem' }}>Category *</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      className="rm-select"
                      required
                      value={newMatCategory ? String(newMatCategory.id) : ''}
                      onChange={e => handleNewMatCategoryChange(e.target.value)}
                      style={{ borderColor: 'rgba(99,102,241,0.3)' }}
                    >
                      <option value="" disabled>Select category</option>
                      {categories.map(c => (
                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#374151', pointerEvents: 'none' }} />
                  </div>
                </div>

                {/* Material name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 600, color: '#6366f1', marginBottom: '0.3rem' }}>Material Name / Acronym *</label>
                  <input
                    type="text"
                    placeholder="e.g. AL, SS, MS, PVC"
                    className="rm-input"
                    required
                    value={newMatType}
                    onChange={e => setNewMatType(e.target.value.toUpperCase())}
                    style={{ borderColor: 'rgba(99,102,241,0.3)' }}
                  />
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid #1a2035' }} />

            {/* ── Row 2: Shape selector ── */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                Material Shape
                {selectedShape?.dim_format && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, textTransform: 'none', fontFamily: 'monospace' }}>
                    {selectedShape.dim_format}
                  </span>
                )}
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  className="rm-select"
                  required
                  value={selectedShape ? String(selectedShape.id) : ''}
                  onChange={e => handleShapeChange(e.target.value)}
                  disabled={!matType && !showNewMat}
                >
                  <option value="" disabled>
                    {shapesLoading ? 'Loading shapes...' : (!matType && !showNewMat ? 'Select material type first' : 'Select shape')}
                  </option>
                  {shapes.map(s => (
                    <option key={s.id} value={String(s.id)}>{s.shape_name}</option>
                  ))}
                </select>
                <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#374151', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* ── Row 3: Dynamic Dimension Fields ── */}
            {dimFields.length > 0 && (
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                  <Ruler size={12} /> Dimensions
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${dimCols}, 1fr)`, gap: '0.65rem' }}>
                  {dimFields.map(f => (
                    <div key={f.key}>
                      <input
                        type={f.type || 'number'}
                        placeholder={f.label}
                        className="rm-input"
                        required={f.key !== 'profile'}
                        value={dims[f.key] || ''}
                        onChange={e => setDims(prev => ({ ...prev, [f.key]: e.target.value }))}
                      />
                      <div style={{ fontSize: '0.65rem', color: '#374151', marginTop: '0.25rem', textAlign: 'center' }}>
                        {f.label}{f.unit ? ` (${f.unit})` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Placeholder when no shape selected */}
            {(!selectedShape && (matType || showNewMat)) && (
              <div style={{ background: '#0f1117', border: '1px dashed #1e2635', borderRadius: '10px', padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#374151' }}>
                Select a shape to see dimension fields
              </div>
            )}

            <div style={{ borderTop: '1px solid #1a2035' }} />

            {/* ── Row 4: Grade ── */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                Material Grade
                {gradesLoading && <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', color: '#6366f1' }}>Loading...</span>}
                {!gradesLoading && grades.length > 0 && (
                  <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', color: '#6366f1', fontWeight: 600, textTransform: 'none' }}>
                    ({grades.length} grades available)
                  </span>
                )}
              </label>

              {grades.length > 0 && !showCustomGrade ? (
                <div style={{ position: 'relative' }}>
                  <select
                    className="rm-select"
                    required
                    value={selectedGrade ? String(selectedGrade.id) : ''}
                    onChange={e => {
                      if (e.target.value === '__custom__') { setShowCustomGrade(true); setSelectedGrade(null); }
                      else {
                        const g = grades.find(x => String(x.id) === e.target.value) || null;
                        setSelectedGrade(g);
                      }
                    }}
                  >
                    <option value="" disabled>Select grade</option>
                    {grades.map(g => <option key={g.id} value={String(g.id)}>{g.grade}</option>)}
                    <option value="__custom__">Other / Custom...</option>
                  </select>
                  <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#374151', pointerEvents: 'none' }} />
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    placeholder="e.g. 6061, 304, Grade 5"
                    className="rm-input"
                    value={customGradeText}
                    onChange={e => setCustomGradeText(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {showCustomGrade && grades.length > 0 && (
                    <button type="button" onClick={() => { setShowCustomGrade(false); setCustomGradeText(''); }}
                      style={{ background: '#1a2035', border: '1px solid #1e2635', borderRadius: '8px', color: '#475569', cursor: 'pointer', padding: '0 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      ← List
                    </button>
                  )}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #1a2035' }} />

            {/* ── Weight Calculator ── */}
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

              {calcResult && (
                <div style={{ marginTop: '0.6rem', fontSize: '0.68rem', color: '#374151', fontFamily: 'monospace' }}>
                  {calcResult.formula}
                </div>
              )}
              {!calcResult && selectedShape && selectedShape.calc_type !== 'weight_only' && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#374151' }}>
                  Fill all dimension fields to auto-calculate
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #1a2035' }} />

            {/* ── Final Weight + Date ── */}
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
              {(resolvedMatTypeName || formattedDimensions || weight) ? (
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
                { label: 'Category', value: matType?.category_name || '--', color: '#818cf8' },
                { label: 'Shape', value: selectedShape?.shape_name || '--', color: '#818cf8' },
                { label: 'Format', value: selectedShape?.dim_format || '--', color: '#94a3b8', small: true },
                { label: 'Material', value: resolvedMatTypeName || '--', color: '#f8fafc' },
                { label: 'Grade', value: resolvedGrade || '--', color: '#f8fafc' },
                { label: 'Dims', value: formattedDimensions || '--', color: '#94a3b8', small: true },
                { label: 'Density', value: resolvedMatTypeName ? `${getDensity(resolvedMatTypeName, resolvedGrade)} g/cm³` : '--', color: '#fbbf24' },
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
