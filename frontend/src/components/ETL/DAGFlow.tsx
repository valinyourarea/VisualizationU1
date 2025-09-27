import React, { useEffect, useState } from 'react';
import { ETLDag, ETLNode } from '../../types';

interface DAGFlowProps {
  dag: ETLDag;
}

export const DAGFlow: React.FC<DAGFlowProps> = ({ dag }) => {
  const nodeWidth = 180;
  const nodeHeight = 60;
  const horizontalSpacing = 240;
  const verticalSpacing = 100;

  // Node positions for the DAG layout
  const nodePositions: { [key: string]: { x: number; y: number } } = {
    'validate_files': { x: 50, y: 100 },
    'create_schema': { x: 50 + horizontalSpacing, y: 100 },
    'load_dimensions': { x: 50 + horizontalSpacing * 2, y: 100 },
    'process_users': { x: 50 + horizontalSpacing * 3, y: 50 },
    'process_sessions': { x: 50 + horizontalSpacing * 3, y: 150 },
    'create_aggregations': { x: 50 + horizontalSpacing * 4, y: 100 },
    'validate_data': { x: 50 + horizontalSpacing * 5, y: 100 },
    'generate_stats': { x: 50 + horizontalSpacing * 6, y: 100 },
  };

  const getNodeColor = (status: ETLNode['status']) => {
    switch (status) {
      case 'success': return '#10B981';  // green
      case 'running': return '#3B82F6';  // blue
      case 'failed': return '#EF4444';   // red
      case 'skipped': return '#9CA3AF';  // gray
      default: return '#E5E7EB';         // light gray
    }
  };

  const getNodeBorderStyle = (status: ETLNode['status']) => {
    if (status === 'running') {
      return {
        strokeDasharray: '5,5',
        animation: 'dash 1s linear infinite'
      };
    }
    return {};
  };

  const drawConnections = () => {
    const connections: JSX.Element[] = [];
    
    dag.nodes.forEach(node => {
      node.dependencies.forEach(depId => {
        const fromPos = nodePositions[depId];
        const toPos = nodePositions[node.id];
        
        if (fromPos && toPos) {
          const startX = fromPos.x + nodeWidth;
          const startY = fromPos.y + nodeHeight / 2;
          const endX = toPos.x;
          const endY = toPos.y + nodeHeight / 2;
          
          const midX = (startX + endX) / 2;
          
          const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
          
          connections.push(
            <g key={`${depId}-${node.id}`}>
              <path
                d={path}
                stroke="#D1D5DB"
                strokeWidth="2"
                fill="none"
              />
              <circle cx={endX} cy={endY} r="4" fill="#9CA3AF" />
            </g>
          );
        }
      });
    });
    
    return connections;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">ETL Pipeline DAG</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-300 rounded"></div>
            <span className="text-gray-600">Pending</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600">Running</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Success</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">Failed</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <svg width="1400" height="250" className="dag-svg">
          <style>
            {`
              @keyframes dash {
                to {
                  stroke-dashoffset: -10;
                }
              }
              
              .node-group {
                cursor: pointer;
                transition: transform 0.2s;
              }
              
              .node-group:hover {
                transform: scale(1.05);
              }
              
              .node-rect {
                transition: all 0.3s ease;
              }
              
              .running-node {
                animation: pulse 2s ease-in-out infinite;
              }
              
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
              }
            `}
          </style>
          
          {/* Draw connections first (behind nodes) */}
          {drawConnections()}
          
          {/* Draw nodes */}
          {dag.nodes.map(node => {
            const pos = nodePositions[node.id];
            if (!pos) return null;
            
            const isRunning = node.status === 'running';
            
            return (
              <g 
                key={node.id} 
                className={`node-group ${isRunning ? 'running-node' : ''}`}
                transform={`translate(${pos.x}, ${pos.y})`}
              >
                {/* Node background */}
                <rect
                  className="node-rect"
                  width={nodeWidth}
                  height={nodeHeight}
                  rx="8"
                  fill={getNodeColor(node.status)}
                  stroke={node.status === 'running' ? '#3B82F6' : '#D1D5DB'}
                  strokeWidth="2"
                  {...getNodeBorderStyle(node.status)}
                />
                
                {/* Node icon */}
                <g transform="translate(10, 20)">
                  {node.status === 'success' && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  )}
                  {node.status === 'running' && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                      <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="2" fill="none" strokeDasharray="4 2">
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0 10 10"
                          to="360 10 10"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </svg>
                  )}
                  {node.status === 'failed' && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                      <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
                    </svg>
                  )}
                  {node.status === 'pending' && (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="#9CA3AF">
                      <circle cx="10" cy="10" r="8" stroke="#9CA3AF" strokeWidth="2" fill="none"/>
                    </svg>
                  )}
                </g>
                
                {/* Node text */}
                <text
                  x={nodeWidth / 2}
                  y={nodeHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="13"
                  fontWeight="500"
                  pointerEvents="none"
                >
                  {node.name}
                </text>
                
                {/* Duration indicator for completed nodes */}
                {node.endTime && node.startTime && (
                  <text
                    x={nodeWidth / 2}
                    y={nodeHeight - 8}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    opacity="0.8"
                  >
                    {((new Date(node.endTime).getTime() - new Date(node.startTime).getTime()) / 1000).toFixed(1)}s
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Status Summary */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600">Total Nodes</div>
          <div className="text-2xl font-semibold text-gray-900">{dag.nodes.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-sm text-green-600">Completed</div>
          <div className="text-2xl font-semibold text-green-900">
            {dag.nodes.filter(n => n.status === 'success').length}
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-sm text-blue-600">Running</div>
          <div className="text-2xl font-semibold text-blue-900">
            {dag.nodes.filter(n => n.status === 'running').length}
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-sm text-red-600">Failed</div>
          <div className="text-2xl font-semibold text-red-900">
            {dag.nodes.filter(n => n.status === 'failed').length}
          </div>
        </div>
      </div>
    </div>
  );
};