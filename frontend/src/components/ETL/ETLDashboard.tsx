import React from 'react';
import { DAGFlow } from './DAGFlow';
import { NodeStatus } from './NodeStatus';

interface ETLDashboardProps {
  dag: any;
}

export const ETLDashboard: React.FC<ETLDashboardProps> = ({ dag }) => {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <DAGFlow dag={dag} />
      </div>
      <div>
        <NodeStatus nodes={dag.nodes} />
      </div>
    </div>
  );
};

export default ETLDashboard;