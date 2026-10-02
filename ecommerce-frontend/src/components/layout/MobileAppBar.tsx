import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface MobileAppBarProps {
  title?: string | React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const MobileAppBar: React.FC<MobileAppBarProps> = ({
  title,
  showBackButton,
  onBack,
  rightAction,
  leftAction,
  children,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={`fixed top-0 inset-x-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] pt-safe ${className}`}>
      <div className="h-16 px-5 sm:px-6 flex items-center justify-between">
        {children ? (
          children
        ) : (
          <>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {leftAction ? (
                leftAction
              ) : showBackButton ? (
                <button 
                  onClick={handleBack} 
                  className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-95 transition-all rounded-full shrink-0"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
              ) : null}
              {title && (
                <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface truncate">
                  {title}
                </span>
              )}
            </div>
            {rightAction && (
              <div className="flex items-center gap-2 shrink-0">
                {rightAction}
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
};
