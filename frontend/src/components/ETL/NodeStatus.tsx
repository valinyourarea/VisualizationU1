import React from 'react';

interface NodeStatusProps {
  nodes: any[];
}

export const NodeStatus: React.FC<NodeStatusProps> = ({ nodes }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4">Node Status</h3>
      <div className="space-y-2">
        {nodes.map((node) => (
          <div key={node.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
            <span className="text-sm font-medium">{node.name}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              node.status === 'success' ? 'bg-green-100 text-green-700' :
              node.status === 'running' ? 'bg-blue-100 text-blue-700' :
              node.status === 'failed' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {node.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodeStatus;