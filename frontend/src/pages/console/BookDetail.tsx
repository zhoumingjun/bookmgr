import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBook, downloadBookUrl, type BookDTO } from '../../api/books';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<BookDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getBook(id)
      .then(res => setBook(res.book))
      .catch(() => setError('Failed to load book'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;
  if (!book) return <div style={{ padding: 24 }}>Book not found</div>;

  function handleDownload() {
    const token = localStorage.getItem('token');
    const url = downloadBookUrl(book!.id);
    const a = document.createElement('a');
    a.href = `${url}?access_token=${token}`;
    a.download = `${book!.title}.pdf`;
    a.click();
  }

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <Link to="/console/books" style={{ display: 'inline-block', marginBottom: 16 }}>Back to catalog</Link>
      <h2>{book.title}</h2>
      <p style={{ color: '#666' }}>by {book.author}</p>
      {book.description && <p>{book.description}</p>}
      <p style={{ fontSize: 14, color: '#999' }}>Added {new Date(book.create_time).toLocaleDateString()}</p>
      <button onClick={handleDownload}>Download PDF</button>
    </div>
  );
}
