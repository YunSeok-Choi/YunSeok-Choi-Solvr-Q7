import React from 'react'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts'

interface PieChartProps {
  data: Array<{
    key: string
    value: number
    percentage?: number
  }>
  title: string
  className?: string
  colors?: string[]
  showLegend?: boolean
  innerRadius?: number
  outerRadius?: number
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  className = '',
  colors = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#06B6D4',
    '#84CC16',
    '#F97316',
    '#EC4899',
    '#6B7280'
  ],
  showLegend = true,
  innerRadius = 0,
  outerRadius = 80
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{data.key}</p>
          <p className="text-sm" style={{ color: data.fill }}>
            <span className="font-medium">건수: </span>
            <span>{data.value}건</span>
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">비율: </span>
            <span>{data.percentage?.toFixed(1) || '0.0'}%</span>
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, percentage }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percentage < 5) return null // 5% 미만은 라벨 숨김

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${percentage.toFixed(0)}%`}
      </text>
    )
  }

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-700">
              {entry.value} ({entry.payload.percentage?.toFixed(1) || '0.0'}%)
            </span>
          </div>
        ))}
      </div>
    )
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
            <RechartsPieChart>
              <Pie
                data={sortedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={outerRadius}
                innerRadius={innerRadius}
                fill="#8884d8"
                dataKey="value"
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend content={<CustomLegend />} />}
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
        <span>전체 {sortedData.length}개 항목</span>
        <span>총 {sortedData.reduce((sum, item) => sum + item.value, 0)}건</span>
      </div>
    </div>
  )
}

export default PieChart
