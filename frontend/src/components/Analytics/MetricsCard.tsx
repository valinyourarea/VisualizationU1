import React from 'react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ 
  title, 
  value, 
  change,
  icon 
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className="text-xs mt-2 text-green-600">{change}</p>
          )}
        </div>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsCard;