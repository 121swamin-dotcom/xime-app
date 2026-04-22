import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('xime_token');
    const storedUser = localStorage.getItem('xime_user');
    if (stored && storedUser) {
      setToken(stored);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  function login(tokenVal, userData) {
    localStorage.setItem('xime_token', tokenVal);
    localStorage.setItem('xime_user', JSON.stringify(userData));
    setToken(tokenVal);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('xime_token');
    localStorage.removeItem('xime_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
