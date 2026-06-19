import { createContext, useState, useCallback } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((loginResponse) => {
    const userData = {
      token: loginResponse.token,
      nombre: loginResponse.nombre,
      rol: loginResponse.rol,
      expira: loginResponse.expira,
    };
    localStorage.setItem('token', loginResponse.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setAuth(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: auth,
        isAuthenticated: !!auth,
        isAdmin: auth?.rol === 'admin',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
