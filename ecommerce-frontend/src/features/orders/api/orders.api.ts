import { apiClient } from '../../../api/axios';
import { ENDPOINTS } from '../../../api/endpoints';

export interface OrderDetailItem {
  id: string | number;
  productId: string | number;
  productNameSnapshot: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  product?: {
    images?: { imageUrl: string; isPrimary: boolean }[];
  };
}

export interface OrderAddress {
  id: string | number;
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  commune?: string;
  streetLine: string;
}

export interface OrderDetail {
  id: string | number;
  orderNumber: string;
  userId: string;
  addressId: string | number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  address?: OrderAddress;
  items: OrderDetailItem[];
}

export const fetchOrderDetailsApi = async (orderId: string): Promise<OrderDetail | null> => {
  try {
    const response = await apiClient.get(ENDPOINTS.ORDERS.DETAIL(orderId));
    return response.data;
  } catch (error) {
    console.error('Failed to fetch order details:', error);
    return null;
  }
};

export const fetchMyOrdersApi = async (): Promise<OrderDetail[]> => {
  try {
    const response = await apiClient.get(ENDPOINTS.ORDERS.LIST);
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch my orders:', error);
    return [];
  }
};

export interface PaymentInitiateResponse {
  paymentId: string | number;
  amount: number;
  qrImageBase64: string;
  qrString: string;
  md5: string;
  providerReference: string;
  expiresAt: string;
  cached?: boolean;
}

export const initiatePaymentApi = async (orderId: string | number): Promise<PaymentInitiateResponse | null> => {
  try {
    const response = await apiClient.post(ENDPOINTS.PAYMENTS.INITIATE, { orderId });
    return response.data;
  } catch (error) {
    console.error('Failed to initiate payment:', error);
    return null;
  }
};

export const simulatePaymentWebhookApi = async (
  paymentId: string | number,
  status: 'PAID' | 'FAILED' = 'PAID'
): Promise<boolean> => {
  try {
    await apiClient.post(ENDPOINTS.PAYMENTS.SIMULATE_WEBHOOK(paymentId.toString()), {
      status,
      providerReference: `TXN-SIM-${Date.now()}`,
    });
    return true;
  } catch (error) {
    console.error('Failed to simulate payment webhook:', error);
    return false;
  }
};

export const getPaymentStatusApi = async (paymentId: string | number): Promise<any | null> => {
  try {
    const response = await apiClient.get(ENDPOINTS.PAYMENTS.GET_STATUS(paymentId.toString()));
    return response.data;
  } catch (error) {
    console.error('Failed to get payment status:', error);
    return null;
  }
};

export interface TrackingTimelineEvent {
  id: string;
  status: string;
  note: string | null;
  timestamp: string;
  updatedBy?: { name: string; role: string };
}

export interface OrderTrackingTimelineResponse {
  orderNumber: string;
  orderId: string;
  timeline: TrackingTimelineEvent[];
}

export const fetchOrderTrackingTimelineApi = async (
  orderId: string | number
): Promise<OrderTrackingTimelineResponse | null> => {
  try {
    const response = await apiClient.get(ENDPOINTS.ORDERS.TRACKING(orderId.toString()));
    return response.data;
  } catch (error) {
    console.error('Failed to fetch tracking timeline:', error);
    return null;
  }
};


