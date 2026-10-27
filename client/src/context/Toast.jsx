import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import './Toast.css';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const seq = useRef(0);

  const push = useCallback((message, tone = 'default') => {
    const id = ++seq.current;
    setItems((l) => [...l.slice(-3), { id, message, tone }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), tone === 'error' ? 6000 : 3500);
  }, []);

  const api = useMemo(
    () => ({
      show: (m) => push(m),
      success: (m) => push(m, 'success'),
      error: (m) => push(m, 'error'),
    }),
    [push]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="pm-toasts" role="status" aria-live="polite">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className={`pm-toast ${t.tone === 'error' ? 'pm-toast--error' : ''}`}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
