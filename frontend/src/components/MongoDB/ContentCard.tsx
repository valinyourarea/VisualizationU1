import React from 'react';

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

interface ContentCardProps {
  movie: Movie;
}

export const ContentCard: React.FC<ContentCardProps> = ({ movie }) => {
  const formatBudget = (budget: number) => {
    if (budget >= 1000000) {
      return `$${(budget / 1000000).toFixed(1)}M`;
    }
    return `$${(budget / 1000).toFixed(0)}K`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(0)}K`;
    }
    return views.toString();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{movie.title}</h3>
        <span className="text-xs text-gray-500 font-mono">{movie.content_id}</span>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {movie.genre.map(g => (
          <span key={g} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
            {g}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-600">Year:</span>
          <span className="ml-1 font-medium">{movie.release_year}</span>
        </div>
        <div>
          <span className="text-gray-600">Duration:</span>
          <span className="ml-1 font-medium">{movie.duration_minutes} min</span>
        </div>
        <div>
          <span className="text-gray-600">Rating:</span>
          <span className="ml-1 font-medium">{movie.rating} </span>
        </div>
        <div>
          <span className="text-gray-600">Views:</span>
          <span className="ml-1 font-medium">{formatViews(movie.views_count)}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Budget</span>
          <span className="text-sm font-semibold text-green-600">
            {formatBudget(movie.production_budget)}
          </span>
        </div>
      </div>

      {/* JSON Preview on Hover */}
      <div className="mt-3 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600 overflow-x-auto">
        <pre>{JSON.stringify({ _id: movie._id, content_id: movie.content_id }, null, 2)}</pre>
      </div>
    </div>
  );
};