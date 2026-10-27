import Icon from '../../components/Icon.jsx';
import { Input } from '../../components/ui';
import './SearchBar.css';

/** Search box + any filter dropdowns passed as children. */
export default function SearchBar({ value, onChange, placeholder = 'Search…', children }) {
  return (
    <div className="pm-admin-search">
      <div className="pm-admin-search__box">
        <Icon name="search" size={16} className="pm-admin-search__icon" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="pm-admin-search__input" />
      </div>
      {children}
    </div>
  );
}
