import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';
import App from './App.jsx';
import { ToastProvider } from './context/Toast.jsx';
import { ConfigProvider } from './context/Config.jsx';
import { AuthProvider } from './context/Auth.jsx';
import { CartProvider } from './context/Cart.jsx';
import { WishlistProvider } from './context/Wishlist.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* reducedMotion="user" honours the OS "reduce motion" setting for every animation */}
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          <ConfigProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <App />
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </ConfigProvider>
        </ToastProvider>
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>
);
