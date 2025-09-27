import React from 'react';

export const Charts: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Session Trends</h3>
      <div className="h-64 flex items-end justify-between">
        {[65, 78, 82, 91, 85, 73, 88, 95, 87, 92, 98, 94].map((height, i) => (
          <div
            key={i}
            className="w-8 bg-black hover:bg-gray-800 transition-colors cursor-pointer"
            style={{ height: `${height}%` }}
            title={`Day ${i + 1}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <span key={day}>{day}</span>
        ))}
      </div>
    </div>
  );
};

export default Charts;