import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, updateUser } from '../../api/users';

export default function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [role, setRole] = useState('ROLE_USER');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getUser(id).then(res => {
      setUsername(res.user.username);
      setEmail(res.user.email);
      setRole(res.user.role);
      setLoading(false);
    }).catch(() => {
      setError('Failed to load user');
      setLoading(false);
    });
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      const fields: Record<string, string> = { role };
      const mask = ['role'];
      if (password) {
        fields.password = password;
        mask.push('password');
      }
      await updateUser(id, fields, mask);
      navigate('/admin/users');
    } catch {
      setError('Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ padding: 24 }}>Loading...</p>;

  return (
    <div style={{ maxWidth: 500, padding: 24 }}>
      <h2>Edit User</h2>
      <p><strong>Username:</strong> {username}</p>
      <p><strong>Email:</strong> {email}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="role" style={{ display: 'block', marginBottom: 4 }}>Role</label>
          <select id="role" value={role} onChange={e => setRole(e.target.value)} style={{ padding: 8 }}>
            <option value="ROLE_USER">User</option>
            <option value="ROLE_ADMIN">Admin</option>
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: 4 }}>New Password (leave blank to keep)</label>
          <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <button type="submit" disabled={saving} style={{ padding: '8px 24px', marginRight: 8 }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={() => navigate('/admin/users')} style={{ padding: '8px 24px' }}>
          Cancel
        </button>
      </form>
    </div>
  );
}
