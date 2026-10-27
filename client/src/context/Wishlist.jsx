import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from './Auth.jsx';
import { useToast } from './Toast.jsx';

const WishCtx = createContext(null);
export const useWishlist = () => useContext(WishCtx);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [ids, setIds] = useState(new Set());

  useEffect(() => {
    if (!user) {
      setIds(new Set());
      return;
    }
    api
      .get('/wishlist')
      .then((r) => setIds(new Set(r.ids)))
      .catch(() => {});
  }, [user]);

  const toggle = useCallback(
    async (productId) => {
      if (!user) {
        toast.show('Sign in to save items to your wishlist.');
        navigate('/login', { state: { from: location.pathname + location.search } });
        return;
      }
      const has = ids.has(productId);
      // optimistic update, rolled back if the server says no
      setIds((s) => {
        const n = new Set(s);
        has ? n.delete(productId) : n.add(productId);
        return n;
      });
      try {
        await (has ? api.del(`/wishlist/${productId}`) : api.put(`/wishlist/${productId}`));
        toast.show(has ? 'Removed from wishlist' : 'Saved to wishlist');
      } catch (err) {
        setIds((s) => {
          const n = new Set(s);
          has ? n.add(productId) : n.delete(productId);
          return n;
        });
        toast.error(err.message);
      }
    },
    [user, ids, toast, navigate, location]
  );

  const value = useMemo(() => ({ ids, has: (id) => ids.has(id), toggle, count: ids.size }), [ids, toggle]);
  return <WishCtx.Provider value={value}>{children}</WishCtx.Provider>;
}
