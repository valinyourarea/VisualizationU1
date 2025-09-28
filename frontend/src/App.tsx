import React, { useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { ETLPage } from './pages/ETLPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import DatabasePage from './pages/DatabasePage';  // SIN LLAVES - es default export
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('etl');

  const renderContent = () => {
    switch (activeTab) {
      case 'etl':
        return <ETLPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'database':
        return <DatabasePage />;
      case 'users':
        return <UsersPage />;
      default:
        return <ETLPage />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}

// Placeholder component for Users page
const UsersPage = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-2">Users</h1>
    <p className="text-gray-600 mb-8">User data and statistics</p>
    
    <div className="bg-white rounded-lg border border-gray-200">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left p-4 font-semibold text-gray-700">User ID</th>
            <th className="text-left p-4 font-semibold text-gray-700">Age</th>
            <th className="text-left p-4 font-semibold text-gray-700">Country</th>
            <th className="text-left p-4 font-semibold text-gray-700">Subscription</th>
            <th className="text-left p-4 font-semibold text-gray-700">Watch Hours</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-4">U001</td>
            <td className="p-4">28</td>
            <td className="p-4">USA</td>
            <td className="p-4">Premium</td>
            <td className="p-4">156.3</td>
          </tr>
          <tr className="border-b">
            <td className="p-4">U002</td>
            <td className="p-4">35</td>
            <td className="p-4">Canada</td>
            <td className="p-4">Standard</td>
            <td className="p-4">89.7</td>
          </tr>
          <tr className="border-b">
            <td className="p-4">U003</td>
            <td className="p-4">42</td>
            <td className="p-4">Mexico</td>
            <td className="p-4">Basic</td>
            <td className="p-4">45.2</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export default App;