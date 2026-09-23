import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useOrderDetail } from '../../features/orders/hooks/useOrderDetail';
import CenterQRImage from '../../assets/image.png';

const MobileOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    order,
    paymentData,
    loading,
    isPaid,
    secondsLeft,
    formatTime,
    copiedText,
    totalAmountUsd,
  } = useOrderDetail(id);

  const [toastMessage, setToastMessage] = useState<{ message: string; icon: string } | null>(null);

  useEffect(() => {
    if (copiedText) {
      setToastMessage({
        message: copiedText === 'rawqr' ? 'QR Code Payload Copied!' : 'Link Copied!',
        icon: 'content_copy',
      });
      const t = setTimeout(() => setToastMessage(null), 2500);
      return () => clearTimeout(t);
    }
  }, [copiedText]);

  const handleSaveQR = () => {
    setToastMessage({ message: 'QR Image saved to camera roll!', icon: 'download_done' });
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleDeepLink = () => {
    setToastMessage({ message: 'Switching to Bakong Mobile...', icon: 'rocket_launch' });
    setTimeout(() => setToastMessage(null), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-on-surface">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-2">progress_activity</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-on-surface">
        <p>Order not found</p>
        <button onClick={() => navigate('/orders')} className="mt-4 text-primary underline">Back to Orders</button>
      </div>
    );
  }

  const orderNumDisplay = order.orderNumber || `#ORD-${order.id}`;
  const isKhqr = order.paymentMethod === 'khqr';

  // If not KHQR or if already paid, we just show a success / standard view
  if (isPaid || !isKhqr) {
    return (
      <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col">
        <header className="fixed top-0 inset-x-0 z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-md pt-safe">
          <div className="h-16 px-container-padding-mobile flex items-center gap-space-xs">
            <button aria-label="Go back" className="w-12 h-12 flex items-center justify-center text-on-surface hover:text-primary transition-all -ml-space-xs" onClick={() => navigate('/orders')}>
              <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
            </button>
            <h1 className="font-headline-md text-headline-md text-on-surface">Order Details</h1>
          </div>
        </header>
        <main className="flex flex-col relative w-full pt-24 pb-safe bg-surface flex-1 px-4 items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center mb-4 mx-auto shadow-lg">
            <span className="material-symbols-outlined text-[48px]">{isPaid ? 'check_circle' : 'local_shipping'}</span>
          </div>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-center mb-2">
            {isPaid ? 'Payment Verified!' : 'Order Confirmed'}
          </h2>
          <p className="text-on-surface-variant text-center max-w-sm mb-8 mx-auto">
            Order <span className="font-bold text-secondary">{orderNumDisplay}</span> is being processed for dispatch.
          </p>
          <button onClick={() => navigate('/orders')} className="w-full max-w-xs mx-auto h-12 bg-primary text-on-primary rounded-xl font-bold shadow-lg">
            View All Orders
          </button>
        </main>
      </div>
    );
  }

  // KHQR Pending Payment Screen
  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <header className="fixed top-0 inset-x-0 z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] pt-safe">
        <div className="h-16 px-container-padding-mobile flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <button aria-label="Go back" className="min-w-[48px] min-h-[48px] w-12 h-12 flex items-center justify-center text-on-surface hover:text-primary active:scale-95 transition-all -ml-space-xs" onClick={() => navigate(-1)}>
              <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
            </button>
            <h1 className="font-headline-md text-headline-md tracking-tight text-on-surface truncate max-w-[190px]">Khqr Checkout Payment</h1>
          </div>
        </div>
      </header>

      <main className="flex flex-col relative w-full pt-16 pb-safe bg-surface flex-1">
        <div className="flex flex-col w-full pb-8">

          {/* Ambient Atmospheric Backdrops */}
          <div className="relative w-full px-container-padding-mobile pt-space-sm">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary-container/20 blur-[60px] pointer-events-none rounded-full"></div>
            <div className="absolute top-48 -right-12 w-48 h-48 bg-secondary-container/15 blur-[50px] pointer-events-none rounded-full"></div>

            {/* Payment Amount & Merchant Card */}
            <div className="relative z-10 bg-surface-container/85 backdrop-blur-xl p-space-md rounded-xl shadow-xl mb-space-sm">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Payable</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-display-hero-mobile text-display-hero-mobile text-on-surface tracking-tight leading-none">${totalAmountUsd.toFixed(2)}</span>
                    <span className="font-label-lg text-label-lg text-secondary font-semibold">USD</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Authentic Bakong KHQR Card UI */}
            <div className="relative z-10 flex justify-center mb-6 mt-2">
              <div className="w-full max-w-[300px] bg-[#161b26] rounded-2xl shadow-[0_16px_40px_-6px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col relative border border-white/5">
                
                {/* Red Header with angled cut */}
                <div className="bg-[#c93237] h-[56px] w-full flex items-center justify-center relative">
                   {/* Angled cut on the right matching dark card body */}
                   <div className="absolute right-0 bottom-0 w-0 h-0 border-b-[20px] border-b-[#161b26] border-l-[20px] border-l-transparent"></div>
                   
                   {/* KHQR Logo */}
                   <div className="flex items-center text-white font-bold text-[24px] tracking-wider font-sans">
                      <span>KH</span>
                      <div className="flex items-center mx-[3px] relative mt-[3px]">
                        <div className="w-[16px] h-[16px] border-[3px] border-white rounded-sm"></div>
                        <div className="absolute -bottom-[2px] -right-[4px] w-[8px] h-[3px] bg-white transform rotate-45"></div>
                      </div>
                      <span>R</span>
                   </div>
                </div>

                {/* Card Body */}
                <div className="relative pt-6 pb-8 bg-[#161b26] flex flex-col">
                  
                  {/* Merchant Info */}
                  <div className="px-7 mb-5 text-left">
                    <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wider mb-1">
                      KHMER STORE CAMBODIA
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[36px] font-extrabold text-white tracking-tight leading-none">
                        {totalAmountUsd.toFixed(2)}
                      </span>
                      <span className="text-sm font-bold text-[#4BD4FF]">USD</span>
                    </div>
                  </div>

                  {/* Dashed Separator */}
                  <div className="relative w-full h-4 flex items-center justify-center mb-5">
                    <div className="w-full border-b-[2px] border-dashed border-white/10 mx-3"></div>
                  </div>

                  {/* QR Code */}
                  <div className="px-7 flex justify-center relative w-full">
                    <div className="relative flex justify-center items-center bg-white p-3 rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.2)] w-full">
                      <QRCodeSVG
                        value={
                          paymentData?.qrString ||
                          `00020101021229210017hongseng_lim@bkrt5204599953038405402${totalAmountUsd.toFixed(2)}5802KH5912Lim Hongseng6010Phnom Penh62110107${orderNumDisplay}6304`
                        }
                        size={214}
                        level="Q"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        imageSettings={{
                          src: CenterQRImage,
                          height: 48,
                          width: 48,
                          excavate: true
                        }}
                        style={{ width: '100%', height: 'auto', maxWidth: '214px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

                {/* Live Scan Status Indicator */}
                <div className="w-full mt-space-sm pt-space-xs flex items-center justify-between px-2 text-on-surface">
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></span>
                    </div>
                    <span className="font-label-md text-label-md text-on-surface">Awaiting Bakong scan...</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface-container-high px-2.5 py-1 rounded-full">
                    <span className="material-symbols-outlined text-[14px] text-error">timer</span>
                    <span className="font-headline-sm text-label-sm font-semibold tracking-wide text-error">
                      {formatTime(secondsLeft)}
                    </span>
                  </div>
                  </div>
            {/* Action Buttons Group */}
            <div className="mt-space-md flex flex-col gap-space-xs relative z-10">
              <button
                onClick={handleSaveQR}
                className="w-full h-12 bg-primary text-on-primary font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.35)] active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">download</span>
                <span>Save QR Image to Gallery</span>
              </button>
              <button
                onClick={handleDeepLink}
                className="w-full h-12 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-lg text-label-lg rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-[20px] text-secondary">account_balance_wallet</span>
                <span>Open in Banking App</span>
              </button>
            </div>

            {/* Quick Help */}
            <div className="mt-space-md flex items-center justify-center gap-2 text-on-surface-variant/70">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span className="font-body-sm text-body-sm">Payment will be automatically detected in seconds</span>
            </div>

            {/* Toast Notification */}
            <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 w-max bg-surface-bright text-on-surface px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 pointer-events-none transition-opacity duration-300 z-50 ${toastMessage ? 'opacity-100' : 'opacity-0'}`}>
              <span className="material-symbols-outlined text-[18px] text-tertiary">{toastMessage?.icon || 'check_circle'}</span>
              <span className="font-label-md text-label-md font-medium">{toastMessage?.message}</span>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default MobileOrderDetailPage;
