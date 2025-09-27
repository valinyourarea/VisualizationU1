import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
      <h1 className="text-xl font-bold text-gray-900">ETL Dashboard</h1>
      <div className="ml-auto flex items-center space-x-4">
        <span className="text-sm text-gray-600">Status: Connected</span>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      </div>
    </header>
  );
};

export default Header;