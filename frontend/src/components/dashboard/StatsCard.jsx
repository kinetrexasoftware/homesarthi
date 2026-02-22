import { useState, useEffect } from 'react';

const StatsCard = ({
  title,
  value,
  change,
  changeType = 'percentage', // 'percentage' or 'number'
  icon: Icon,
  color = 'blue',
  loading = false,
  formatValue = (val) => val.toString()
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (loading) return;

    const duration = 1000; // Animation duration in ms
    const steps = 60; // Number of animation steps
    const increment = value / steps;
    let current = 0;
    const stepDuration = duration / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setAnimatedValue(value);
        clearInterval(timer);
      } else {
        setAnimatedValue(current);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, loading]);

  const getColorClasses = () => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        icon: 'text-blue-600'
      },
      green: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        icon: 'text-green-600'
      },
      yellow: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-600',
        icon: 'text-yellow-600'
      },
      red: {
        bg: 'bg-red-50',
        text: 'text-red-600',
        icon: 'text-red-600'
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        icon: 'text-purple-600'
      },
      indigo: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        icon: 'text-indigo-600'
      }
    };
    return colors[color] || colors.blue;
  };

  const colorClasses = getColorClasses();

  const getChangeColor = () => {
    if (!change) return 'text-gray-500';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = () => {
    if (!change) return null;
    return change > 0 ? (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ) : (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    );
  };

  const formatChange = () => {
    if (!change) return null;

    if (changeType === 'percentage') {
      return `${change > 0 ? '+' : ''}${change}%`;
    } else {
      return `${change > 0 ? '+' : ''}${change}`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClasses.bg}`}>
          <Icon className={`w-6 h-6 ${colorClasses.icon}`} />
        </div>
      </div>

      <div className="mb-2">
        <span className={`text-2xl font-bold ${colorClasses.text}`}>
          {formatValue(animatedValue)}
        </span>
      </div>

      {change !== undefined && (
        <div className={`flex items-center text-sm ${getChangeColor()}`}>
          {getChangeIcon()}
          <span className="ml-1">{formatChange()}</span>
          <span className="ml-1 text-gray-500">from last month</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
