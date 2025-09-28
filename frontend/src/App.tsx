import React, { useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { ETLPage } from './pages/ETLPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import DatabasePage from './pages/DatabasePage';
import UsersPage from './pages/UsersPage';
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

export default App;