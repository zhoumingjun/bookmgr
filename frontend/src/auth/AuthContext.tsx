import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

type Role = 'super_admin' | 'admin' | 'teacher' | 'parent';

interface AuthContextType {
  token: string | null;
  role: Role | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;       // super_admin or admin
  isSuperAdmin: boolean;   // super_admin only
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token'),
  );
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    if (token) {
      const payload = parseJwt(token);
      const r = payload?.role as string;
      if (r === 'super_admin' || r === 'admin' || r === 'teacher' || r === 'parent') {
        setRole(r as Role);
      } else {
        setRole(null);
      }
    } else {
      setRole(null);
    }
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        login,
        logout,
        isAuthenticated: !!token,
        isAdmin: role === 'super_admin' || role === 'admin',
        isSuperAdmin: role === 'super_admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
