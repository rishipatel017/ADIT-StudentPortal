import React, { useMemo } from 'react';
import type { Column } from './index';

interface VirtualizedTableProps {
  data: any[];
  columns: Column<any>[];
  height: number;
  rowHeight: number;
  loading?: boolean;
  className?: string;
}

function VirtualizedTable({
  data,
  columns,
  height,
  rowHeight = 60,
  loading = false,
  className = '',
}: VirtualizedTableProps) {
  const memoizedData = useMemo(() => data, [data]);

  if (loading) {
    return (
      <div className="table-container">
        <div className="p-8 space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="skeleton-line h-4" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-container">
        <div className="p-8 text-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`}>
      {/* Header */}
      <div className="table-header flex items-center border-b border-gray-200">
        {columns.map((column) => (
          <div
            key={String(column.key)}
            className="table-header-cell px-6 py-3"
            style={{
              flex: column.key === 'name' ? 2 : 1,
              minWidth: column.key === 'name' ? '200px' : '120px',
            }}
          >
            {column.label}
          </div>
        ))}
      </div>

      {/* Body with simple scrolling for now */}
      <div 
        style={{ 
          height: height - 60,
          overflowY: 'auto'
        }}
      >
        {memoizedData.map((item, index) => (
          <div
            key={index}
            className="table-row flex items-center border-b border-gray-200"
            style={{ height: rowHeight }}
          >
            {columns.map((column, colIndex) => (
              <div
                key={String(column.key)}
                className="table-cell px-6 py-4 text-sm text-gray-900"
                style={{
                  flex: column.key === 'name' ? 2 : 1,
                  minWidth: column.key === 'name' ? '200px' : '120px',
                }}
              >
                {column.render ? column.render(item[column.key], item) : String(item[column.key])}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VirtualizedTable;
