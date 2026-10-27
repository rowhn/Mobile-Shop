import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Button, cx } from '../../components/ui';
import { useAuth } from '../../context/Auth.jsx';
import { usePageTitle } from '../../lib/hooks.js';
import './Account.css';

// ✏️ Account tabs: [path, text, exact-match?]
const TABS = [['/account', 'Orders', true], ['/account/repairs', 'Repairs'], ['/wishlist', 'Wishlist'], ['/account/profile', 'Profile & addresses']];

export default function AccountLayout() {
  usePageTitle('My account');
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="container py-4 py-lg-5">
      <div className="pm-account__head">
        <div>
          <p className="small text-muted mb-1">Signed in as {user.email}</p>
          <h1 className="page-title mb-0">Hi, {user.name.split(' ')[0]}</h1>
        </div>
        <div className="d-flex gap-2">
          {isStaff && <Button to="/admin" variant="dark" size="sm"><Icon name="settings" size={16} />Admin</Button>}
          <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }}><Icon name="logout" size={16} />Sign out</Button>
        </div>
      </div>
      <nav className="pm-account__tabs hide-scrollbar" aria-label="Account">
        {TABS.map(([to, text, end]) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => cx('pm-account__tab', isActive && 'is-active')}>{text}</NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
