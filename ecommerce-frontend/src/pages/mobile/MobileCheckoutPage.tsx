import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCheckout } from '../../features/checkout/hooks/useCheckout';
import { parsePrice } from '../../utils/price.utils';

export const MobileCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    cartLoading,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    paymentMethod,
    setPaymentMethod,
    promoCode,
    setPromoCode,
    appliedPromo,
    discountAmount,
    promoError,
    subtotal,
    totalCount,
    finalTotalUsd,
    finalTotalKhr,
    handleApplyPromo,
    handleRemovePromo,
    showNewAddressForm,
    setShowNewAddressForm,
    newAddrForm,
    setNewAddrForm,
    handleCreateAddress,
    isSavingAddress,
    handlePlaceOrder,
    isSubmitting,
    submitError,
  } = useCheckout();

  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const selectedAddress = addresses.find(a => String(a.id) === String(selectedAddressId));

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] pt-safe">
        <div className="h-16 px-container-padding-mobile flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <button onClick={() => navigate('/cart')} className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-95 transition-all rounded-full">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface ml-space-2xs">Shopping Cart</span>
          </div>
          <div className="flex items-center gap-space-xs text-primary">
            <span className="material-symbols-outlined">shopping_bag</span>
            <span className="font-label-sm font-bold">{totalCount}</span>
          </div>
        </div>
      </header>

      <main className="flex flex-col relative w-full pt-16 pb-24 bg-surface flex-1">
        <div className="flex flex-col w-full relative">
          
          {/* Dimmed Peek Background Cart Canvas */}
          <div className="px-container-padding-mobile pt-space-xs space-y-space-md opacity-40 select-none pointer-events-none filter blur-[2px]">
            <div className="flex items-center justify-between">
              <span className="font-headline-md text-headline-md text-on-surface">Cart Summary</span>
              <span className="font-label-md text-label-md text-secondary">{totalCount} items</span>
            </div>
            
            {cartItems.slice(0, 1).map(item => {
              const imgUrl = item.product?.images?.find((img: any) => img.isPrimary)?.imageUrl || item.product?.images?.[0]?.imageUrl;
              return (
                <div key={item.id} className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex items-center gap-space-sm">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-highest overflow-hidden flex items-center justify-center p-1">
                    {imgUrl && <img src={imgUrl} alt={item.product?.name} className="w-full h-full object-cover rounded" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-headline-sm text-headline-sm text-on-surface truncate">{item.product?.name}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-price-card text-price-card text-primary block truncate max-w-[80px]">${(parsePrice(item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          {/* Bottom Sheet Backdrop Scrim */}
          <div className="fixed inset-0 bg-surface-container-lowest/80 backdrop-blur-md z-40"></div>

          {/* Elevated Bottom Sheet Modal Container */}
          <section className="relative z-40 mt-space-xs bg-surface-container-low shadow-[0_-12px_40px_rgba(0,0,0,0.85)] rounded-t-[28px] overflow-hidden flex flex-col pb-28">
            
            {/* Top Pull Handle Pill */}
            <div className="w-full flex items-center justify-center pt-space-sm pb-space-xs">
              <div className="w-12 h-1.5 rounded-full bg-surface-variant"></div>
            </div>

            {/* Modal Header */}
            <div className="px-container-padding-mobile py-space-xs flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                </div>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight">Checkout &amp; Delivery</h2>
              </div>
              <button onClick={() => navigate('/cart')} aria-label="Dismiss sheet" className="w-10 h-10 rounded-full bg-surface-container-highest/60 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-transform active:scale-90" type="button">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="px-container-padding-mobile space-y-space-md mt-space-xs">
              
              {/* Section 1: Item Summary Accordion Preview */}
              <div className="bg-surface-container rounded-xl p-space-sm shadow-sm transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <div className="flex -space-x-2 overflow-hidden items-center py-0.5">
                      {cartItems.slice(0, 3).map((item, idx) => {
                        const imgUrl = item.product?.images?.find((img: any) => img.isPrimary)?.imageUrl || item.product?.images?.[0]?.imageUrl;
                        return (
                          <div key={idx} className="inline-block h-8 w-8 rounded-full ring-2 ring-surface-container overflow-hidden bg-surface-container-highest flex items-center justify-center">
                            {imgUrl && <img src={imgUrl} alt={item.product?.name} className="w-full h-full object-cover" />}
                          </div>
                        );
                      })}
                    </div>
                    <div className="ml-space-2xs">
                      <span className="font-headline-sm text-headline-sm text-on-surface">{totalCount} Items</span>
                      <span className="font-label-sm text-label-sm text-secondary block font-bold">${subtotal.toFixed(2)} USD</span>
                    </div>
                  </div>
                  <button onClick={() => setIsAccordionOpen(!isAccordionOpen)} className="font-label-md text-label-md text-primary hover:text-primary-fixed flex items-center gap-1 py-space-2xs px-space-xs rounded-lg hover:bg-primary/10 transition-colors">
                    <span>Details</span>
                    <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${isAccordionOpen ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>
                </div>

                {/* Expanded Item Accordion Body */}
                <div className={`pt-space-sm space-y-space-xs ${isAccordionOpen ? 'block' : 'hidden'}`}>
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm py-1">
                      <span className="truncate max-w-[200px]">
                        {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.product?.name}
                      </span>
                      <span className="text-on-surface font-semibold">${(parsePrice(item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="pt-space-2xs flex justify-end">
                    <Link to="/cart" className="font-label-sm text-label-sm text-secondary hover:underline flex items-center gap-1">
                      <span>Edit Bag in Cart</span>
                      <span className="material-symbols-outlined text-[12px]">edit</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Section 2: Touch-friendly Cambodian Address Picker */}
              <div className="bg-surface-container rounded-xl p-space-md shadow-sm relative overflow-hidden">
                <div className="flex items-start justify-between mb-space-xs">
                  <div className="flex items-center gap-space-xs">
                    <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                    </div>
                    <div>
                      {selectedAddress ? (
                        <>
                          <div className="flex items-center gap-space-2xs">
                            <span className="font-headline-sm text-headline-sm text-on-surface truncate">{selectedAddress.recipientName}</span>
                            {selectedAddress.isDefault && (
                              <span className="bg-tertiary-container/40 text-tertiary-fixed font-label-sm text-label-sm px-1.5 py-0.5 rounded">Default</span>
                            )}
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">{selectedAddress.phone}</span>
                        </>
                      ) : (
                        <span className="font-headline-sm text-headline-sm text-on-surface">No Address Selected</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setShowNewAddressForm(!showNewAddressForm)} className="font-label-md text-label-md text-secondary hover:text-secondary-fixed transition-colors whitespace-nowrap">
                    {showNewAddressForm ? 'Cancel' : 'Change/Add'}
                  </button>
                </div>

                {selectedAddress && !showNewAddressForm && (
                  <>
                    <div className="flex flex-wrap gap-1.5 mt-space-xs">
                      <span className="bg-surface-container-highest text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                        {selectedAddress.province}
                      </span>
                      {selectedAddress.city && (
                        <span className="bg-surface-container-highest text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-full">
                          District: {selectedAddress.city}
                        </span>
                      )}
                      {selectedAddress.commune && (
                        <span className="bg-surface-container-highest text-on-surface font-label-sm text-label-sm px-2.5 py-1 rounded-full">
                          Commune: {selectedAddress.commune}
                        </span>
                      )}
                    </div>
                    <div className="mt-space-xs pt-space-xs flex items-center justify-between text-on-surface-variant">
                      <p className="font-body-md text-body-md text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-outline shrink-0">apartment</span>
                        <span className="break-words">{selectedAddress.streetLine}</span>
                      </p>
                    </div>
                  </>
                )}

                {/* Show address selection and new form if "Change" is clicked */}
                {showNewAddressForm && (
                  <div className="mt-space-md pt-space-md border-t border-white/10">
                    <div className="space-y-space-sm mb-space-md max-h-48 overflow-y-auto pr-1">
                      {addresses.map(addr => (
                        <label
                          key={addr.id}
                          onClick={() => { setSelectedAddressId(addr.id); setShowNewAddressForm(false); }}
                          className={`flex items-start p-space-sm rounded-xl cursor-pointer shadow-sm transition-all border ${String(selectedAddressId) === String(addr.id) ? 'bg-surface-container-highest border-secondary/50' : 'bg-surface-container-low border-white/5 opacity-80'}`}
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-label-md font-semibold text-on-surface block truncate">{addr.recipientName} ({addr.label})</span>
                            <p className="font-body-sm text-on-surface-variant truncate">{addr.streetLine}, {addr.city}</p>
                          </div>
                          {String(selectedAddressId) === String(addr.id) && <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 ml-2">check</span>}
                        </label>
                      ))}
                    </div>
                    
                    <h3 className="font-label-md font-semibold mb-2">Or add new:</h3>
                    <form onSubmit={(e) => { handleCreateAddress(e); }} className="space-y-space-xs">
                      <input type="text" placeholder="Address Label (Home / Work)" value={newAddrForm.label} onChange={(e) => setNewAddrForm({...newAddrForm, label: e.target.value})} required className="w-full h-10 px-space-sm rounded-lg bg-surface-container-highest text-on-surface focus:outline-none border border-white/10 font-body-sm" />
                      <input type="text" placeholder="Recipient Name" value={newAddrForm.recipientName} onChange={(e) => setNewAddrForm({...newAddrForm, recipientName: e.target.value})} required className="w-full h-10 px-space-sm rounded-lg bg-surface-container-highest text-on-surface focus:outline-none border border-white/10 font-body-sm" />
                      <input type="tel" placeholder="Phone" value={newAddrForm.phone} onChange={(e) => setNewAddrForm({...newAddrForm, phone: e.target.value})} required className="w-full h-10 px-space-sm rounded-lg bg-surface-container-highest text-on-surface focus:outline-none border border-white/10 font-body-sm" />
                      <select value={newAddrForm.province} onChange={(e) => setNewAddrForm({...newAddrForm, province: e.target.value})} className="w-full h-10 px-space-sm rounded-lg bg-surface-container-highest text-on-surface focus:outline-none border border-white/10 font-body-sm">
                        <option value="Phnom Penh">Phnom Penh Capital</option>
                        <option value="Siem Reap">Siem Reap</option>
                        <option value="Battambang">Battambang</option>
                        <option value="Other Provinces">Other</option>
                      </select>
                      <input type="text" placeholder="District / City" value={newAddrForm.city} onChange={(e) => setNewAddrForm({...newAddrForm, city: e.target.value})} required className="w-full h-10 px-space-sm rounded-lg bg-surface-container-highest text-on-surface focus:outline-none border border-white/10 font-body-sm" />
                      <textarea rows={2} placeholder="Street Address" value={newAddrForm.streetLine} onChange={(e) => setNewAddrForm({...newAddrForm, streetLine: e.target.value})} required className="w-full p-space-sm rounded-lg bg-surface-container-highest text-on-surface focus:outline-none border border-white/10 resize-none font-body-sm"></textarea>
                      <button type="submit" disabled={isSavingAddress} className="w-full h-10 rounded-lg bg-secondary text-on-secondary font-label-md font-semibold">
                        {isSavingAddress ? 'Saving...' : 'Save New Address'}
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Section 3: Payment Method Selector Cards */}
              <div className="space-y-space-xs">
                <div className="flex items-center justify-between px-space-2xs">
                  <label className="font-headline-sm text-headline-sm text-on-surface">Payment Method</label>
                  {paymentMethod === 'khqr' && (
                    <span className="font-label-sm text-label-sm text-tertiary-fixed flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(78,222,163,0.8)]"></span>
                      Instant KHQR Settlement
                    </span>
                  )}
                </div>

                {/* Option A: Bakong KHQR */}
                <div onClick={() => setPaymentMethod('khqr')} className={`cursor-pointer rounded-xl p-space-md transition-all relative overflow-hidden group ${paymentMethod === 'khqr' ? 'bg-surface-container-highest shadow-[0_4px_24px_rgba(76,215,246,0.18)]' : 'bg-surface-container hover:bg-surface-container-high shadow-sm'}`}>
                  <div className="flex items-start gap-space-sm">
                    <div className={`w-5 h-5 mt-0.5 rounded-full flex items-center justify-center transition-all shrink-0 ${paymentMethod === 'khqr' ? 'bg-secondary text-on-secondary shadow-[0_0_12px_rgba(76,215,246,0.8)]' : 'bg-surface-variant text-transparent'}`}>
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-space-2xs">
                          <span className="font-headline-sm text-headline-sm text-on-surface">Bakong KHQR Payment</span>
                          <span className="bg-error-container text-on-error-container font-label-sm text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">KHQR</span>
                        </div>
                        <span className="font-label-sm text-label-sm text-tertiary-fixed bg-tertiary/10 px-2 py-0.5 rounded-full font-bold ml-auto">0% FEE</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Option B: Cash on Delivery (COD) */}
                <div onClick={() => setPaymentMethod('cod')} className={`cursor-pointer rounded-xl p-space-md transition-all relative overflow-hidden group ${paymentMethod === 'cod' ? 'bg-surface-container-highest shadow-[0_4px_24px_rgba(128,131,255,0.2)]' : 'bg-surface-container hover:bg-surface-container-high shadow-sm'}`}>
                  <div className="flex items-start gap-space-sm">
                    <div className={`w-5 h-5 mt-0.5 rounded-full flex items-center justify-center transition-all shrink-0 ${paymentMethod === 'cod' ? 'bg-primary text-on-primary shadow-[0_0_12px_rgba(192,193,255,0.7)]' : 'bg-surface-variant text-transparent'}`}>
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-headline-sm text-on-surface">Cash on Delivery (COD)</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        Settle directly in USD or KHR to courier when package arrives at your door.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promo Code Section */}
              <div className="bg-surface-container rounded-xl p-space-md shadow-sm">
                 <div className="flex justify-between items-center mb-space-sm">
                    <h2 className="font-headline-sm font-semibold text-on-surface">Promo Code</h2>
                 </div>
                 <div className="flex gap-space-xs">
                    <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Code" className="flex-1 h-11 px-space-sm rounded-lg bg-surface-container-highest text-on-surface uppercase focus:outline-none border border-white/10 font-mono tracking-wider" />
                    <button onClick={handleApplyPromo} className="h-11 px-space-md rounded-lg border border-primary text-primary font-label-md font-semibold hover:bg-primary/10 transition-colors">Apply</button>
                 </div>
                 {promoError && <p className="text-xs text-error mt-2 font-body-sm">{promoError}</p>}
                 {appliedPromo && (
                    <div className="mt-space-sm flex justify-between items-center bg-tertiary/15 text-tertiary px-space-sm py-2 rounded-lg font-label-sm">
                       <span className="font-semibold font-mono">'{appliedPromo}' APPLIED</span>
                       <button onClick={handleRemovePromo} className="text-error font-bold">Remove</button>
                    </div>
                 )}
              </div>

              {/* Section 4: Price Breakdown Card */}
              <div className="bg-surface-container rounded-xl p-space-md shadow-sm space-y-space-xs">
                <div className="flex justify-between items-center text-on-surface-variant font-body-md text-body-md">
                  <span>Items Subtotal</span>
                  <span className="text-on-surface font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-on-surface-variant font-body-md text-body-md">
                    <span>Discount</span>
                    <span className="text-tertiary font-semibold">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-on-surface-variant font-body-md text-body-md">
                  <div className="flex items-center gap-1">
                    <span>Express Delivery</span>
                    <span className="material-symbols-outlined text-[14px] text-tertiary">bolt</span>
                  </div>
                  <span className="text-tertiary-fixed font-semibold">FREE</span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant font-body-md text-body-md">
                  <span>Tax (0%)</span>
                  <span className="text-on-surface font-semibold">$0.00</span>
                </div>
                
                {paymentMethod === 'cod' && (
                  <div className="flex justify-between items-center text-on-surface-variant font-body-md text-body-md">
                    <span>Cash Handling Surcharge</span>
                    <span className="text-secondary font-semibold">+$1.00</span>
                  </div>
                )}
                
                <div className="pt-space-xs mt-space-xs bg-surface-container-highest/40 p-space-sm rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Total Settled Amount</span>
                    <div className="flex items-baseline gap-space-2xs">
                      <span className="font-price-hero text-price-hero text-on-surface">${(finalTotalUsd + (paymentMethod === 'cod' ? 1 : 0)).toFixed(2)}</span>
                      <span className="font-label-sm text-label-sm text-outline">USD</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </section>

          {/* Sticky Bottom Checkout Action Dock */}
          <div className="fixed bottom-0 inset-x-0 z-50 p-space-md pb-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.7)] border-t border-white/5">
            <div className="max-w-md mx-auto flex flex-col gap-1.5">
              <button 
                onClick={handlePlaceOrder}
                disabled={isSubmitting || cartItems.length === 0}
                className={`w-full h-12 rounded-xl text-on-primary font-label-lg text-label-lg font-bold transition-all flex items-center justify-center gap-space-xs disabled:opacity-50 ${paymentMethod === 'khqr' ? 'bg-gradient-to-r from-primary-container via-inverse-primary to-secondary shadow-[0_0_24px_rgba(128,131,255,0.45)] hover:shadow-[0_0_32px_rgba(76,215,246,0.6)] active:scale-[0.98]' : 'bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(128,131,255,0.4)] hover:shadow-[0_0_28px_rgba(128,131,255,0.6)] active:scale-[0.98]'}`} 
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">{paymentMethod === 'khqr' ? 'qr_code_scanner' : 'local_shipping'}</span>
                <span>
                  {isSubmitting ? 'Processing...' : (paymentMethod === 'khqr' ? `Pay with Bakong KHQR ($${finalTotalUsd.toFixed(2)})` : `Confirm Cash on Delivery ($${(finalTotalUsd + 1).toFixed(2)})`)}
                </span>
              </button>
              {submitError ? (
                 <p className="font-label-sm text-label-sm text-center text-error mt-1">{submitError}</p>
              ) : (
                 <p className="font-label-sm text-label-sm text-center text-outline">
                    {paymentMethod === 'khqr' ? 'One-tap mobile app switch or dynamic QR display' : 'Pay when you receive the items'}
                 </p>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default MobileCheckoutPage;
