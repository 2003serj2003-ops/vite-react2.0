import { useState, useEffect } from 'react';
import { api, APIError } from '../lib/api';

interface User {
  id: string;
  telegram_id: number | null;
  email: string | null;
  full_name: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

interface UsersManagementProps {
  userRole: string;
}

export default function UsersManagement({ userRole }: UsersManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data.users as User[]);
      setError('');
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await api.updateUser(userId, { role: newRole });
      await loadUsers(); // Перезагружаем список
      setEditingUser(null);
    } catch (err) {
      if (err instanceof APIError) {
        alert(err.message);
      }
    }
  };

  const toggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      await api.updateUser(userId, { is_active: !currentActive });
      await loadUsers();
    } catch (err) {
      if (err instanceof APIError) {
        alert(err.message);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Users Management</h2>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: '#fff',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <thead>
            <tr style={{ backgroundColor: '#1E6FDB', color: '#fff' }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Telegram ID</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Last Login</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>{user.full_name}</td>
                <td style={tdStyle}>{user.telegram_id || 'N/A'}</td>
                <td style={tdStyle}>
                  {editingUser === user.id ? (
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      style={selectStyle}
                      disabled={userRole !== 'owner' && user.role === 'owner'}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                      {userRole === 'owner' && <option value="owner">Owner</option>}
                    </select>
                  ) : (
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: getRoleColor(user.role),
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {user.role.toUpperCase()}
                    </span>
                  )}
                </td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: user.is_active ? '#4CAF50' : '#f44336',
                    color: '#fff',
                    fontSize: '12px',
                  }}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={tdStyle}>
                  {user.last_login_at
                    ? new Date(user.last_login_at).toLocaleDateString()
                    : 'Never'}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {editingUser === user.id ? (
                      <button
                        onClick={() => setEditingUser(null)}
                        style={btnStyle}
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingUser(user.id)}
                        style={btnStyle}
                        disabled={userRole !== 'owner' && userRole !== 'admin'}
                      >
                        Edit Role
                      </button>
                    )}
                    <button
                      onClick={() => toggleUserActive(user.id, user.is_active)}
                      style={{...btnStyle, backgroundColor: user.is_active ? '#f44336' : '#4CAF50'}}
                      disabled={userRole !== 'owner' && userRole !== 'admin'}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getRoleColor(role: string) {
  switch (role) {
    case 'owner': return '#9C27B0';
    case 'admin': return '#FF5722';
    case 'editor': return '#2196F3';
    case 'viewer': return '#4CAF50';
    default: return '#757575';
  }
}

const thStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'left',
  fontWeight: 'bold',
};

const tdStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'left',
};

const selectStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  fontSize: '14px',
};

const btnStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: '#1E6FDB',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: 'bold',
};
