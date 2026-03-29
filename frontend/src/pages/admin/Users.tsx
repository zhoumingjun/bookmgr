import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listUsers, deleteUser, type UserDTO } from '../../api/users';

export default function UsersPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [nextToken, setNextToken] = useState('');
  const [prevTokens, setPrevTokens] = useState<string[]>([]);
  const [currentToken, setCurrentToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function loadUsers(token: string) {
    setLoading(true);
    setError('');
    try {
      const res = await listUsers(20, token);
      setUsers(res.users || []);
      setNextToken(res.next_page_token || '');
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(currentToken); }, [currentToken]);

  function handleNext() {
    setPrevTokens(prev => [...prev, currentToken]);
    setCurrentToken(nextToken);
  }

  function handlePrev() {
    const prev = [...prevTokens];
    const token = prev.pop() || '';
    setPrevTokens(prev);
    setCurrentToken(token);
  }

  async function handleDelete(id: string, username: string) {
    if (!confirm(`Delete user "${username}"?`)) return;
    try {
      await deleteUser(id);
      loadUsers(currentToken);
    } catch {
      setError('Failed to delete user');
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>User Management</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? <p>Loading...</p> : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Username</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Created</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={tdStyle}>{u.username}</td>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>{u.role}</td>
                  <td style={tdStyle}>{new Date(u.create_time).toLocaleDateString()}</td>
                  <td style={tdStyle}>
                    <button onClick={() => navigate(`/admin/users/${u.id}`)} style={{ marginRight: 8 }}>Edit</button>
                    <button onClick={() => handleDelete(u.id, u.username)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 16 }}>
            <button onClick={handlePrev} disabled={prevTokens.length === 0} style={{ marginRight: 8 }}>Previous</button>
            <button onClick={handleNext} disabled={!nextToken}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = { textAlign: 'left', padding: 8, borderBottom: '2px solid #ccc' };
const tdStyle: React.CSSProperties = { padding: 8, borderBottom: '1px solid #eee' };
