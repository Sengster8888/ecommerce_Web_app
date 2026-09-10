import React from 'react';

interface ToastNotificationProps {
  message: string | null;
  isVisible: boolean;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ message, isVisible }) => {
  if (!isVisible || !message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-space-xs px-space-md py-space-sm rounded-xl bg-surface-container-highest text-on-surface shadow-2xl border border-tertiary/40 animate-slideUp">
      <span className="material-symbols-outlined text-tertiary text-[22px]">check_circle</span>
      <span className="font-label-md text-label-md">{message}</span>
    </div>
  );
};
