import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Offcanvas } from 'react-bootstrap';
import Icon from '../components/Icon.jsx';
import { Button, IconButton, cx } from '../components/ui';
import { useAuth } from '../context/Auth.jsx';
import { useConfig } from '../context/Config.jsx';
import './admin.css';
import './AdminLayout.css';

// [path, label, icon, who can see it ('admin' = admins only, 'staff' = staff + admins), exact match?]
const NAV = [
  ['/admin', 'Dashboard', 'chart', 'admin', true],
  ['/admin/products', 'Products', 'box', 'admin'],
  ['/admin/inventory', 'Inventory', 'inbox', 'admin'],
  ['/admin/categories', 'Categories', 'grid', 'admin'],
  ['/admin/banners', 'Banners & campaigns', 'image', 'admin'],
  ['/admin/coupons', 'Coupons', 'tag', 'admin'],
  ['/admin/orders', 'Orders', 'bag', 'staff'],
  ['/admin/repairs', 'Repair bookings', 'wrench', 'staff'],
  ['/admin/repair-devices', 'Repair devices & prices', 'phone', 'admin'],
  ['/admin/repair-services', 'Repair services', 'screen', 'admin'],
  ['/admin/customers', 'Customers & staff', 'users', 'admin'],
  ['/admin/content', 'Content (FAQ, pages)', 'edit', 'admin'],
  ['/admin/messages', 'Messages', 'mail', 'admin'],
  ['/admin/settings', 'Settings', 'settings', 'admin'],
];

export default function AdminLayout() {
  const { user, isAdmin, logout } = useAuth();
  const { store } = useConfig();
  const [open, setOpen] = useState(false);
  const items = NAV.filter(([, , , role]) => isAdmin || role === 'staff');

  const nav = (
    <nav className="pm-admin__nav" aria-label="Admin">
      {items.map(([to, text, icon, , end]) => (
        <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => cx('pm-admin__link', isActive && 'is-active')}>
          <Icon name={icon} size={18} />
          {text}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="pm-admin">
      <aside className="pm-admin__sidebar">
        <div className="pm-admin__brand"><strong>{store.name}</strong><span>Admin dashboard</span></div>
        {nav}
        <div className="pm-admin__user">
          <p className="fw-medium mb-0 text-truncate">{user.name}</p>
          <p className="small text-muted mb-3 text-truncate">{user.role}</p>
          <div className="d-flex gap-2">
            <Button to="/" variant="secondary" size="sm">View store</Button>
            <Button variant="outline" size="sm" onClick={logout}>Sign out</Button>
          </div>
        </div>
      </aside>

      <div className="pm-admin__content">
        <header className="pm-admin__topbar">
          <IconButton icon="menu" label="Open menu" onClick={() => setOpen(true)} />
          <strong>{store.name}</strong>
          <span className="small text-muted">Admin</span>
          <Link to="/" className="ms-auto small">View store</Link>
        </header>
        <Offcanvas show={open} onHide={() => setOpen(false)} placement="start" aria-label="Admin menu">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title as="strong">{store.name}</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0 d-flex flex-column">
            {nav}
            <div className="pm-admin__user">
              <p className="fw-medium mb-0 text-truncate">{user.name}</p>
              <p className="small text-muted mb-3">{user.role}</p>
              <Button variant="outline" size="sm" onClick={logout}>Sign out</Button>
            </div>
          </Offcanvas.Body>
        </Offcanvas>
        <main className="pm-admin__main"><Outlet /></main>
      </div>
    </div>
  );
}
