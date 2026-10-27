import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './AdminLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import ProductForm from './pages/ProductForm.jsx';
import Inventory from './pages/Inventory.jsx';
import Categories from './pages/Categories.jsx';
import Banners from './pages/Banners.jsx';
import Coupons from './pages/Coupons.jsx';
import Orders from './pages/Orders.jsx';
import RepairBookings from './pages/RepairBookings.jsx';
import RepairDevices from './pages/RepairDevices.jsx';
import RepairServices from './pages/RepairServices.jsx';
import Customers from './pages/Customers.jsx';
import Content from './pages/Content.jsx';
import Messages from './pages/Messages.jsx';
import Settings from './pages/Settings.jsx';
import RequireAuth from '../pages/Auth/RequireAuth.jsx';
import { useAuth } from '../context/Auth.jsx';

// Defined at module level so its identity is stable across renders (an inline component would remount the page each render).
const A = ({ children }) => <RequireAuth admin>{children}</RequireAuth>;

/** Admin routes. Each page lives in admin/pages/. */
export default function AdminApp() {
  const { isAdmin } = useAuth();
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        {/* staff land on Orders; admins on the dashboard */}
        <Route index element={isAdmin ? <Dashboard /> : <Navigate to="orders" replace />} />
        <Route path="orders" element={<Orders />} />
        <Route path="repairs" element={<RepairBookings />} />

        <Route path="products" element={<A><Products /></A>} />
        <Route path="products/:id" element={<A><ProductForm /></A>} />
        <Route path="inventory" element={<A><Inventory /></A>} />
        <Route path="categories" element={<A><Categories /></A>} />
        <Route path="banners" element={<A><Banners /></A>} />
        <Route path="coupons" element={<A><Coupons /></A>} />
        <Route path="repair-devices" element={<A><RepairDevices /></A>} />
        <Route path="repair-services" element={<A><RepairServices /></A>} />
        <Route path="customers" element={<A><Customers /></A>} />
        <Route path="content" element={<A><Content /></A>} />
        <Route path="messages" element={<A><Messages /></A>} />
        <Route path="settings" element={<A><Settings /></A>} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
