import React, { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, Download } from 'lucide-react'
import { format } from 'date-fns'

// Components
import {
  MetricCard,
  FilterPanel,
  TimeSeriesChart,
  BarChart,
  PieChart,
  HeatmapChart
} from '../components'

// Services & Types
import DashboardService from '../services/dashboardService'
import type { DashboardData, DashboardFilters } from '../types/dashboard'

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [filters, setFilters] = useState<DashboardFilters>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // 데이터 로드
  const loadDashboardData = async (newFilters?: DashboardFilters) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await DashboardService.getDashboardData(newFilters || filters)
      setDashboardData(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  // 초기 데이터 로드
  useEffect(() => {
    loadDashboardData()
  }, [])

  // 필터 변경 핸들러
  const handleFiltersChange = (newFilters: DashboardFilters) => {
    setFilters(newFilters)
    loadDashboardData(newFilters)
  }

  // 새로고침 핸들러
  const handleRefresh = () => {
    loadDashboardData()
  }

  // 히트맵 데이터 변환
  const getHeatmapData = () => {
    if (!dashboardData?.raw_data) return []

    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
    const timeNames = ['새벽', '오전', '오후', '저녁']

    return dashboardData.raw_data.reduce(
      (acc, release) => {
        const dayName = dayNames[release.published_day_of_week]
        const timePeriod =
          {
            NIGHT: '새벽',
            MORNING: '오전',
            AFTERNOON: '오후',
            EVENING: '저녁'
          }[release.time_period] || '기타'

        const key = `${dayName}-${timePeriod}`
        const existing = acc.find(item => item.x === dayName && item.y === timePeriod)

        if (existing) {
          existing.value += 1
        } else {
          acc.push({
            x: dayName,
            y: timePeriod,
            value: 1,
            label: `${dayName} ${timePeriod}`
          })
        }

        return acc
      },
      [] as Array<{ x: string; y: string; value: number; label: string }>
    )
  }

  // 사용 가능한 저장소 목록
  const availableRepos = dashboardData?.raw_data
    ? Array.from(new Set(dashboardData.raw_data.map(r => r.repo_name))).sort()
    : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">릴리즈 분석 대시보드</h1>
              <p className="mt-1 text-sm text-gray-500">GitHub 릴리즈 데이터 시각화 및 분석</p>
            </div>

            <div className="flex items-center space-x-3">
              {lastUpdated && (
                <span className="text-sm text-gray-500">
                  마지막 업데이트: {format(lastUpdated, 'HH:mm:ss')}
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                새로고침
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 필터 */}
        <div className="mb-8">
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableRepos={availableRepos}
            isLoading={isLoading}
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">데이터 로드 오류</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center">
              <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
              <span className="ml-3 text-sm text-blue-700">데이터를 불러오는 중...</span>
            </div>
          </div>
        )}

        {/* 대시보드 내용 */}
        {dashboardData && (
          <>
            {/* 주요 메트릭 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {dashboardData.summary_metrics?.map((metric, index) => (
                <MetricCard key={index} metric={metric} />
              )) || []}
            </div>

            {/* 차트 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* 시계열 차트 */}
              <div className="lg:col-span-2">
                <TimeSeriesChart
                  data={dashboardData.time_series || []}
                  title="릴리즈 추이"
                  showCumulative={true}
                  showArea={false}
                />
              </div>

              {/* 저장소별 분포 */}
              <PieChart
                data={dashboardData.aggregations?.by_repo || []}
                title="저장소별 릴리즈 분포"
                innerRadius={40}
                showLegend={false}
              />

              {/* 릴리즈 타입별 분포 */}
              <PieChart
                data={dashboardData.aggregations?.by_release_type || []}
                title="릴리즈 타입별 분포"
                innerRadius={0}
                colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444']}
              />

              {/* 요일별 분포 */}
              <BarChart
                data={dashboardData.aggregations?.by_day_of_week || []}
                title="요일별 릴리즈 분포"
                color="#10B981"
                showPercentage={true}
              />

              {/* 시간대별 분포 */}
              <BarChart
                data={dashboardData.aggregations?.by_time_period || []}
                title="시간대별 릴리즈 분포"
                color="#8B5CF6"
                showPercentage={true}
              />

              {/* 월별 분포 */}
              <BarChart
                data={dashboardData.aggregations?.by_month || []}
                title="월별 릴리즈 분포"
                color="#F59E0B"
                horizontal={false}
              />

              {/* 분기별 분포 */}
              <BarChart
                data={dashboardData.aggregations?.by_quarter || []}
                title="분기별 릴리즈 분포"
                color="#EC4899"
                horizontal={false}
              />
            </div>

            {/* 히트맵 */}
            <div className="mb-8">
              <HeatmapChart
                data={getHeatmapData()}
                title="요일 × 시간대 릴리즈 패턴"
                xAxisLabel="요일"
                yAxisLabel="시간대"
                colorScheme="blue"
              />
            </div>

            {/* 데이터 정보 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">데이터 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-500">데이터 범위</div>
                  <div className="text-lg font-medium text-gray-900">
                    {dashboardData.data_freshness?.data_range?.earliest_release || '-'} ~{' '}
                    {dashboardData.data_freshness?.data_range?.latest_release || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">전체 릴리즈 수</div>
                  <div className="text-lg font-medium text-gray-900">
                    {dashboardData.pagination_info?.total_records?.toLocaleString() || '0'}건
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">마지막 업데이트</div>
                  <div className="text-lg font-medium text-gray-900">
                    {dashboardData.data_freshness?.last_updated
                      ? format(
                          new Date(dashboardData.data_freshness.last_updated),
                          'yyyy-MM-dd HH:mm'
                        )
                      : '-'}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard
