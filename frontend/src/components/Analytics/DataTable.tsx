import React from 'react';

interface DataTableProps {
  data?: any[];
}

export const DataTable: React.FC<DataTableProps> = ({ data = [] }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-4 font-semibold text-gray-700">User ID</th>
              <th className="text-left p-4 font-semibold text-gray-700">Sessions</th>
              <th className="text-left p-4 font-semibold text-gray-700">Watch Time</th>
              <th className="text-left p-4 font-semibold text-gray-700">Completion</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="p-4">U001</td>
              <td className="p-4">15</td>
              <td className="p-4">45.5h</td>
              <td className="p-4">78%</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="p-4">U002</td>
              <td className="p-4">12</td>
              <td className="p-4">32.3h</td>
              <td className="p-4">65%</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="p-4">U003</td>
              <td className="p-4">8</td>
              <td className="p-4">18.7h</td>
              <td className="p-4">92%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;