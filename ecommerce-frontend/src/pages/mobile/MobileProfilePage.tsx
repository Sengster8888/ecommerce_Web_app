import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { updateProfileApi } from '../../features/auth/api/auth.api';
import { getMeStatsApi } from '../../features/auth/api/auth.api';
import {
  fetchAddressesApi,
  createAddressApi,
  updateAddressApi,
  deleteAddressApi,
  setDefaultAddressApi,
  type Address,
  type CreateAddressData,
} from '../../features/addresses/api/addresses.api';
import { fetchMyOrdersApi, type OrderDetail } from '../../features/orders/api/orders.api';
import { fetchCart } from '../../features/cart/api/cart.api';
import { submitProductRatingApi } from '../../features/reviews/api/reviews.api';

export const MobileProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'reviews'>('profile');
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [profileStats, setProfileStats] = useState({
    ordersPlaced: 0,
    totalSpent: 0,
    pendingReviews: 0,
    savedLocationsCount: 0,
  });
  const [cartCount, setCartCount] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Address Modals
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);
  const [editAddressId, setEditAddressId] = useState<string | number | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressForm, setAddressForm] = useState<CreateAddressData>({
    label: 'Home',
    recipientName: '',
    phone: '',
    province: 'Phnom Penh',
    city: 'Khan Toul Kork',
    commune: 'Sangkat Boeng Kak 1',
    streetLine: 'Street 516, House #18B',
    isDefault: true,
  });

  // Reviews State
  const [reviewTab, setReviewTab] = useState<'pending' | 'published'>('pending');
  const [productRatings, setProductRatings] = useState<Record<string | number, number>>({});
  const [productComments, setProductComments] = useState<Record<string | number, string>>({});
  const [submittingReviewId, setSubmittingReviewId] = useState<string | number | null>(null);
  const [submittedReviewIds, setSubmittedReviewIds] = useState<Set<string | number>>(new Set());

  // Edit Profile States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editProfileLoading, setEditProfileLoading] = useState(false);
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const [addrRes, orderRes, statsRes, cartRes] = await Promise.all([
        fetchAddressesApi(),
        fetchMyOrdersApi(),
        getMeStatsApi(),
        fetchCart().catch(() => null),
      ]);
      setAddresses(addrRes);
      setOrders(orderRes.filter((o) => o.status === 'CONFIRMED' || o.status === 'SHIPPED' || o.status === 'PROCESSING' || o.status === 'DELIVERED'));
      setProfileStats(statsRes);
      if (cartRes && cartRes.items) {
        setCartCount(cartRes.items.reduce((acc: number, item: any) => acc + item.quantity, 0));
      }
    } catch (err) {
      console.error('Error loading profile data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteAddress = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await deleteAddressApi(id);
      showToast('Address deleted.');
      const updated = await fetchAddressesApi();
      setAddresses(updated);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete address.';
      showToast(msg, 'error');
    }
  };

  const handleSetDefaultAddress = async (id: string | number) => {
    try {
      await setDefaultAddressApi(id);
      showToast('Default delivery address updated.');
      const updated = await fetchAddressesApi();
      setAddresses(updated);
    } catch (err) {
      showToast('Failed to set default address.', 'error');
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.recipientName || !addressForm.phone || !addressForm.streetLine) {
      showToast('Please fill in required address fields.');
      return;
    }
    setAddressLoading(true);
    try {
      if (isEditAddressOpen && editAddressId) {
        await updateAddressApi(editAddressId, addressForm);
        showToast('Delivery address updated!');
        setIsEditAddressOpen(false);
      } else {
        await createAddressApi(addressForm);
        showToast('New delivery address added!');
        setIsAddAddressOpen(false);
      }
      setEditAddressId(null);
      const updated = await fetchAddressesApi();
      setAddresses(updated);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save address.', 'error');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleOpenEditAddress = (addr: Address) => {
    setAddressForm({
      label: addr.label,
      recipientName: addr.recipientName,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      commune: addr.commune || '',
      streetLine: addr.streetLine,
      isDefault: addr.isDefault,
    });
    setEditAddressId(addr.id);
    setIsEditAddressOpen(true);
  };

  const handleItemRatingSubmit = async (productId: string | number, productName: string) => {
    const itemRating = productRatings[productId] || 5;
    setSubmittingReviewId(productId);
    try {
      await submitProductRatingApi(productId, itemRating);
      showToast(`Thank you! Your ${itemRating}-star rating for "${productName}" has been recorded.`);
      setSubmittedReviewIds((prev) => new Set(prev).add(productId));
    } catch (err: any) {
      let errorMsg = 'Failed to submit rating.';
      if (err.response?.data?.message) {
        errorMsg = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(', ')
          : err.response.data.message;
      }
      showToast(errorMsg, 'error');
    } finally {
      setSubmittingReviewId(null);
    }
  };

  const displayName = user?.fullName || user?.name || (user?.email ? user.email.split('@')[0] : 'Sokha Chan');
  const displayEmail = user?.email || 'sokha.chan@khmertech.com.kh';
  const displayPhone = user?.phone || '(+855) 12 889 972';
  
  const avatarSeed = displayName;
  const dicebearAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`;
  const displayAvatar = user?.avatarUrl || dicebearAvatarUrl;

  const handleOpenEditProfile = () => {
    setEditName(user?.fullName || user?.name || displayName);
    setEditPhone(user?.phone || displayPhone);
    setEditAvatarUrl(user?.avatarUrl || displayAvatar);
    setIsEditProfileOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WEBP, etc.).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setEditAvatarUrl(compressedDataUrl);
          showToast('Image optimized! Click Save Changes to apply.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditProfileLoading(true);
    try {
      await updateProfileApi({
        fullName: editName,
        phone: editPhone,
        avatarUrl: editAvatarUrl || undefined,
      });
      await refreshProfile();
      showToast('Profile updated successfully!');
      setIsEditProfileOpen(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setEditProfileLoading(false);
    }
  };

  const activeOrdersCount = orders.filter((o) =>
    ['SHIPPED', 'PROCESSING', 'CONFIRMED', 'PENDING'].includes(o.status)
  ).length;

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.15)]">
        <div className="h-16 px-container-padding-mobile flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <img alt="Brand logo" className="h-8 w-auto object-contain shrink-0" src="https://res.cloudinary.com/twnsqgoa/image/upload/v1790070307/Untitled_design.png" />
            <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">Profile</h1>
          </div>
          <div className="flex items-center gap-space-2xs shrink-0">
            <button aria-label="Logout" onClick={() => logout()} className="w-11 h-11 flex items-center justify-center rounded-full text-error hover:text-error-container transition-colors">
              <span className="material-symbols-outlined text-[24px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface">
        <div className="flex flex-col w-full px-container-padding-mobile space-y-space-md pb-12">
          
          {/* Top User Profile Summary Card */}
          <div className="relative overflow-hidden rounded-xl bg-surface-container p-space-md shadow-xl backdrop-blur-xl mt-4">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-primary-container/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-secondary/15 rounded-full blur-xl pointer-events-none"></div>
            <div className="relative flex items-start gap-space-sm">
              <button type="button" onClick={() => setIsAvatarPreviewOpen(true)} className="relative shrink-0 block focus:outline-none rounded-full ring-2 ring-transparent focus:ring-primary transition-all">
                <img alt={displayName} className="w-16 h-16 rounded-full object-cover shadow-[0_0_16px_rgba(99,102,241,0.25)] bg-surface-container-high" src={displayAvatar} />
                <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-surface-container flex items-center justify-center p-0.5">
                  <span className="w-full h-full rounded-full bg-tertiary flex items-center justify-center text-on-tertiary shadow-[0_0_8px_rgba(78,222,163,0.7)]">
                    <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                  </span>
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-space-xs flex-wrap justify-between">
                  <h2 className="font-headline-md text-headline-md text-on-surface truncate">{displayName}</h2>
                  <button onClick={handleOpenEditProfile} className="text-primary hover:text-primary-container p-1 bg-surface-container-high rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                </div>
                <p className="mt-1.5 font-body-sm text-body-sm text-on-surface-variant truncate">
                  {displayPhone}&nbsp;<span className="mx-1 text-outline">|</span>&nbsp;{displayEmail}
                </p>
              </div>
            </div>

            {/* 4-Stat Compact Metric Grid */}
            <div className="mt-space-md grid grid-cols-2 gap-space-xs">
              <div className="p-space-xs rounded-lg bg-surface-container-high/60 backdrop-blur-md flex flex-col justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center justify-between">
                  Orders Placed
                  <span className="material-symbols-outlined text-[14px] text-primary">local_shipping</span>
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-headline-sm text-headline-sm text-on-surface">{profileStats.ordersPlaced}</span>
                </div>
              </div>
              
              <div className="p-space-xs rounded-lg bg-surface-container-high/60 backdrop-blur-md flex flex-col justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center justify-between">
                  Total Spent
                  <span className="material-symbols-outlined text-[14px] text-secondary">payments</span>
                </span>
                <div className="mt-1">
                  <div className="font-headline-sm text-headline-sm text-on-surface">${profileStats.totalSpent.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="p-space-xs rounded-lg bg-surface-container-high/60 backdrop-blur-md flex flex-col justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center justify-between">
                  Pending Reviews
                  <span className="material-symbols-outlined text-[14px] text-tertiary">rate_review</span>
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-headline-sm text-headline-sm text-on-surface">{profileStats.pendingReviews}</span>
                </div>
              </div>
              
              <div className="p-space-xs rounded-lg bg-surface-container-high/60 backdrop-blur-md flex flex-col justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center justify-between">
                  Saved Addresses
                  <span className="material-symbols-outlined text-[14px] text-outline">location_on</span>
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-headline-sm text-headline-sm text-on-surface">{addresses.length || profileStats.savedLocationsCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Prominent Tab Navigation Pills */}
          <div className="flex items-center gap-space-xs overflow-x-auto no-scrollbar py-0.5">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-label-md text-label-md transition-all ${activeTab === 'profile' ? 'bg-primary-container text-on-primary shadow-[0_0_18px_rgba(128,131,255,0.45)]' : 'bg-surface-container-high text-on-surface hover:bg-surface-bright'}`}
            >
              <span className="material-symbols-outlined text-[16px]">person</span>
              <span>Profile &amp; Addresses</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-label-md text-label-md transition-all ${activeTab === 'reviews' ? 'bg-primary-container text-on-primary shadow-[0_0_18px_rgba(128,131,255,0.45)]' : 'bg-surface-container-high text-on-surface hover:bg-surface-bright'}`}
            >
              <span className="material-symbols-outlined text-[16px]">reviews</span>
              <span>Reviews</span>
              {profileStats.pendingReviews > 0 && <span className="px-1.5 py-0.2 rounded-full bg-tertiary-container/40 text-tertiary font-label-sm text-label-sm">{profileStats.pendingReviews}</span>}
            </button>
          </div>

          {activeTab === 'profile' && (
            <>
              {/* Section A: Personal Information */}
              <div className="rounded-xl bg-surface-container p-space-md shadow-md space-y-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[20px] text-primary">badge</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">Personal Information</h3>
                  </div>
                </div>
                <div className="space-y-space-xs pt-1">
                  <div className="p-space-xs rounded-lg bg-surface-container-low">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Full Legal Name</span>
                    <p className="font-body-md text-body-md text-on-surface font-medium mt-0.5">{displayName}</p>
                  </div>
                  <div className="p-space-xs rounded-lg bg-surface-container-low">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Email Address</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary font-label-sm text-label-sm">
                        <span className="material-symbols-outlined text-[11px]">verified</span> Verified
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface font-medium mt-0.5 truncate">{displayEmail}</p>
                  </div>
                  <div className="p-space-xs rounded-lg bg-surface-container-low">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Primary Mobile</span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface font-medium mt-0.5">{displayPhone}</p>
                  </div>
                </div>
              </div>

              {/* Section B: Delivery Address Book */}
              <div className="rounded-xl bg-surface-container p-space-md shadow-md space-y-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[20px] text-tertiary">home_pin</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">Delivery Addresses</h3>
                  </div>
                  <button onClick={() => setIsAddAddressOpen(true)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm shadow-[0_0_12px_rgba(128,131,255,0.35)]">
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Add New
                  </button>
                </div>
                
                {addresses.length === 0 ? (
                  <div className="p-space-sm rounded-xl bg-surface-container-low text-center flex flex-col items-center justify-center gap-2 py-6">
                    <span className="material-symbols-outlined text-outline text-3xl">location_off</span>
                    <span className="text-on-surface-variant text-sm">No saved addresses found.</span>
                  </div>
                ) : (
                  addresses.map(addr => (
                    <div key={addr.id} className="p-space-sm rounded-xl bg-surface-container-low relative overflow-hidden space-y-2 mb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`material-symbols-outlined text-[18px] ${addr.isDefault ? 'text-secondary' : 'text-primary'}`}>
                            {addr.label.toLowerCase().includes('work') ? 'apartment' : 'home'}
                          </span>
                          <span className="font-headline-sm text-headline-sm text-on-surface">{addr.label} ({addr.recipientName})</span>
                        </div>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary-fixed-dim font-label-sm text-label-sm shrink-0">
                            Default Address
                          </span>
                        )}
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface">
                        {addr.streetLine}{addr.commune ? `, ${addr.commune}` : ''}, {addr.city}, {addr.province}, Cambodia
                      </p>
                      <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-outline">call</span>
                        Recipient: {addr.phone}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        {!addr.isDefault && (
                          <button onClick={() => handleSetDefaultAddress(addr.id)} className="px-3 py-1 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm">
                            Set Default
                          </button>
                        )}
                        <button onClick={() => handleOpenEditAddress(addr)} className="px-3 py-1 rounded-lg bg-secondary-container/30 text-secondary font-label-sm text-label-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">edit</span> Edit
                        </button>
                        <button onClick={() => handleDeleteAddress(addr.id)} className="px-3 py-1 rounded-lg bg-error-container/30 text-error font-label-sm text-label-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">delete</span> Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'reviews' && (() => {
            const realOrderItems = orders
              .filter(o => o.status === 'CONFIRMED' || o.status === 'SHIPPED' || o.status === 'DELIVERED')
              .flatMap((o) =>
                (o.items || []).map((item) => ({
                  productId: item.productId,
                  productName: item.productNameSnapshot,
                  orderNumber: o.orderNumber,
                  orderStatus: o.status,
                  orderDate: o.createdAt,
                  imageUrl: item.product?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop',
                }))
            );

            const pendingItems = realOrderItems.filter((item) => !submittedReviewIds.has(item.productId));
            const publishedItems = realOrderItems.filter((item) => submittedReviewIds.has(item.productId));

            return (
              <div className="flex flex-col gap-space-md pb-6">
                <div className="flex bg-surface-container-low p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setReviewTab('pending')}
                    className={`flex-1 py-2 rounded-lg text-label-md font-label-md transition-colors ${
                      reviewTab === 'pending'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Pending ({pendingItems.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewTab('published')}
                    className={`flex-1 py-2 rounded-lg text-label-md font-label-md transition-colors ${
                      reviewTab === 'published'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Published ({publishedItems.length})
                  </button>
                </div>

                {reviewTab === 'pending' && (
                  <div className="flex flex-col gap-space-sm">
                    {pendingItems.length > 0 ? (
                      pendingItems.map((item, index) => {
                        const currentStar = productRatings[item.productId] || 5;
                        const currentComment = productComments[item.productId] || '';
                        const isSubmitting = submittingReviewId === item.productId;

                        return (
                          <div key={`${item.orderNumber}-${item.productId}-${index}`} className="bg-surface-container p-space-sm rounded-xl shadow-sm flex flex-col gap-3 relative overflow-hidden">
                            <div className="absolute top-0 right-0 px-2 py-0.5 bg-tertiary-container/30 text-tertiary text-[10px] font-bold rounded-bl-lg">
                              Awaiting Feedback
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="w-12 h-12 rounded-lg bg-surface-container-lowest overflow-hidden shrink-0">
                                <img className="w-full h-full object-cover" src={item.imageUrl} alt={item.productName} />
                              </div>
                              <div>
                                <span className="text-body-sm font-medium text-on-surface line-clamp-1">{item.productName}</span>
                                <span className="text-label-sm text-on-surface-variant">Order #{item.orderNumber}</span>
                              </div>
                            </div>
                            <div className="bg-surface-container-lowest border border-surface-bright rounded-lg p-3 flex flex-col gap-2">
                              <span className="text-label-sm text-on-surface-variant">Rate your item</span>
                              <div className="flex items-center gap-1 text-tertiary">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    onClick={() => setProductRatings((prev) => ({ ...prev, [item.productId]: star }))}
                                    className={`material-symbols-outlined text-[24px] cursor-pointer ${star <= currentStar ? 'text-tertiary' : 'text-outline-variant'}`}
                                  >
                                    star
                                  </span>
                                ))}
                                <span className="text-label-sm font-semibold text-on-surface ml-1">{currentStar}.0</span>
                              </div>
                              <textarea
                                rows={2}
                                value={currentComment}
                                onChange={(e) => setProductComments((prev) => ({ ...prev, [item.productId]: e.target.value }))}
                                placeholder="Share your experience..."
                                className="w-full bg-surface-container-low border border-surface-bright rounded-lg p-2 text-body-sm text-on-surface focus:outline-none focus:border-primary placeholder:text-on-surface-variant/60 resize-none mt-1"
                              ></textarea>
                            </div>
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleItemRatingSubmit(item.productId, item.productName)}
                                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md font-label-md shadow-sm disabled:opacity-50"
                              >
                                {isSubmitting ? 'Submitting...' : 'Submit Review'}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-surface-container p-6 rounded-xl text-center flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-4xl text-secondary">task_alt</span>
                        <h3 className="text-label-lg font-medium text-on-surface">All Caught Up!</h3>
                        <p className="text-body-sm text-on-surface-variant">You have no pending reviews.</p>
                      </div>
                    )}
                  </div>
                )}

                {reviewTab === 'published' && (
                  <div className="flex flex-col gap-space-sm">
                    {publishedItems.length > 0 ? (
                      publishedItems.map((item, index) => (
                        <div key={`${item.orderNumber}-${item.productId}-${index}`} className="bg-surface-container p-space-sm rounded-xl shadow-sm flex flex-col gap-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-surface-container-lowest overflow-hidden shrink-0">
                                <img className="w-full h-full object-cover" src={item.imageUrl} alt={item.productName} />
                              </div>
                              <div>
                                <span className="text-body-sm font-medium text-on-surface line-clamp-1">{item.productName}</span>
                                <div className="flex items-center gap-0.5 text-tertiary mt-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <span key={s} className={`material-symbols-outlined text-[14px] ${s <= (productRatings[item.productId] || 5) ? 'text-tertiary' : 'text-outline-variant'}`}>star</span>
                                  ))}
                                  <span className="text-[10px] text-on-surface ml-1 font-bold">{(productRatings[item.productId] || 5)}.0</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-surface-container-lowest rounded-lg p-3 flex flex-col gap-1">
                            <p className="text-body-sm text-on-surface italic">“{productComments[item.productId] || 'Great product! Very satisfied with the purchase.'}”</p>
                            <span className="text-[10px] text-on-surface-variant mt-1">Order #{item.orderNumber}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-surface-container p-6 rounded-xl text-center flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-4xl text-outline-variant">rate_review</span>
                        <h3 className="text-label-lg font-medium text-on-surface">No Published Reviews</h3>
                        <p className="text-body-sm text-on-surface-variant">Submit a review in the pending tab.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[999] w-[90vw] max-w-sm px-4 py-3 rounded-md shadow-2xl flex items-start gap-3 animate-fade-in text-white ${
          toast.type === 'error' ? 'bg-[#ff6b6b]/95 border border-[#ff6b6b]' : 'bg-[#4edea3]/95 border border-[#4edea3]'
        }`}>
          <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span className="text-sm leading-snug">{toast.message}</span>
        </div>
      )}

      {/* Avatar Preview Modal */}
      {isAvatarPreviewOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
          <div className="absolute top-0 right-0 p-4 pt-safe flex w-full justify-end">
            <button onClick={() => setIsAvatarPreviewOpen(false)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="w-full max-w-sm px-6">
            <img 
              src={displayAvatar} 
              alt={displayName} 
              className="w-full aspect-square rounded-full object-cover border-4 border-surface-container-high shadow-2xl" 
            />
            <h2 className="text-center text-white font-headline-md mt-6">{displayName}</h2>
            <p className="text-center text-white/70 font-body-md mt-1">{displayEmail}</p>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full sm:max-w-md bg-surface-container rounded-t-2xl sm:rounded-2xl p-space-md shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto animate-slide-up sm:animate-none">
            <div className="flex items-center justify-between sticky top-0 bg-surface-container pb-2 pt-1 z-10 border-b border-surface-bright">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Edit Profile</h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full bg-surface-container-high">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant rounded-xl text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant rounded-xl text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline"
                  placeholder="(+855) 12 345 678"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Avatar / Profile Picture</label>
                <div className="flex items-center gap-2">
                  <label htmlFor="mobile-edit-avatar-upload" className="px-3 py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md cursor-pointer flex items-center justify-center gap-1.5 border border-outline-variant transition-colors shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-primary">cloud_upload</span>
                    <span className="hidden sm:inline">Upload</span>
                  </label>
                  <input
                    type="file"
                    id="mobile-edit-avatar-upload"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <input
                    type="url"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    className="flex-1 w-full min-w-0 px-4 py-3 bg-surface-container-highest border border-outline-variant rounded-xl text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline"
                    placeholder="Or paste image URL"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={editProfileLoading}
                className="w-full py-3.5 rounded-full bg-primary text-on-primary font-label-lg flex items-center justify-center gap-2 mt-4 hover:shadow-md disabled:opacity-50 transition-all"
              >
                {editProfileLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {(isAddAddressOpen || isEditAddressOpen) && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full sm:max-w-md bg-surface-container rounded-t-2xl sm:rounded-2xl p-space-md shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto animate-slide-up sm:animate-none">
            <div className="flex items-center justify-between sticky top-0 bg-surface-container pb-2 pt-1 z-10 border-b border-surface-bright">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{isEditAddressOpen ? 'Edit Address' : 'Add New Address'}</h3>
              <button onClick={() => { setIsAddAddressOpen(false); setIsEditAddressOpen(false); }} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full bg-surface-container-high">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateAddress} className="flex flex-col gap-space-sm pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-label-sm font-label-sm text-on-surface-variant">Label (e.g. Home, Work)</label>
                  <input
                    type="text"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    className="bg-surface-container-low border border-surface-bright rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-label-sm font-label-sm text-on-surface-variant">Recipient Name</label>
                  <input
                    type="text"
                    value={addressForm.recipientName}
                    onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                    className="bg-surface-container-low border border-surface-bright rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-label-sm font-label-sm text-on-surface-variant">Phone Number</label>
                <input
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  className="bg-surface-container-low border border-surface-bright rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-label-sm font-label-sm text-on-surface-variant">Province/City</label>
                  <input
                    type="text"
                    value={addressForm.province}
                    onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                    className="bg-surface-container-low border border-surface-bright rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-label-sm font-label-sm text-on-surface-variant">District/Khan</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="bg-surface-container-low border border-surface-bright rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-label-sm font-label-sm text-on-surface-variant">Commune/Sangkat</label>
                  <input
                    type="text"
                    value={addressForm.commune}
                    onChange={(e) => setAddressForm({ ...addressForm, commune: e.target.value })}
                    className="bg-surface-container-low border border-surface-bright rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-label-sm font-label-sm text-on-surface-variant">Street Line &amp; House #</label>
                <input
                  type="text"
                  value={addressForm.streetLine}
                  onChange={(e) => setAddressForm({ ...addressForm, streetLine: e.target.value })}
                  className="bg-surface-container-low border border-surface-bright rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="mobileIsDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                />
                <label htmlFor="mobileIsDefault" className="text-body-sm text-on-surface cursor-pointer">Set as default delivery address</label>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-surface-bright">
                <button
                  type="button"
                  onClick={() => { setIsAddAddressOpen(false); setIsEditAddressOpen(false); }}
                  className="px-4 py-2 rounded-xl text-on-surface-variant font-label-md hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressLoading}
                  className="px-6 py-2 rounded-xl bg-primary text-on-primary font-label-md shadow-sm disabled:opacity-50"
                >
                  {addressLoading ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
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
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary-container text-on-secondary font-label-sm text-label-sm leading-none flex items-center justify-center font-bold shadow-[0_0_12px_rgba(3,181,211,0.5)]">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="font-label-sm text-label-sm font-medium tracking-tight">Cart</span>
          </a>
          <a className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl text-on-surface-variant hover:text-on-surface transition-all duration-200 group" href="#" onClick={(e) => { e.preventDefault(); navigate('/orders'); }}>
            <div className="flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-200">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 0" }}>receipt_long</span>
            </div>
            <span className="font-label-sm text-label-sm font-medium tracking-tight">Orders</span>
          </a>
          <a aria-current="page" className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-all duration-200 group text-primary [&>div]:bg-primary/10 [&>div]:scale-105" href="#">
            <div className="flex items-center justify-center w-8 h-8 rounded-full transition-transform duration-200">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            </div>
            <span className="font-label-sm text-label-sm font-medium tracking-tight">Profile</span>
          </a>
        </div>
      </nav>
    </div>
  );
};

export default MobileProfilePage;
