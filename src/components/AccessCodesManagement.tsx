import { useState, useEffect } from 'react';
import { api, APIError } from '../lib/api';

interface AccessCode {
  id: string;
  role_to_assign: string;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  is_disabled: boolean;
  created_at: string;
  note: string | null;
}

export default function AccessCodesManagement({ t }: { t: any }) {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCode, setNewCode] = useState({
    role_to_assign: 'viewer' as any,
    max_uses: 1,
    expires_at: '',
    note: '',
  });
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    try {
      setLoading(true);
      const data = await api.getAccessCodes();
      setCodes(data.codes);
    } catch (err) {
      console.error('Failed to load codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCode = async () => {
    try {
      const data = await api.createAccessCode({
        ...newCode,
        max_uses: newCode.max_uses || null,
        expires_at: newCode.expires_at || null,
      });
      
      setGeneratedCode(data.code); // Показываем код ОДИН РАЗ!
      await loadCodes();
      setShowCreateForm(false);
      setNewCode({ role_to_assign: 'viewer', max_uses: 1, expires_at: '', note: '' });
    } catch (err) {
      if (err instanceof APIError) {
        alert(err.message);
      }
    }
  };

  const deleteCode = async (id: string) => {
    if (!confirm('Deactivate this access code?')) return;
    
    try {
      await api.deleteAccessCode(id);
      await loadCodes();
    } catch (err) {
      if (err instanceof APIError) {
        alert(err.message);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Access Codes</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#7000FF',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {showCreateForm ? 'Cancel' : '+ Create Code'}
        </button>
      </div>

      {showCreateForm && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <h3>Create New Access Code</h3>
          <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label>Role:</label>
              <select
                value={newCode.role_to_assign}
                onChange={(e) => setNewCode({ ...newCode, role_to_assign: e.target.value as any })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div>
              <label>Max Uses (0 = unlimited):</label>
              <input
                type="number"
                value={newCode.max_uses}
                onChange={(e) => setNewCode({ ...newCode, max_uses: parseInt(e.target.value) || 0 })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label>Expires At (optional):</label>
              <input
                type="datetime-local"
                value={newCode.expires_at}
                onChange={(e) => setNewCode({ ...newCode, expires_at: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div>
              <label>Note:</label>
              <input
                type="text"
                value={newCode.note}
                onChange={(e) => setNewCode({ ...newCode, note: e.target.value })}
                placeholder="Optional note..."
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
          </div>
          <button
            onClick={createCode}
            style={{
              marginTop: '15px',
              padding: '10px 30px',
              backgroundColor: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Generate Code
          </button>
        </div>
      )}

      {generatedCode && (
        <div style={{
          padding: '20px',
          backgroundColor: '#4CAF50',
          color: '#fff',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <h3>⚠️ Save This Code - It Will Only Show Once!</h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '24px',
            fontFamily: 'monospace',
            marginTop: '10px',
          }}>
            <strong>{generatedCode}</strong>
            <button
              onClick={() => copyToClipboard(generatedCode)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#fff',
                color: '#4CAF50',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Copy
            </button>
          </div>
          <button
            onClick={() => setGeneratedCode(null)}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: 'rgba(255,255,255,0.3)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            I've saved it, close this
          </button>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px' }}>
        <thead>
          <tr style={{ backgroundColor: '#7000FF', color: '#fff' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Uses</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Expires</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Note</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((code) => (
            <tr key={code.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#7000FF',
                  color: '#fff',
                  fontSize: '12px',
                }}>
                  {code.role_to_assign.toUpperCase()}
                </span>
              </td>
              <td style={{ padding: '12px' }}>
                {code.uses_count} / {code.max_uses || '∞'}
              </td>
              <td style={{ padding: '12px' }}>
                {code.expires_at
                  ? new Date(code.expires_at).toLocaleDateString()
                  : 'Never'}
              </td>
              <td style={{ padding: '12px' }}>
                {code.is_disabled ? (
                  <span style={{ color: 'red' }}>Disabled</span>
                ) : (
                  <span style={{ color: 'green' }}>Active</span>
                )}
              </td>
              <td style={{ padding: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {code.note || '-'}
              </td>
              <td style={{ padding: '12px' }}>
                <button
                  onClick={() => deleteCode(code.id)}
                  disabled={code.is_disabled}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: code.is_disabled ? '#ccc' : '#f44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: code.is_disabled ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Deactivate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
