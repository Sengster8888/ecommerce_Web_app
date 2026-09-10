import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { StorefrontHeader } from '../components/storefront/StorefrontHeader';
import { StorefrontFooter } from '../components/storefront/StorefrontFooter';
import { ToastNotification } from '../components/storefront/ToastNotification';
import { useOrderDetail, exchangeRate } from '../features/orders/hooks/useOrderDetail';
import { parsePrice, formatKHR } from '../utils/price.utils';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
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
  } = useOrderDetail(id);

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const prevPaidRef = useRef(isPaid);

  useEffect(() => {
    if (!prevPaidRef.current && isPaid) {
      setShowSuccessToast(true);
      setShowSuccessModal(true);
      const timer = setTimeout(() => setShowSuccessToast(false), 6000);
      return () => clearTimeout(timer);
    }
    prevPaidRef.current = isPaid;
  }, [isPaid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col justify-between">
        <StorefrontHeader />
        <main className="w-full pt-28 pb-space-2xl bg-surface flex-1 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-2">
            progress_activity
          </span>
          <p className="text-on-surface-variant font-body-md">Loading payment gateway &amp; order details...</p>
        </main>
        <StorefrontFooter />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col justify-between">
        <StorefrontHeader />
        <main className="w-full pt-28 pb-space-2xl bg-surface flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="p-8 rounded-2xl bg-surface-container-low border border-white/10 max-w-md w-full shadow-2xl">
            <span className="material-symbols-outlined text-[64px] text-secondary mb-4">
              error_outline
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-2">Order Not Found</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              We couldn't find the requested order record or access was denied.
            </p>
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm transition-all shadow-lg"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back to My Orders
            </Link>
          </div>
        </main>
        <StorefrontFooter />
      </div>
    );
  }

  const orderNumDisplay = order.orderNumber || `#ORD-${order.id}`;

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col justify-between">
      <StorefrontHeader />

      <main className="w-full pt-24 pb-space-3xl bg-surface min-h-screen">
        <div className="relative w-full overflow-hidden">
          {/* Ambient Glow Spheres */}
          <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-primary-container/15 blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-space-md lg:px-container-padding-desktop py-space-md">
            {/* Breadcrumbs & Status Bar */}
            <div className="bg-surface-container-low rounded-xl p-space-md lg:p-space-lg mb-space-xl shadow-md border border-white/5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md">
                <div className="flex flex-wrap items-center gap-space-xs text-on-surface-variant font-label-md text-label-md">
                  <Link to="/cart" className="flex items-center gap-space-2xs text-tertiary hover:underline">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span className="font-headline-sm text-headline-sm">1. Cart</span>
                  </Link>
                  <span className="text-outline">/</span>
                  <Link to="/checkout" className="flex items-center gap-space-2xs text-tertiary hover:underline">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span className="font-headline-sm text-headline-sm">2. Shipping</span>
                  </Link>
                  <span className="text-outline">/</span>
                  <span className="flex items-center gap-space-2xs text-secondary font-headline-sm text-headline-sm">
                    {isPaid ? (
                      <span className="material-symbols-outlined text-[18px] text-tertiary">check_circle</span>
                    ) : (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                      </span>
                    )}
                    <span>{isPaid ? '3. Payment Verified' : '3. Payment Gateway (Polling)'}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-space-sm">
                  <div className="bg-surface-container px-space-md py-space-2xs rounded-lg border border-white/5">
                    <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider">ORDER ID</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{orderNumDisplay}</span>
                  </div>
                  <div className="bg-surface-container px-space-md py-space-2xs rounded-lg border border-white/5">
                    <span className="font-label-sm text-label-sm text-tertiary block uppercase tracking-wider">DUE PAYABLE</span>
                    <span className="font-price-card text-price-card text-on-surface font-bold">
                      ${totalAmountUsd.toFixed(2)}{' '}
                      <span className="font-label-sm text-label-sm text-tertiary font-mono">
                        ({totalAmountKhr.toLocaleString()} ៛)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
              {/* Left Hub (Payment Options & QR - 7 Cols) */}
              <div className="lg:col-span-7 flex flex-col gap-space-lg">
                {/* Polling Real-time Card */}
                <div className="bg-surface-container rounded-xl p-space-md lg:p-space-lg shadow-md border border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-sm">
                    <div className="flex items-center gap-space-sm">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center relative ${
                        isPaid ? 'bg-tertiary/20 text-tertiary' : 'bg-secondary/15 text-secondary'
                      }`}>
                        <span className="material-symbols-outlined text-[24px]">
                          {isPaid ? 'verified' : 'sensors'}
                        </span>
                        {!isPaid && (
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-tertiary rounded-full animate-pulse"></span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                          {isPaid ? 'Payment Confirmed & Verified!' : 'Waiting for payment...'}
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {isPaid
                            ? 'Order transitioned to dispatch fulfillment hub.'
                            : 'Live polling Bakong National Gateway & Local Hubs'}
                        </p>
                      </div>
                    </div>

                    {!isPaid && (
                      <div className="text-left sm:text-right">
                        <div className="font-label-sm text-label-sm text-outline uppercase font-semibold">QR EXPIRES IN</div>
                        <div className="font-price-card text-price-card text-secondary font-mono font-bold">
                          {formatTime(secondsLeft)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Visual Progress Bar */}
                  {!isPaid && (
                    <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden mt-space-2xs">
                      <div
                        className="h-full bg-secondary transition-all duration-1000"
                        style={{ width: `${timerPercentage}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Verified Success Card (Shown when Paid or CONFIRMED) */}
                {isPaid && (
                  <div className="bg-surface-container-high rounded-xl p-space-lg shadow-xl text-center space-y-space-md border border-tertiary/30">
                    <div className="w-16 h-16 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center mx-auto shadow-lg">
                      <span className="material-symbols-outlined text-[36px]">check_circle</span>
                    </div>
                    <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                      Payment Verified Instantly!
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
                      We received your transaction via National Bakong Gateway. Order{' '}
                      <span className="text-secondary font-bold">{orderNumDisplay}</span> has been confirmed and queued for express courier dispatch.
                    </p>
                    <div className="pt-space-sm flex items-center justify-center gap-space-sm">
                      <Link
                        to="/orders"
                        className="py-space-sm px-space-lg rounded-xl bg-tertiary text-on-tertiary-container font-label-lg text-label-lg font-bold shadow-md hover:brightness-110 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                        <span>Track Order Status</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Method Selector Tabs (Only when Pending) */}
                {!isPaid && (
                  <>
                    <div className="flex rounded-xl bg-surface-container-lowest p-space-2xs border border-white/5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('khqr')}
                        className={`flex-1 py-space-sm px-space-md rounded-lg font-label-lg text-label-lg transition-all flex items-center justify-center gap-space-2xs cursor-pointer ${
                          activeTab === 'khqr'
                            ? 'bg-surface-container text-secondary font-bold shadow-sm'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                        <span>Bakong KHQR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('transfer')}
                        className={`flex-1 py-space-sm px-space-md rounded-lg font-label-lg text-label-lg transition-all flex items-center justify-center gap-space-2xs cursor-pointer ${
                          activeTab === 'transfer'
                            ? 'bg-surface-container text-secondary font-bold shadow-sm'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">account_balance</span>
                        <span>Bank Transfer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('card')}
                        className={`flex-1 py-space-sm px-space-md rounded-lg font-label-lg text-label-lg transition-all flex items-center justify-center gap-space-2xs cursor-pointer ${
                          activeTab === 'card'
                            ? 'bg-surface-container text-secondary font-bold shadow-sm'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">credit_card</span>
                        <span>Card Fallback</span>
                      </button>
                    </div>

                    {/* TAB 1: KHQR Gateway Panel */}
                    {activeTab === 'khqr' && (
                      <div className="flex flex-col gap-space-lg">
                        <div className="bg-surface-container rounded-xl p-space-lg lg:p-space-xl shadow-xl flex flex-col items-center text-center relative overflow-hidden border border-white/5">
                          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-tertiary via-secondary to-primary-container"></div>
                          
                          {/* KHQR Branding Card */}
                          <div className="w-full max-w-sm bg-surface-container-lowest rounded-xl p-space-md mb-space-md flex items-center justify-between shadow-inner border border-white/5">
                            <div className="flex items-center gap-space-xs">
                              <div className="w-7 h-7 rounded bg-error-container text-error flex items-center justify-center font-bold text-xs">
                                KH
                              </div>
                              <div className="text-left">
                                <span className="font-headline-sm text-headline-sm text-on-surface block leading-tight font-bold">
                                  KHQR Pay
                                </span>
                                <span className="font-label-sm text-label-sm text-tertiary">
                                  NBC Certified System
                                </span>
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-secondary">verified_user</span>
                          </div>

                          {/* High Contrast Real Scannable QR Surface */}
                          <div className="p-space-md bg-white rounded-xl shadow-2xl relative mb-space-md flex flex-col items-center justify-center border border-white/20">
                            <div className="w-64 h-64 flex items-center justify-center p-2 bg-white rounded-lg">
                              <QRCodeSVG
                                value={
                                  paymentData?.qrString ||
                                  `00020101021229210017hongseng_lim@bkrt5204599953038405402${totalAmountUsd.toFixed(2)}5802KH5912Lim Hongseng6010Phnom Penh62110107${orderNumDisplay}6304`
                                }
                                size={240}
                                level="M"
                                includeMargin={true}
                              />
                            </div>
                          </div>

                          {/* Merchant & Price Details */}
                          <div className="space-y-space-2xs mb-space-lg">
                            <div className="flex items-center justify-center gap-space-2xs">
                              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                                KHMER STORE Cambodia
                              </span>
                              <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
                            </div>
                            <div className="font-price-hero text-price-hero text-on-surface font-bold">
                              ${totalAmountUsd.toFixed(2)}{' '}
                              <span className="font-headline-md text-headline-md text-secondary font-mono">
                                / {totalAmountKhr.toLocaleString()} ៛
                              </span>
                            </div>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">
                              Scan using ABA Mobile, Wing, ACLEDA, or any Bakong-enabled Cambodian App
                            </p>
                          </div>

                          {/* Supported Local Payment Rails */}
                          <div className="w-full bg-surface-container-low rounded-xl p-space-md mb-space-lg border border-white/5">
                            <span className="font-label-sm text-label-sm text-on-surface-variant block mb-space-sm uppercase tracking-wider font-semibold">
                              Accepted KHQR Mobile Banking Apps
                            </span>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-space-xs">
                              <div className="bg-surface-container px-space-xs py-space-xs rounded-lg text-center font-label-sm text-label-sm text-secondary font-bold">
                                ABA PAY
                              </div>
                              <div className="bg-surface-container px-space-xs py-space-xs rounded-lg text-center font-label-sm text-label-sm text-primary font-bold">
                                Wing
                              </div>
                              <div className="bg-surface-container px-space-xs py-space-xs rounded-lg text-center font-label-sm text-label-sm text-tertiary font-bold">
                                ACLEDA
                              </div>
                              <div className="bg-surface-container px-space-xs py-space-xs rounded-lg text-center font-label-sm text-label-sm text-on-surface font-bold">
                                Canadia
                              </div>
                              <div className="bg-surface-container px-space-xs py-space-xs rounded-lg text-center font-label-sm text-label-sm text-on-surface font-bold">
                                Sathapana
                              </div>
                              <div className="bg-surface-container px-space-xs py-space-xs rounded-lg text-center font-label-sm text-label-sm text-error font-bold">
                                Bakong
                              </div>
                            </div>
                          </div>

                          {/* KHQR Actions */}
                          <div className="w-full flex flex-col sm:flex-row items-center gap-space-sm">
                            <button
                              type="button"
                              onClick={() => {
                                const qrVal = paymentData?.qrString || '';
                                copyToClipboard(qrVal, 'rawqr');
                              }}
                              className="w-full sm:flex-1 py-space-sm px-space-md rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-lg text-label-lg transition-all flex items-center justify-center gap-space-xs cursor-pointer border border-white/5"
                            >
                              <span className="material-symbols-outlined text-[20px]">content_copy</span>
                              <span>{copiedText === 'rawqr' ? 'Copied Payload!' : 'Copy KHQR Data'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(`https://khqr.bakong.nbc.org.kh/pay/${orderNumDisplay}`, 'link')}
                              className="w-full sm:flex-1 py-space-sm px-space-md rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-lg text-label-lg transition-all flex items-center justify-center gap-space-xs cursor-pointer border border-white/5"
                            >
                              <span className="material-symbols-outlined text-[20px]">link</span>
                              <span>{copiedText === 'link' ? 'Copied Link!' : 'Copy Link'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleSimulatePaymentSuccess}
                              className="w-full sm:flex-1 py-space-sm px-space-md rounded-xl bg-tertiary-container hover:bg-tertiary text-on-tertiary-container font-label-lg text-label-lg font-bold transition-all flex items-center justify-center gap-space-xs cursor-pointer shadow-md"
                            >
                              <span className="material-symbols-outlined text-[20px]">play_circle</span>
                              <span>Simulate Paid</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: Direct Bank Transfer Details */}
                    {activeTab === 'transfer' && (
                      <div className="flex flex-col gap-space-md">
                        <div className="bg-surface-container rounded-xl p-space-lg shadow-md space-y-space-md border border-white/5">
                          <div className="flex items-center gap-space-xs text-secondary">
                            <span className="material-symbols-outlined">account_balance_wallet</span>
                            <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                              Direct Bank Wire &amp; Deposit
                            </h4>
                          </div>
                          <p className="font-body-md text-body-md text-on-surface-variant">
                            Transfer directly to our designated bank accounts in Phnom Penh. Enter the memo code accurately for instant order reconciliation.
                          </p>

                          {/* Account 1: ABA */}
                          <div className="bg-surface-container-lowest rounded-xl p-space-md flex items-center justify-between border border-white/5">
                            <div>
                              <span className="font-label-sm text-label-sm text-secondary font-bold">ABA BANK (USD / KHR)</span>
                              <div className="font-headline-sm text-headline-sm text-on-surface font-mono font-bold">001 234 567</div>
                              <span className="font-body-sm text-body-sm text-on-surface-variant">Beneficiary: KHMER STORE CAMBODIA CO., LTD.</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard('001234567', 'aba')}
                              className="p-space-xs rounded-lg bg-surface-container hover:bg-surface-bright text-on-surface cursor-pointer border border-white/10"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {copiedText === 'aba' ? 'check' : 'content_copy'}
                              </span>
                            </button>
                          </div>

                          {/* Account 2: ACLEDA */}
                          <div className="bg-surface-container-lowest rounded-xl p-space-md flex items-center justify-between border border-white/5">
                            <div>
                              <span className="font-label-sm text-label-sm text-tertiary font-bold">ACLEDA BANK PLC</span>
                              <div className="font-headline-sm text-headline-sm text-on-surface font-mono font-bold">100 889 923 11</div>
                              <span className="font-body-sm text-body-sm text-on-surface-variant">Beneficiary: KHMER STORE CAMBODIA CO., LTD.</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard('10088992311', 'acleda')}
                              className="p-space-xs rounded-lg bg-surface-container hover:bg-surface-bright text-on-surface cursor-pointer border border-white/10"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {copiedText === 'acleda' ? 'check' : 'content_copy'}
                              </span>
                            </button>
                          </div>

                          {/* Crucial Memo Banner */}
                          <div className="bg-primary-container/20 rounded-xl p-space-md flex items-center justify-between border border-primary/30">
                            <div className="flex items-center gap-space-sm">
                              <span className="material-symbols-outlined text-primary text-[28px]">pin</span>
                              <div>
                                <span className="font-label-sm text-label-sm text-primary uppercase font-bold">
                                  Mandatory Transfer Memo / Remark
                                </span>
                                <div className="font-headline-md text-headline-md text-on-surface font-mono font-bold">
                                  {orderNumDisplay}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(orderNumDisplay, 'memo')}
                              className="px-space-sm py-space-xs rounded-lg bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold cursor-pointer"
                            >
                              {copiedText === 'memo' ? 'Copied Memo' : 'Copy Memo'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: International Card Fallback */}
                    {activeTab === 'card' && (
                      <div className="flex flex-col gap-space-md">
                        <div className="bg-surface-container rounded-xl p-space-lg shadow-md border border-white/5 space-y-space-md">
                          <div className="flex items-center justify-between mb-space-md">
                            <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                              International Card Payment
                            </h4>
                            <div className="flex items-center gap-space-2xs text-on-surface-variant">
                              <span className="material-symbols-outlined text-[20px]">lock</span>
                              <span className="font-label-sm text-label-sm">256-Bit Encrypted</span>
                            </div>
                          </div>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSimulatePaymentSuccess();
                            }}
                            className="space-y-space-md"
                          >
                            <div>
                              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-space-2xs">
                                Cardholder Full Name
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="SOKHA CHAN"
                                className="w-full h-12 bg-surface-container-lowest rounded-xl px-space-md font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container-high transition-colors border border-white/10"
                              />
                            </div>
                            <div>
                              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-space-2xs">
                                Card Number
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="4111 2222 3333 4444"
                                className="w-full h-12 bg-surface-container-lowest rounded-xl px-space-md font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container-high transition-colors border border-white/10"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-space-md">
                              <div>
                                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-space-2xs">
                                  Expiry Date
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="MM/YY"
                                  className="w-full h-12 bg-surface-container-lowest rounded-xl px-space-md font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container-high transition-colors border border-white/10"
                                />
                              </div>
                              <div>
                                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-space-2xs">
                                  Security CVV
                                </label>
                                <input
                                  type="password"
                                  required
                                  maxLength={4}
                                  placeholder="123"
                                  className="w-full h-12 bg-surface-container-lowest rounded-xl px-space-md font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container-high transition-colors border border-white/10"
                                />
                              </div>
                            </div>
                            <button
                              type="submit"
                              className="w-full py-space-md rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg font-bold transition-all shadow-md cursor-pointer"
                            >
                              Authorize ${totalAmountUsd.toFixed(2)} USD
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Right Hub (Order & Delivery Snapshot - 5 Cols) */}
              <div className="lg:col-span-5 flex flex-col gap-space-lg">
                {/* Destination Card */}
                {order.address && (
                  <div className="bg-surface-container rounded-xl p-space-md lg:p-space-lg shadow-md border border-white/5">
                    <div className="flex items-center justify-between mb-space-sm">
                      <div className="flex items-center gap-space-2xs text-secondary">
                        <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Delivery Address</span>
                      </div>
                      <span className="font-label-sm text-label-sm px-space-xs py-space-2xs bg-tertiary/10 text-tertiary rounded font-medium">
                        Express Dispatch
                      </span>
                    </div>
                    <div className="space-y-space-2xs text-on-surface-variant font-body-md text-body-md">
                      <div className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        {order.address.recipientName} ({order.address.label})
                      </div>
                      <div className="flex items-center gap-space-2xs text-secondary font-mono">
                        <span className="material-symbols-outlined text-[16px]">call</span>
                        <span>{order.address.phone}</span>
                      </div>
                      <div className="flex items-start gap-space-2xs">
                        <span className="material-symbols-outlined text-[16px] shrink-0 mt-1 text-outline">location_on</span>
                        <span>
                          {order.address.streetLine}, {order.address.commune ? `${order.address.commune}, ` : ''}
                          {order.address.city}, {order.address.province}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items Condensed Breakdown */}
                <div className="bg-surface-container rounded-xl p-space-md lg:p-space-lg shadow-md border border-white/5">
                  <div className="flex items-center justify-between mb-space-md">
                    <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Purchased Items ({order.items?.length || 0})
                    </h4>
                  </div>
                  <div className="space-y-space-md max-h-72 overflow-y-auto pr-1">
                    {order.items?.map((item) => {
                      const uPrice = parsePrice(item.unitPrice);
                      const lTotal = parsePrice(item.lineTotal || uPrice * item.quantity);
                      const imgUrl =
                        item.product?.images?.find((img) => img.isPrimary)?.imageUrl ||
                        item.product?.images?.[0]?.imageUrl ||
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80';

                      return (
                        <div key={item.id} className="flex items-center gap-space-md">
                          <img
                            src={imgUrl}
                            alt={item.productNameSnapshot}
                            className="w-16 h-16 rounded-lg object-cover bg-surface-container-lowest shrink-0 border border-white/5"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">
                              {item.productNameSnapshot}
                            </h5>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">
                              Qty: {item.quantity} • ${uPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-price-card text-price-card text-on-surface font-bold">
                              ${lTotal.toFixed(2)}
                            </div>
                            <div className="font-label-sm text-label-sm text-outline font-mono">
                              {formatKHR(lTotal * exchangeRate)} ៛
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="bg-surface-container rounded-xl p-space-md lg:p-space-lg shadow-md space-y-space-sm border border-white/5">
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs font-bold">
                    Payment Breakdown
                  </h4>
                  <div className="flex justify-between font-body-md text-body-md text-on-surface-variant">
                    <span>Subtotal</span>
                    <span className="text-on-surface font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-body-md text-body-md text-on-surface-variant">
                    <span>Phnom Penh Express Courier</span>
                    <span className="text-tertiary font-medium">FREE</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between font-body-md text-body-md text-secondary">
                      <span className="flex items-center gap-space-2xs">
                        <span className="material-symbols-outlined text-[16px]">sell</span>
                        Promo Voucher Discount
                      </span>
                      <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-space-sm mt-space-sm bg-surface-container-lowest/60 rounded-lg p-space-md border border-white/5">
                    <div className="flex justify-between items-baseline">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Total Payable</span>
                      <div className="text-right">
                        <span className="font-price-hero text-price-hero text-secondary font-bold">
                          ${totalAmountUsd.toFixed(2)}
                        </span>
                        <div className="font-body-sm text-body-sm text-outline font-mono">
                          ≈ {totalAmountKhr.toLocaleString()} KHR (Cambodian Riel)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cambodian Concierge & Support Box */}
                <div className="bg-surface-container-low rounded-xl p-space-md flex items-center justify-between shadow-sm border border-white/5">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[22px]">support_agent</span>
                    </div>
                    <div>
                      <h5 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Need Payment Assistance?</h5>
                      <p className="font-body-sm text-body-sm text-outline">Telegram: @CambodianEStoreSupport</p>
                    </div>
                  </div>
                  <a
                    href="https://t.me"
                    target="_blank"
                    rel="noreferrer"
                    className="px-space-sm py-space-xs bg-surface-container-high hover:bg-surface-bright rounded-lg font-label-md text-label-md text-on-surface flex items-center gap-space-2xs shrink-0"
                  >
                    <span>Live Chat</span>
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                </div>

                {/* Bottom Navigation / Cancel Link */}
                <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm px-space-2xs">
                  <Link to="/orders" className="hover:text-error flex items-center gap-space-2xs transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    <span>Return to My Orders</span>
                  </Link>
                  <span className="text-outline">Encrypted &amp; Certified by NBC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Success Modal Popup */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#131722] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(16,185,129,0.3)] text-center space-y-5 animate-scaleUp">
            {/* Close X Button */}
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/50 hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Glowing Success Badge Icon */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.6)]">
                <span className="material-symbols-outlined text-[44px] font-bold">check_circle</span>
              </div>
            </div>

            {/* Title & Details */}
            <div className="space-y-2">
              <h3 className="font-outfit font-extrabold text-2xl text-white tracking-tight">
                Payment Successful!
              </h3>
              <p className="text-slate-300 font-sans text-xs">
                Your transaction via NBC Bakong KHQR has been verified & confirmed.
              </p>
            </div>

            {/* Order Info Card */}
            <div className="bg-[#1a1f2c] rounded-2xl p-4 border border-white/5 space-y-2 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Order Reference:</span>
                <span className="font-mono font-bold text-emerald-400">{orderNumDisplay}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-mono font-bold text-white">${totalAmountUsd.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Khmer Riel:</span>
                <span className="font-mono text-cyan-400">{totalAmountKhr.toLocaleString()} ៛</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-outfit font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                <span>Track Order Fulfillment</span>
              </button>
              <Link
                to="/products"
                className="w-full py-3 px-6 rounded-2xl bg-[#1c2230] hover:bg-[#252c3d] text-slate-300 font-sans text-xs font-semibold flex items-center justify-center gap-2 transition-all block"
              >
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      <ToastNotification message="🎉 Payment Confirmed & Verified Instantly via Bakong KHQR!" isVisible={showSuccessToast} />
      <StorefrontFooter />
    </div>
  );
};

export default OrderDetailPage;
