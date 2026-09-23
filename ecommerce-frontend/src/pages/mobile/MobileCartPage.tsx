import React from 'react';
import { useNavigate } from 'react-router-dom';
import { parsePrice } from '../../utils/price.utils';
export interface MobileCartPageProps {
  cartItems: any[];
  loading: boolean;
  updatingItemId: string | number | null;
  subtotal: number;
  totalCount: number;
  discountAmount: number;
  grandTotalUsd: number;
  promoCode: string;
  setPromoCode: (code: string) => void;
  appliedPromo: any;
  promoError: string | null;
  handleUpdateQuantity: (itemId: string | number, newQuantity: number) => void;
  handleRemoveItem: (productId: string | number) => void;
  handleClearCart: () => void;
  handleApplyPromo: () => void;
  handleRemovePromo: () => void;
}

export const MobileCartPage: React.FC<MobileCartPageProps> = ({
  cartItems = [],
  loading = false,
  updatingItemId = null,
  subtotal = 0,
  totalCount = 0,
  discountAmount = 0,
  grandTotalUsd = 0,
  promoCode = '',
  setPromoCode,
  appliedPromo = null,
  promoError = null,
  handleUpdateQuantity,
  handleRemoveItem,
  handleClearCart,
  handleApplyPromo,
  handleRemovePromo,
}) => {
  const navigate = useNavigate();
  
  // Hardcode shipping for demo UI mapping if no real shipping logic exists yet
  const shippingFee = cartItems.length > 0 ? 45 : 0;
  const grandTotal = grandTotalUsd + shippingFee;

  return (
    <div className="bg-surface min-h-screen text-on-surface font-sans pb-[150px]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 pt-safe sticky top-0 z-50 bg-surface/90 backdrop-blur-md">
        <h1 className="font-semibold text-lg tracking-tight ">Shopping Bag {totalCount > 0 ? `(${totalCount})` : ''}</h1>
        <button className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[24px]">favorite_border</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-surface"></span>
        </button>
      </header>

      <main className="px-5 mt-2">
        {cartItems.length > 0 && (
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-sm font-medium text-on-surface-variant">{totalCount} Items</span>
            <button 
              onClick={handleClearCart} 
              disabled={loading}
              className="text-sm text-error font-medium flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50 hover:underline"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Clear All
            </button>
          </div>
        )}
        {/* Cart Items List */}
        <div className="flex flex-col gap-4 mb-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-[48px] text-outline mb-2">shopping_bag</span>
              <p className="text-on-surface-variant">Your shopping bag is empty.</p>
            </div>
          ) : (
            cartItems.map((item) => {
              const product = item.product;
              const primaryImage = product?.images?.find((img: any) => img.isPrimary)?.imageUrl || product?.images?.[0]?.imageUrl || 'https://placehold.co/400?text=No+Image';
              const isUpdating = updatingItemId === item.id;
              
              return (
                <div key={item.id} className="bg-surface-container rounded-3xl p-3 flex gap-4 shadow-sm items-center relative">
                  {/* Remove Button (optional enhancement for user experience) */}
                  <button onClick={() => handleRemoveItem(item.id)} className="absolute top-3 right-3 text-outline hover:text-error">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                  
                  {/* Image */}
                  <div className="w-24 h-24 rounded-2xl bg-surface-container-lowest flex-shrink-0 flex items-center justify-center p-2">
                    <img src={primaryImage} alt={product?.name} className="w-full h-full object-contain" />
                  </div>
                  
                  {/* Details */}
                  <div className="flex flex-col justify-between h-full py-1 flex-1">
                    <div>
                      <h3 className="font-bold text-on-surface text-sm pr-6 line-clamp-1">{product?.name}</h3>
                      <p className="text-on-surface-variant text-xs mt-0.5">
                        Brand: {product?.brand || product?.category?.name || 'Standard'}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-primary font-bold text-lg">$ {parsePrice(product?.price || 0).toFixed(2)}</span>
                      
                      {/* Quantity Selector */}
                      <div className="flex items-center gap-2 bg-surface px-1.5 py-1 rounded-full shadow-sm">
                        <button 
                          disabled={isUpdating || item.quantity <= 1}
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-on-surface disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[16px]">remove</span>
                        </button>
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm">
                          {isUpdating ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : item.quantity}
                        </div>
                        <button 
                          disabled={isUpdating || item.quantity >= (product?.stock || 99)}
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-on-surface disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Promo Code Section */}
        {cartItems.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-3 bg-surface-container rounded-2xl p-2 shadow-sm">
              <input 
                type="text" 
                placeholder="Enter Coupon Code" 
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm px-3 text-on-surface placeholder:text-on-surface-variant"
              />
              {appliedPromo ? (
                <button onClick={handleRemovePromo} className="bg-error text-on-error px-5 py-3 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all">
                  Remove
                </button>
              ) : (
                <button onClick={handleApplyPromo} className="bg-primary text-on-primary px-5 py-3 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all">
                  Apply Code
                </button>
              )}
            </div>
            {promoError && (
              <p className="text-error text-xs mt-2 px-2">{promoError}</p>
            )}
          </div>
        )}

        {/* Order Summary */}
        {cartItems.length > 0 && (
          <div className="bg-surface-container rounded-3xl p-5 shadow-sm">
            <h3 className="text-primary font-bold text-lg mb-4">Order Summary</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-on-surface">Item Total</span>
                <span className="text-on-surface">$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-on-surface">Discount</span>
                <span className={discountAmount > 0 ? "text-error" : "text-on-surface"}>
                  {discountAmount > 0 ? `-$ ${discountAmount.toFixed(2)}` : "$ 0.00"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-on-surface">Delivery</span>
                <span className="text-on-surface">$ {"0.00"}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-on-surface">Tax</span>
                <span className="text-on-surface">$ 0.00</span>
              </div>
              <div className="w-full h-px bg-outline-variant my-1"></div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-on-surface">Total</span>
                <span className="text-on-surface">$ {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Action & Nav Bar */}
      <div className="fixed bottom-0 w-full bg-surface pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-50">
        {cartItems.length > 0 && (
          <div className="px-5 pt-3 pb-2">
            <button 
              onClick={() => navigate('/checkout')}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-on-primary h-14 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg transition-colors active:scale-95 shadow-md disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              Proceed to Checkout
            </button>
          </div>
        )}
        
        {/* Bottom Nav Icons */}
        <nav className="w-full bg-surface-container-low/90 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.7)]">
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
            <a aria-current="page" className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-all duration-200 group text-primary [&>div]:bg-primary/10 [&>div]:scale-105" href="#" onClick={(e) => { e.preventDefault(); navigate('/cart'); }}>
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-200">
                <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
                {totalCount > 0 && (
                  <span className="absolute -top-0.5 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary-container text-on-secondary font-label-sm text-label-sm leading-none flex items-center justify-center font-bold shadow-[0_0_12px_rgba(3,181,211,0.5)]">
                    {totalCount}
                  </span>
                )}
              </div>
              <span className="font-label-sm text-label-sm font-medium tracking-tight">Cart</span>
            </a>
            <a className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl text-on-surface-variant hover:text-on-surface transition-all duration-200 group" href="#" onClick={(e) => { e.preventDefault(); navigate('/orders'); }}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-200">
                <span className="material-symbols-outlined text-[22px]">receipt_long</span>
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
    </div>
  );
};
