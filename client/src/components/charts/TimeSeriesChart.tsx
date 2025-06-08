import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface TimeSeriesChartProps {
  data: Array<{
    date: string
    value: number
    cumulative_value?: number
  }>
  title: string
  className?: string
  showCumulative?: boolean
  showArea?: boolean
  color?: string
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  title,
  className = '',
  showCumulative = false,
  showArea = false,
  color = '#3B82F6'
}) => {
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MM/dd')
    } catch {
      return dateString
    }
  }

  const formatTooltipDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'yyyy-MM-dd')
    } catch {
      return dateString
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{formatTooltipDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">
                {entry.dataKey === 'cumulative_value' ? '누적' : '일일'}:
              </span>
              <span className="ml-1">{entry.value}건</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const ChartComponent = showArea ? AreaChart : LineChart

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">데이터가 없습니다</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />

              {showArea ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    fill={color}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  {showCumulative && (
                    <Area
                      type="monotone"
                      dataKey="cumulative_value"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  )}
                </>
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    dot={{ fill: color, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
                  />
                  {showCumulative && (
                    <Line
                      type="monotone"
                      dataKey="cumulative_value"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                    />
                  )}
                </>
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />
          <span>일일 릴리즈 수</span>
        </div>
        {showCumulative && (
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
            <span>누적 릴리즈 수</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default TimeSeriesChart
