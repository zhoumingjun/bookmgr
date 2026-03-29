import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listBooks, type BookDTO } from '../../api/books';

export default function ConsoleBooksPage() {
  const [books, setBooks] = useState<BookDTO[]>([]);
  const [nextToken, setNextToken] = useState('');
  const [prevTokens, setPrevTokens] = useState<string[]>([]);
  const [currentToken, setCurrentToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div style={{ padding: 24 }}>
      <h2>Book Catalog</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? <p>Loading...</p> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
            {books.map(b => (
              <Link to={`/console/books/${b.id}`} key={b.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
                  <h3 style={{ margin: '0 0 8px' }}>{b.title}</h3>
                  <p style={{ margin: '0 0 4px', color: '#666' }}>{b.author}</p>
                  {b.description && <p style={{ margin: 0, fontSize: 14, color: '#999' }}>{b.description.slice(0, 100)}{b.description.length > 100 ? '...' : ''}</p>}
                </div>
              </Link>
            ))}
          </div>
          {books.length === 0 && <p>No books available.</p>}
          <div style={{ marginTop: 16 }}>
            <button onClick={handlePrev} disabled={prevTokens.length === 0} style={{ marginRight: 8 }}>Previous</button>
            <button onClick={handleNext} disabled={!nextToken}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}
