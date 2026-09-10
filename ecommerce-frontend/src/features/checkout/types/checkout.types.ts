export interface Address {
  id: string | number;
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  commune: string;
  streetLine: string;
  isDefault: boolean;
}

export interface CreateAddressDto {
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  commune: string;
  streetLine: string;
  isDefault?: boolean;
}

export type CheckoutPaymentMethod = 'khqr' | 'cod';

export interface CheckoutPayload {
  addressId: string | number;
  paymentMethod: CheckoutPaymentMethod;
  promoCode?: string;
}

export interface DiscountValidationResult {
  discountId?: string;
  discountAmount: number;
  isValid: boolean;
  message?: string;
}

export interface OrderResult {
  id: string | number;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}
