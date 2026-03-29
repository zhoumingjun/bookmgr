import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBook, updateBook, uploadBookFile, type BookDTO } from '../../api/books';

export default function BookEditPage() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<BookDTO | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    getBook(id).then(res => {
      setBook(res.book);
      setTitle(res.book.title);
      setAuthor(res.book.author);
      setDescription(res.book.description);
    }).catch(() => setError('Failed to load book'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !book) return;
    setSaving(true);
    setError('');
    try {
      const mask: string[] = [];
      if (title !== book.title) mask.push('title');
      if (author !== book.author) mask.push('author');
      if (description !== book.description) mask.push('description');

      if (mask.length > 0) {
        await updateBook(id, { title, author, description }, mask);
      }
      if (file) {
        await uploadBookFile(id, file);
      }
      navigate('/admin/books');
    } catch {
      setError('Failed to update book');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h2>Edit Book</h2>
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
          <label>Replace PDF File<br />
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        <button type="button" onClick={() => navigate('/admin/books')} style={{ marginLeft: 8 }}>Cancel</button>
      </form>
    </div>
  );
}
