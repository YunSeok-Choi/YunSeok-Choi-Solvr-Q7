import React from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface BarChartProps {
  data: Array<{
    key: string
    value: number
    percentage?: number
  }>
  title: string
  className?: string
  color?: string
  dataLabel?: string
  showPercentage?: boolean
  horizontal?: boolean
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  className = '',
  color = '#3B82F6',
  dataLabel = 'value',
  showPercentage = false,
  horizontal = false
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          <p className="text-sm" style={{ color: payload[0].color }}>
            <span className="font-medium">건수: </span>
            <span>{payload[0].value}건</span>
          </p>
          {showPercentage && data.percentage !== undefined && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">비율: </span>
              <span>{data.percentage.toFixed(1)}%</span>
            </p>
          )}
        </div>
      )
    }
    return null
  }

  // 데이터 정렬 (내림차순)
  const sortedData = [...data].sort((a, b) => b.value - a.value)

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      {sortedData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">데이터가 없습니다</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={sortedData}
              layout={horizontal ? ('verseReverse' as any) : undefined}
              margin={{
                top: 5,
                right: 30,
                left: horizontal ? 60 : 20,
                bottom: horizontal ? 5 : 60
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              {horizontal ? (
                <>
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="key"
                    stroke="#6b7280"
                    fontSize={12}
                    width={50}
                    tick={{ fontSize: 10 }}
                  />
                </>
              ) : (
                <>
                  <XAxis
                    dataKey="key"
                    stroke="#6b7280"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                </>
              )}
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill={color} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />
          <span>릴리즈 건수</span>
        </div>
        <span>총 {sortedData.reduce((sum, item) => sum + item.value, 0)}건</span>
      </div>
    </div>
  )
}

export default BarChart
