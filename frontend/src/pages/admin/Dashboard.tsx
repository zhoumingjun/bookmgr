import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Admin Dashboard</h1>
      <nav>
        <ul>
          <li><Link to="/admin/users">User Management</Link></li>
        </ul>
      </nav>
    </div>
  );
}
