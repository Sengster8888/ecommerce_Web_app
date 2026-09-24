import React from 'react';

interface ToastNotificationProps {
  message: string | null;
  isVisible: boolean;
  type?: 'success' | 'error';
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ message, isVisible, type = 'success' }) => {
  if (!isVisible || !message) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-[999] max-w-md flex items-start gap-space-sm px-space-md py-space-sm rounded-md bg-surface-container-highest text-on-surface shadow-2xl border animate-slideUp ${
      type === 'error' ? 'border-[#ff6b6b]/40' : 'border-tertiary/40'
    }`}>
      <span className={`material-symbols-outlined shrink-0 mt-0.5 text-[22px] ${type === 'error' ? 'text-[#ff6b6b]' : 'text-tertiary'}`}>
        {type === 'error' ? 'error' : 'check_circle'}
      </span>
      <span className="font-label-md text-label-md leading-snug">{message}</span>
    </div>
  );
};
