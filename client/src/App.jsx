import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import SiteLayout from './layout/SiteLayout.jsx';
import { PageLoader } from './components/ui';
import Home from './pages/Home/Home.jsx';
import Shop from './pages/Shop/Shop.jsx';
import ProductDetail from './pages/ProductDetail/ProductDetail.jsx';
import Cart from './pages/Cart/Cart.jsx';
import Checkout from './pages/Checkout/Checkout.jsx';
import Wishlist from './pages/Wishlist/Wishlist.jsx';
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import RequireAuth from './pages/Auth/RequireAuth.jsx';
import AccountLayout from './pages/Account/AccountLayout.jsx';
import OrdersTab from './pages/Account/OrdersTab.jsx';
import RepairsTab from './pages/Account/RepairsTab.jsx';
import ProfileTab from './pages/Account/ProfileTab.jsx';
import OrderDetail from './pages/Account/OrderDetail.jsx';
import RepairCenter from './pages/Repair/RepairCenter.jsx';
import BookRepair from './pages/Repair/BookRepair.jsx';
import TrackRepair from './pages/Repair/TrackRepair.jsx';
import CmsPage from './pages/Info/CmsPage.jsx';
import Contact from './pages/Info/Contact.jsx';
import Faq from './pages/Info/Faq.jsx';
import Policies from './pages/Info/Policies.jsx';
import Support from './pages/Info/Support.jsx';
import NotFound from './pages/Info/NotFound.jsx';

// The admin dashboard is a separate bundle: shoppers never download it.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

/** All website addresses (URLs) and which page file shows them. */
export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="shop/:category" element={<Shop />} />
        <Route path="new-arrivals" element={<Shop flag="new" heading="New arrivals" intro="The latest to land." />} />
        <Route path="deals" element={<Shop flag="sale" heading="Deals" intro="Great prices on great products, while stocks last." />} />
        <Route path="product/:slug" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route path="account" element={<RequireAuth><AccountLayout /></RequireAuth>}>
          <Route index element={<OrdersTab />} />
          <Route path="repairs" element={<RepairsTab />} />
          <Route path="profile" element={<ProfileTab />} />
        </Route>
        <Route path="orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />

        <Route path="repair" element={<RepairCenter />} />
        <Route path="repair/book" element={<BookRepair />} />
        <Route path="repair/track" element={<TrackRepair />} />

        <Route path="about" element={<CmsPage slug="about" />} />
        <Route path="contact" element={<Contact />} />
        <Route path="faq" element={<Faq />} />
        <Route path="support" element={<Support />} />
        <Route path="policies" element={<Policies />} />
        <Route path="policies/:slug" element={<CmsPage />} />
        <Route path="search" element={<Navigate to="/shop" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        path="admin/*"
        element={
          <RequireAuth staff>
            <Suspense fallback={<PageLoader />}>
              <AdminApp />
            </Suspense>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
