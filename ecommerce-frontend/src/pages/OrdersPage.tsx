import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StorefrontHeader } from '../components/storefront/StorefrontHeader';
import { StorefrontFooter } from '../components/storefront/StorefrontFooter';
import {
  fetchMyOrdersApi,
  fetchOrderDetailsApi,
  fetchOrderTrackingTimelineApi,
  type OrderDetail,
  type TrackingTimelineEvent,
} from '../features/orders/api/orders.api';
import { parsePrice, formatKHR } from '../utils/price.utils';

export const exchangeRate = 4100; // 1 USD = 4,100 KHR

export const OrdersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryOrderId = searchParams.get('id');

  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [trackingTimeline, setTrackingTimeline] = useState<TrackingTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Load tracking timeline from GET /api/orders/:id/tracking
  const loadTrackingTimeline = async (orderId: string | number) => {
    try {
      const res = await fetchOrderTrackingTimelineApi(orderId);
      if (res && res.timeline) {
        setTrackingTimeline(res.timeline);
      } else {
        setTrackingTimeline([]);
      }
    } catch (err) {
      console.error('Error fetching tracking timeline:', err);
    }
  };

  // Load all user orders (excluding PENDING/unpaid orders from tracking list)
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const orderList = await fetchMyOrdersApi();
      const confirmedOrders = orderList.filter((o) => o.status !== 'PENDING');
      setOrders(confirmedOrders);

      if (confirmedOrders.length > 0) {
        let targetOrder = confirmedOrders[0];
        if (queryOrderId) {
          const match = confirmedOrders.find(
            (o) => String(o.id) === queryOrderId || o.orderNumber === queryOrderId
          );
          if (match) targetOrder = match;
        }

        const details = await fetchOrderDetailsApi(String(targetOrder.id));
        const finalOrder = details || targetOrder;
        setSelectedOrder(finalOrder);
        await loadTrackingTimeline(finalOrder.id);
      } else {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }, [queryOrderId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Handle switching order
  const handleSelectOrder = async (orderId: string | number) => {
    const found = orders.find((o) => String(o.id) === String(orderId));
    if (found) {
      const details = await fetchOrderDetailsApi(String(found.id));
      const finalOrder = details || found;
      setSelectedOrder(finalOrder);
      await loadTrackingTimeline(finalOrder.id);
    }
  };

  // Helper for Milestone Completion
  const getStepStatus = (
    currentStatus: OrderDetail['status'],
    step: 'placed' | 'verified' | 'processing' | 'shipped' | 'delivered'
  ) => {
    const statusOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    switch (step) {
      case 'placed':
        return currentIndex >= 0;
      case 'verified':
        return currentIndex >= 1;
      case 'processing':
        return currentIndex >= 2;
      case 'shipped':
        return currentIndex >= 3;
      case 'delivered':
        return currentIndex >= 4;
      default:
        return false;
    }
  };

  // Helper for fetching tracking timeline event info for a status
  const getStepTrackingInfo = (statusKey: string) => {
    const event = trackingTimeline.find((t) => t.status.toUpperCase() === statusKey.toUpperCase());
    if (event) {
      const formattedTime = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const formattedDate = new Date(event.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      return { note: event.note, time: formattedTime, date: formattedDate, fullTimestamp: event.timestamp };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col justify-between">
        <StorefrontHeader />
        <main className="w-full pt-28 pb-space-2xl bg-surface flex-1 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-2">
            progress_activity
          </span>
          <p className="text-on-surface-variant font-body-md">Loading order tracking telemetry...</p>
        </main>
        <StorefrontFooter />
      </div>
    );
  }

  if (orders.length === 0 || !selectedOrder) {
    return (
      <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col justify-between">
        <StorefrontHeader />
        <main className="w-full pt-28 pb-space-2xl bg-surface flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="p-8 rounded-2xl bg-surface-container-low border border-white/10 max-w-md w-full shadow-2xl">
            <span className="material-symbols-outlined text-[64px] text-outline mb-4">
              local_shipping
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-2">
              No Tracking History Found
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              You don't have any active or past orders to track right now.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm transition-all shadow-lg hover:brightness-110"
            >
              <span className="material-symbols-outlined text-lg">shopping_bag</span>
              Explore Storefront Products
            </Link>
          </div>
        </main>
        <StorefrontFooter />
      </div>
    );
  }

  const orderNumDisplay = selectedOrder.orderNumber || `#ORD-${selectedOrder.id}`;
  const totalUsd = parsePrice(selectedOrder.totalAmount);
  const totalKhr = Math.round(totalUsd * exchangeRate);

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col justify-between antialiased">
      <StorefrontHeader />

      <main className="w-full pt-20 bg-surface min-h-screen">
        <div className="flex flex-col w-full">
          <div className="max-w-7xl mx-auto w-full px-space-md lg:px-container-padding-desktop py-space-xl space-y-space-xl">
            {/* Quick Order Switcher Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl border border-white/5 shadow-md">
              <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md">
                <span className="material-symbols-outlined text-secondary text-[20px]">manage_search</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">Select Order to Track:</span>
              </div>
              <div className="flex flex-wrap items-center gap-space-sm w-full sm:w-auto">
                <select
                  value={String(selectedOrder.id)}
                  onChange={(e) => handleSelectOrder(e.target.value)}
                  className="w-full sm:w-auto bg-surface-container-high text-on-surface font-mono font-bold text-sm px-space-md py-space-xs rounded-xl border border-white/10 focus:outline-none focus:border-secondary cursor-pointer"
                >
                  {orders.map((ord) => (
                    <option key={ord.id} value={String(ord.id)} className="bg-[#171b26] text-white">
                      {ord.orderNumber || `#ORD-${ord.id}`} — ${parsePrice(ord.totalAmount).toFixed(2)} ({ord.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Header Banner & Quick Status Ribbon */}
            <div className="relative overflow-hidden rounded-xl bg-surface-container p-space-lg lg:p-space-xl shadow-xl border border-white/5">
              <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-secondary/10 blur-3xl pointer-events-none"></div>
              <div className="absolute right-1/4 -bottom-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-lg">
                <div className="space-y-space-2xs">
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                      Live Dispatch Telemetry
                    </span>
                    {selectedOrder.status === 'SHIPPED' && (
                      <span className="inline-flex items-center gap-1 px-space-xs py-space-2xs rounded-full bg-secondary/15 text-secondary font-label-sm text-label-sm font-bold shadow-[0_0_12px_rgba(76,215,246,0.35)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
                        IN TRANSIT • OUT FOR DELIVERY
                      </span>
                    )}
                    {selectedOrder.status === 'DELIVERED' && (
                      <span className="inline-flex items-center gap-1 px-space-xs py-space-2xs rounded-full bg-tertiary/15 text-tertiary font-label-sm text-label-sm font-bold shadow-[0_0_12px_rgba(78,222,163,0.35)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                        DELIVERED • HANDOVER COMPLETE
                      </span>
                    )}
                    {(selectedOrder.status === 'CONFIRMED' || selectedOrder.status === 'PROCESSING') && (
                      <span className="inline-flex items-center gap-1 px-space-xs py-space-2xs rounded-full bg-tertiary/15 text-tertiary font-label-sm text-label-sm font-bold shadow-[0_0_12px_rgba(78,222,163,0.35)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                        PAID • PROCESSING & PACKING
                      </span>
                    )}
                    {selectedOrder.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 px-space-xs py-space-2xs rounded-full bg-error/15 text-error font-label-sm text-label-sm font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                        AWAITING KHQR PAYMENT
                      </span>
                    )}
                  </div>

                  <h1 className="font-headline-lg text-headline-lg text-on-surface flex items-center gap-space-xs tracking-tight font-bold">
                    Order <span className="text-secondary font-mono">{orderNumDisplay}</span>
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • Verified through{' '}
                    <span className="text-tertiary font-medium">Bakong KHQR (ABA Bank KHQR)</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Horizontal Checkpoint Pipeline */}
            <div className="rounded-xl bg-surface-container p-space-lg lg:p-space-xl shadow-xl border border-white/5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-xs mb-space-xl">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Consignment Progress</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Real-time GPS telemetry &amp; hub audit log from Phnom Penh Central Depot
                  </p>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm text-tertiary flex items-center gap-1 px-space-xs py-space-2xs bg-surface-container-lowest rounded-full border border-white/5">
                    <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                    {selectedOrder.status === 'DELIVERED'
                      ? '5 of 5 Milestones Completed'
                      : selectedOrder.status === 'SHIPPED'
                        ? '4 of 5 Milestones Reached (Shipped)'
                        : selectedOrder.status === 'PROCESSING'
                          ? '3 of 5 Milestones Reached (Processing)'
                          : selectedOrder.status === 'CONFIRMED'
                            ? '2 of 5 Milestones Reached (Verified)'
                            : '1 of 5 Milestones (Pending Payment)'}
                  </span>
                </div>
              </div>

              {/* Pipeline Steps Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md relative">
                {/* Step 1: Order Placed */}
                <div className="relative flex flex-col space-y-space-xs bg-surface-container-low p-space-md rounded-xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center shadow-[0_0_16px_rgba(78,222,163,0.3)]">
                      <span className="material-symbols-outlined text-[20px]">shopping_cart_checkout</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-tertiary font-mono">
                      {getStepTrackingInfo('PENDING')?.time || 'Step 01'}
                    </span>
                  </div>
                  <div className="font-label-lg text-label-lg text-on-surface font-semibold">1. Order Placed</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {getStepTrackingInfo('PENDING')?.note || 'Web checkout initiated. Cart verified & items locked.'}
                  </p>
                  <div className="pt-space-2xs">
                    <span className="font-label-sm text-label-sm px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface-variant font-medium">
                      Cart Confirmed
                    </span>
                  </div>
                </div>

                {/* Step 2: Payment Verified */}
                <div className={`relative flex flex-col space-y-space-xs p-space-md rounded-xl border border-white/5 ${getStepStatus(selectedOrder.status, 'verified')
                    ? 'bg-surface-container-low'
                    : 'bg-surface-container-low/50 opacity-60'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStepStatus(selectedOrder.status, 'verified')
                        ? 'bg-tertiary/20 text-tertiary shadow-[0_0_16px_rgba(78,222,163,0.3)]'
                        : 'bg-surface-container-highest text-outline'
                      }`}>
                      <span className="material-symbols-outlined text-[20px]">verified</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-tertiary font-mono">
                      {getStepTrackingInfo('CONFIRMED')?.time || 'Step 02'}
                    </span>
                  </div>
                  <div className="font-label-lg text-label-lg text-on-surface font-semibold">2. Payment Verified</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {getStepTrackingInfo('CONFIRMED')?.note || 'Bakong KHQR zero-fee settlement via ABA Bank KHQR.'}
                  </p>
                  <div className="pt-space-2xs">
                    <span className={`font-label-sm text-label-sm px-space-xs py-space-2xs rounded ${getStepStatus(selectedOrder.status, 'verified')
                        ? 'bg-surface-container-high text-tertiary font-bold'
                        : 'bg-surface-container-lowest text-outline'
                      }`}>
                      {getStepStatus(selectedOrder.status, 'verified') ? 'KHQR Verified' : 'Awaiting Payment'}
                    </span>
                  </div>
                </div>

                {/* Step 3: Processing */}
                <div className={`relative flex flex-col space-y-space-xs p-space-md rounded-xl border border-white/5 ${getStepStatus(selectedOrder.status, 'processing')
                    ? 'bg-surface-container-low'
                    : 'bg-surface-container-low/50 opacity-60'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStepStatus(selectedOrder.status, 'processing')
                        ? 'bg-tertiary/20 text-tertiary shadow-[0_0_16px_rgba(78,222,163,0.3)]'
                        : 'bg-surface-container-highest text-outline'
                      }`}>
                      <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-tertiary font-mono">
                      {getStepTrackingInfo('PROCESSING')?.time || 'Step 03'}
                    </span>
                  </div>
                  <div className="font-label-lg text-label-lg text-on-surface font-semibold">3. Processing</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {getStepTrackingInfo('PROCESSING')?.note || 'Sensok Central Hub. Tamper-evident seals applied & QC approved.'}
                  </p>
                </div>

                {/* Step 4: Shipped (En Route) */}
                <div className={`relative flex flex-col space-y-space-xs p-space-md rounded-xl ${selectedOrder.status === 'SHIPPED'
                    ? 'bg-surface-container-high shadow-[0_0_24px_rgba(76,215,246,0.15)] ring-2 ring-secondary/50'
                    : getStepStatus(selectedOrder.status, 'shipped')
                      ? 'bg-surface-container-low border border-white/5'
                      : 'bg-surface-container-low/50 opacity-60 border border-white/5'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className={`relative w-10 h-10 rounded-full flex items-center justify-center ${selectedOrder.status === 'SHIPPED'
                        ? 'bg-secondary text-on-secondary shadow-[0_0_20px_rgba(76,215,246,0.6)]'
                        : getStepStatus(selectedOrder.status, 'shipped')
                          ? 'bg-tertiary/20 text-tertiary'
                          : 'bg-surface-container-highest text-outline'
                      }`}>
                      <span className="material-symbols-outlined text-[22px] animate-pulse">local_shipping</span>
                      {selectedOrder.status === 'SHIPPED' && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                        </span>
                      )}
                    </div>
                    <span className={`font-label-sm text-label-sm font-semibold ${selectedOrder.status === 'SHIPPED' ? 'text-secondary' : 'text-outline'
                      }`}>
                      {selectedOrder.status === 'SHIPPED' ? 'Active' : getStepTrackingInfo('SHIPPED')?.time || 'Step 04'}
                    </span>
                  </div>
                  <div className="font-label-lg text-label-lg text-on-surface font-semibold">4. Shipped (En Route)</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {getStepTrackingInfo('SHIPPED')?.note || 'Courier Mr. Vireak en route to destination sector.'}
                  </p>
                </div>

                {/* Step 5: Delivered */}
                <div className={`relative flex flex-col space-y-space-xs p-space-md rounded-xl border border-white/5 ${selectedOrder.status === 'DELIVERED'
                    ? 'bg-surface-container-low ring-2 ring-tertiary/50'
                    : 'bg-surface-container-low/50 opacity-60'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedOrder.status === 'DELIVERED'
                        ? 'bg-tertiary text-on-tertiary shadow-[0_0_20px_rgba(78,222,163,0.6)]'
                        : 'bg-surface-container-highest text-outline'
                      }`}>
                      <span className="material-symbols-outlined text-[20px]">home_pin</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-outline font-mono">
                      {getStepTrackingInfo('DELIVERED')?.time || 'Step 05'}
                    </span>
                  </div>
                  <div className="font-label-lg text-label-lg text-on-surface font-semibold">5. Delivered</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {getStepTrackingInfo('DELIVERED')?.note || 'Signature & contactless snapshot confirmation required at doorstep.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Split Section: Telemetry Map & Recipient Details vs. Audit Log */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
              {/* Left Column (7 cols): Address & Items Summary */}
              <div className="lg:col-span-7 space-y-space-xl">
                {/* Destination Address Card */}
                {selectedOrder.address && (
                  <div className="rounded-xl bg-surface-container p-space-lg shadow-xl border border-white/5 space-y-space-sm">
                    <div className="flex items-center justify-between border-b border-white/5 pb-space-sm">
                      <div className="flex items-center gap-space-xs text-secondary">
                        <span className="material-symbols-outlined text-[22px]">location_on</span>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Delivery Address &amp; Recipient</h3>
                      </div>
                      <span className="font-label-sm text-label-sm px-space-xs py-space-2xs bg-tertiary/10 text-tertiary rounded font-bold">
                        Phnom Penh Express
                      </span>
                    </div>
                    <div className="space-y-space-2xs text-on-surface-variant font-body-md text-body-md pt-space-xs">
                      <div className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        {selectedOrder.address.recipientName} ({selectedOrder.address.label})
                      </div>
                      <div className="flex items-center gap-space-2xs text-secondary font-mono font-semibold">
                        <span className="material-symbols-outlined text-[16px]">call</span>
                        <span>{selectedOrder.address.phone}</span>
                      </div>
                      <div className="flex items-start gap-space-2xs">
                        <span className="material-symbols-outlined text-[16px] shrink-0 mt-1 text-outline">home</span>
                        <span>
                          {selectedOrder.address.streetLine}, {selectedOrder.address.commune ? `${selectedOrder.address.commune}, ` : ''}
                          {selectedOrder.address.city}, {selectedOrder.address.province}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Purchased Items Summary */}
                <div className="rounded-xl bg-surface-container p-space-lg shadow-xl space-y-space-md border border-white/5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs font-bold">
                      <span className="material-symbols-outlined text-primary text-[22px]">inventory</span>
                      Consolidated Package ({selectedOrder.items?.length || 0} Items)
                    </h3>
                    <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-low px-space-xs py-space-2xs rounded font-medium">
                      Express Courier Sealed
                    </span>
                  </div>

                  {/* Items Stack */}
                  <div className="space-y-space-sm">
                    {selectedOrder.items?.map((item) => {
                      const uPrice = parsePrice(item.unitPrice);
                      const lTotal = parsePrice(item.lineTotal || uPrice * item.quantity);
                      const imgUrl =
                        item.product?.images?.find((img) => img.isPrimary)?.imageUrl ||
                        item.product?.images?.[0]?.imageUrl ||
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80';

                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-space-md p-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors border border-white/5"
                        >
                          <img
                            src={imgUrl}
                            alt={item.productNameSnapshot}
                            className="w-16 h-16 rounded-lg object-cover bg-surface-container-lowest shrink-0 border border-white/5"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-label-lg text-label-lg text-on-surface font-semibold truncate">
                              {item.productNameSnapshot}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-space-sm gap-y-1 font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                              <span className="text-tertiary">Qty: {item.quantity}</span>
                              <span>• Unit: ${uPrice.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-price-card text-price-card text-secondary font-bold">
                              ${lTotal.toFixed(2)}
                            </div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                              {formatKHR(lTotal * exchangeRate)} ៛
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total Calculation Row */}
                  <div className="pt-space-sm border-t border-white/5 flex items-center justify-between text-on-surface-variant font-body-md text-body-md">
                    <span>Subtotal &amp; Express Local Shipping:</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Total: ${totalUsd.toFixed(2)} USD{' '}
                      <span className="text-secondary font-mono font-normal">
                        ({totalKhr.toLocaleString()} KHR)
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols): Support Tools */}
              <div className="lg:col-span-5 space-y-space-xl">
                {/* Customer Help & Support */}
                <div className="rounded-xl bg-surface-container p-space-lg shadow-xl space-y-space-md border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[22px]">support_agent</span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Contact Store &amp; Support</h3>
                    </div>
                    <span className="font-label-sm text-label-sm text-tertiary flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span> Online Now
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Need address changes, gate access instructions, or instant status updates? Cambodian E-Store support concierge is ready to assist.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
                    <button
                      type="button"
                      onClick={() => window.open('https://t.me', '_blank')}
                      className="h-11 px-space-md rounded-xl bg-secondary text-on-secondary font-label-md text-label-md font-bold flex items-center justify-center gap-space-2xs hover:bg-secondary-fixed-dim transition-all shadow-[0_0_12px_rgba(76,215,246,0.3)] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      <span>Telegram Support</span>
                    </button>
                    <a
                      href="tel:+85523999888"
                      className="h-11 px-space-md rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-space-2xs transition-colors border border-white/5"
                    >
                      <span className="material-symbols-outlined text-primary text-[18px]">phone_in_talk</span>
                      <span>Call Hotline</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
};

export default OrdersPage;
