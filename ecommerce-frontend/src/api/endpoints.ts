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
    GET: '/cart',
    ADD: '/cart/items',
    UPDATE: (itemId: string) => `/cart/items/${itemId}`,
    REMOVE: (itemId: string) => `/cart/items/${itemId}`,
    CLEAR: '/cart',
  },
  ORDERS: {
    LIST: '/orders',
    CHECKOUT: '/orders/checkout',
    CREATE: '/orders',
    DETAIL: (id: string) => `/orders/${id}`,
    TRACKING: (id: string) => `/orders/${id}/tracking`,
  },
  ADDRESSES: {
    LIST: '/addresses',
    CREATE: '/addresses',
    DETAIL: (id: string) => `/addresses/${id}`,
    SET_DEFAULT: (id: string) => `/addresses/${id}/default`,
    DELETE: (id: string) => `/addresses/${id}`,
  },
  DISCOUNTS: {
    VALIDATE: '/discounts/validate',
  },
  ADMIN: {
    ORDERS: '/admin/orders',
    UPDATE_ORDER_STATUS: (id: string) => `/admin/orders/${id}/status`,
  },
  PAYMENTS: {
    INITIATE: '/payments',
    GET_STATUS: (id: string) => `/payments/${id}`,
    SIMULATE_WEBHOOK: (id: string) => `/payments/${id}/simulate-webhook`,
  },
};

