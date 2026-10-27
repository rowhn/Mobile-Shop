import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Fetches data with loading / error / reload handling and cancels stale requests.
 * `fn` receives an AbortSignal. Re-runs whenever `deps` change.
 */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(() => fnRef.current(ctrl.signal))
      .then((data) => !ctrl.signal.aborted && setState({ data, loading: false, error: null }))
      .catch((error) => {
        if (error?.name === 'AbortError' || ctrl.signal.aborted) return;
        setState((s) => ({ data: s.data, loading: false, error }));
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload, setData: (data) => setState((s) => ({ ...s, data })) };
}

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} · NOVA` : 'NOVA';
    return () => {
      document.title = prev;
    };
  }, [title]);
}

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);
  return [value, setValue];
}

let razorpayLoader;
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  razorpayLoader ??= new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => {
      razorpayLoader = null;
      resolve(false);
    };
    document.body.appendChild(s);
  });
  return razorpayLoader;
}
