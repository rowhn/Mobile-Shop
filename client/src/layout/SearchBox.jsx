import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { ProductImage } from '../components/ProductCard.jsx';
import { api } from '../lib/api.js';
import { useDebounced } from '../lib/hooks.js';
import { money } from '../lib/format.js';
import './SearchBox.css';

/** Search input with live product suggestions (used in the Navbar). */
export default function SearchBox({ onDone, autoFocus }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const dq = useDebounced(q.trim(), 250);
  const box = useRef(null);

  useEffect(() => {
    if (dq.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    api
      .get('/products/suggest', { q: dq }, ctrl.signal)
      .then((r) => setResults(r.items))
      .catch(() => {});
    return () => ctrl.abort();
  }, [dq]);

  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
    onDone?.();
  };

  return (
    <div ref={box} className="pm-search">
      <form onSubmit={submit} role="search" className="pm-search__form">
        <Icon name="search" size={18} className="pm-search__icon" />
        <input
          type="search"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search products"
          aria-label="Search products"
          className="pm-search__input"
        />
      </form>
      {open && results.length > 0 && (
        <ul className="pm-search__results">
          {results.map((p) => (
            <li key={p.id}>
              <Link
                to={`/product/${p.slug}`}
                onClick={() => {
                  setOpen(false);
                  setQ('');
                  onDone?.();
                }}
                className="pm-search__item"
              >
                <ProductImage product={p} className="pm-search__thumb" />
                <span className="pm-search__text">
                  <span className="pm-search__name">{p.name}</span>
                  <span className="pm-search__brand">{p.brand}</span>
                </span>
                <span className="fw-medium small">{money(p.finalPrice)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
