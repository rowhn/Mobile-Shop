import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { useConfig } from '../../context/Config.jsx';
import './Auth.css';

/** Shared frame for Login and Register. */
export default function AuthShell({ title, subtitle, children, footer }) {
  const { store } = useConfig();
  return (
    <div className="container pm-auth">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="pm-auth__box">
        <p className="pm-auth__brand">{store.name}</p>
        <h1 className="pm-auth__title">{title}</h1>
        <p className="pm-auth__sub">{subtitle}</p>
        <div className="pm-auth__card">{children}</div>
        <p className="pm-auth__foot">{footer}</p>
      </motion.div>
    </div>
  );
}

/** Where to go after signing in: ?next=/path or the page that sent us here. */
export const useRedirect = () => {
  const { state, search } = useLocation();
  const next = new URLSearchParams(search).get('next');
  return state?.from || (next?.startsWith('/') && !next.startsWith('//') ? next : '/account');
};
