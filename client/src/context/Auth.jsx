import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../lib/api.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const logout = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout); // an expired/invalid token signs the user out everywhere
    if (!tokenStore.get()) return;
    api
      .get('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [logout]);

  const accept = (r) => {
    tokenStore.set(r.token);
    setUser(r.user);
    return r.user;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isStaff: user?.role === 'staff' || user?.role === 'admin',
      isAdmin: user?.role === 'admin',
      login: async (email, password) => accept(await api.post('/auth/login', { email, password })),
      register: async (form) => accept(await api.post('/auth/register', form)),
      logout,
      setUser,
      acceptSession: accept,
    }),
    [user, loading, logout]
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
