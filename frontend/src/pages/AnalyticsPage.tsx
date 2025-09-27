import React, { useState, useEffect } from 'react';
import { ChartIcon, UsersIcon, ClockIcon, CheckIcon } from '../icons/Icons';
import { api } from '../services/api';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const data = await api.get('/analytics');
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
      <p className="text-gray-600 mb-8">Data insights and metrics</p>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={UsersIcon}
          label="Total Users"
          value="100"
          change="+12%"
          positive={true}
        />
        <MetricCard
          icon={ChartIcon}
          label="Total Sessions"
          value="200"
          change="+8%"
          positive={true}
        />
        <MetricCard
          icon={ClockIcon}
          label="Avg Watch Time"
          value="45 min"
          change="-5%"
          positive={false}
        />
        <MetricCard
          icon={CheckIcon}
          label="Completion Rate"
          value="68%"
          change="+3%"
          positive={true}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Bar Chart - Device Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Device Distribution</h3>
          <div className="space-y-3">
            <BarItem label="Desktop" value={45} />
            <BarItem label="Mobile" value={30} />
            <BarItem label="Smart TV" value={20} />
            <BarItem label="Tablet" value={5} />
          </div>
        </div>

        {/* Pie Chart - Subscription Types */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Subscription Types</h3>
          <div className="flex items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="80" fill="#F5F5F5" />
              <path
                d="M 100 100 L 100 20 A 80 80 0 0 1 180 100 Z"
                fill="#000000"
              />
              <path
                d="M 100 100 L 180 100 A 80 80 0 0 1 100 180 Z"
                fill="#737373"
              />
              <path
                d="M 100 100 L 100 180 A 80 80 0 1 1 100 20 Z"
                fill="#D4D4D4"
              />
            </svg>
            <div className="ml-6 space-y-2">
              <LegendItem color="#000000" label="Premium" value="35%" />
              <LegendItem color="#737373" label="Standard" value="45%" />
              <LegendItem color="#D4D4D4" label="Basic" value="20%" />
            </div>
          </div>
        </div>
      </div>

      {/* Time Series */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Sessions Over Time</h3>
        <div className="h-64 flex items-end justify-between">
          {[65, 78, 82, 91, 85, 73, 88, 95, 87, 92, 98, 94].map((height, i) => (
            <div
              key={i}
              className="w-8 bg-black hover:bg-gray-800 transition-colors cursor-pointer"
              style={{ height: `${height}%` }}
              title={`Month ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
          <span>Jul</span>
          <span>Aug</span>
          <span>Sep</span>
          <span>Oct</span>
          <span>Nov</span>
          <span>Dec</span>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const MetricCard: React.FC<{
  icon: React.FC<{ size: number; className: string }>;
  label: string;
  value: string;
  change: string;
  positive: boolean;
}> = ({ icon: Icon, label, value, change, positive }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className={`text-xs mt-2 ${positive ? 'text-green-600' : 'text-red-600'}`}>
          {change} from last period
        </p>
      </div>
      <Icon size={24} className="text-gray-400" />
    </div>
  </div>
);

const BarItem: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div>
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-700">{label}</span>
      <span className="text-gray-900 font-medium">{value}%</span>
    </div>
    <div className="h-6 bg-gray-100 rounded">
      <div
        className="h-full bg-black rounded transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const LegendItem: React.FC<{ color: string; label: string; value: string }> = ({ 
  color, 
  label, 
  value 
}) => (
  <div className="flex items-center space-x-2">
    <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
    <span className="text-sm text-gray-700">{label}</span>
    <span className="text-sm font-medium text-gray-900">{value}</span>
  </div>
);