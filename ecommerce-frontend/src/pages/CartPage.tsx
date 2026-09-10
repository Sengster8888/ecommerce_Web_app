import React from 'react';
import { Link } from 'react-router-dom';
import { StorefrontHeader } from '../components/storefront/StorefrontHeader';
import { StorefrontFooter } from '../components/storefront/StorefrontFooter';
import { useCart, exchangeRate } from '../features/cart/hooks/useCart';
import { parsePrice, formatKHR } from '../utils/price.utils';

export const CartPage: React.FC = () => {
  const {
    cartItems,
    loading,
    updatingItemId,
    subtotal,
    totalCount,
    discountAmount,
    grandTotalUsd,
    grandTotalKhr,
    promoCode,
    setPromoCode,
    appliedPromo,
    promoError,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearCart,
    handleApplyPromo,
    handleRemovePromo,
  } = useCart();

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col justify-between">
      <StorefrontHeader cartCount={totalCount} cartTotal={subtotal} />

      <main className="w-full pt-24 pb-space-3xl bg-surface min-h-screen">
        <div className="relative w-full max-w-7xl mx-auto px-container-padding-mobile md:px-container-padding-tablet lg:px-container-padding-desktop">
          {/* Subtle Ambient Glow Orbs */}
          <div className="absolute top-12 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div className="absolute top-72 right-10 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

          {/* Breadcrumb & Top Indicator */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md mb-space-sm">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <Link to="/products" className="hover:text-primary transition-colors">Storefront</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-secondary font-semibold">Shopping Cart ({totalCount} {totalCount === 1 ? 'Item' : 'Items'})</span>
          </nav>

          {/* Page Title Banner */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md mb-space-xl">
            <div>
              <div className="inline-flex items-center gap-2 px-space-xs py-1 rounded-full bg-surface-container-high text-secondary font-label-sm text-label-sm mb-space-xs shadow-sm border border-white/5">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                Direct Dispatch • Phnom Penh Fulfillment Hub
              </div>
              <h1 className="font-headline-lg lg:text-display-hero text-on-surface tracking-tight font-bold">
                Your Shopping Cart
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-space-2xs">
                Review your selected hardware before proceeding to secure Bakong KHQR checkout. Free same-day delivery applies to orders across Phnom Penh and provincial depots.
              </p>
            </div>
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
            {/* Left Column (~65% - 8 Columns) */}
            <section className="lg:col-span-8 flex flex-col gap-space-lg">
              {/* Batch Control Toolbar */}
              <div className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-low shadow-sm border border-white/5">
                <div className="flex items-center gap-space-xs select-none">
                  <span className="font-label-lg text-label-lg text-on-surface font-medium">
                    Cart Items ({totalCount})
                  </span>
                </div>
                <div className="flex items-center gap-space-md">
                  <span className="hidden sm:inline-flex items-center gap-1 font-label-sm text-label-sm text-tertiary">
                    <span className="material-symbols-outlined text-sm">bolt</span> Ready for Express Dispatch
                  </span>
                  {cartItems.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCart}
                      className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">delete_sweep</span>
                      Clear Cart
                    </button>
                  )}
                </div>
              </div>

              {/* Cart Item Cards List */}
              {loading ? (
                <div className="p-space-2xl bg-surface-container-low rounded-xl text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-2 block">
                    progress_activity
                  </span>
                  Loading your shopping cart...
                </div>
              ) : cartItems.length > 0 ? (
                <div className="flex flex-col gap-space-md">
                  {cartItems.map((item) => {
                    const price = parsePrice(item.product?.price || 0);
                    const lineTotal = price * item.quantity;
                    const lineKhr = formatKHR(lineTotal);
                    const isUpdating = String(updatingItemId) === String(item.id);
                    const imgUrl =
                      item.product?.images?.find((img: any) => img.isPrimary)?.imageUrl ||
                      item.product?.images?.[0]?.imageUrl ||
                      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80';

                    return (
                      <article
                        key={item.id}
                        className="p-space-lg rounded-xl bg-surface-container-low hover:bg-surface-container transition-all duration-300 shadow-md border border-white/5 relative overflow-hidden"
                      >
                        <div className="flex flex-col sm:flex-row gap-space-md">
                          {/* Item Thumbnail */}
                          <div className="relative w-full sm:w-36 h-36 shrink-0 rounded-xl overflow-hidden bg-surface-container-lowest flex items-center justify-center border border-white/5">
                            <img
                              src={imgUrl}
                              alt={item.product?.name || 'Product Image'}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded font-label-sm text-label-sm bg-surface-container-lowest/80 text-secondary backdrop-blur-md border border-secondary/20">
                              In Stock
                            </span>
                          </div>

                          {/* Item Content */}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-space-xs mb-space-2xs">
                                <span className="px-space-xs py-0.5 rounded-full bg-tertiary/15 text-tertiary font-label-sm text-label-sm flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Direct Store Stock
                                </span>
                              </div>
                              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                                {item.product?.name}
                              </h2>
                              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">
                                {item.product?.description || '1-Year Cambodian Authorized Warranty Included'}
                              </p>
                            </div>

                            {/* Stepper & Pricing */}
                            <div className="flex flex-wrap items-end justify-between gap-space-sm pt-space-sm">
                              {/* Quantity Stepper */}
                              <div className="flex flex-col gap-1">
                                <div className="inline-flex items-center bg-surface-container-highest rounded-lg p-1 border border-white/5">
                                  <button
                                    type="button"
                                    aria-label="Decrease quantity"
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                    className="w-8 h-8 rounded flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    <span className="material-symbols-outlined text-base">remove</span>
                                  </button>
                                  <span className="w-10 text-center font-label-lg text-label-lg text-on-surface font-semibold">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    aria-label="Increase quantity"
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                    className="w-8 h-8 rounded flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    <span className="material-symbols-outlined text-base">add</span>
                                  </button>
                                </div>
                              </div>

                              {/* Price */}
                              <div className="text-right">
                                <div className="font-headline-md text-headline-md text-on-surface font-bold">
                                  ${lineTotal.toFixed(2)}
                                </div>
                                <div className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                                  ≈ {lineKhr} KHR
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Bottom Bar: Actions */}
                        <div className="flex items-center justify-end gap-space-md pt-space-sm mt-space-sm bg-surface-container/30 -mx-space-lg -mb-space-lg px-space-lg py-space-xs rounded-b-xl border-t border-white/5">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleRemoveItem(item.id)}
                            className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-error transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span> Remove
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                /* Empty Cart State */
                <div className="p-space-2xl rounded-2xl bg-surface-container-low text-center shadow-xl border border-white/5 flex flex-col items-center justify-center space-y-space-md py-16">
                  <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl text-outline">shopping_cart_off</span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                    Your Shopping Cart is Empty
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                    Explore our curated collection of high-performance electronics, smartphones, and computing gadgets with Bakong KHQR privilege pricing.
                  </p>
                  <Link
                    to="/products"
                    className="px-space-xl py-space-md rounded-xl bg-primary text-on-primary font-headline-sm text-headline-sm font-bold shadow-lg hover:brightness-110 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">storefront</span>
                    <span>Browse Products Catalog</span>
                  </Link>
                </div>
              )}
            </section>

            {/* Right Column (~35% - 4 Columns - Sticky Order Summary) */}
            <aside className="lg:col-span-4 lg:sticky lg:top-28 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-2xl bg-surface-container-low backdrop-blur-xl shadow-xl flex flex-col gap-space-md border border-white/5">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Order Summary</h2>
                  <span className="px-space-xs py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">
                    {totalCount} {totalCount === 1 ? 'Item' : 'Items'}
                  </span>
                </div>

                {/* Price Calculation Lines */}
                <div className="flex flex-col gap-space-xs font-body-md text-body-md text-on-surface-variant">
                  <div className="flex items-center justify-between">
                    <span>Subtotal (USD)</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant/80">
                    <span className="font-label-sm text-label-sm">Subtotal (KHR Reference)</span>
                    <span className="font-label-sm text-label-sm font-mono">
                      ≈ {formatKHR(subtotal * exchangeRate)} ៛
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-tertiary">
                      <span className="font-label-md text-label-md font-semibold">Voucher Discount</span>
                      <span className="font-mono font-bold">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span>Estimated Tax &amp; MOC Fee</span>
                    <span className="text-on-surface font-medium">$0.00 (Included)</span>
                  </div>
                </div>

                {/* Promo Code Input / Applied Badge */}
                <div className="bg-surface-container rounded-xl p-space-sm border border-white/5 space-y-space-xs">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-[18px]">sell</span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Store Voucher</span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Coupon Code"
                      className="flex-1 h-9 px-space-xs rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm uppercase font-mono tracking-wider focus:outline-none border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="h-9 px-space-md rounded-lg bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-bright transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-xs text-error font-body-sm">{promoError}</p>
                  )}
                  {appliedPromo && (
                    <div className="flex items-center justify-between px-space-xs py-1 rounded bg-tertiary/15 text-tertiary font-label-sm text-label-sm">
                      <span className="font-mono font-semibold">'{appliedPromo}' APPLIED (-${discountAmount.toFixed(2)})</span>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-error hover:underline text-[11px] cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Total Highlight Box */}
                <div className="p-space-md rounded-xl bg-surface-container-high flex flex-col gap-1 shadow-inner border border-white/5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider font-semibold">
                      Grand Total
                    </span>
                    <div className="text-right">
                      <div className="font-display-hero text-headline-lg lg:text-price-hero text-primary font-bold tracking-tight">
                        ${grandTotalUsd.toFixed(2)}
                      </div>
                      <div className="font-label-md text-label-md text-secondary font-medium font-mono">
                        ≈ {grandTotalKhr.toLocaleString()} KHR (៛)
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-space-xs pt-space-xs">
                  {cartItems.length > 0 ? (
                    <Link
                      to="/checkout"
                      className="w-full h-12 rounded-xl bg-primary-container text-on-primary-container font-headline-sm text-headline-sm font-bold flex items-center justify-center gap-space-xs hover:opacity-95 shadow-[0_0_24px_rgba(99,102,241,0.35)] transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">lock</span>
                      <span>Proceed to Checkout • ${grandTotalUsd.toFixed(2)}</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full h-12 rounded-xl bg-surface-container-highest text-outline font-headline-sm text-headline-sm font-bold flex items-center justify-center gap-space-xs opacity-50 cursor-not-allowed"
                    >
                      <span>Cart is Empty</span>
                    </button>
                  )}
                </div>

                {/* Cambodian Payment Trust Badges */}
                <div className="pt-space-xs flex flex-col gap-space-2xs">
                  <div className="font-label-sm text-label-sm text-on-surface-variant text-center uppercase tracking-wider font-semibold">
                    Accepted Cambodian Gateways
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <span className="px-2 py-1 rounded bg-surface-container-highest font-label-sm text-label-sm text-on-surface font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-tertiary">qr_code_2</span> KHQR
                    </span>
                    <span className="px-2 py-1 rounded bg-surface-container-highest font-label-sm text-label-sm text-on-surface font-medium">ABA PAY</span>
                    <span className="px-2 py-1 rounded bg-surface-container-highest font-label-sm text-label-sm text-on-surface font-medium">Wing Bank</span>
                    <span className="px-2 py-1 rounded bg-surface-container-highest font-label-sm text-label-sm text-on-surface font-medium">ACLEDA</span>
                    <span className="px-2 py-1 rounded bg-surface-container-highest font-label-sm text-label-sm text-on-surface font-medium">Visa / MC</span>
                    <span className="px-2 py-1 rounded bg-surface-container-highest font-label-sm text-label-sm text-secondary font-medium">COD (Phnom Penh)</span>
                  </div>
                </div>
              </div>

              {/* Telegram Support Callout */}
              <div className="bg-surface-container-low rounded-xl p-space-md shadow-md flex items-center justify-between gap-space-sm border border-white/5">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[20px]">support_agent</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface font-semibold">
                      Need Order Assistance?
                    </p>
                    <p className="font-body-sm text-body-sm text-outline">Telegram • (+855) 23 998 889</p>
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
            </aside>
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
};

export default CartPage;
