import React from 'react';
import ProductsPage from './ProductsPage';
import MobileHomePage from './mobile/MobileHomePage';

export const HomePage: React.FC = () => {
  return (
    <>
      <div className="md:hidden">
        <MobileHomePage />
      </div>
      <div className="hidden md:block">
        <ProductsPage />
      </div>
    </>
  );
};

export default HomePage;
