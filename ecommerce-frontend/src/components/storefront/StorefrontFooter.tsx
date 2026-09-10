import React from 'react';

export const StorefrontFooter: React.FC = () => {
  return (
    <footer className="w-full bg-surface-container-lowest text-on-surface-variant border-t border-white/5">
      <div className="max-w-7xl mx-auto px-space-md lg:px-container-padding-desktop py-space-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-xl mb-space-2xl">
          {/* Brand Info */}
          <div>
            <div className="flex items-center gap-space-xs mb-space-md">
              <span className="font-headline-md text-headline-md text-on-surface font-bold">
                Cambodian <span className="text-secondary">E-Store</span>
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
              Futuristic digital commerce crafted for contemporary Southeast Asian lifestyles with instant local payments.
            </p>
            <div className="flex items-center gap-space-xs text-tertiary">
              <span className="material-symbols-outlined text-[20px]">verified</span>
              <span className="font-label-md text-label-md">Official Retailer in Cambodia</span>
            </div>
          </div>

          {/* Delivery Coverage */}
          <div>
            <h4 className="font-headline-sm text-headline-sm text-on-surface mb-space-md">
              Express Provincial Delivery
            </h4>
            <p className="font-body-md text-body-md text-on-surface-variant mb-space-sm">
              Same-day rapid dispatch in Phnom Penh capital and 24-48h secured delivery across all 25 Cambodian provinces.
            </p>
            <div className="flex flex-wrap gap-space-2xs">
              <span className="font-label-sm text-label-sm px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface border border-white/5">
                Phnom Penh
              </span>
              <span className="font-label-sm text-label-sm px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface border border-white/5">
                Siem Reap
              </span>
              <span className="font-label-sm text-label-sm px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface border border-white/5">
                Battambang
              </span>
              <span className="font-label-sm text-label-sm px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface border border-white/5">
                Sihanoukville
              </span>
              <span className="font-label-sm text-label-sm px-space-xs py-space-2xs rounded bg-surface-container-low text-secondary border border-secondary/20">
                + 21 Provinces
              </span>
            </div>
          </div>

          {/* Hotline & Support */}
          <div>
            <h4 className="font-headline-sm text-headline-sm text-on-surface mb-space-md">
              Support &amp; Hotline
            </h4>
            <div className="space-y-space-xs font-body-md text-body-md">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[20px]">call</span>
                <span className="text-on-surface font-label-lg text-label-lg">+855 (0) 23 999 888</span>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                  schedule
                </span>
                <span>Daily: 8:00 AM - 9:00 PM ICT</span>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                  location_on
                </span>
                <span>Khan Doun Penh, Phnom Penh</span>
              </div>
            </div>
          </div>

          {/* Local Cambodian Payments */}
          <div>
            <h4 className="font-headline-sm text-headline-sm text-on-surface mb-space-md">
              Cambodian Payment Security
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
              Instant QR checkout and multi-tier bank level encrypted payment gateways.
            </p>
            <div className="grid grid-cols-3 gap-space-xs">
              <div className="flex items-center justify-center p-space-xs rounded-lg bg-surface-container text-center font-label-sm text-label-sm text-tertiary border border-tertiary/30 shadow-[0_0_12px_rgba(78,222,163,0.15)] font-bold">
                Bakong KHQR
              </div>
              <div className="flex items-center justify-center p-space-xs rounded-lg bg-surface-container text-center font-label-sm text-label-sm text-secondary font-bold">
                Wing
              </div>
              <div className="flex items-center justify-center p-space-xs rounded-lg bg-surface-container text-center font-label-sm text-label-sm text-primary font-bold">
                ABA PAY
              </div>
              <div className="flex items-center justify-center p-space-xs rounded-lg bg-surface-container text-center font-label-sm text-label-sm text-on-surface">
                Visa
              </div>
              <div className="flex items-center justify-center p-space-xs rounded-lg bg-surface-container text-center font-label-sm text-label-sm text-on-surface">
                Mastercard
              </div>
              <div className="flex items-center justify-center p-space-xs rounded-lg bg-surface-container text-center font-label-sm text-label-sm text-on-surface-variant">
                COD
              </div>
            </div>
          </div>
        </div>

        {/* Footer Legal & Copyright Bar */}
        <div className="pt-space-lg border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-space-md font-body-sm text-body-sm">
          <p>© 2026 Cambodian E-Store. Engineered for digital retail excellence.</p>
          <div className="flex gap-space-lg">
            <span className="text-on-surface-variant hover:text-on-surface cursor-pointer">
              Privacy Notice
            </span>
            <span className="text-on-surface-variant hover:text-on-surface cursor-pointer">
              KHQR Terms of Service
            </span>
            <span className="text-on-surface-variant hover:text-on-surface cursor-pointer">
              Provincial Shipping Policy
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
