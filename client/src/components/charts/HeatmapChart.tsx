import React from 'react'

interface HeatmapDataPoint {
  x: string
  y: string
  value: number
  label?: string
}

interface HeatmapChartProps {
  data: HeatmapDataPoint[]
  title: string
  xAxisLabel?: string
  yAxisLabel?: string
  className?: string
  colorScheme?: 'blue' | 'green' | 'red' | 'purple'
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({
  data,
  title,
  xAxisLabel = '',
  yAxisLabel = '',
  className = '',
  colorScheme = 'blue'
}) => {
  // 데이터에서 고유한 x, y 값들 추출
  const xValues = Array.from(new Set(data.map(d => d.x))).sort()
  const yValues = Array.from(new Set(data.map(d => d.y))).sort()

  // 최대값 찾기 (색상 강도 계산용)
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))

  // 색상 스킴 정의
  const colorSchemes = {
    blue: {
      light: '#EBF8FF',
      medium: '#90CDF4',
      dark: '#2B6CB0',
      text: '#1A365D'
    },
    green: {
      light: '#F0FDF4',
      medium: '#86EFAC',
      dark: '#059669',
      text: '#064E3B'
    },
    red: {
      light: '#FEF2F2',
      medium: '#FCA5A5',
      dark: '#DC2626',
      text: '#7F1D1D'
    },
    purple: {
      light: '#F5F3FF',
      medium: '#C4B5FD',
      dark: '#7C3AED',
      text: '#4C1D95'
    }
  }

  const colors = colorSchemes[colorScheme]

  // 값에 따른 색상 강도 계산
  const getColor = (value: number) => {
    if (maxValue === minValue) return colors.medium

    const intensity = (value - minValue) / (maxValue - minValue)

    if (intensity < 0.2) return colors.light
    if (intensity < 0.5) return `${colors.medium}80`
    if (intensity < 0.8) return colors.medium
    return colors.dark
  }

  // 데이터 매핑을 위한 Map 생성
  const dataMap = new Map<string, HeatmapDataPoint>()
  data.forEach(point => {
    dataMap.set(`${point.x}-${point.y}`, point)
  })

  // 셀 크기 계산
  const cellSize = Math.min(40, Math.max(20, 300 / Math.max(xValues.length, yValues.length)))

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">데이터가 없습니다</p>
        </div>
      ) : (
        <div className="overflow-auto">
          <div className="flex">
            {/* Y축 라벨 */}
            <div className="flex flex-col justify-center mr-2">
              {yAxisLabel && (
                <div
                  className="text-xs text-gray-600 font-medium mb-2"
                  style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    height: yValues.length * cellSize
                  }}
                >
                  {yAxisLabel}
                </div>
              )}
              <div className="flex flex-col">
                {yValues.map(y => (
                  <div
                    key={y}
                    className="flex items-center justify-end text-xs text-gray-600 pr-2"
                    style={{ height: cellSize }}
                  >
                    {y}
                  </div>
                ))}
              </div>
            </div>

            {/* 히트맵 */}
            <div>
              {/* X축 라벨 */}
              <div className="flex mb-1">
                {xValues.map(x => (
                  <div
                    key={x}
                    className="text-xs text-gray-600 text-center"
                    style={{
                      width: cellSize,
                      transform: 'rotate(-45deg)',
                      transformOrigin: 'center',
                      height: '20px',
                      lineHeight: '20px'
                    }}
                  >
                    {x}
                  </div>
                ))}
              </div>

              {/* 히트맵 그리드 */}
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${xValues.length}, ${cellSize}px)` }}
              >
                {yValues.map(y =>
                  xValues.map(x => {
                    const point = dataMap.get(`${x}-${y}`)
                    const value = point?.value || 0

                    return (
                      <div
                        key={`${x}-${y}`}
                        className="relative group cursor-pointer border border-gray-200 hover:border-gray-400 transition-colors"
                        style={{
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: getColor(value)
                        }}
                      >
                        {/* 값 표시 (작은 셀에서는 숨김) */}
                        {cellSize > 30 && value > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span
                              className="text-xs font-medium"
                              style={{
                                color: value > maxValue * 0.6 ? 'white' : colors.text
                              }}
                            >
                              {value}
                            </span>
                          </div>
                        )}

                        {/* 툴팁 */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                            <div>
                              {x} × {y}
                            </div>
                            <div>값: {value}</div>
                            {point?.label && <div>{point.label}</div>}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* X축 라벨 */}
              {xAxisLabel && (
                <div className="text-xs text-gray-600 font-medium text-center mt-2">
                  {xAxisLabel}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 범례 */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          <span>낮음</span>
          <div className="flex space-x-1">
            <div
              className="w-4 h-4 border border-gray-200"
              style={{ backgroundColor: colors.light }}
            />
            <div
              className="w-4 h-4 border border-gray-200"
              style={{ backgroundColor: `${colors.medium}80` }}
            />
            <div
              className="w-4 h-4 border border-gray-200"
              style={{ backgroundColor: colors.medium }}
            />
            <div
              className="w-4 h-4 border border-gray-200"
              style={{ backgroundColor: colors.dark }}
            />
          </div>
          <span>높음</span>
        </div>
        <span>최대값: {maxValue}</span>
      </div>
    </div>
  )
}

export default HeatmapChart
