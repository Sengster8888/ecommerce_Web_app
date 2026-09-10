import React from 'react';
import { Link } from 'react-router-dom';

export const DeliveryAssuranceBanner: React.FC = () => {
  return (
    <div className="mt-space-2xl p-space-lg rounded-xl bg-surface-container-lowest flex flex-col md:flex-row items-center justify-between gap-space-lg border border-white/5 shadow-lg">
      <div className="flex items-center gap-space-md">
        <div className="w-12 h-12 rounded-xl bg-secondary-container/20 text-secondary flex items-center justify-center shrink-0 border border-secondary/30">
          <span className="material-symbols-outlined text-[28px]">rocket_launch</span>
        </div>
        <div>
          <h4 className="font-headline-sm text-headline-sm text-on-surface">
            Need Same-Day Dispatch in Phnom Penh?
          </h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Orders placed before 2:00 PM ICT are delivered by 7:00 PM same evening via express local courier across Phnom Penh capital.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-space-sm shrink-0">
        <div className="flex items-center gap-space-2xs px-space-sm py-space-xs rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md border border-white/5">
          <span className="material-symbols-outlined text-tertiary text-[20px]">
            qr_code_scanner
          </span>
          <span>Bakong KHQR Ready</span>
        </div>
        <Link
          to="/orders"
          className="px-space-md py-space-xs rounded-lg bg-surface-container hover:bg-surface-bright text-on-surface font-label-md text-label-md transition-colors border border-white/10"
        >
          Track Existing Parcel
        </Link>
      </div>
    </div>
  );
};
