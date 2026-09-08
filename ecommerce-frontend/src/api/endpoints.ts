export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';


export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_OTP: '/auth/verify-otp',
    SEND_OTP: '/auth/otp/send',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    UPDATE_PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/password/change',
    FORGOT_PASSWORD: '/auth/password/forgot',
    RESET_PASSWORD: '/auth/password/reset',
    GOOGLE_OAUTH: '/auth/google',
  },
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id: string) => `/products/${id}`,
    CATEGORIES: '/categories',
  },
  CART: {
    GET: '/carts',
    ADD: '/carts/items',
    UPDATE: (itemId: string) => `/carts/items/${itemId}`,
    REMOVE: (itemId: string) => `/carts/items/${itemId}`,
    CLEAR: '/carts/clear',
  },
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders',
    DETAIL: (id: string) => `/orders/${id}`,
    TRACKING: (trackingNumber: string) => `/order-tracking/${trackingNumber}`,
  },
  ADMIN: {
    ORDERS: '/admin/orders',
    UPDATE_ORDER_STATUS: (id: string) => `/admin/orders/${id}/status`,
  },
};
