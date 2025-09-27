import React, { useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { ETLPage } from './pages/ETLPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
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

// Placeholder components
const DatabasePage = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-2">Database</h1>
    <p className="text-gray-600 mb-8">MySQL database tables and structure</p>
    
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Tables</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center justify-between">
            <span>• users</span>
            <span className="font-mono">100 rows</span>
          </li>
          <li className="flex items-center justify-between">
            <span>• viewing_sessions</span>
            <span className="font-mono">200 rows</span>
          </li>
          <li className="flex items-center justify-between">
            <span>• subscription_types</span>
            <span className="font-mono">3 rows</span>
          </li>
          <li className="flex items-center justify-between">
            <span>• device_types</span>
            <span className="font-mono">4 rows</span>
          </li>
          <li className="flex items-center justify-between">
            <span>• user_metrics</span>
            <span className="font-mono">100 rows</span>
          </li>
        </ul>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Connection Info</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Host:</dt>
            <dd className="font-mono">mysql</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Port:</dt>
            <dd className="font-mono">3306</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Database:</dt>
            <dd className="font-mono">streaming_db</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">User:</dt>
            <dd className="font-mono">etluser</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Status:</dt>
            <dd className="text-green-600 font-medium">Connected</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
);

const UsersPage = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-2">Users</h1>
    <p className="text-gray-600 mb-8">User data and statistics</p>
    
    <div className="bg-white rounded-lg border border-gray-200">
      <table className="table">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Age</th>
            <th>Country</th>
            <th>Subscription</th>
            <th>Watch Hours</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>U001</td>
            <td>28</td>
            <td>USA</td>
            <td>Premium</td>
            <td>156.3</td>
          </tr>
          <tr>
            <td>U002</td>
            <td>35</td>
            <td>Canada</td>
            <td>Standard</td>
            <td>89.7</td>
          </tr>
          <tr>
            <td>U003</td>
            <td>42</td>
            <td>Mexico</td>
            <td>Basic</td>
            <td>45.2</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export default App;