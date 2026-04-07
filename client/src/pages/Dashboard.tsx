import { useEffect, useState } from 'react';
import axios from 'axios';

interface Profile {
  name: string;
  role: string;
  email: string;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [materialTypes, setMaterialTypes] = useState<{name: string}[]>([]);
  const [showNewMat, setShowNewMat] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    axios.get('/api/me').then(r => setProfile(r.data.user)).catch(console.error);
    loadTypes();
  }, []);

  const loadTypes = () => {
    axios.get('/api/dashboard').then(r => setMaterialTypes(r.data.materialTypes || [])).catch(console.error);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setMessage({ text: 'Inserting...', type: 'info' });
    try {
      await axios.post('/api/add', data);
      setMessage({ text: '✅ Data inserted successfully!', type: 'success' });
      (e.target as HTMLFormElement).reset();
      loadTypes();
      setShowNewMat(false);
    } catch (err: any) {
      setMessage({ text: `❌ ${err.response?.data?.error || 'Failed to insert'}`, type: 'error' });
    }
  };

  return (
    <div className="page-section">
      <div className="user-card">
        <h3>👤 My Profile</h3>
        <table className="user-table">
          <thead>
            <tr><th>Name</th><th>Designation</th><th>Email</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>{profile?.name || 'Loading...'}</td>
              <td>{profile?.role || ''}</td>
              <td>{profile?.email || ''}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="header">
        <h2>📊 Add raw material</h2>
      </div>

      <div className="card">
        {message.text && (
          <p style={{ color: message.type === 'error' ? 'var(--danger)' : 'var(--success)', marginBottom: '10px' }}>
            {message.text}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <input type="text" name="raw_material_dimensions" placeholder="Rm Dimensions (e.g. L 3000 × W 2000 × H 3)" required />
          <input type="text" name="material_grade" placeholder="Material Grade" required />
          
          <select name="material_type" required defaultValue="" onChange={(e) => setShowNewMat(e.target.value === '__new__')}>
            <option value="" disabled>Select Material</option>
            {materialTypes.map(k => <option key={k.name} value={k.name}>{k.name}</option>)}
            <option value="__new__">+ Add new Material…</option>
          </select>

          {showNewMat && (
            <input 
              type="text" 
              name="new_material_type" 
              placeholder="New Material (e.g. AL, SS — saved as UPPERCASE)" 
              style={{ textTransform: 'uppercase' }} 
              required 
            />
          )}
          
          <input type="text" name="uom" placeholder="UOM (e.g. KG, MT, PCS)" required />
          <input type="number" name="kgs" placeholder="Kgs" step="any" min="0" required />
          <input type="date" name="shipment_date" required />
          
          <button className="btn-primary" type="submit">➕ Add entry</button>
        </form>
      </div>
    </div>
  );
}
