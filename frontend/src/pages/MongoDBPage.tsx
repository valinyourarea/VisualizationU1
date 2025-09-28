import React, { useState, useEffect } from 'react';
import { JsonDiagram } from '../components/MongoDB/JsonDiagram';
import { ContentCard } from '../components/MongoDB/ContentCard';
import { api } from '../services/api';

interface Movie {
  _id: string;
  content_id: string;
  title: string;
  genre: string[];
  duration_minutes: number;
  release_year: number;
  rating: number;
  views_count: number;
  production_budget: number;
}

interface Stats {
  totalMovies: number;
  uniqueGenres: number;
  yearRange: {
    minYear: number;
    maxYear: number;
    avgRating: number;
    totalViews: number;
    avgBudget: number;
  };
  genreDistribution: Array<{
    _id: string;
    count: number;
    avgRating: number;
  }>;
}

export default function MongoDBPage() {
  const [view, setView] = useState<'diagram' | 'cards'>('diagram');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [etlRunning, setEtlRunning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [moviesRes, statsRes, schemaRes] = await Promise.all([
        api.get('/mongodb/content?limit=20'),
        api.get('/mongodb/stats'),
        api.get('/mongodb/schema')
      ]);

      setMovies(moviesRes.data || []);
      setStats(statsRes.stats);
      setSchema(schemaRes.schema);
    } catch (error) {
      console.error('Error fetching MongoDB data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runMongoETL = async () => {
    setEtlRunning(true);
    try {
      const response = await api.post('/mongodb/etl/start');
      if (response.success) {
        alert(`ETL Complete! Processed ${response.stats.totalDocuments} documents`);
        await fetchData();
      }
    } catch (error) {
      console.error('ETL Error:', error);
      alert('ETL Failed');
    } finally {
      setEtlRunning(false);
    }
  };

  return (
    <div className="p-8 h-full bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">MongoDB Database</h1>
        <p className="text-gray-600 mt-1">NoSQL Document Store - Movies Collection</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Total Documents</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalMovies}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Unique Genres</p>
            <p className="text-2xl font-bold text-gray-900">{stats.uniqueGenres}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Year Range</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.yearRange?.minYear}-{stats.yearRange?.maxYear}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Avg Rating</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.yearRange?.avgRating?.toFixed(1)} ★
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Total Views</p>
            <p className="text-2xl font-bold text-gray-900">
              {(stats.yearRange?.totalViews / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mb-6 flex gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setView('diagram')}
            className={`px-4 py-2 rounded ${
              view === 'diagram' ? 'bg-black text-white' : 'bg-white border border-gray-300'
            }`}
          >
            Schema View
          </button>
          <button
            onClick={() => setView('cards')}
            className={`px-4 py-2 rounded ${
              view === 'cards' ? 'bg-black text-white' : 'bg-white border border-gray-300'
            }`}
          >
            Documents View
          </button>
        </div>
        <button
          onClick={runMongoETL}
          disabled={etlRunning}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {etlRunning ? 'Running ETL...' : 'Run MongoDB ETL'}
        </button>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : view === 'diagram' ? (
        <JsonDiagram schema={schema} stats={stats} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {movies.map(movie => (
            <ContentCard key={movie._id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
