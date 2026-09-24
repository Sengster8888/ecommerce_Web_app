import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { StorefrontHeader } from '../components/storefront/StorefrontHeader';
import { StorefrontFooter } from '../components/storefront/StorefrontFooter';
import { useAuth } from '../features/auth/hooks/useAuth';
import { updateProfileApi, changePasswordApi, getMeStatsApi } from '../features/auth/api/auth.api';
import {
  fetchAddressesApi,
  createAddressApi,
  updateAddressApi,
  setDefaultAddressApi,
  deleteAddressApi,
  type Address,
  type CreateAddressData,
} from '../features/addresses/api/addresses.api';
import { fetchMyOrdersApi, type OrderDetail } from '../features/orders/api/orders.api';
import { submitProductRatingApi } from '../features/reviews/api/reviews.api';
import { parsePrice } from '../utils/price.utils';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile, logout } = useAuth();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'addresses' | 'orders' | 'reviews'>('addresses');

  // Real Data states
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [profileStats, setProfileStats] = useState({
    ordersPlaced: 0,
    totalSpent: 0,
    pendingReviews: 0,
    savedLocationsCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Filter states for Order History
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');

  // Form states for Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Edit Profile Modal state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editProfileLoading, setEditProfileLoading] = useState(false);

  // View & Post Avatar Modal states
  const [isViewAvatarModalOpen, setIsViewAvatarModalOpen] = useState(false);
  const [isPostAvatarModalOpen, setIsPostAvatarModalOpen] = useState(false);
  const [postAvatarUrl, setPostAvatarUrl] = useState('');
  const [postAvatarLoading, setPostAvatarLoading] = useState(false);

  // Add/Edit Address Modal state
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);
  const [editAddressId, setEditAddressId] = useState<string | number | null>(null);
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
  const [addressLoading, setAddressLoading] = useState(false);

  // Interactive Reviews & Real Product Ratings state
  const [reviewTab, setReviewTab] = useState<'pending' | 'published'>('pending');
  const [productRatings, setProductRatings] = useState<Record<string | number, number>>({});
  const [productComments, setProductComments] = useState<Record<string | number, string>>({});
  const [submittingReviewId, setSubmittingReviewId] = useState<string | number | null>(null);
  const [submittedReviewIds, setSubmittedReviewIds] = useState<Set<string | number>>(new Set());
  
  // Expanded Orders state for Order History (show 1 product by default)
  const [expandedOrders, setExpandedOrders] = useState<Set<string | number>>(new Set());
  const toggleOrderExpanded = (orderId: string | number) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
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

  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load user data & addresses & orders
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [addrRes, orderRes, statsRes] = await Promise.all([
        fetchAddressesApi(),
        fetchMyOrdersApi(),
        getMeStatsApi(),
      ]);
      setAddresses(addrRes);
      setOrders(orderRes.filter(o => o.status === 'CONFIRMED'));
      setProfileStats(statsRes);
    } catch (err) {
      console.error('Error loading profile data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set default values when edit profile opens
  const handleOpenEditProfile = () => {
    setEditName(user?.fullName || user?.name || displayName);
    setEditPhone(user?.phone || displayPhone);
    setEditAvatarUrl(user?.avatarUrl || displayAvatar);
    setIsEditProfileOpen(true);
  };

  // Submit profile update
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

  // Open Post Avatar modal
  const handleOpenPostAvatar = () => {
    setPostAvatarUrl(user?.avatarUrl || displayAvatar);
    setIsPostAvatarModalOpen(true);
  };

  // Submit Post Avatar
  const handlePostAvatarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postAvatarUrl.trim()) {
      showToast('Please enter or select an avatar image URL.');
      return;
    }
    setPostAvatarLoading(true);
    try {
      await updateProfileApi({
        fullName: displayName,
        phone: user?.phone || undefined,
        avatarUrl: postAvatarUrl.trim(),
      });
      await refreshProfile();
      showToast('New profile avatar posted successfully!');
      setIsPostAvatarModalOpen(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to post avatar.');
    } finally {
      setPostAvatarLoading(false);
    }
  };

  // Handle local image file upload, compress via canvas & convert to lightweight Data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WEBP, etc.).');
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
          setPostAvatarUrl(compressedDataUrl);
          setEditAvatarUrl(compressedDataUrl);
          showToast('Image optimized! Click Post Avatar / Save Changes to apply.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Submit password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (!currentPassword || !newPassword) {
      setPasswordMsg({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await changePasswordApi({ currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: res.message || 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.message)
          ? err.response?.data?.message.join(', ')
          : 'Failed to update password.');
      setPasswordMsg({ type: 'error', text: errorMsg });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Submit new or updated address
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

  // Handle set default address
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

  // Handle delete address
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

  // Compute stats directly from backend API orders
  const totalOrdersCount = profileStats.ordersPlaced;
  const activeOrdersCount = orders.filter((o) =>
    ['SHIPPED', 'PROCESSING', 'CONFIRMED', 'PENDING'].includes(o.status)
  ).length;
  const completedOrdersCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const cancelledOrdersCount = orders.filter((o) => o.status === 'CANCELLED').length;

  const completedOrders = orders.filter((o) => o.status === 'DELIVERED');
  const totalSpentUsd = profileStats.totalSpent;
  const savedLocationsCount = profileStats.savedLocationsCount;

  // Filtered orders list dynamically matching status & query from real backend data
  const filteredOrders = orders.filter((order) => {
    if (orderStatusFilter === 'ACTIVE' && !['SHIPPED', 'PROCESSING', 'CONFIRMED', 'PENDING'].includes(order.status)) {
      return false;
    }
    if (orderStatusFilter === 'COMPLETED' && order.status !== 'DELIVERED') return false;
    if (orderStatusFilter === 'CANCELLED' && order.status !== 'CANCELLED') return false;

    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase();
      const matchId = order.orderNumber.toLowerCase().includes(q) || String(order.id).toLowerCase().includes(q);
      const matchItem = order.items?.some((i) => i.productNameSnapshot.toLowerCase().includes(q));
      return matchId || matchItem;
    }
    return true;
  });

  // Display user info (uses uploaded user.avatarUrl or dynamic Dicebear Lorelei avatar API)
  const displayName = user?.fullName || user?.name || (user?.email ? user.email.split('@')[0] : 'Sokha Chan');
  const displayEmail = user?.email || 'sokha.chan@khmertech.com.kh';
  const displayPhone = user?.phone || '(+855) 12 889 972';
  
  const avatarSeed = displayName;
  const dicebearAvatarUrl = `https://api.dicebear.com/10.x/lorelei/svg?seed=${encodeURIComponent(avatarSeed)}&size=128`;
  const displayAvatar = user?.avatarUrl || dicebearAvatarUrl;

  return (
    <div className="min-h-screen bg-[#0f131d] font-sans text-[#dfe2f1] flex flex-col selection:bg-[#8083ff] selection:text-[#0d0096]">
      {/* Storefront Header */}
      <StorefrontHeader />

      {/* Main Content Area */}
      <main className="w-full pt-20 flex-1">
        <div className="flex flex-col w-full relative">
          {/* Subtle Ambient Glow Orbs */}
          <div className="relative w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
            <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#c0c1ff]/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
            <div className="absolute top-64 right-10 w-80 h-80 bg-[#4cd7f6]/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

            {/* Notification Toast */}
            {toast && (
              <div
                className={`fixed top-24 right-6 z-50 bg-[#1c1f2a] border px-4 py-3 max-w-md rounded-md shadow-2xl flex items-start gap-3 animate-bounce ${
                  toast.type === 'error' ? 'border-[#ff6b6b] text-white' : 'border-[#4edea3] text-white'
                }`}
              >
                <span
                  className={`material-symbols-outlined shrink-0 mt-0.5 ${
                    toast.type === 'error' ? 'text-[#ff6b6b]' : 'text-[#4edea3]'
                  }`}
                >
                  {toast.type === 'error' ? 'error' : 'check_circle'}
                </span>
                <span className="text-sm font-medium leading-snug">{toast.message}</span>
              </div>
            )}

            {/* Top Account Summary Banner */}
            <section className="relative bg-[#1c1f2a]/90 backdrop-blur-xl rounded-2xl border border-[#262a35] shadow-2xl p-6 md:p-8 overflow-hidden">
              <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-gradient-to-br from-[#8083ff]/20 to-[#4cd7f6]/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                {/* User Identity */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="relative shrink-0 group cursor-pointer" onClick={() => setIsViewAvatarModalOpen(true)}>
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[#262a35] ring-4 ring-[#8083ff]/30 shadow-xl flex items-center justify-center relative">
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        src={displayAvatar}
                        alt={displayName}
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-lg" title="View Avatar">
                          visibility
                        </span>
                      </div>
                    </div>
                    {/* Post Avatar Camera Badge Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPostAvatar();
                      }}
                      title="Post / Change Avatar"
                      className="absolute bottom-0 right-0 w-7.5 h-7.5 rounded-full bg-[#8083ff] text-white ring-4 ring-[#1c1f2a] flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="font-outfit font-bold text-2xl sm:text-3xl text-white tracking-tight">
                        {displayName}
                      </h1>
                    </div>

                    {/* View Avatar & Post Avatar Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handleOpenPostAvatar}
                        className="px-3 py-1 rounded-lg bg-[#8083ff] hover:bg-[#6b6eff] text-white font-sans text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_14px_rgba(128,131,255,0.3)] transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                        Post Avatar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsViewAvatarModalOpen(true)}
                        className="px-3 py-1 rounded-lg bg-[#313540] hover:bg-[#3f4452] text-[#4cd7f6] font-sans text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">visibility</span>
                        View Avatar
                      </button>
                      <button
                        type="button"
                        onClick={() => logout()}
                        className="px-3 py-1 rounded-lg bg-[#ff4a4a]/90 hover:bg-[#ff4a4a] text-white font-sans text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_14px_rgba(255,74,74,0.3)] transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">logout</span>
                        Logout
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#c7c4d7] font-sans text-xs sm:text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">
                          phone_iphone
                        </span>
                        {displayPhone}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[#464554] hidden sm:inline-block"></span>
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#c0c1ff]">
                          mail
                        </span>
                        {displayEmail}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto shrink-0">
                  <div className="flex flex-col p-3 sm:p-4 rounded-xl bg-[#0a0e18]/80 border border-[#262a35] backdrop-blur-md shadow-md">
                    <span className="text-[11px] font-medium text-[#908fa0] uppercase tracking-wider">
                      Orders Placed
                    </span>
                    <span className="font-outfit font-bold text-xl text-[#4cd7f6] mt-1">
                      {totalOrdersCount}
                    </span>
                  </div>

                  <div className="flex flex-col p-3 sm:p-4 rounded-xl bg-[#0a0e18]/80 border border-[#262a35] backdrop-blur-md shadow-md">
                    <span className="text-[11px] font-medium text-[#908fa0] uppercase tracking-wider">
                      Total Spent
                    </span>
                    <span className="font-outfit font-bold text-xl text-white mt-1">
                      ${totalSpentUsd.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-col p-3 sm:p-4 rounded-xl bg-[#0a0e18]/80 border border-[#262a35] backdrop-blur-md shadow-md">
                    <span className="text-[11px] font-medium text-[#908fa0] uppercase tracking-wider">
                      Pending Reviews
                    </span>
                    <span className="font-outfit font-bold text-xl text-[#c0c1ff] mt-1">{profileStats.pendingReviews}</span>
                  </div>

                  <div className="flex flex-col p-3 sm:p-4 rounded-xl bg-[#0a0e18]/80 border border-[#262a35] backdrop-blur-md shadow-md">
                    <span className="text-[11px] font-medium text-[#908fa0] uppercase tracking-wider">
                      Saved Locations
                    </span>
                    <span className="font-outfit font-bold text-xl text-white mt-1">
                      {savedLocationsCount}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Navigation Tab Bar */}
            <div className="flex items-center justify-between p-1.5 bg-[#0a0e18] border border-[#262a35] rounded-xl shadow-inner gap-2 overflow-x-auto">
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                {/* Tab 1 */}
                <button
                  type="button"
                  onClick={() => setActiveTab('addresses')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans text-sm font-semibold transition-all ${
                    activeTab === 'addresses'
                      ? 'bg-[#8083ff] text-white shadow-[0_0_20px_rgba(128,131,255,0.4)]'
                      : 'text-[#c7c4d7] hover:text-white hover:bg-[#262a35]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                  Profile &amp; Addresses
                </button>

                {/* Tab 2 */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('orders');
                    setOrderStatusFilter('ALL');
                    setOrderSearchQuery('');
                  }}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans text-sm font-semibold transition-all ${
                    activeTab === 'orders'
                      ? 'bg-[#8083ff] text-white shadow-[0_0_20px_rgba(128,131,255,0.4)]'
                      : 'text-[#c7c4d7] hover:text-white hover:bg-[#262a35]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">local_mall</span>
                  Order History
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">
                    {totalOrdersCount}
                  </span>
                </button>

                {/* Tab 3 */}
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-sans text-sm font-semibold transition-all ${
                    activeTab === 'reviews'
                      ? 'bg-[#8083ff] text-white shadow-[0_0_20px_rgba(128,131,255,0.4)]'
                      : 'text-[#c7c4d7] hover:text-white hover:bg-[#262a35]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">reviews</span>
                  My Reviews
                </button>
              </div>
            </div>

            {/* ========================================================= */}
            {/* TAB 1: PROFILE & ADDRESSES SECTION                        */}
            {/* ========================================================= */}
            {activeTab === 'addresses' && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Profile Details & Password Security (5 Cols) */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Personal Information Card */}
                    <div className="bg-[#1c1f2a] border border-[#262a35] rounded-xl p-6 shadow-xl flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="font-outfit font-semibold text-lg text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#c0c1ff] text-[20px]">
                            person
                          </span>
                          Personal Information
                        </span>
                        <button
                          type="button"
                          onClick={handleOpenEditProfile}
                          className="text-xs font-semibold text-[#4cd7f6] hover:underline cursor-pointer"
                        >
                          Edit Info
                        </button>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col">
                          <label className="text-[10px] font-semibold text-[#908fa0] uppercase tracking-wider mb-1">
                            Full Name
                          </label>
                          <div className="bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-2 text-sm text-white font-medium">
                            {displayName}
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <label className="text-[10px] font-semibold text-[#908fa0] uppercase tracking-wider mb-1">
                            Email Address
                          </label>
                          <div className="bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-2 flex items-center justify-between">
                            <span className="text-sm text-white">{displayEmail}</span>
                            <span className="px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] text-[10px] font-bold">
                              Verified
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <label className="text-[10px] font-semibold text-[#908fa0] uppercase tracking-wider mb-1">
                            Phone (Cambodia OTP)
                          </label>
                          <div className="bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-2 flex items-center justify-between">
                            <span className="text-sm text-white">{displayPhone}</span>
                            <span className="material-symbols-outlined text-[#4edea3] text-[16px]">
                              check_circle
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Password & Security Card */}
                    <div className="bg-[#1c1f2a] border border-[#262a35] rounded-xl p-6 shadow-xl flex flex-col gap-4">
                      <span className="font-outfit font-semibold text-lg text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">
                          lock_reset
                        </span>
                        Password &amp; Security
                      </span>

                      {passwordMsg && (
                        <div
                          className={`p-3 rounded-lg text-xs font-medium ${
                            passwordMsg.type === 'success'
                              ? 'bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {passwordMsg.text}
                        </div>
                      )}

                      <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                        <div className="flex flex-col">
                          <label className="text-xs text-[#908fa0] mb-1">Current Password</label>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8083ff]"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs text-[#908fa0] mb-1">New Password</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min 8 chars, uppercase, number & symbol"
                            className="bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8083ff] placeholder:text-[#464554]"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs text-[#908fa0] mb-1">Confirm New Password</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-type new password"
                            className="bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8083ff] placeholder:text-[#464554]"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={passwordLoading}
                          className="mt-1 px-4 py-2.5 rounded-lg bg-[#262a35] text-white hover:bg-[#313540] text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          {passwordLoading ? 'Updating...' : 'Update Password'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Right Column: Delivery Address Book (7 Cols) */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-outfit font-bold text-xl text-white tracking-tight">
                          Delivery Address Book
                        </h2>
                        <p className="text-xs text-[#908fa0]">
                          Manage home, office, and provincial delivery dispatch locations.
                        </p>
                      </div>
                    </div>

                    {/* Address List */}
                    {addresses.length > 0 ? (
                      addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="bg-[#1c1f2a] border border-[#262a35] rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[#4cd7f6] text-[22px]">
                                {addr.label.toLowerCase().includes('work') ? 'corporate_fare' : 'home'}
                              </span>
                              <span className="font-outfit font-semibold text-base text-white">
                                {addr.label} ({addr.recipientName})
                              </span>
                              {addr.isDefault && (
                                <span className="px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] text-[10px] font-bold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
                                  Default Address
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              {!addr.isDefault && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSetDefaultAddress(addr.id)}
                                    className="text-[#8083ff] hover:underline"
                                  >
                                    Set as Default
                                  </button>
                                  <span className="text-[#464554]">•</span>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenEditAddress(addr)}
                                className="text-[#4cd7f6] hover:underline"
                              >
                                Edit
                              </button>
                              <span className="text-[#464554]">•</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="text-rose-400 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <div className="bg-[#0a0e18]/70 border border-[#262a35] rounded-lg p-4 flex flex-col gap-1">
                            <div className="text-sm text-white font-medium">
                              {addr.streetLine}
                              {addr.commune ? `, ${addr.commune}` : ''}
                            </div>
                            <div className="text-xs text-[#c7c4d7]">
                              {addr.city}, {addr.province}, Cambodia
                            </div>
                            <div className="text-xs text-[#908fa0] mt-1 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] text-[#4edea3]">
                                call
                              </span>
                              Recipient: {addr.phone}
                            </div>
                          </div>

                        </div>
                      ))
                    ) : (
                      <>
                        {/* Static Default Address Preview Card 1 */}
                        <div className="bg-[#1c1f2a] border border-[#262a35] rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[#4cd7f6] text-[22px]">
                                home
                              </span>
                              <span className="font-outfit font-semibold text-base text-white">
                                Home ({displayName})
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] text-[10px] font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
                                Default Address
                              </span>
                            </div>
                          </div>
                          <div className="bg-[#0a0e18]/70 border border-[#262a35] rounded-lg p-4 flex flex-col gap-1">
                            <div className="text-sm text-white font-medium">
                              Street 516, House #18B, Sangkat Boeng Kak 1
                            </div>
                            <div className="text-xs text-[#c7c4d7]">
                              Khan Toul Kork, Phnom Penh 120407, Cambodia
                            </div>
                            <div className="text-xs text-[#908fa0] mt-1 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] text-[#4edea3]">
                                call
                              </span>
                              Recipient: {displayPhone}
                            </div>
                          </div>
                        </div>

                        {/* Static Work Address Card 2 */}
                        <div className="bg-[#1c1f2a] border border-[#262a35] rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[#8083ff] text-[22px]">
                                corporate_fare
                              </span>
                              <span className="font-outfit font-semibold text-base text-white">
                                Work / Corporate Office
                              </span>
                            </div>
                          </div>
                          <div className="bg-[#0a0e18]/70 border border-[#262a35] rounded-lg p-4 flex flex-col gap-1">
                            <div className="text-sm text-white font-medium">
                              Canadia Bank Tower, Floor 14, Unit 1402
                            </div>
                            <div className="text-xs text-[#c7c4d7]">
                              Corner Monivong &amp; Kramuon Sar, Khan Daun Penh, Phnom Penh
                            </div>
                            <div className="text-xs text-[#908fa0] mt-1 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] text-[#4edea3]">
                                call
                              </span>
                              Recipient: (+855) 98 442 110 (Office Desk)
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Add Address dashed card */}
                    <button
                      type="button"
                      onClick={() => setIsAddAddressOpen(true)}
                      className="p-6 rounded-xl bg-[#171b26] border-2 border-dashed border-[#262a35] hover:border-[#8083ff] transition-all flex flex-col items-center justify-center gap-2 text-[#908fa0] hover:text-white group cursor-pointer"
                    >
                      <span className="w-10 h-10 rounded-full bg-[#262a35] group-hover:bg-[#8083ff] group-hover:text-white flex items-center justify-center transition-all">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                      </span>
                      <span className="font-sans font-semibold text-sm text-white">
                        Add Another Delivery Address
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: ORDER HISTORY VIEW                                 */}
            {/* ========================================================= */}
            {activeTab === 'orders' && (
              <div className="flex flex-col gap-6">
                {/* Filter and search toolbar */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 bg-[#171b26] border border-[#262a35] rounded-xl">
                  {/* Status chips */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                    <button
                      type="button"
                      onClick={() => setOrderStatusFilter('ALL')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                        orderStatusFilter === 'ALL'
                          ? 'bg-[#8083ff] text-white'
                          : 'bg-[#262a35] text-[#c7c4d7] hover:text-white'
                      }`}
                    >
                      All ({totalOrdersCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderStatusFilter('ACTIVE')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer ${
                        orderStatusFilter === 'ACTIVE'
                          ? 'bg-[#8083ff] text-white'
                          : 'bg-[#262a35] text-[#c7c4d7] hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#4cd7f6] shadow-[0_0_8px_rgba(76,215,246,0.8)]"></span>
                      Active / In-Transit ({activeOrdersCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderStatusFilter('COMPLETED')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                        orderStatusFilter === 'COMPLETED'
                          ? 'bg-[#8083ff] text-white'
                          : 'bg-[#262a35] text-[#c7c4d7] hover:text-white'
                      }`}
                    >
                      Completed ({completedOrdersCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderStatusFilter('CANCELLED')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                        orderStatusFilter === 'CANCELLED'
                          ? 'bg-[#8083ff] text-white'
                          : 'bg-[#262a35] text-[#c7c4d7] hover:text-white'
                      }`}
                    >
                      Cancelled ({cancelledOrdersCount})
                    </button>
                  </div>

                  {/* Controls: Date & Search */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-1.5 text-[#c7c4d7] text-xs font-medium shrink-0">
                      <span className="material-symbols-outlined text-[16px] text-[#908fa0] mr-1.5">
                        calendar_month
                      </span>
                      <span>2025 - 2026</span>
                    </div>
                    <div className="flex-1 min-w-[200px] flex items-center bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-1.5">
                      <span className="material-symbols-outlined text-[#908fa0] text-[18px] mr-2">
                        search
                      </span>
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        placeholder="Search Order ID or Item..."
                        className="w-full bg-transparent border-none outline-none text-xs text-white placeholder:text-[#908fa0]"
                      />
                    </div>
                  </div>
                </div>

                {/* Orders List */}
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-[#1c1f2a] border border-[#262a35] rounded-xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-4 hover:bg-[#262a35]/60 transition-all duration-300"
                    >
                      <div
                        className={`absolute top-0 left-0 w-1.5 h-full ${
                          ord.status === 'DELIVERED'
                            ? 'bg-[#4edea3]'
                            : ord.status === 'SHIPPED' || ord.status === 'PROCESSING'
                            ? 'bg-[#4cd7f6]'
                            : 'bg-[#8083ff]'
                        }`}
                      ></div>

                      {/* Card Header */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pl-2">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-outfit font-semibold text-base text-white">
                            #{ord.orderNumber}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-[#464554]"></span>
                          <span className="text-xs text-[#908fa0]">
                            Placed {new Date(ord.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-[#464554]"></span>
                          <span className="text-xs text-[#4edea3] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px]">qr_code_scanner</span>
                            {ord.paymentMethod || 'Bakong KHQR Paid'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                              ord.status === 'DELIVERED'
                                ? 'bg-[#4edea3]/15 text-[#4edea3]'
                                : 'bg-[#4cd7f6]/15 text-[#4cd7f6] animate-pulse'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {ord.status === 'DELIVERED' ? 'task_alt' : 'local_shipping'}
                            </span>
                            {ord.status === 'DELIVERED' ? 'Delivered & Verified' : ord.status}
                          </span>
                        </div>
                      </div>

                      {/* Items Sub-panel */}
                      <div className="bg-[#0a0e18]/70 border border-[#262a35] rounded-lg p-4 flex flex-col gap-4">
                        {(expandedOrders.has(ord.id) ? ord.items : ord.items?.slice(0, 1))?.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262a35] last:border-b-0 pb-3 last:pb-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-lg bg-[#262a35] overflow-hidden shrink-0">
                                <img
                                  className="w-full h-full object-cover"
                                  src={item.product?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop'}
                                  alt={item.productNameSnapshot}
                                />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs sm:text-sm font-semibold text-white truncate">
                                  {item.productNameSnapshot}
                                </span>
                                <span className="text-[11px] text-[#908fa0]">Qty: {item.quantity}</span>
                              </div>
                            </div>
                            <div className="text-right sm:self-center">
                              <span className="font-outfit font-bold text-sm text-white">
                                ${parsePrice(item.unitPrice).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {ord.items && ord.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => toggleOrderExpanded(ord.id)}
                            className="text-xs font-semibold text-[#8083ff] hover:text-[#9fa1ff] transition-colors flex items-center justify-center gap-1 w-full py-2 mt-1 rounded-md bg-[#8083ff]/5 hover:bg-[#8083ff]/15 cursor-pointer"
                          >
                            {expandedOrders.has(ord.id) ? (
                              <>
                                <span className="material-symbols-outlined text-[16px]">expand_less</span>
                                Show Less
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[16px]">expand_more</span>
                                Show {ord.items.length - 1} More Item{ord.items.length - 1 !== 1 ? 's' : ''}
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Bottom Summary & Actions */}
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-1 pl-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-[#908fa0]">Total Paid:</span>
                          <span className="font-outfit font-bold text-xl text-[#4cd7f6]">
                            ${parsePrice(ord.totalAmount).toFixed(2)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/orders?id=${ord.id}`}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#4cd7f6] text-[#003640] hover:brightness-110 transition-all shadow-[0_0_16px_rgba(76,215,246,0.3)]"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              share_location
                            </span>
                            Track Order
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#1c1f2a] border border-[#262a35] rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xl">
                    <span className="material-symbols-outlined text-4xl text-[#908fa0]">filter_alt_off</span>
                    <h3 className="text-base font-semibold text-white font-outfit">No Orders Found</h3>
                    <p className="text-xs text-[#908fa0] max-w-sm">
                      {orderSearchQuery.trim()
                        ? `No orders matching "${orderSearchQuery}" were found.`
                        : `You have no orders currently in "${orderStatusFilter}" status.`}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderStatusFilter('ALL');
                        setOrderSearchQuery('');
                      }}
                      className="mt-2 px-4 py-2 rounded-lg bg-[#8083ff] text-white text-xs font-semibold hover:brightness-110 transition-all cursor-pointer shadow-[0_0_14px_rgba(128,131,255,0.3)]"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: MY REVIEWS SECTION                                 */}
            {/* ========================================================= */}
            {activeTab === 'reviews' && (() => {
              const realOrderItems = orders
                .filter(o => o.status === 'CONFIRMED' || o.status === 'DELIVERED')
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
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="font-outfit font-bold text-xl text-white tracking-tight">
                        Product Ratings &amp; Reviews
                      </h2>
                      <p className="text-xs text-[#908fa0]">
                        Share feedback and rate your verified tech purchases.
                      </p>
                    </div>
                    <div className="flex items-center bg-[#0a0e18] border border-[#262a35] p-1 rounded-lg gap-1">
                      <button
                        type="button"
                        onClick={() => setReviewTab('pending')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          reviewTab === 'pending'
                            ? 'bg-[#8083ff] text-white shadow-sm'
                            : 'text-[#c7c4d7] hover:text-white'
                        }`}
                      >
                        Pending ({pendingItems.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewTab('published')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          reviewTab === 'published'
                            ? 'bg-[#8083ff] text-white shadow-sm'
                            : 'text-[#c7c4d7] hover:text-white'
                        }`}
                      >
                        Published ({publishedItems.length})
                      </button>
                    </div>
                  </div>

                  {reviewTab === 'pending' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                      {pendingItems.length > 0 ? (
                        pendingItems.map((item, index) => {
                          const currentStar = productRatings[item.productId] || 5;
                          const currentComment = productComments[item.productId] || '';
                          const isSubmitting = submittingReviewId === item.productId;

                          return (
                            <div
                              key={`${item.orderNumber}-${item.productId}-${index}`}
                              className="bg-[#1c1f2a] border border-[#262a35] rounded-xl p-6 shadow-xl flex flex-col justify-between gap-4 relative overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 px-3 py-1 bg-[#4cd7f6]/15 text-[#4cd7f6] text-[10px] font-bold rounded-bl-lg">
                                Awaiting Feedback
                              </div>

                              <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-14 h-14 rounded-lg bg-[#262a35] overflow-hidden shrink-0">
                                    <img
                                      className="w-full h-full object-cover"
                                      src={item.imageUrl}
                                      alt={item.productName}
                                    />
                                  </div>
                                  <div>
                                    <span className="text-sm font-semibold text-white block">
                                      {item.productName}
                                    </span>
                                    <span className="text-xs text-[#908fa0]">
                                      Delivered • Order #{item.orderNumber}
                                    </span>
                                  </div>
                                </div>

                                {/* Interactive Star Selector */}
                                <div className="bg-[#0a0e18]/80 border border-[#262a35] rounded-lg p-4 flex flex-col gap-2">
                                  <span className="text-xs text-[#908fa0]">How was your overall experience?</span>
                                  <div className="flex items-center gap-1 text-[#4cd7f6]">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span
                                        key={star}
                                        onClick={() =>
                                          setProductRatings((prev) => ({ ...prev, [item.productId]: star }))
                                        }
                                        className={`material-symbols-outlined text-[28px] cursor-pointer hover:scale-110 transition-transform ${
                                          star <= currentStar ? 'text-[#4cd7f6]' : 'text-[#464554]'
                                        }`}
                                      >
                                        star
                                      </span>
                                    ))}
                                    <span className="text-xs font-semibold text-white ml-2">
                                      {currentStar}.0 / 5.0
                                    </span>
                                  </div>
                                  <textarea
                                    rows={3}
                                    value={currentComment}
                                    onChange={(e) =>
                                      setProductComments((prev) => ({ ...prev, [item.productId]: e.target.value }))
                                    }
                                    placeholder="Share build quality, performance, and durability feedback..."
                                    className="w-full bg-[#171b26] border border-[#262a35] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#8083ff] placeholder:text-[#908fa0] resize-none mt-1"
                                  ></textarea>
                                </div>
                              </div>

                              <div className="flex items-center justify-end pt-1">
                                <button
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() => handleItemRatingSubmit(item.productId, item.productName)}
                                  className="px-4 py-2 rounded-lg bg-[#8083ff] text-white text-xs font-semibold shadow-[0_0_18px_rgba(128,131,255,0.35)] hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
                                >
                                  {isSubmitting ? 'Submitting...' : 'Submit Rating & Review'}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-2 bg-[#1c1f2a] border border-[#262a35] rounded-xl p-8 text-center flex flex-col items-center gap-3">
                          <span className="material-symbols-outlined text-4xl text-[#4edea3]">task_alt</span>
                          <h3 className="text-base font-semibold text-white">All Delivered Purchases Reviewed!</h3>
                          <p className="text-xs text-[#908fa0]">You have reviewed all your delivered products. Check the Published tab to view your ratings.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {reviewTab === 'published' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                      {publishedItems.length > 0 ? (
                        publishedItems.map((item, index) => (
                          <div
                            key={`${item.orderNumber}-${item.productId}-${index}`}
                            className="bg-[#1c1f2a] border border-[#262a35] rounded-xl p-6 shadow-xl flex flex-col justify-between gap-4 relative"
                          >
                            <div className="flex flex-col gap-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-14 h-14 rounded-lg bg-[#262a35] overflow-hidden shrink-0">
                                    <img
                                      className="w-full h-full object-cover"
                                      src={item.imageUrl}
                                      alt={item.productName}
                                    />
                                  </div>
                                  <div>
                                    <span className="text-sm font-semibold text-white block">
                                      {item.productName}
                                    </span>
                                    <div className="flex items-center gap-1 text-[#4cd7f6] mt-0.5">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <span
                                          key={s}
                                          className={`material-symbols-outlined text-[16px] ${
                                            s <= (productRatings[item.productId] || 5) ? 'text-[#4cd7f6]' : 'text-[#464554]'
                                          }`}
                                        >
                                          star
                                        </span>
                                      ))}
                                      <span className="text-xs text-white ml-1 font-bold">
                                        {(productRatings[item.productId] || 5)}.0
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] text-[10px] font-bold flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">verified</span>
                                  Verified Buyer
                                </span>
                              </div>

                              <div className="bg-[#0a0e18]/60 border border-[#262a35] rounded-lg p-4 flex flex-col gap-1">
                                <p className="text-xs text-[#dfe2f1] italic">
                                  “{productComments[item.productId] || 'Outstanding build quality and fast courier delivery! Very satisfied with the hardware performance.'}”
                                </p>
                                <span className="text-[11px] text-[#908fa0] mt-1">
                                  Reviewed • Order #{item.orderNumber}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[#908fa0] text-xs pt-1">
                              <span className="flex items-center gap-1 text-[#c7c4d7]">
                                <span className="material-symbols-outlined text-[16px] text-[#8083ff]">
                                  thumb_up
                                </span>
                                Verified Purchase Review
                              </span>
                              <span className="text-[#4edea3] font-semibold text-xs flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                Published
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 bg-[#1c1f2a] border border-[#262a35] rounded-xl p-8 text-center flex flex-col items-center gap-3">
                          <span className="material-symbols-outlined text-4xl text-[#908fa0]">rate_review</span>
                          <h3 className="text-base font-semibold text-white">No Published Reviews Yet</h3>
                          <p className="text-xs text-[#908fa0]">Submit a rating under the Pending tab to publish your product feedback.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1c1f2a] border border-[#262a35] w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="font-outfit font-bold text-lg text-white">Edit Personal Info</h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-[#908fa0] hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#908fa0]">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8083ff]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#908fa0]">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8083ff]"
                  placeholder="(+855) 12 889 972"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#908fa0]">Upload Avatar Image from Device</label>
                <div className="flex items-center gap-2">
                  <label htmlFor="edit-avatar-file-input" className="px-3 py-2 rounded-lg bg-[#262a35] hover:bg-[#313540] text-xs font-semibold text-white cursor-pointer flex items-center gap-1.5 border border-[#313540] transition-colors shrink-0">
                    <span className="material-symbols-outlined text-[16px] text-[#8083ff]">cloud_upload</span>
                    Choose File
                  </label>
                  <input
                    type="file"
                    id="edit-avatar-file-input"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <input
                    type="text"
                    value={editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    className="flex-1 bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8083ff] placeholder:text-[#464554]"
                    placeholder="Or paste image URL (https://...)"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#c7c4d7] hover:bg-[#262a35]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editProfileLoading}
                  className="px-5 py-2 rounded-lg bg-[#8083ff] text-white text-xs font-semibold shadow-md hover:brightness-110 disabled:opacity-50"
                >
                  {editProfileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {(isAddAddressOpen || isEditAddressOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1c1f2a] border border-[#262a35] w-full max-w-lg rounded-2xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-outfit font-bold text-lg text-white">
                {isEditAddressOpen ? 'Edit Delivery Address' : 'Add Delivery Address'}
              </h3>
              <button
                type="button"
                onClick={() => { setIsAddAddressOpen(false); setIsEditAddressOpen(false); }}
                className="text-[#908fa0] hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateAddress} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#908fa0]">Label (e.g. Home, Work)</label>
                  <input
                    type="text"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    className="bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8083ff]"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#908fa0]">Recipient Name</label>
                  <input
                    type="text"
                    value={addressForm.recipientName}
                    onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                    className="bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8083ff]"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#908fa0]">Phone Number</label>
                <input
                  type="text"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  className="bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8083ff]"
                  placeholder="012 889 972"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#908fa0]">Province / Capital</label>
                  <input
                    type="text"
                    value={addressForm.province}
                    onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                    className="bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8083ff]"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#908fa0]">City / District (Khan/Srok)</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8083ff]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#908fa0]">Commune (Sangkat/Khum)</label>
                  <input
                    type="text"
                    value={addressForm.commune}
                    onChange={(e) => setAddressForm({ ...addressForm, commune: e.target.value })}
                    className="bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8083ff]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#908fa0]">Street Line &amp; House #</label>
                  <input
                    type="text"
                    value={addressForm.streetLine}
                    onChange={(e) => setAddressForm({ ...addressForm, streetLine: e.target.value })}
                    className="bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8083ff]"
                    placeholder="Street 516, House #18B"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultCheck"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded border-[#262a35] bg-[#0a0e18] text-[#8083ff] focus:ring-0"
                />
                <label htmlFor="isDefaultCheck" className="text-xs text-[#dfe2f1] cursor-pointer">
                  Set as my default delivery address
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsAddAddressOpen(false); setIsEditAddressOpen(false); }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#c7c4d7] hover:bg-[#262a35]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressLoading}
                  className="px-5 py-2 rounded-lg bg-[#8083ff] text-white text-xs font-semibold shadow-md hover:brightness-110 disabled:opacity-50"
                >
                  {addressLoading ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Avatar Lightbox Modal */}
      {isViewAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#1c1f2a] border border-[#262a35] w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-5 relative">
            <button
              type="button"
              onClick={() => setIsViewAvatarModalOpen(false)}
              className="absolute top-4 right-4 text-[#908fa0] hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="font-outfit font-bold text-lg text-white">Profile Avatar</h3>

            {/* High Res Avatar Container */}
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden bg-[#262a35] ring-4 ring-[#8083ff]/40 shadow-2xl flex items-center justify-center">
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col items-center gap-1 text-center">
              <span className="font-outfit font-bold text-lg text-white">{displayName}</span>
              <span className="text-xs text-[#908fa0]">
                {user?.avatarUrl ? 'Uploaded Profile Avatar' : 'Dicebear Lorelei SVG Avatar'}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsViewAvatarModalOpen(false);
                  handleOpenPostAvatar();
                }}
                className="flex-1 py-2.5 rounded-lg bg-[#8083ff] text-white font-sans text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md hover:brightness-110 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                Post / Change Avatar
              </button>
              <button
                type="button"
                onClick={() => setIsViewAvatarModalOpen(false)}
                className="px-4 py-2.5 rounded-lg bg-[#262a35] text-[#c7c4d7] hover:text-white font-sans text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post & Change Avatar Modal */}
      {isPostAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#1c1f2a] border border-[#262a35] w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8083ff]">photo_camera</span>
                <h3 className="font-outfit font-bold text-lg text-white">Post New Profile Avatar</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPostAvatarModalOpen(false)}
                className="text-[#908fa0] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Live Avatar Preview */}
            <div className="flex flex-col items-center justify-center py-4 bg-[#0a0e18] border border-[#262a35] rounded-xl gap-3">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-[#262a35] ring-4 ring-[#8083ff]/40 shadow-xl flex items-center justify-center">
                <img
                  src={postAvatarUrl || displayAvatar}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = displayAvatar;
                  }}
                />
              </div>
              <span className="text-xs text-[#908fa0]">Live Avatar Preview</span>
            </div>

            {/* Dicebear Avatar Presets */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#908fa0]">Choose Avatar Style Preset</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Lorelei', style: 'lorelei' },
                  { name: 'Adventurer', style: 'adventurer' },
                  { name: 'Fun Emoji', style: 'fun-emoji' },
                  { name: 'Bottts', style: 'bottts' },
                  { name: 'Notionists', style: 'notionists' },
                  { name: 'Big Smile', style: 'big-smile' },
                ].map((preset) => {
                  const presetUrl = `https://api.dicebear.com/10.x/${preset.style}/svg?seed=${encodeURIComponent(displayName)}&size=128`;
                  return (
                    <button
                      key={preset.style}
                      type="button"
                      onClick={() => setPostAvatarUrl(presetUrl)}
                      className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        postAvatarUrl === presetUrl
                          ? 'bg-[#8083ff]/20 border-[#8083ff] text-white shadow-sm'
                          : 'bg-[#0a0e18] border-[#262a35] text-[#c7c4d7] hover:border-[#4cd7f6]'
                      }`}
                    >
                      {preset.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handlePostAvatarSubmit} className="flex flex-col gap-4">
              {/* File Upload Dropzone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#908fa0]">Upload Image File from Computer</label>
                <div className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-[#262a35] hover:border-[#8083ff] rounded-xl bg-[#0a0e18] cursor-pointer transition-colors group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="post-avatar-file-input"
                  />
                  <label htmlFor="post-avatar-file-input" className="flex flex-col items-center gap-1 cursor-pointer w-full text-center">
                    <span className="material-symbols-outlined text-[#8083ff] text-2xl group-hover:scale-110 transition-transform">
                      cloud_upload
                    </span>
                    <span className="text-xs font-semibold text-white">Click to Select Image File (JPG, PNG, WEBP)</span>
                    <span className="text-[10px] text-[#908fa0]">Supports files up to 5MB</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#908fa0]">Or Paste Custom Image URL</label>
                <input
                  type="text"
                  value={postAvatarUrl}
                  onChange={(e) => setPostAvatarUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/demo/image/upload/sample.jpg"
                  className="bg-[#0a0e18] border border-[#262a35] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#8083ff] placeholder:text-[#464554]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPostAvatarModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#c7c4d7] hover:bg-[#262a35]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postAvatarLoading}
                  className="px-5 py-2.5 rounded-lg bg-[#8083ff] text-white text-xs font-semibold shadow-md hover:brightness-110 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">publish</span>
                  {postAvatarLoading ? 'Posting...' : 'Post Avatar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Storefront Footer */}
      <StorefrontFooter />
    </div>
  );
};

export default ProfilePage;
