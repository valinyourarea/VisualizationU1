import React, { useState, useEffect } from 'react';
import { DAGFlow } from '../components/ETL/DAGFlow';
import { PlayIcon, RefreshIcon, ClockIcon, DatabaseIcon } from '../icons/Icons';
import { useETL } from '../hooks/useETL';

export const ETLPage: React.FC = () => {
  const { dag, startETL, resetETL, isRunning } = useETL();
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && dag.startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(dag.startTime).getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, dag.startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ETL Pipeline</h1>
        <p className="text-gray-600">Extract, Transform, Load streaming data into MySQL</p>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={startETL}
              disabled={isRunning}
              className={`
                flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors
                ${isRunning 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-gray-800'
                }
              `}
            >
              <PlayIcon size={20} />
              <span>{isRunning ? 'Running...' : 'Start ETL'}</span>
            </button>

            <button
              onClick={resetETL}
              disabled={isRunning}
              className={`
                flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors border-2 border-gray-300
                ${isRunning 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <RefreshIcon size={20} />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center space-x-6">
            {/* Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                dag.status === 'idle' ? 'bg-gray-400' :
                dag.status === 'running' ? 'bg-blue-500 animate-pulse' :
                dag.status === 'completed' ? 'bg-green-500' :
                'bg-red-500'
              }`} />
              <span className="text-sm font-medium text-gray-700 capitalize">{dag.status}</span>
            </div>

            {/* Timer */}
            {isRunning && (
              <div className="flex items-center space-x-2">
                <ClockIcon size={20} className="text-gray-500" />
                <span className="text-sm font-mono text-gray-700">{formatTime(elapsedTime)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ 
                  width: `${(dag.nodes.filter(n => n.status === 'success').length / dag.nodes.length) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Current Node */}
        {dag.currentNode && isRunning && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Current Task:</span> {
                dag.nodes.find(n => n.id === dag.currentNode)?.name
              }
            </p>
          </div>
        )}
      </div>

      {/* DAG Visualization */}
      <DAGFlow dag={dag} />

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Data Sources</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
            <FileIcon size={32} className="text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2">CSV Files</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tables Created</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
            <DatabaseIcon size={32} className="text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2">MySQL Tables</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Records Processed</p>
              <p className="text-2xl font-bold text-gray-900">
                {dag.status === 'completed' ? '300+' : '-'}
              </p>
            </div>
            <UsersIcon size={32} className="text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Users & Sessions</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {dag.endTime && dag.startTime 
                  ? formatTime(Math.floor((new Date(dag.endTime).getTime() - new Date(dag.startTime).getTime()) / 1000))
                  : '-'
                }
              </p>
            </div>
            <ClockIcon size={32} className="text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Execution Time</p>
        </div>
      </div>

      {/* Error Display */}
      {dag.nodes.some(n => n.status === 'failed') && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertIcon size={20} className="text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Pipeline Failed</h4>
              <p className="text-sm text-red-700 mt-1">
                {dag.nodes.find(n => n.status === 'failed')?.error || 'An error occurred during execution'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Import missing icons
const FileIcon: React.FC<{ size: number; className: string }> = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/>
    <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const UsersIcon: React.FC<{ size: number; className: string }> = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const AlertIcon: React.FC<{ size: number; className: string }> = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2"/>
  </svg>
);