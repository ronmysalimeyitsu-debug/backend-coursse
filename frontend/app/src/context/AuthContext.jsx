import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/httpClient.js';

const AuthContext = createContext(null);
const TOKEN_KEY = 'request-desk-token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.me(token)
      .then(setUser)
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function login(credentials) {
    const result = await authApi.login(credentials);
    sessionStorage.setItem(TOKEN_KEY, result.accessToken);
    setToken(result.accessToken);
    const currentUser = await authApi.me(result.accessToken);
    setUser(currentUser);
  }

  async function register(credentials) {
    await authApi.register(credentials);
    await login(credentials);
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
    {children}
  </AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
