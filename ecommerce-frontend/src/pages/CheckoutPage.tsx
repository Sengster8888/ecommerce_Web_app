import React from 'react';
import { Link } from 'react-router-dom';
import { StorefrontHeader } from '../components/storefront/StorefrontHeader';
import { StorefrontFooter } from '../components/storefront/StorefrontFooter';
import { useCheckout, exchangeRate } from '../features/checkout/hooks/useCheckout';
import { parsePrice, formatKHR } from '../utils/price.utils';

export const CheckoutPage: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col justify-between">
      <StorefrontHeader cartCount={totalCount} cartTotal={subtotal} />

      <main className="w-full pt-24 pb-space-2xl bg-surface min-h-screen">
        <div className="max-w-7xl mx-auto w-full px-space-md lg:px-container-padding-desktop py-space-md">
          {/* Breadcrumb & Step Tracker Navigation */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-xl">
            <div>
              <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-space-2xs">
                <Link to="/" className="hover:text-on-surface">Cambodian E-Store</Link>
                <span>/</span>
                <Link to="/cart" className="hover:text-on-surface">Shopping Cart</Link>
                <span>/</span>
                <span className="text-secondary">Secured Checkout</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                Express Checkout
              </h1>
            </div>

            {/* Linear Step Pills */}
            <div className="flex items-center bg-surface-container-low p-space-xs rounded-xl shadow-md border border-white/5">
              <Link
                to="/cart"
                className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg text-tertiary bg-tertiary/10 transition-all hover:bg-tertiary/20"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span className="font-label-md text-label-md font-semibold">1. Cart</span>
              </Link>
              <div className="w-6 h-0.5 bg-surface-container-highest mx-space-2xs"></div>
              <div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg text-on-primary bg-primary-container shadow-sm">
                <span className="w-5 h-5 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center font-label-sm text-label-sm font-bold">
                  2
                </span>
                <span className="font-label-md text-label-md font-bold">Checkout Details</span>
              </div>
              <div className="w-6 h-0.5 bg-surface-container-highest mx-space-2xs"></div>
              <div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg text-on-surface-variant opacity-60">
                <span className="w-5 h-5 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-label-sm text-label-sm">
                  3
                </span>
                <span className="font-label-md text-label-md">Bakong KHQR</span>
              </div>
            </div>
          </div>

          {/* Main Two-Column Layout (7 cols details / 5 cols summary) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
            {/* Left Column: Checkout Inputs (7 Cols) */}
            <div className="lg:col-span-7 space-y-space-xl">
              {/* SECTION 1: Shipping Address */}
              <section className="bg-surface-container rounded-xl p-space-lg shadow-xl relative overflow-hidden border border-white/5">
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex items-center justify-between gap-space-md mb-space-lg">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[22px]">local_shipping</span>
                    </div>
                    <div>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        1. Delivery Location
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Fast dispatch across Phnom Penh &amp; 24 provinces
                      </p>
                    </div>
                  </div>
                  <span className="px-space-xs py-space-2xs rounded-full bg-surface-container-high font-label-sm text-label-sm text-secondary font-medium">
                    {addresses.length} Saved {addresses.length === 1 ? 'Address' : 'Addresses'}
                  </span>
                </div>

                {/* Saved Address Selector Grid */}
                {addresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md mb-space-lg">
                    {addresses.map((addr) => {
                      const isSelected = String(selectedAddressId) === String(addr.id);
                      return (
                        <label
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`relative flex flex-col p-space-md rounded-xl cursor-pointer shadow-md transition-all duration-200 border ${
                            isSelected
                              ? 'bg-surface-container-high border-secondary/50 ring-1 ring-secondary/50'
                              : 'bg-surface-container-low border-white/5 hover:bg-surface-container-high opacity-85'
                          }`}
                        >
                          <input
                            type="radio"
                            name="selected_address"
                            checked={isSelected}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="hidden"
                          />
                          <div className="flex items-start justify-between gap-space-xs mb-space-xs">
                            <div className="flex items-center gap-space-xs">
                              <span className="material-symbols-outlined text-secondary text-[20px]">
                                {addr.label?.toLowerCase() === 'work' || addr.label?.toLowerCase() === 'office'
                                  ? 'corporate_fare'
                                  : 'home'}
                              </span>
                              <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                                {addr.recipientName} ({addr.label})
                              </span>
                            </div>
                            {addr.isDefault && (
                              <span className="px-space-2xs py-0.5 rounded bg-tertiary/15 text-tertiary font-label-sm text-label-sm font-medium">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="font-label-md text-label-md text-secondary mb-space-2xs font-mono">
                            {addr.phone}
                          </p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-space-sm">
                            {addr.streetLine}, {addr.commune ? `${addr.commune}, ` : ''}{addr.city}, {addr.province}
                          </p>
                          <div className="mt-auto pt-space-xs flex items-center gap-space-2xs text-tertiary font-label-sm text-label-sm">
                            <span className="material-symbols-outlined text-[16px]">verified</span>
                            <span>Express Zone Verified</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-space-md bg-surface-container-low rounded-xl text-center text-on-surface-variant font-body-sm mb-space-lg">
                    No saved addresses found. Please add your delivery address below.
                  </div>
                )}

                {/* Add New Delivery Address Toggle */}
                <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-inner border border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm((prev) => !prev)}
                    className="w-full px-space-md py-space-sm flex items-center justify-between text-left text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-space-xs font-label-lg text-label-lg font-semibold">
                      <span className="material-symbols-outlined text-[20px]">
                        {showNewAddressForm ? 'cancel' : 'add_circle'}
                      </span>
                      <span>Add New Delivery Address</span>
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Province, City, or District Drop
                    </span>
                  </button>

                  {/* Collapsible Form */}
                  {showNewAddressForm && (
                    <form onSubmit={handleCreateAddress} className="p-space-md bg-surface-container-low space-y-space-md border-t border-white/5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                        <div>
                          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-space-2xs">
                            Address Label (Home / Work) *
                          </label>
                          <input
                            type="text"
                            value={newAddrForm.label}
                            onChange={(e) => setNewAddrForm({ ...newAddrForm, label: e.target.value })}
                            placeholder="e.g. Home or Office"
                            required
                            className="w-full h-12 px-space-md rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-high transition-all border border-white/10"
                          />
                        </div>
                        <div>
                          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-space-2xs">
                            Recipient Full Name *
                          </label>
                          <input
                            type="text"
                            value={newAddrForm.recipientName}
                            onChange={(e) => setNewAddrForm({ ...newAddrForm, recipientName: e.target.value })}
                            placeholder="e.g. Sokha Chan"
                            required
                            className="w-full h-12 px-space-md rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-high transition-all border border-white/10"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                        <div>
                          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-space-2xs">
                            Cambodian Mobile Phone *
                          </label>
                          <input
                            type="tel"
                            value={newAddrForm.phone}
                            onChange={(e) => setNewAddrForm({ ...newAddrForm, phone: e.target.value })}
                            placeholder="012 345 678"
                            required
                            className="w-full h-12 px-space-md rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-high transition-all border border-white/10"
                          />
                        </div>
                        <div>
                          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-space-2xs">
                            Province / Municipality *
                          </label>
                          <select
                            value={newAddrForm.province}
                            onChange={(e) => setNewAddrForm({ ...newAddrForm, province: e.target.value })}
                            className="w-full h-12 px-space-md rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-high transition-all border border-white/10 cursor-pointer"
                          >
                            <option value="Phnom Penh">Phnom Penh Capital</option>
                            <option value="Siem Reap">Siem Reap (Angkor Zone)</option>
                            <option value="Battambang">Battambang</option>
                            <option value="Preah Sihanouk">Preah Sihanouk (Kompong Som)</option>
                            <option value="Kampot">Kampot / Kep</option>
                            <option value="Kandal">Kandal</option>
                            <option value="Other Provinces">Other Provinces</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                        <div>
                          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-space-2xs">
                            Khan / District / Srok *
                          </label>
                          <input
                            type="text"
                            value={newAddrForm.city}
                            onChange={(e) => setNewAddrForm({ ...newAddrForm, city: e.target.value })}
                            placeholder="e.g. Khan Toul Kork"
                            required
                            className="w-full h-12 px-space-md rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-high transition-all border border-white/10"
                          />
                        </div>
                        <div>
                          <label className="block font-label-sm text-label-sm text-on-surface-variant mb-space-2xs">
                            Sangkat / Commune
                          </label>
                          <input
                            type="text"
                            value={newAddrForm.commune}
                            onChange={(e) => setNewAddrForm({ ...newAddrForm, commune: e.target.value })}
                            placeholder="e.g. Sangkat Boeng Kak 1"
                            className="w-full h-12 px-space-md rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-high transition-all border border-white/10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-space-2xs">
                          Street Address &amp; House # *
                        </label>
                        <textarea
                          rows={2}
                          value={newAddrForm.streetLine}
                          onChange={(e) => setNewAddrForm({ ...newAddrForm, streetLine: e.target.value })}
                          placeholder="e.g. Street 516, House #18B"
                          required
                          className="w-full p-space-md rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-high transition-all border border-white/10 resize-none"
                        ></textarea>
                      </div>

                      <div className="flex items-center justify-end gap-space-sm pt-space-xs">
                        <button
                          type="button"
                          onClick={() => setShowNewAddressForm(false)}
                          className="px-space-md py-space-xs rounded-lg text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingAddress}
                          className="px-space-lg py-space-xs rounded-lg bg-secondary text-on-secondary font-label-md text-label-md font-semibold hover:bg-secondary-fixed transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isSavingAddress ? 'Saving...' : 'Save Address'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </section>

              {/* SECTION 2: Payment Method Selection */}
              <section className="bg-surface-container rounded-xl p-space-lg shadow-xl relative border border-white/5">
                <div className="flex items-center justify-between gap-space-md mb-space-lg">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
                    </div>
                    <div>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        2. Payment Method
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Select instant local clearing or cash payment
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-2xs text-tertiary font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    <span>256-Bit TLS Protected</span>
                  </div>
                </div>

                {/* Payment Options Vertical Stack */}
                <div className="space-y-space-md">
                  {/* Option A: Bakong KHQR (Recommended) */}
                  <label
                    onClick={() => setPaymentMethod('khqr')}
                    className={`block p-space-md rounded-xl cursor-pointer shadow-lg transition-all relative overflow-hidden border ${
                      paymentMethod === 'khqr'
                        ? 'bg-surface-container-high border-tertiary/50'
                        : 'bg-surface-container-low border-white/5 hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-tertiary to-secondary"></div>
                    <div className="flex items-start gap-space-md pl-space-xs">
                      <input
                        type="radio"
                        name="payment_method"
                        value="khqr"
                        checked={paymentMethod === 'khqr'}
                        onChange={() => setPaymentMethod('khqr')}
                        className="mt-1.5 accent-tertiary"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-space-xs mb-space-2xs">
                          <div className="flex items-center gap-space-xs">
                            <span className="font-label-lg text-label-lg text-on-surface font-bold">
                              Bakong KHQR (NBC Standard)
                            </span>
                            <span className="px-space-xs py-0.5 rounded-full bg-tertiary/20 text-tertiary font-label-sm text-label-sm font-semibold">
                              0% Fee • Instant
                            </span>
                          </div>
                          <span className="font-label-sm text-label-sm text-secondary font-mono tracking-wider font-semibold">
                            ALL CAMBODIAN BANKS
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
                          Scan with ABA Mobile, Wing, ACLEDA, Canadia, Sathapana, Prince Bank, or any Bakong-enabled app in USD or KHR.
                        </p>
                        {/* Supported Bank Badges */}
                        <div className="flex flex-wrap items-center gap-space-xs">
                          <span className="px-space-xs py-1 rounded bg-surface-container text-[11px] font-bold text-primary tracking-wide">
                            ABA PAY
                          </span>
                          <span className="px-space-xs py-1 rounded bg-surface-container text-[11px] font-bold text-secondary tracking-wide">
                            WING BANK
                          </span>
                          <span className="px-space-xs py-1 rounded bg-surface-container text-[11px] font-bold text-tertiary tracking-wide">
                            ACLEDA toanChet
                          </span>
                          <span className="px-space-xs py-1 rounded bg-surface-container text-[11px] font-bold text-on-surface tracking-wide">
                            CANADIA
                          </span>
                          <span className="px-space-xs py-1 rounded bg-surface-container text-[11px] font-medium text-outline">
                            +38 Participating Banks
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Option B: Cash on Delivery (COD) */}
                  <label
                    onClick={() => setPaymentMethod('cod')}
                    className={`block p-space-md rounded-xl cursor-pointer shadow-sm transition-all border ${
                      paymentMethod === 'cod'
                        ? 'bg-surface-container-high border-secondary/50'
                        : 'bg-surface-container-low border-white/5 hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="flex items-start gap-space-md">
                      <input
                        type="radio"
                        name="payment_method"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="mt-1.5 accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-space-xs mb-space-2xs">
                          <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                            Cash on Delivery (COD)
                          </span>
                          <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-secondary font-label-sm text-label-sm">
                            No Extra Fee
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Pay driver in physical USD or Khmer Riel cash upon packet arrival. Driver carries verified small denomination change.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Regulatory & Trust Footer Note */}
                <div className="mt-space-lg pt-space-md flex items-center justify-between flex-wrap gap-space-sm text-on-surface-variant font-body-sm text-body-sm border-t border-white/5">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">verified_user</span>
                    <span>Audited under National Bank of Cambodia (NBC) Payment Regulations</span>
                  </div>
                  <span className="font-mono text-outline font-label-sm text-label-sm">TRANS-REF-ID: CS-KH-88294</span>
                </div>
              </section>
            </div>

            {/* Right Column: Sticky Order Summary & Voucher (5 Cols) */}
            <div className="lg:col-span-5 space-y-space-lg lg:sticky lg:top-24">
              {/* Cart Items Summary Card */}
              <div className="bg-surface-container rounded-xl p-space-lg shadow-2xl relative border border-white/5">
                <div className="flex items-center justify-between gap-space-md mb-space-md pb-space-sm border-b border-surface-container-highest/60">
                  <div className="flex items-center gap-space-xs">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Order Items</h2>
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary font-label-sm text-label-sm font-bold">
                      {totalCount} {totalCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <Link to="/cart" className="font-label-sm text-label-sm text-secondary hover:underline flex items-center gap-1">
                    <span>Edit Cart</span>
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                  </Link>
                </div>

                {/* Item Rows */}
                {cartLoading ? (
                  <div className="py-space-md text-center text-on-surface-variant text-body-sm">
                    Loading cart items...
                  </div>
                ) : cartItems.length > 0 ? (
                  <div className="space-y-space-md mb-space-lg max-h-80 overflow-y-auto pr-1">
                    {cartItems.map((item) => {
                      const itemPrice = parsePrice(item.product?.price || 0);
                      const lineTotal = itemPrice * item.quantity;
                      const lineKhr = formatKHR(lineTotal);
                      const imgUrl =
                        item.product?.images?.find((img: any) => img.isPrimary)?.imageUrl ||
                        item.product?.images?.[0]?.imageUrl ||
                        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80';

                      return (
                        <div key={item.id} className="flex items-center gap-space-sm">
                          <div className="w-16 h-16 rounded-xl bg-surface-container-lowest shrink-0 overflow-hidden shadow-inner flex items-center justify-center p-1 border border-white/5">
                            <img
                              src={imgUrl}
                              alt={item.product?.name || 'Product'}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-label-lg text-label-lg text-on-surface font-semibold truncate">
                              {item.product?.name}
                            </h3>
                            <div className="flex items-center gap-space-2xs text-on-surface-variant font-body-sm text-body-sm">
                              <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-outline text-[11px]">
                                Qty: {item.quantity}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-price-card text-price-card text-on-surface font-bold block">
                              ${lineTotal.toFixed(2)}
                            </span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                              {lineKhr} ៛
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-space-md text-center text-on-surface-variant text-body-sm">
                    Your cart is empty. <Link to="/products" className="text-primary hover:underline">Browse Products</Link>
                  </div>
                )}

                {/* Promo & Voucher Field */}
                <div className="bg-surface-container-low rounded-xl p-space-sm mb-space-lg border border-white/5">
                  <div className="flex items-center gap-space-xs mb-space-xs">
                    <span className="material-symbols-outlined text-secondary text-[18px]">sell</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                      Promotion Code or Store Voucher
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter coupon code"
                      className="flex-1 h-10 px-space-sm rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md uppercase font-mono tracking-wider focus:outline-none border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="h-10 px-space-md rounded-lg bg-surface-container-highest text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-bright transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && (
                    <p className="mt-1 text-xs text-error font-body-sm">{promoError}</p>
                  )}
                  {/* Applied Voucher Tag */}
                  {appliedPromo && (
                    <div className="mt-space-xs flex items-center justify-between px-space-xs py-1 rounded bg-tertiary/15 text-tertiary font-label-sm text-label-sm">
                      <div className="flex items-center gap-1 font-mono font-semibold">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        <span>'{appliedPromo}' APPLIED (-${discountAmount.toFixed(2)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-error hover:underline flex items-center text-[12px] cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Price Calculation Breakdown */}
                <div className="space-y-space-xs pt-space-xs mb-space-lg text-on-surface-variant font-body-md text-body-md">
                  <div className="flex items-center justify-between">
                    <span>Cart Subtotal ({totalCount} items)</span>
                    <span className="text-on-surface font-mono font-medium">
                      ${subtotal.toFixed(2)} <span className="text-outline text-xs">(≈ {formatKHR(subtotal * exchangeRate)} ៛)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Delivery Dispatch</span>
                    <span className="text-tertiary font-mono font-medium">
                      Free Shipping
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-tertiary">
                      <span className="flex items-center gap-1">Voucher Discount</span>
                      <span className="font-mono font-semibold">
                        -${discountAmount.toFixed(2)} ({-formatKHR(discountAmount * exchangeRate)} ៛)
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span>Cambodia VAT &amp; Customs (10%)</span>
                      <span className="material-symbols-outlined text-[14px] text-outline" title="Tax inclusive retail value">
                        info
                      </span>
                    </span>
                    <span className="text-tertiary font-mono text-label-md">Included in retail</span>
                  </div>

                  {/* Total Bar (Large Emphasis) */}
                  <div className="pt-space-md mt-space-sm bg-surface-container-high rounded-xl p-space-md shadow-inner border border-white/5">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Total Amount Due</span>
                      <div className="text-right">
                        <span className="font-display-hero-mobile text-display-hero-mobile text-secondary font-bold tracking-tight block">
                          ${finalTotalUsd.toFixed(2)}
                        </span>
                        <span className="font-headline-sm text-headline-sm text-tertiary font-mono block">
                          ≈ {finalTotalKhr.toLocaleString()} KHR
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-outline pt-1">
                      <span>Exchange peg: 1 USD = 4,100 KHR</span>
                      <span>Includes all provincial fees</span>
                    </div>
                  </div>
                </div>

                {/* Submit Error Warning */}
                {submitError && (
                  <div className="mb-space-md p-space-sm rounded-lg bg-error/15 text-error font-body-sm border border-error/30 text-center">
                    {submitError}
                  </div>
                )}

                {/* High-Impact Checkout CTA Button */}
                <div className="space-y-space-sm">
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting || cartItems.length === 0}
                    className="w-full h-14 rounded-xl bg-primary-container text-on-primary font-headline-sm text-headline-sm font-bold flex items-center justify-center gap-space-xs shadow-[0_0_24px_rgba(128,131,255,0.45)] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Processing Order...</span>
                    ) : (
                      <>
                        <span>Place Order &amp; Proceed</span>
                        <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                  <p className="font-body-sm text-body-sm text-outline text-center px-space-xs leading-relaxed">
                    By placing this order, you will connect to the official National Bank of Cambodia{' '}
                    <strong className="text-on-surface">Bakong KHQR</strong> gateway to complete real-time verification.
                  </p>
                </div>

                {/* Purchase Protection Features */}
                <div className="mt-space-lg pt-space-md bg-surface-container-low rounded-xl p-space-sm grid grid-cols-2 gap-space-xs border border-white/5">
                  <div className="flex items-center gap-space-2xs text-on-surface font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
                    <span>100% Genuine Tech</span>
                  </div>
                  <div className="flex items-center gap-space-2xs text-on-surface font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-secondary text-[18px]">published_with_changes</span>
                    <span>7-Day Hassle Returns</span>
                  </div>
                </div>
              </div>

              {/* Provincial Live Hotline Card */}
              <div className="bg-surface-container-low rounded-xl p-space-md shadow-md flex items-center justify-between gap-space-sm border border-white/5">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[20px]">support_agent</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-semibold">
                      Need Cambodian Hotline Support?
                    </p>
                    <p className="font-body-sm text-body-sm text-outline">Telegram • +855 (0) 23 999 888</p>
                  </div>
                </div>
                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noreferrer"
                  className="px-space-sm py-space-xs rounded-lg bg-surface-container-high text-secondary hover:bg-surface-container-highest font-label-sm text-label-sm font-semibold transition-colors shrink-0"
                >
                  Chat Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
};

export default CheckoutPage;
