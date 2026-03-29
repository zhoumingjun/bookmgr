import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/Dashboard';
import UsersPage from './pages/admin/Users';
import UserEditPage from './pages/admin/UserEdit';
import BooksPage from './pages/admin/Books';
import BookNewPage from './pages/admin/BookNew';
import BookEditPage from './pages/admin/BookEdit';
import ConsoleHome from './pages/console/Home';
import ConsoleBooksPage from './pages/console/Books';
import BookDetailPage from './pages/console/BookDetail';
import LoginPage from './pages/Login';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requireAdmin><UsersPage /></ProtectedRoute>} />
          <Route path="/admin/users/:id" element={<ProtectedRoute requireAdmin><UserEditPage /></ProtectedRoute>} />
          <Route path="/admin/books" element={<ProtectedRoute requireAdmin><BooksPage /></ProtectedRoute>} />
          <Route path="/admin/books/new" element={<ProtectedRoute requireAdmin><BookNewPage /></ProtectedRoute>} />
          <Route path="/admin/books/:id" element={<ProtectedRoute requireAdmin><BookEditPage /></ProtectedRoute>} />
          <Route path="/console" element={<ProtectedRoute><ConsoleHome /></ProtectedRoute>} />
          <Route path="/console/books" element={<ProtectedRoute><ConsoleBooksPage /></ProtectedRoute>} />
          <Route path="/console/books/:id" element={<ProtectedRoute><BookDetailPage /></ProtectedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/console" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
