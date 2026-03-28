import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import AdminDashboard from './pages/admin/Dashboard';
import ConsoleHome from './pages/console/Home';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/console/*" element={<ConsoleHome />} />
          <Route path="/login" element={<div>Login Page (TODO)</div>} />
          <Route path="/" element={<Navigate to="/console" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
