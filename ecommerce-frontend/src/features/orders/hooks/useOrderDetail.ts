import { useState, useEffect, useCallback } from 'react';
import {
  fetchOrderDetailsApi,
  initiatePaymentApi,
  simulatePaymentWebhookApi,
  getPaymentStatusApi,
  type OrderDetail,
  type PaymentInitiateResponse,
} from '../api/orders.api';
import { parsePrice } from '../../../utils/price.utils';

export const exchangeRate = 4100; // 1 USD = 4,100 KHR

export const useOrderDetail = (orderId: string | undefined) => {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentInitiateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'khqr' | 'transfer' | 'card'>('khqr');
  const [isPaid, setIsPaid] = useState(false);

  // Countdown timer state (10 minutes = 600s)
  const [secondsLeft, setSecondsLeft] = useState(600);

  // Clipboard copy state flags
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchOrderDetailsApi(orderId);
      if (data) {
        setOrder(data);
        if (data.status === 'CONFIRMED' || data.status === 'PROCESSING' || data.status === 'SHIPPED' || data.status === 'DELIVERED') {
          setIsPaid(true);
        } else {
          // Initiate real KHQR payment from backend
          const payRes = await initiatePaymentApi(orderId);
          if (payRes) {
            setPaymentData(payRes);
          }
        }
      }
    } catch (err) {
      console.error('Error loading order details:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Timer Countdown Effect
  useEffect(() => {
    if (secondsLeft <= 0 || isPaid) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, isPaid]);

  // Hybrid Smart Polling Effect (every 3s auto-check payment & order status)
  useEffect(() => {
    if (!orderId || isPaid) return;

    const pollInterval = setInterval(async () => {
      try {
        if (paymentData?.paymentId) {
          const payStatus = await getPaymentStatusApi(paymentData.paymentId);
          if (payStatus?.status === 'PAID') {
            setIsPaid(true);
            const updatedOrder = await fetchOrderDetailsApi(orderId);
            if (updatedOrder) setOrder(updatedOrder);
            return;
          }
        }

        const latestOrder = await fetchOrderDetailsApi(orderId);
        if (latestOrder) {
          if (
            latestOrder.status === 'CONFIRMED' ||
            latestOrder.status === 'PROCESSING' ||
            latestOrder.status === 'SHIPPED' ||
            latestOrder.status === 'DELIVERED'
          ) {
            setOrder(latestOrder);
            setIsPaid(true);
          }
        }
      } catch (err) {
        // Silent catch during background polling
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [orderId, isPaid, paymentData?.paymentId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText(null);
    }, 2500);
  };

  const handleSimulatePaymentSuccess = async () => {
    if (paymentData?.paymentId) {
      await simulatePaymentWebhookApi(paymentData.paymentId, 'PAID');
    }
    setIsPaid(true);
    if (order) {
      setOrder({ ...order, status: 'CONFIRMED' });
    }
  };

  // Calculations
  const subtotal = order ? parsePrice(order.subtotal) : 0;
  const discountAmount = order ? parsePrice(order.discountAmount) : 0;
  const totalAmountUsd = order ? parsePrice(order.totalAmount) : 0;
  const totalAmountKhr = Math.round(totalAmountUsd * exchangeRate);

  // Format Timer MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  const timerPercentage = (secondsLeft / 600) * 100;

  return {
    order,
    paymentData,
    loading,
    activeTab,
    setActiveTab,
    isPaid,
    secondsLeft,
    formatTime,
    timerPercentage,
    copiedText,
    copyToClipboard,
    handleSimulatePaymentSuccess,
    subtotal,
    discountAmount,
    totalAmountUsd,
    totalAmountKhr,
    refreshOrder: loadOrder,
  };
};
