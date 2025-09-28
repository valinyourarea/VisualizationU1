// frontend/src/components/MongoDB/JsonDiagram.tsx
import React, { useState } from 'react';

interface JsonDiagramProps {
  schema: any;
  stats: any;
}

interface TreeNode {
  name: string;
  value?: any;
  type?: string;
  children?: TreeNode[];
  expanded?: boolean;
}

export const JsonDiagram: React.FC<JsonDiagramProps> = ({ schema, stats }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(['root', 'document', 'fields', 'indexes', 'stats'])
  );

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'String': return 'text-green-600';
      case 'Number': return 'text-blue-600';
      case 'Array': return 'text-purple-600';
      case 'Date': return 'text-yellow-600';
      case 'ObjectId': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'String': return '"T"';
      case 'Number': return '#';
      case 'Array': return '[]';
      case 'Date': return 'D';
      case 'ObjectId': return 'ID';
      case 'Object': return '{}';
      default: return '•';
    }
  };

  const TreeNodeComponent: React.FC<{ 
    node: TreeNode; 
    level: number; 
    path: string;
    isLast?: boolean;
    parentPath?: string;
  }> = ({ node, level, path, isLast = false, parentPath = '' }) => {
    const nodeId = `${path}-${node.name}`;
    const isExpanded = expandedNodes.has(nodeId);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div className="relative">
        {/* Connection lines */}
        {level > 0 && (
          <>
            {/* Vertical line from parent */}
            <div 
              className="absolute border-l-2 border-gray-300"
              style={{
                left: `${(level - 1) * 32 + 16}px`,
                top: '-20px',
                height: '20px'
              }}
            />
            {/* Horizontal line to node */}
            <div 
              className="absolute border-t-2 border-gray-300"
              style={{
                left: `${(level - 1) * 32 + 16}px`,
                top: '20px',
                width: '16px'
              }}
            />
          </>
        )}

        {/* Node content */}
        <div 
          className="flex items-center gap-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
          style={{ paddingLeft: `${level * 32}px` }}
          onClick={() => hasChildren && toggleNode(nodeId)}
        >
          {/* Expand/collapse icon */}
          {hasChildren && (
            <span className="text-gray-500 w-4">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {!hasChildren && <span className="w-4" />}

          {/* Node icon */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
            node.type ? 'bg-gray-100' : 'bg-purple-100'
          }`}>
            {node.type ? getTypeIcon(node.type) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7V17C3 19 4 20 6 20H18C20 20 21 19 21 17V9C21 7 20 6 18 6H13L11 4H6C4 4 3 5 3 7Z"/>
              </svg>
            )}
          </div>

          {/* Node name */}
          <span className="font-medium text-gray-800">{node.name}</span>

          {/* Node type */}
          {node.type && (
            <span className={`text-sm ${getTypeColor(node.type)}`}>
              {node.type}
            </span>
          )}

          {/* Node value */}
          {node.value !== undefined && (
            <span className="text-sm text-gray-500">
              = {typeof node.value === 'object' ? JSON.stringify(node.value) : String(node.value)}
            </span>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {/* Vertical line for children */}
            {node.children!.length > 1 && (
              <div 
                className="absolute border-l-2 border-gray-300"
                style={{
                  left: `${level * 32 + 16}px`,
                  top: '0',
                  height: `calc(100% - 40px)`
                }}
              />
            )}
            {node.children!.map((child, index) => (
              <TreeNodeComponent
                key={`${nodeId}-${child.name}-${index}`}
                node={child}
                level={level + 1}
                path={`${path}-${child.name}`}
                isLast={index === node.children!.length - 1}
                parentPath={nodeId}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Build tree structure
  const documentFields: TreeNode[] = [
    { name: '_id', type: 'ObjectId' },
    { name: 'content_id', type: 'String' },
    { name: 'title', type: 'String' },
    { 
      name: 'genre', 
      type: 'Array',
      children: [
        { name: '[0]', value: 'Action', type: 'String' },
        { name: '[1]', value: 'Drama', type: 'String' },
        { name: '[2]', value: 'Sci-Fi', type: 'String' }
      ]
    },
    { name: 'duration_minutes', type: 'Number' },
    { name: 'release_year', type: 'Number' },
    { name: 'rating', type: 'Number' },
    { name: 'views_count', type: 'Number' },
    { name: 'production_budget', type: 'Number' },
    { name: 'created_at', type: 'Date' },
    { name: 'updated_at', type: 'Date' }
  ];

  const indexNodes: TreeNode[] = schema.indexes ? schema.indexes.map((idx: any) => ({
    name: Object.keys(idx.key || {}).join(', '),
    type: 'Index',
    value: idx.name
  })) : [];

  const rootNode: TreeNode = {
    name: 'streaming_nosql',
    children: [
      {
        name: 'movies',
        children: [
          {
            name: `Documents (${schema.documentCount || 0})`,
            children: [
              {
                name: 'Schema',
                children: documentFields
              }
            ]
          },
          {
            name: 'Indexes',
            children: indexNodes
          },
          {
            name: 'Statistics',
            children: [
              { name: 'Total Documents', value: stats?.totalMovies || 0, type: 'Number' },
              { name: 'Unique Genres', value: stats?.uniqueGenres || 0, type: 'Number' },
              { name: 'Avg Rating', value: stats?.yearRange?.avgRating?.toFixed(2) || 0, type: 'Number' },
              { name: 'Total Views', value: stats?.yearRange?.totalViews || 0, type: 'Number' }
            ]
          }
        ]
      }
    ]
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">MongoDB Collection Structure</h3>
          <p className="text-sm text-gray-600 mt-1">Interactive tree visualization of the document schema</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setExpandedNodes(new Set(['root', 'document', 'fields', 'indexes', 'stats']))}
            className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
          >
            Expand All
          </button>
          <button
            onClick={() => setExpandedNodes(new Set(['root']))}
            className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Tree Diagram */}
      <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
        <TreeNodeComponent 
          node={rootNode} 
          level={0} 
          path="root"
        />
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Data Types</h4>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold">"T"</span>
            <span className="text-green-600">String</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold">#</span>
            <span className="text-blue-600">Number</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold">[]</span>
            <span className="text-purple-600">Array</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold">ID</span>
            <span className="text-red-600">ObjectId</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs">📅</span>
            <span className="text-yellow-600">Date</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold">{}</span>
            <span className="text-gray-600">Object</span>
          </div>
        </div>
      </div>

      {/* Genre Distribution (if available) */}
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