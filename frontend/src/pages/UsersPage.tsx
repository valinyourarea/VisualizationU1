import React, { useState, useEffect, useMemo } from 'react';

interface User {
  user_id: string;
  age: number | null;
  country: string | null;
  subscription_type: string;
  total_sessions: number;
  total_watch_hours: number;
  avg_completion: number;
  favorite_device: string | null;
  last_activity: string;
}

interface UserStats {
  total_users: number;
  avg_age: number;
  countries: number;
  avg_sessions: number;
  avg_watch_hours: number;
  top_countries: Array<{ country: string; count: number }>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof User>('user_id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0
  });
  const [filter, setFilter] = useState({
    subscription: 'all',
    country: 'all',
    activity: 'all'
  });

  // Fetch users data
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        sortBy,
        order: sortOrder,
        page: currentPage.toString(),
        limit: pagination.limit.toString()
      });
      
      const response = await fetch(`http://localhost:4000/api/users?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/users/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Handle sorting
  const handleSort = (column: keyof User) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
    setCurrentPage(1);
  };

  // Filter users locally
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (filter.subscription !== 'all' && user.subscription_type !== filter.subscription) return false;
      if (filter.country !== 'all' && user.country !== filter.country) return false;
      if (filter.activity === 'active' && user.last_activity === 'Never') return false;
      if (filter.activity === 'inactive' && user.last_activity !== 'Never') return false;
      return true;
    });
  }, [users, filter]);

  // Unique values for filters
  const uniqueSubscriptions = useMemo(() => {
    return Array.from(new Set(users.map(u => u.subscription_type)));
  }, [users]);

  const uniqueCountries = useMemo(() => {
    return Array.from(new Set(users.map(u => u.country).filter(Boolean))) as string[];
  }, [users]);

  return (
    <div className="p-8 h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600 mt-1">User data and statistics</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_users.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Avg Age</p>
            <p className="text-2xl font-bold text-gray-900">{stats.avg_age} years</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Countries</p>
            <p className="text-2xl font-bold text-gray-900">{stats.countries}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Avg Sessions</p>
            <p className="text-2xl font-bold text-gray-900">{stats.avg_sessions}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Avg Watch Hours</p>
            <p className="text-2xl font-bold text-gray-900">{stats.avg_watch_hours}h</p>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                className="pl-8 pr-3 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-1 focus:ring-gray-400"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Subscription Filter */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
              value={filter.subscription}
              onChange={(e) => setFilter({ ...filter, subscription: e.target.value })}
            >
              <option value="all">All Subscriptions</option>
              {uniqueSubscriptions.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>

            {/* Country Filter */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
              value={filter.country}
              onChange={(e) => setFilter({ ...filter, country: e.target.value })}
            >
              <option value="all">All Countries</option>
              {uniqueCountries.sort().map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>

            {/* Activity Filter */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
              value={filter.activity}
              onChange={(e) => setFilter({ ...filter, activity: e.target.value })}
            >
              <option value="all">All Activity</option>
              <option value="active">Active Users</option>
              <option value="inactive">Inactive Users</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredUsers.length} of {pagination.total} users
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                {[
                  { key: 'user_id', label: 'User ID' },
                  { key: 'age', label: 'Age' },
                  { key: 'country', label: 'Country' },
                  { key: 'subscription_type', label: 'Subscription' },
                  { key: 'total_sessions', label: 'Sessions' },
                  { key: 'total_watch_hours', label: 'Watch Hours' },
                  { key: 'avg_completion', label: 'Completion' },
                  { key: 'favorite_device', label: 'Device' },
                  { key: 'last_activity', label: 'Last Activity' }
                ].map(column => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(column.key as keyof User)}
                  >
                    <div className="flex items-center gap-1">
                      {column.label}
                      {sortBy === column.key && (
                        <span className="text-gray-400">
                          {sortOrder === 'ASC' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.user_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.age || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.country || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.subscription_type === 'Premium' ? 'bg-purple-100 text-purple-800' :
                        user.subscription_type === 'Standard' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.subscription_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.total_sessions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.total_watch_hours}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${user.avg_completion}%` }}
                          />
                        </div>
                        <span className="text-xs">{user.avg_completion}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.favorite_device || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.last_activity}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === pageNum
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {pagination.pages > 5 && <span className="px-2">...</span>}
            {pagination.pages > 5 && (
              <button
                onClick={() => setCurrentPage(pagination.pages)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === pagination.pages
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pagination.pages}
              </button>
            )}
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
            disabled={currentPage === pagination.pages}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          Page {currentPage} of {pagination.pages}
        </div>
      </div>
    </div>
  );
}