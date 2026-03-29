import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import UsersPage from './pages/admin/Users';
import UserEditPage from './pages/admin/UserEdit';
import BooksPage from './pages/admin/Books';
import BookNewPage from './pages/admin/BookNew';
import BookEditPage from './pages/admin/BookEdit';
import ConsoleBooksPage from './pages/console/Books';
import BookDetailPage from './pages/console/BookDetail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute requireAdmin><AppLayout /></ProtectedRoute>}>
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/users/:id" element={<UserEditPage />} />
            <Route path="/admin/books" element={<BooksPage />} />
            <Route path="/admin/books/new" element={<BookNewPage />} />
            <Route path="/admin/books/:id" element={<BookEditPage />} />
            <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
          </Route>
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/console/books" element={<ConsoleBooksPage />} />
            <Route path="/console/books/:id" element={<BookDetailPage />} />
            <Route path="/console" element={<Navigate to="/console/books" replace />} />
          </Route>
          <Route path="/" element={<Navigate to="/console" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
