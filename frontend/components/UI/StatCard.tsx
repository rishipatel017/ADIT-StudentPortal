import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'purple';
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'primary',
  trend,
  loading = false,
}) => {
  const variantClasses = {
    primary: 'stat-card',
    success: 'stat-card stat-card-success',
    warning: 'stat-card stat-card-warning',
    error: 'stat-card stat-card-error',
    purple: 'stat-card stat-card-purple',
  };

  if (loading) {
    return (
      <div className="stat-card">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="skeleton-line h-4 w-24 mb-2" />
            <div className="skeleton-line h-8 w-16 mb-2" />
            <div className="skeleton-line h-3 w-20" />
          </div>
          <div className="skeleton-avatar" />
        </div>
      </div>
    );
  }

  return (
    <div className={variantClasses[variant]}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/90 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold mb-1">{value}</p>
          {subtitle && (
            <p className="text-white/80 text-xs">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-xs ${
              trend.direction === 'up' ? 'text-green-200' : 'text-red-200'
            }`}>
              <svg
                className={`w-3 h-3 mr-1 transform ${
                  trend.direction === 'up' ? '' : 'rotate-180'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {trend.value}
            </div>
          )}
        </div>
        {icon && (
          <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
