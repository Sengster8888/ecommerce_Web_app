import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  fetchMyOrdersApi,
  fetchOrderDetailsApi,
  fetchOrderTrackingTimelineApi,
  type OrderDetail,
  type TrackingTimelineEvent,
} from '../../features/orders/api/orders.api';
import { parsePrice } from '../../utils/price.utils';
import { useAuth } from '../../features/auth/hooks/useAuth';

export const MobileOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryOrderId = searchParams.get('id');
  const { user } = useAuth();

  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [trackingTimeline, setTrackingTimeline] = useState<TrackingTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Chat sheet state
  const [isChatSheetOpen, setIsChatSheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 2400);
  };

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

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const orderList = await fetchMyOrdersApi();
      const confirmedOrders = orderList.filter((o) => o.status === 'CONFIRMED' || o.status === 'PROCESSING' || o.status === 'SHIPPED' || o.status === 'DELIVERED');
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

  const handleSelectOrder = async (orderId: string | number) => {
    const found = orders.find((o) => String(o.id) === String(orderId));
    if (found) {
      const details = await fetchOrderDetailsApi(String(found.id));
      const finalOrder = details || found;
      setSelectedOrder(finalOrder);
      await loadTrackingTimeline(finalOrder.id);
    }
  };

  const getStepStatus = (
    currentStatus: OrderDetail['status'],
    step: 'placed' | 'verified' | 'processing' | 'shipped' | 'delivered'
  ) => {
    const statusOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    switch (step) {
      case 'placed': return currentIndex >= 0;
      case 'verified': return currentIndex >= 1;
      case 'processing': return currentIndex >= 2;
      case 'shipped': return currentIndex >= 3;
      case 'delivered': return currentIndex >= 4;
      default: return false;
    }
  };

  const getStepTrackingInfo = (statusKey: string) => {
    const event = trackingTimeline.find((t) => t.status.toUpperCase() === statusKey.toUpperCase());
    if (event) {
      const isObjectOrEmpty = typeof event.timestamp === 'object' || !event.timestamp;
      const parsedDate = new Date(event.timestamp);
      const isValidDate = !isObjectOrEmpty && !isNaN(parsedDate.getTime());

      const formattedTime = isValidDate ? parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      const formattedDate = isValidDate ? parsedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '';

      return { note: event.note, time: formattedTime, date: formattedDate, fullTimestamp: event.timestamp };
    }
    return null;
  };

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <header className="fixed top-0 inset-x-0 z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] pt-safe">
        <div className="h-16 px-container-padding-mobile flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <img alt="Brand logo" className="h-28 w-auto object-contain" src="https://res.cloudinary.com/twnsqgoa/image/upload/v1790070307/Untitled_design.png" />
            <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface ml-space-2xs truncate max-w-[120px]">Orders History</span>
          </div>
          {/* <div className="flex items-center gap-space-xs">
            <button aria-label="Search catalog" className="min-w-[48px] min-h-[48px] w-12 h-12 flex items-center justify-center text-on-surface-variant hover:text-secondary active:scale-95 transition-all rounded-full" onClick={() => navigate('/shop')}>
              <span className="material-symbols-outlined text-[24px]">search</span>
            </button>
            <div className="flex items-center justify-center pl-space-2xs cursor-pointer" onClick={() => navigate('/profile')}>
              <img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-outline-variant/30 bg-surface-container" src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || user?.fullName || 'Guest'}`} />
            </div>
          </div> */}
        </div>
      </header>

      <main className="flex flex-col relative w-full pt-16 pb-24 bg-surface flex-1">
        <div className="flex flex-col w-full">
          {loading ? (
             <div className="flex-1 flex flex-col items-center justify-center py-20">
               <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-2">progress_activity</span>
               <p className="text-on-surface-variant font-body-md">Loading order tracking...</p>
             </div>
          ) : !selectedOrder ? (
            <div className="flex flex-col items-center justify-center text-center px-4 py-20">
              <div className="p-8 rounded-2xl bg-surface-container-low border border-white/10 max-w-md w-full shadow-2xl">
                <span className="material-symbols-outlined text-[64px] text-outline mb-4">local_shipping</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-2">No Tracking History</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6">You don't have any active or past orders to track right now.</p>
                <button onClick={() => navigate('/products')} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm transition-all shadow-lg">
                  <span className="material-symbols-outlined text-lg">shopping_bag</span>
                  Explore Storefront
                </button>
              </div>
            </div>
          ) : (
            <div className="px-container-padding-mobile pt-space-md space-y-space-md">
              {/* Order Switcher */}
              {orders.length > 1 && (
                <div className="flex flex-col gap-1 mb-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase">Select Order</label>
                  <select
                    value={String(selectedOrder.id)}
                    onChange={(e) => handleSelectOrder(e.target.value)}
                    className="w-full bg-surface-container-high text-on-surface font-mono font-bold text-sm px-space-md py-space-xs rounded-xl border border-white/10 focus:outline-none focus:border-secondary cursor-pointer h-12"
                  >
                    {orders.map((ord) => (
                      <option key={ord.id} value={String(ord.id)} className="bg-[#171b26] text-white">
                        {ord.orderNumber || `#ORD-${ord.id}`} — ${parsePrice(ord.totalAmount).toFixed(2)} ({ord.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Top Status Banner Card */}
              <div className="relative overflow-hidden rounded-xl bg-surface-container p-space-md shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-secondary/10 blur-2xl pointer-events-none"></div>
                <div className="flex items-start justify-between gap-space-xs relative z-10">
                  <div>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">Tracking Number</span>
                    <div className="flex items-center gap-space-2xs">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-mono tracking-tight">{selectedOrder.orderNumber || `#ORD-${selectedOrder.id}`}</span>
                      <button className="p-1 text-on-surface-variant hover:text-secondary active:scale-90 transition-transform" onClick={() => { navigator.clipboard.writeText(selectedOrder.orderNumber || `ORD-${selectedOrder.id}`); showToast('Tracking ID copied!'); }}>
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                    </div>
                  </div>
                  {selectedOrder.status === 'SHIPPED' && (
                    <div className="flex items-center gap-1.5 px-space-xs py-1 rounded-full bg-secondary-container/20 shadow-[0_0_18px_rgba(6,182,212,0.35)]">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                      </span>
                      <span className="font-label-sm text-label-sm text-secondary font-semibold">Out for Final Delivery</span>
                    </div>
                  )}
                  {selectedOrder.status === 'DELIVERED' && (
                    <div className="flex items-center gap-1.5 px-space-xs py-1 rounded-full bg-tertiary-container/20 shadow-[0_0_18px_rgba(78,222,163,0.35)]">
                      <span className="relative flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
                      </span>
                      <span className="font-label-sm text-label-sm text-tertiary font-semibold">Delivered</span>
                    </div>
                  )}
                </div>
                <div className="mt-space-md pt-space-xs flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">schedule</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Status Details</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface">{selectedOrder.status}</span>
                    </div>
                  </div>
                  <span className="px-space-xs py-1 rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">VET Express</span>
                </div>
              </div>

              {/* Live GPS Dispatch Map View - Only show if shipped */}
              {selectedOrder.status === 'SHIPPED' && (
              <div className="relative overflow-hidden rounded-xl bg-surface-container-low shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-surface-container-lowest/40 pointer-events-none"></div>
                <div className="absolute top-space-sm left-space-sm right-space-sm flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2 px-space-sm py-1.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-lg pointer-events-auto">
                    <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_rgba(78,222,163,0.8)]"></div>
                    <span className="font-label-sm text-label-sm text-on-surface font-medium">GPS Radar Live</span>
                  </div>
                  <div className="px-space-xs py-1 rounded-full bg-primary/20 backdrop-blur-md text-primary font-label-sm text-label-sm font-semibold pointer-events-auto">
                    {selectedOrder.address?.city || 'Phnom Penh'}
                  </div>
                </div>
                <div className="absolute bottom-space-sm inset-x-space-sm flex items-center justify-between p-space-sm rounded-xl bg-surface-container-high/95 backdrop-blur-xl shadow-[0_12px_32px_-4px_rgba(0,0,0,0.7)]">
                  <div className="flex items-center gap-space-xs">
                    <div className="relative w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shadow-[0_0_16px_rgba(128,131,255,0.5)]">
                      <span className="material-symbols-outlined text-[20px]">two_wheeler</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-headline-sm text-headline-sm text-on-surface">Mr. Vireak</span>
                        <span className="font-label-sm text-label-sm text-tertiary">Approaching</span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant block truncate max-w-[150px]">{selectedOrder.address?.streetLine || 'Local street'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <button onClick={() => setIsChatSheetOpen(true)} className="w-10 h-10 rounded-full bg-secondary/20 text-secondary flex items-center justify-center active:scale-95 transition-all">
                       <span className="material-symbols-outlined text-[20px]">chat</span>
                    </button>
                  </div>
                </div>
              </div>
              )}

              {/* Vertical Step-by-Step Delivery Timeline */}
              <div className="rounded-xl bg-surface-container p-space-md shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between mb-space-md">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">Delivery Progress</h2>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">5 Milestones</span>
                </div>
                <div className="relative pl-6 space-y-space-lg">
                  {/* Connecting Glowing Track Background */}
                  <div className="absolute left-2.5 top-3 bottom-5 w-0.5 bg-surface-container-highest"></div>
                  
                  {/* Progress Fill Gradient based on status */}
                  <div className={`absolute left-2.5 top-3 w-0.5 bg-gradient-to-b from-tertiary via-secondary to-primary shadow-[0_0_10px_rgba(99,102,241,0.6)] ${
                    selectedOrder.status === 'DELIVERED' ? 'h-[100%]' :
                    selectedOrder.status === 'SHIPPED' ? 'h-[75%]' :
                    selectedOrder.status === 'PROCESSING' ? 'h-[50%]' :
                    selectedOrder.status === 'CONFIRMED' ? 'h-[25%]' : 'h-0'
                  }`}></div>

                  {/* Step 1: Placed (PENDING) */}
                  <div className={`relative ${getStepStatus(selectedOrder.status, 'placed') ? 'group' : 'opacity-60'}`}>
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-surface-container flex items-center justify-center">
                      {getStepStatus(selectedOrder.status, 'placed') ? (
                        <div className="w-4 h-4 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-[0_0_12px_rgba(78,222,163,0.6)]">
                          <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                        </div>
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full bg-surface-container-highest flex items-center justify-center">
                          <span className="material-symbols-outlined text-[10px] text-on-surface-variant">shopping_cart_checkout</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className={`font-headline-sm text-headline-sm ${getStepStatus(selectedOrder.status, 'placed') ? 'text-on-surface' : 'text-on-surface-variant'}`}>Order Placed</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{getStepTrackingInfo('PENDING')?.time || ''}</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        {getStepTrackingInfo('PENDING')?.note || 'Order has been placed.'}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Verified (CONFIRMED) */}
                  <div className={`relative ${getStepStatus(selectedOrder.status, 'verified') ? 'group' : 'opacity-60'}`}>
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-surface-container flex items-center justify-center">
                      {getStepStatus(selectedOrder.status, 'verified') ? (
                        <div className="w-4 h-4 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-[0_0_12px_rgba(78,222,163,0.6)]">
                          <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                        </div>
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full bg-surface-container-highest flex items-center justify-center">
                          <span className="material-symbols-outlined text-[10px] text-on-surface-variant">verified</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className={`font-headline-sm text-headline-sm ${getStepStatus(selectedOrder.status, 'verified') ? 'text-on-surface' : 'text-on-surface-variant'}`}>Payment Confirmed</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{getStepTrackingInfo('CONFIRMED')?.time || ''}</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        {getStepTrackingInfo('CONFIRMED')?.note || 'Payment verified.'}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Processing (PROCESSING) */}
                  <div className={`relative ${getStepStatus(selectedOrder.status, 'processing') ? 'group' : 'opacity-60'}`}>
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-surface-container flex items-center justify-center">
                      {getStepStatus(selectedOrder.status, 'processing') ? (
                        selectedOrder.status === 'PROCESSING' ? (
                          <div className="relative w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-[0_0_18px_rgba(128,131,255,0.9)] animate-pulse">
                            <span className="material-symbols-outlined text-[13px] text-on-primary">inventory_2</span>
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-[0_0_12px_rgba(78,222,163,0.6)]">
                            <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                          </div>
                        )
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full bg-surface-container-highest flex items-center justify-center">
                          <span className="material-symbols-outlined text-[10px] text-on-surface-variant">inventory_2</span>
                        </div>
                      )}
                    </div>
                    <div className={`flex flex-col ${selectedOrder.status === 'PROCESSING' ? 'p-space-xs rounded-lg bg-surface-container-high/60' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-headline-sm text-headline-sm ${selectedOrder.status === 'PROCESSING' ? 'text-primary' : getStepStatus(selectedOrder.status, 'processing') ? 'text-on-surface' : 'text-on-surface-variant'}`}>Order Processing</span>
                          {selectedOrder.status === 'PROCESSING' && <span className="px-1.5 py-0.2 rounded bg-secondary-container/30 text-secondary font-label-sm text-[10px] font-bold">CURRENT</span>}
                        </div>
                        <span className={`font-label-sm text-label-sm ${selectedOrder.status === 'PROCESSING' ? 'text-primary' : 'text-on-surface-variant'} font-mono`}>{getStepTrackingInfo('PROCESSING')?.time || ''}</span>
                      </div>
                      <p className={`font-body-sm text-body-sm ${selectedOrder.status === 'PROCESSING' ? 'text-on-surface' : 'text-on-surface-variant'} mt-1`}>
                        {getStepTrackingInfo('PROCESSING')?.note || 'Order is being processed.'}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Shipped (SHIPPED) */}
                  <div className={`relative ${getStepStatus(selectedOrder.status, 'shipped') ? 'group' : 'opacity-60'}`}>
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-surface-container flex items-center justify-center">
                      {getStepStatus(selectedOrder.status, 'shipped') ? (
                        selectedOrder.status === 'SHIPPED' ? (
                          <div className="relative w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-[0_0_18px_rgba(128,131,255,0.9)] animate-pulse">
                            <span className="material-symbols-outlined text-[13px] text-on-primary">local_shipping</span>
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-[0_0_12px_rgba(78,222,163,0.6)]">
                            <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                          </div>
                        )
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full bg-surface-container-highest flex items-center justify-center">
                          <span className="material-symbols-outlined text-[10px] text-on-surface-variant">local_shipping</span>
                        </div>
                      )}
                    </div>
                    <div className={`flex flex-col ${selectedOrder.status === 'SHIPPED' ? 'p-space-xs rounded-lg bg-surface-container-high/60' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-headline-sm text-headline-sm ${selectedOrder.status === 'SHIPPED' ? 'text-primary' : getStepStatus(selectedOrder.status, 'shipped') ? 'text-on-surface' : 'text-on-surface-variant'}`}>Shipped</span>
                          {selectedOrder.status === 'SHIPPED' && <span className="px-1.5 py-0.2 rounded bg-secondary-container/30 text-secondary font-label-sm text-[10px] font-bold">CURRENT</span>}
                        </div>
                        <span className={`font-label-sm text-label-sm ${selectedOrder.status === 'SHIPPED' ? 'text-primary' : 'text-on-surface-variant'} font-mono`}>{getStepTrackingInfo('SHIPPED')?.time || ''}</span>
                      </div>
                      <p className={`font-body-sm text-body-sm ${selectedOrder.status === 'SHIPPED' ? 'text-on-surface' : 'text-on-surface-variant'} mt-1`}>
                        {getStepTrackingInfo('SHIPPED')?.note || 'Order has been shipped.'}
                      </p>
                    </div>
                  </div>

                  {/* Step 5: Delivered (DELIVERED) */}
                  <div className={`relative ${getStepStatus(selectedOrder.status, 'delivered') ? 'group' : 'opacity-60'}`}>
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-surface-container flex items-center justify-center">
                      {getStepStatus(selectedOrder.status, 'delivered') ? (
                        <div className="w-4 h-4 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-[0_0_12px_rgba(78,222,163,0.6)]">
                          <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                        </div>
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full bg-surface-container-highest flex items-center justify-center">
                          <span className="material-symbols-outlined text-[10px] text-on-surface-variant">home</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className={`font-headline-sm text-headline-sm ${getStepStatus(selectedOrder.status, 'delivered') ? 'text-on-surface' : 'text-on-surface-variant'}`}>Delivered</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">{getStepTrackingInfo('DELIVERED')?.time || ''}</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        {getStepTrackingInfo('DELIVERED')?.note || 'Order has been delivered.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Item Mini Card */}
              <div className="rounded-xl bg-surface-container p-space-md shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] space-y-space-xs">
                <div className="flex items-center justify-between mb-space-xs border-b border-white/5 pb-2">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Order Content</span>
                  <span className="font-label-sm text-label-sm text-tertiary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> {selectedOrder.items?.length || 0} Items
                  </span>
                </div>
                
                {selectedOrder.items?.map((item: any) => {
                  const imgUrl = item.product?.images?.find((img: any) => img.isPrimary)?.imageUrl || item.product?.images?.[0]?.imageUrl || 'https://placehold.co/150';
                  return (
                    <div key={item.id} className="flex items-center gap-space-sm p-space-xs rounded-lg bg-surface-container-low mb-2">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container-highest flex-shrink-0">
                        <img className="w-full h-full object-cover" alt={item.productNameSnapshot} src={imgUrl} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-headline-sm text-headline-sm text-on-surface truncate">{item.productNameSnapshot}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-body-sm text-body-sm text-on-surface-variant">Qty: {item.quantity}</span>
                          <span className="font-price-card text-[14px] text-on-surface font-semibold">${parsePrice(item.unitPrice).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Telegram Support Hotline Card */}
              <div className="rounded-xl bg-gradient-to-r from-surface-container to-surface-container-high p-space-md shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] flex items-center justify-between mb-space-md border border-white/5">
                <div className="flex items-center gap-space-sm">
                  <div className="w-11 h-11 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary shadow-[0_0_16px_rgba(3,181,211,0.3)]">
                    <span className="material-symbols-outlined text-[24px]">support_agent</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm text-secondary block font-semibold">Priority Concierge Help</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface block">Telegram Live Support</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">+855 23 999 888 (24/7)</span>
                  </div>
                </div>
                <a className="px-space-sm py-2 rounded-xl bg-secondary text-on-secondary font-label-md text-label-md font-bold shadow-[0_0_16px_rgba(76,215,246,0.4)] active:scale-95 transition-transform flex items-center gap-1" href="https://t.me/" rel="noopener noreferrer" target="_blank">
                  <span>Chat</span>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Toast Notification */}
      <div className={`fixed bottom-20 inset-x-6 z-50 transform transition-all duration-300 flex justify-center ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}`}>
        <div className="px-space-md py-space-xs rounded-full bg-surface-bright text-on-surface shadow-2xl flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
          <span className="font-body-sm text-body-sm">{toastMessage}</span>
        </div>
      </div>

      {/* Chat Sheet */}
      <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity flex flex-col justify-end ${isChatSheetOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`w-full bg-surface-container-high rounded-t-2xl p-space-md shadow-[0_24px_60px_-8px_rgba(0,0,0,0.85)] max-h-[618px] flex flex-col transition-transform duration-300 ${isChatSheetOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center justify-between pb-space-sm">
            <div className="flex items-center gap-space-xs">
              <div className="w-3 h-3 rounded-full bg-tertiary animate-pulse"></div>
              <span className="font-headline-sm text-headline-sm text-on-surface">Direct Courier Message</span>
            </div>
            <button className="p-1 rounded-full text-on-surface-variant hover:text-on-surface" onClick={() => setIsChatSheetOpen(false)}>
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div className="flex-1 py-space-sm space-y-space-xs overflow-y-auto">
            <div className="p-2.5 rounded-lg bg-surface-container max-w-[80%] text-on-surface-variant font-body-sm text-body-sm">
              Hello! I am on my way. Will reach your location soon.
            </div>
          </div>
          <div className="pt-space-sm flex gap-space-xs">
            <input className="flex-1 h-11 px-space-sm rounded-xl bg-surface-container-lowest text-on-surface font-body-sm text-body-sm placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Type quick reply..." type="text" />
            <button className="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center active:scale-95 transition-transform" onClick={() => { showToast('Message sent!'); setIsChatSheetOpen(false); }}>
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 w-full z-40 pb-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.7)]">
        <div className="flex justify-around items-center h-16 px-space-xs">
          <a className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl text-on-surface-variant hover:text-on-surface transition-all duration-200 group" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            <div className="flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-200">
              <span className="material-symbols-outlined text-[22px]">home</span>
            </div>
            <span className="font-label-sm text-label-sm font-medium tracking-tight">Home</span>
          </a>
          <a className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl text-on-surface-variant hover:text-on-surface transition-all duration-200 group" href="#" onClick={(e) => { e.preventDefault(); navigate('/products'); }}>
            <div className="flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-200">
              <span className="material-symbols-outlined text-[22px]">grid_view</span>
            </div>
            <span className="font-label-sm text-label-sm font-medium tracking-tight">Catalog</span>
          </a>
          <a className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl text-on-surface-variant hover:text-on-surface transition-all duration-200 group" href="#" onClick={(e) => { e.preventDefault(); navigate('/cart'); }}>
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-200">
              <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
            </div>
            <span className="font-label-sm text-label-sm font-medium tracking-tight">Cart</span>
          </a>
          <a aria-current="page" className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-all duration-200 group text-primary [&>div]:bg-primary/10 [&>div]:scale-105" href="#">
            <div className="flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-200">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
            </div>
            <span className="font-label-sm text-label-sm font-medium tracking-tight">Orders</span>
          </a>
          <a className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl text-on-surface-variant hover:text-on-surface transition-all duration-200 group" href="#" onClick={(e) => { e.preventDefault(); navigate('/profile'); }}>
            <div className="flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-200">
              <span className="material-symbols-outlined text-[22px]">person</span>
            </div>
            <span className="font-label-sm text-label-sm font-medium tracking-tight">Profile</span>
          </a>
        </div>
      </nav>
    </div>
  );
};

export default MobileOrdersPage;
