import React from 'react';
import { Outlet } from 'react-router-dom';
import { MobileBottomNav } from './MobileBottomNav';

export const MobileLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-[#0f131d] text-[#dfe2f1] flex flex-col md:hidden">
      {/* 
        Main content area. 
        Added pb-24 to ensure content is not hidden behind the fixed bottom nav.
      */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>
      
      <MobileBottomNav />
    </div>
  );
};
