import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { MetricCardProps } from '../../types/dashboard'

const MetricCard: React.FC<MetricCardProps> = ({ metric, className = '' }) => {
  const formatValue = (value: number | string, format: string): string => {
    if (typeof value === 'string') return value

    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'duration':
        if (value < 60) return `${value}초`
        if (value < 3600) return `${Math.round(value / 60)}분`
        if (value < 86400) return `${Math.round(value / 3600)}시간`
        return `${Math.round(value / 86400)}일`
      case 'ratio':
        return `${value.toFixed(2)}:1`
      case 'number':
      default:
        return value.toLocaleString()
    }
  }

  const getTrendIcon = () => {
    if (!metric.change) return null

    switch (metric.change.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  const getTrendColor = () => {
    if (!metric.change) return 'text-gray-500'

    switch (metric.change.trend) {
      case 'up':
        return 'text-green-500'
      case 'down':
        return 'text-red-500'
      case 'stable':
        return 'text-gray-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-500 mb-1">{metric.name}</h3>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-900">
              {formatValue(metric.value, metric.format)}
            </span>
            {metric.unit && metric.format === 'number' && (
              <span className="ml-1 text-sm text-gray-500">{metric.unit}</span>
            )}
          </div>
          {metric.description && <p className="text-xs text-gray-400 mt-1">{metric.description}</p>}
        </div>

        {metric.change && (
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {metric.change.value > 0 ? '+' : ''}
              {metric.change.value}%
            </span>
          </div>
        )}
      </div>

      {metric.change && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">{metric.change.period} 대비</span>
        </div>
      )}
    </div>
  )
}

export default MetricCard
