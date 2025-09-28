import React, { useState } from 'react';

interface JsonDiagramProps {
  schema: any;
  stats: any;
}

export const JsonDiagram: React.FC<JsonDiagramProps> = ({ schema, stats }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  if (!schema) {
    return <div>No schema data available</div>;
  }

  const sampleDoc = schema.sampleDocument || {
    _id: 'ObjectId',
    content_id: 'String',
    title: 'String',
    genre: ['Array<String>'],
    duration_minutes: 'Number',
    release_year: 'Number',
    rating: 'Number',
    views_count: 'Number',
    production_budget: 'Number',
    created_at: 'Date',
    updated_at: 'Date'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Structure</h3>
        <div className="text-sm text-gray-600">
          Collection: <span className="font-mono">movies</span> | 
          Documents: <span className="font-mono">{schema.documentCount}</span>
        </div>
      </div>

      {/* JSON Tree Visualization */}
      <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
        <div className="text-purple-600">{"{"}</div>
        
        {/* Database Info */}
        <div className="pl-4">
          <span className="text-blue-600">"database"</span>: 
          <span className="text-green-600"> "streaming_nosql"</span>,
        </div>
        
        <div className="pl-4">
          <span className="text-blue-600">"collection"</span>: 
          <span className="text-green-600"> "movies"</span>,
        </div>

        {/* Document Structure */}
        <div className="pl-4">
          <span 
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => toggleNode('document')}
          >
            "document"
          </span>: {expandedNodes.has('document') ? '{' : '{ ... }'}
          
          {expandedNodes.has('document') && (
            <div className="pl-4">
              {Object.entries(sampleDoc).map(([key, value], index) => {
                const isLast = index === Object.entries(sampleDoc).length - 1;
                let displayValue = value;
                
                if (typeof value === 'object' && value !== null) {
                  if (Array.isArray(value)) {
                    displayValue = `[${value.join(', ')}]`;
                  } else {
                    displayValue = JSON.stringify(value);
                  }
                } else if (typeof value === 'string') {
                  displayValue = `"${value}"`;
                } else {
                  displayValue = String(value);
                }

                return (
                  <div key={key}>
                    <span className="text-blue-600">"{key}"</span>: 
                    <span className="text-orange-600"> {displayValue}</span>
                    {!isLast && ','}
                  </div>
                );
              })}
              <div>{'}'}</div>
            </div>
          )}
        </div>

        {/* Indexes */}
        <div className="pl-4 mt-2">
          <span 
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => toggleNode('indexes')}
          >
            "indexes"
          </span>: {expandedNodes.has('indexes') ? '[' : '[ ... ]'}
          
          {expandedNodes.has('indexes') && schema.indexes && (
            <div className="pl-4">
              {schema.indexes.map((index: any, i: number) => (
                <div key={i}>
                  {JSON.stringify(index.key)}
                  {i < schema.indexes.length - 1 && ','}
                </div>
              ))}
              <div>{']'}</div>
            </div>
          )}
        </div>

        <div className="text-purple-600">{"}"}</div>
      </div>

      {/* Genre Distribution */}
      {stats?.genreDistribution && (
        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Genre Distribution</h4>
          <div className="space-y-2">
            {stats.genreDistribution.slice(0, 5).map((genre: any) => (
              <div key={genre._id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{genre._id}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${(genre.count / stats.totalMovies) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{genre.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};