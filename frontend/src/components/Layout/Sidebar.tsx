import React from 'react';
import { DatabaseIcon, FlowIcon, ChartIcon, UsersIcon } from '../../icons/Icons';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'etl', label: 'ETL Pipeline', icon: FlowIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartIcon },
    { id: 'database', label: 'Database', icon: DatabaseIcon },
    { id: 'users', label: 'Users', icon: UsersIcon },
  ];

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
            <DatabaseIcon size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Streaming ETL</h2>
            <p className="text-xs text-gray-500">Data Pipeline</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors
                ${isActive 
                  ? 'bg-black text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Status Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">MySQL Status</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          <p className="text-xs text-gray-500">Database Connected</p>
          <p className="text-xs text-gray-500 mt-1">streaming_db</p>
        </div>
      </div>
    </aside>
  );
};