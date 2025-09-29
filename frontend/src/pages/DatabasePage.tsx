import React, { useEffect, useState } from 'react';

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  key: 'PRI' | 'MUL' | 'UNI' | '';
  default: any;
  extra: string;
}

interface ForeignKey {
  constraintName: string;
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
}

interface Table {
  name: string;
  columns: Column[];
  foreignKeys: ForeignKey[];
  rowCount: number;
}

interface DatabaseSchema {
  database: string;
  tables: Table[];
  stats: {
    totalTables: number;
    totalRows: number;
    relationships: number;
  };
}

// Posiciones fijas optimizadas para vista completa
const TABLE_POSITIONS: Record<string, { x: number; y: number }> = {
  subscription_types: { x: 40, y: 60 },
  device_types: { x: 40, y: 260 },
  users: { x: 360, y: 160 },
  viewing_sessions: { x: 680, y: 160 },
  user_metrics: { x: 1000, y: 160 },
};

export default function DatabasePage() {
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [hoveredRelation, setHoveredRelation] = useState<string | null>(null);

  useEffect(() => {
    fetchSchema();
  }, []);

  const fetchSchema = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/database/schema');
      const data = await response.json();
      
      if (data.success) {
        setSchema(data);
      } else {
        setError(data.message || 'Failed to load schema');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  const getKeyIndicator = (key: string) => {
    switch (key) {
      case 'PRI': return 'PK';
      case 'MUL': return 'FK';
      case 'UNI': return 'UK';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading database schema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error: {error}</p>
          <button 
            onClick={fetchSchema}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!schema) return null;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Database Schema</h1>
            <p className="text-gray-600 mt-1">Entity Relationship Diagram for {schema.database}</p>
          </div>
          <div className="flex items-center gap-8 text-sm text-gray-600">
            <div>
              <span className="text-gray-500">Tables:</span>
              <span className="ml-2 font-semibold text-gray-900">{schema.stats.totalTables}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Rows:</span>
              <span className="ml-2 font-semibold text-gray-900">{schema.stats.totalRows.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500">Relationships:</span>
              <span className="ml-2 font-semibold text-gray-900">{schema.stats.relationships}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ER Diagram - Fixed size, no zoom */}
      <div className="flex-1 relative overflow-auto bg-gray-50">
        <svg 
          width="1320" 
          height="600"
          className="min-w-full"
        >
          {/* Grid Background */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="1320" height="600" fill="url(#grid)" />

          {/* Draw Relationships */}
          {schema.tables.map(table => 
            table.foreignKeys.map(fk => {
              const fromPos = TABLE_POSITIONS[table.name] || { x: 500, y: 500 };
              const toPos = TABLE_POSITIONS[fk.referencedTable] || { x: 600, y: 600 };
              const relationId = `${table.name}-${fk.columnName}-${fk.referencedTable}`;
              const isHovered = hoveredRelation === relationId;
              
              // Calculate table dimensions for better arrow placement
              const fromTable = schema.tables.find(t => t.name === table.name);
              const fromHeight = fromTable ? 40 + (fromTable.columns.length * 28) : 100;
              
              return (
                <g key={relationId}>
                  <defs>
                    <marker
                      id={`arrow-${relationId}`}
                      markerWidth="8"
                      markerHeight="8"
                      refX="8"
                      refY="4"
                      orient="auto"
                    >
                      <path
                        d="M 0 0 L 8 4 L 0 8 Z"
                        fill={isHovered ? '#374151' : '#9CA3AF'}
                      />
                    </marker>
                  </defs>
                  <line
                    x1={fromPos.x + 280}
                    y1={fromPos.y + fromHeight/2}
                    x2={toPos.x}
                    y2={toPos.y + 50}
                    stroke={isHovered ? '#374151' : '#D1D5DB'}
                    strokeWidth={isHovered ? '2' : '1.5'}
                    markerEnd={`url(#arrow-${relationId})`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredRelation(relationId)}
                    onMouseLeave={() => setHoveredRelation(null)}
                  />
                  {isHovered && (
                    <text
                      x={(fromPos.x + toPos.x + 280) / 2}
                      y={(fromPos.y + toPos.y + fromHeight/2 + 50) / 2 - 5}
                      fill="#374151"
                      fontSize="11"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {fk.columnName} → {fk.referencedColumn}
                    </text>
                  )}
                </g>
              );
            })
          )}

          {/* Draw Tables */}
          {schema.tables.map(table => {
            const pos = TABLE_POSITIONS[table.name] || { x: 500, y: 500 };
            const isSelected = selectedTable === table.name;
            const tableHeight = 40 + (table.columns.length * 28);
            
            return (
              <g 
                key={table.name}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onClick={() => setSelectedTable(isSelected ? null : table.name)}
              >
                {/* Table Shadow */}
                <rect
                  x="2"
                  y="2"
                  width="280"
                  height={tableHeight}
                  fill="black"
                  opacity="0.1"
                  rx="4"
                />
                
                {/* Table Background */}
                <rect
                  width="280"
                  height={tableHeight}
                  fill="white"
                  stroke={isSelected ? '#1F2937' : '#D1D5DB'}
                  strokeWidth={isSelected ? '2' : '1'}
                  rx="4"
                />
                
                {/* Table Header */}
                <rect
                  width="280"
                  height="40"
                  fill={isSelected ? '#1F2937' : '#F9FAFB'}
                  stroke={isSelected ? '#1F2937' : '#D1D5DB'}
                  strokeWidth={isSelected ? '2' : '1'}
                  rx="4"
                />
                <rect
                  y="30"
                  width="280"
                  height="10"
                  fill={isSelected ? '#1F2937' : '#F9FAFB'}
                />
                
                {/* Table Name */}
                <text
                  x="12"
                  y="25"
                  fill={isSelected ? 'white' : '#1F2937'}
                  fontSize="14"
                  fontWeight="600"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {table.name}
                </text>
                
                {/* Row Count */}
                <text
                  x="268"
                  y="25"
                  fill={isSelected ? 'white' : '#6B7280'}
                  fontSize="11"
                  textAnchor="end"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {table.rowCount.toLocaleString()} rows
                </text>
                
                {/* Columns */}
                {table.columns.map((column, idx) => {
                  const keyIndicator = getKeyIndicator(column.key);
                  const yPos = 40 + idx * 28;
                  
                  return (
                    <g key={column.name}>
                      <rect
                        y={yPos}
                        width="280"
                        height="28"
                        fill={idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB'}
                        stroke="#E5E7EB"
                        strokeWidth="0.5"
                      />
                      
                      {/* Key indicator */}
                      {keyIndicator && (
                        <text
                          x="10"
                          y={yPos + 18}
                          fontSize="10"
                          fill="#6B7280"
                          fontWeight="600"
                          fontFamily="system-ui, -apple-system, sans-serif"
                        >
                          {keyIndicator}
                        </text>
                      )}
                      
                      {/* Column name */}
                      <text
                        x={keyIndicator ? "35" : "12"}
                        y={yPos + 18}
                        fontSize="12"
                        fill="#374151"
                        fontFamily="system-ui, -apple-system, sans-serif"
                      >
                        {column.name}
                      </text>
                      
                      {/* Data type */}
                      <text
                        x="268"
                        y={yPos + 18}
                        fontSize="11"
                        fill="#9CA3AF"
                        textAnchor="end"
                        fontFamily="system-ui, -apple-system, sans-serif"
                      >
                        {column.type}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer */}
      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-6">
            <span><span className="font-semibold">PK</span> = Primary Key</span>
            <span><span className="font-semibold">FK</span> = Foreign Key</span>
            <span><span className="font-semibold">UK</span> = Unique Key</span>
          </div>
          <div className="text-gray-500">
            Click tables to highlight • Hover relationships to see details
          </div>
        </div>
      </div>
    </div>
  );
}