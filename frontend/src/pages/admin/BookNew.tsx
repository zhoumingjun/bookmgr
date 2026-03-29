import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBook, uploadBookFile } from '../../api/books';

export default function BookNewPage() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await createBook(title, author, description);
      if (file) {
        await uploadBookFile(res.book.id, file);
      }
      navigate('/admin/books');
    } catch {
      setError('Failed to create book');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h2>Add Book</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Title<br />
            <input value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Author<br />
            <input value={author} onChange={e => setAuthor(e.target.value)} required style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Description<br />
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>PDF File<br />
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create Book'}</button>
        <button type="button" onClick={() => navigate('/admin/books')} style={{ marginLeft: 8 }}>Cancel</button>
      </form>
    </div>
  );
}
