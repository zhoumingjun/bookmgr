import { Link } from 'react-router-dom';

export default function ConsoleHome() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Book Console</h1>
      <p>Browse and read books here.</p>
      <nav>
        <ul>
          <li><Link to="/console/books">Book Catalog</Link></li>
        </ul>
      </nav>
    </div>
  );
}
