import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listBooks, deleteBook, type BookDTO } from '../../api/books';

export default function BooksPage() {
  const [books, setBooks] = useState<BookDTO[]>([]);
  const [nextToken, setNextToken] = useState('');
  const [prevTokens, setPrevTokens] = useState<string[]>([]);
  const [currentToken, setCurrentToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function loadBooks(token: string) {
    setLoading(true);
    setError('');
    try {
      const res = await listBooks(20, token);
      setBooks(res.books || []);
      setNextToken(res.next_page_token || '');
    } catch {
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBooks(currentToken); }, [currentToken]);

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

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete book "${title}"?`)) return;
    try {
      await deleteBook(id);
      loadBooks(currentToken);
    } catch {
      setError('Failed to delete book');
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Book Management</h2>
      <button onClick={() => navigate('/admin/books/new')} style={{ marginBottom: 16 }}>Add Book</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? <p>Loading...</p> : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Author</th>
                <th style={thStyle}>Created</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map(b => (
                <tr key={b.id}>
                  <td style={tdStyle}>{b.title}</td>
                  <td style={tdStyle}>{b.author}</td>
                  <td style={tdStyle}>{new Date(b.create_time).toLocaleDateString()}</td>
                  <td style={tdStyle}>
                    <button onClick={() => navigate(`/admin/books/${b.id}`)} style={{ marginRight: 8 }}>Edit</button>
                    <button onClick={() => handleDelete(b.id, b.title)}>Delete</button>
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
