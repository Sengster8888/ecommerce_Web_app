import React from 'react';
import { Routes, Route } from 'react-router-dom';

import LoginPage from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import ProductsPage from '../pages/ProductsPage';
import ShopPage from '../pages/ShopPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import CartPage from '../pages/CartPage';
import CheckoutPage from '../pages/CheckoutPage';
import MobileCheckoutPage from '../pages/mobile/MobileCheckoutPage';
import { useIsMobile } from '../hooks/useIsMobile';

const CheckoutRouteWrapper = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileCheckoutPage /> : <CheckoutPage />;
};
import OrdersPage from '../pages/OrdersPage';
import MobileOrdersPage from '../pages/mobile/MobileOrdersPage';

const OrdersRouteWrapper = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileOrdersPage /> : <OrdersPage />;
};
import OrderDetailPage from '../pages/OrderDetailPage';
import MobileOrderDetailPage from '../pages/mobile/MobileOrderDetailPage';

const OrderDetailRouteWrapper = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileOrderDetailPage /> : <OrderDetailPage />;
};


import MobileCatalogPage from '../pages/mobile/MobileCatalogPage';

const ProductsRouteWrapper = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileCatalogPage /> : <ProductsPage />;
};
import ProfilePage from '../pages/ProfilePage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import NotFoundPage from '../pages/NotFoundPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/products" element={<ProductsRouteWrapper />} />
      <Route path="/shop" element={<ShopPage />} />

      <Route path="/products/:id" element={<ProductDetailPage />} />

      {/* Home Page */}
      <Route path="/" element={<HomePage />} />

      {/* Customer Protected Routes */}
      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <CheckoutRouteWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <OrdersRouteWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <OrderDetailRouteWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
