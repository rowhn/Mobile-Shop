import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useLocalStorage } from '../lib/hooks.js';

const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx);

const key = (i) => `${i.productId}:${i.sku || ''}`;

/**
 * The browser only stores {productId, sku, qty} (plus a coupon code). Names, images and ALL prices
 * come from the server (/cart/quote), so a stale or tampered cart can never change what you pay.
 */
export function CartProvider({ children }) {
  const [items, setItems] = useLocalStorage('nova.cart', []);
  const [couponCode, setCouponCode] = useLocalStorage('nova.coupon', '');
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [open, setOpen] = useState(false); // cart drawer
  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    if (!items.length) {
      setQuote(null);
      setQuoteError(null);
      return null;
    }
    const id = ++reqId.current;
    setQuoting(true);
    try {
      const q = await api.post('/cart/quote', {
        items: items.map(({ productId, sku, qty }) => ({ productId, sku: sku || '', qty })),
        couponCode: couponCode || undefined,
      });
      if (id !== reqId.current) return null;
      setQuote(q);
      setQuoteError(null);
      return q;
    } catch (err) {
      if (id === reqId.current) setQuoteError(err);
      return null;
    } finally {
      if (id === reqId.current) setQuoting(false);
    }
  }, [items, couponCode]);

  useEffect(() => {
    const t = setTimeout(refresh, 150);
    return () => clearTimeout(t);
  }, [refresh]);

  // A coupon the server rejected is dropped so it doesn't keep failing silently.
  useEffect(() => {
    if (quote?.couponError && couponCode) setCouponCode('');
  }, [quote, couponCode, setCouponCode]);

  const add = useCallback(
    (productId, sku = '', qty = 1) => {
      setItems((list) => {
        const k = `${productId}:${sku}`;
        const found = list.find((i) => key(i) === k);
        if (found) return list.map((i) => (key(i) === k ? { ...i, qty: Math.min(10, i.qty + qty) } : i));
        return [...list, { productId, sku, qty: Math.min(10, qty) }];
      });
    },
    [setItems]
  );
  const setQty = useCallback(
    (productId, sku, qty) =>
      setItems((list) =>
        qty <= 0
          ? list.filter((i) => key(i) !== `${productId}:${sku || ''}`)
          : list.map((i) => (key(i) === `${productId}:${sku || ''}` ? { ...i, qty: Math.min(10, qty) } : i))
      ),
    [setItems]
  );
  const remove = useCallback((productId, sku) => setQty(productId, sku, 0), [setQty]);
  const clear = useCallback(() => {
    setItems([]);
    setCouponCode('');
    setQuote(null);
  }, [setItems, setCouponCode]);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      quote,
      quoting,
      quoteError,
      couponCode,
      applyCoupon: async (code) => {
        setCouponCode(code.trim().toUpperCase());
      },
      removeCoupon: () => setCouponCode(''),
      add,
      setQty,
      remove,
      clear,
      refresh,
      open,
      setOpen,
    }),
    [items, quote, quoting, quoteError, couponCode, add, setQty, remove, clear, refresh, open, setCouponCode]
  );
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
