import React from 'react';

interface NodeStatusProps {
  /** Puede venir undefined: usamos fallback interno */
  nodes?: Array<{
    id: string;
    name: string;
    status: 'pending' | 'running' | 'success' | 'failed' | 'error' | string;
  }>;
}

export const NodeStatus: React.FC<NodeStatusProps> = ({ nodes }) => {
  // Fallback seguro para evitar nodes.map cuando nodes es undefined/null
  const list = Array.isArray(nodes) ? nodes : [];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4">Node Status</h3>

      {list.length === 0 ? (
        <div className="text-sm text-gray-500">No nodes to display.</div>
      ) : (
        <div className="space-y-2">
          {list.map((node) => {
            const status = (node?.status ?? 'pending') as string;
            const className =
              status === 'success'
                ? 'bg-green-100 text-green-700'
                : status === 'running'
                ? 'bg-blue-100 text-blue-700'
                : status === 'failed' || status === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700';

            return (
              <div
                key={node.id}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
              >
                <span className="text-sm font-medium">{node.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${className}`}>
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NodeStatus;
