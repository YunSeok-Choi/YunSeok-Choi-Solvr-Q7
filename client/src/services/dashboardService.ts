import axios from 'axios'
import type {
  DashboardData,
  DashboardFilters,
  DashboardMetric,
  DashboardAggregation,
  TimeSeriesDataPoint,
  RawReleaseData
} from '../types/dashboard'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// API Response wrapper
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export class DashboardService {
  /**
   * 전체 대시보드 데이터를 가져옵니다
   */
  static async getDashboardData(filters?: DashboardFilters): Promise<DashboardData> {
    try {
      const params = new URLSearchParams()

      if (filters) {
        if (filters.repos?.length) {
          params.append('repos', filters.repos.join(','))
        }
        if (filters.date_from) {
          params.append('date_from', filters.date_from)
        }
        if (filters.date_to) {
          params.append('date_to', filters.date_to)
        }
        if (filters.work_day_types?.length) {
          params.append('work_day_types', filters.work_day_types.join(','))
        }
        if (filters.release_types?.length) {
          params.append('release_types', filters.release_types.join(','))
        }
        if (filters.time_periods?.length) {
          params.append('time_periods', filters.time_periods.join(','))
        }
        if (filters.include_prereleases !== undefined) {
          params.append('include_prereleases', filters.include_prereleases.toString())
        }
        if (filters.include_drafts !== undefined) {
          params.append('include_drafts', filters.include_drafts.toString())
        }
      }

      const queryString = params.toString()
      const url = `/dashboard${queryString ? `?${queryString}` : ''}`

      const response = await apiClient.get<ApiResponse<DashboardData>>(url)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch dashboard data')
      }

      const data = response.data.data

      // 안전성을 위한 기본값 제공
      return {
        summary_metrics: data?.summary_metrics || [],
        raw_data: data?.raw_data || [],
        time_series: data?.time_series || [],
        aggregations: data?.aggregations || {
          by_repo: [],
          by_date: [],
          by_day_of_week: [],
          by_month: [],
          by_quarter: [],
          by_time_period: [],
          by_release_type: []
        },
        filters_applied: data?.filters_applied || {},
        data_freshness: data?.data_freshness || {
          last_updated: new Date().toISOString(),
          data_range: {
            earliest_release: '',
            latest_release: ''
          }
        },
        pagination_info: data?.pagination_info || {
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      throw this.handleApiError(error)
    }
  }

  /**
   * 주요 메트릭만 가져옵니다
   */
  static async getMetrics(filters?: DashboardFilters): Promise<DashboardMetric[]> {
    try {
      const params = this.buildQueryParams(filters)
      const url = `/dashboard/metrics${params ? `?${params}` : ''}`

      const response = await apiClient.get<ApiResponse<{ summary_metrics: DashboardMetric[] }>>(url)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch metrics')
      }

      return response.data.data.summary_metrics
    } catch (error) {
      console.error('Error fetching metrics:', error)
      throw this.handleApiError(error)
    }
  }

  /**
   * 집계 데이터만 가져옵니다
   */
  static async getAggregations(filters?: DashboardFilters): Promise<DashboardData['aggregations']> {
    try {
      const params = this.buildQueryParams(filters)
      const url = `/dashboard/aggregations${params ? `?${params}` : ''}`

      const response = await apiClient.get<ApiResponse<DashboardData['aggregations']>>(url)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch aggregations')
      }

      return response.data.data
    } catch (error) {
      console.error('Error fetching aggregations:', error)
      throw this.handleApiError(error)
    }
  }

  /**
   * 시계열 데이터만 가져옵니다
   */
  static async getTimeSeries(filters?: DashboardFilters): Promise<TimeSeriesDataPoint[]> {
    try {
      const params = this.buildQueryParams(filters)
      const url = `/dashboard/timeseries${params ? `?${params}` : ''}`

      const response = await apiClient.get<ApiResponse<TimeSeriesDataPoint[]>>(url)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch time series data')
      }

      return response.data.data
    } catch (error) {
      console.error('Error fetching time series data:', error)
      throw this.handleApiError(error)
    }
  }

  /**
   * Raw 데이터를 페이지네이션과 함께 가져옵니다
   */
  static async getRawData(
    filters?: DashboardFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: RawReleaseData[]; pagination: DashboardData['pagination_info'] }> {
    try {
      const params = this.buildQueryParams(filters)
      const paginationParams = new URLSearchParams(params || '')
      paginationParams.append('page', page.toString())
      paginationParams.append('limit', limit.toString())

      const url = `/dashboard/raw?${paginationParams.toString()}`

      const response = await apiClient.get<
        ApiResponse<{
          raw_data: RawReleaseData[]
          pagination_info: DashboardData['pagination_info']
        }>
      >(url)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch raw data')
      }

      return {
        data: response.data.data.raw_data,
        pagination: response.data.data.pagination_info
      }
    } catch (error) {
      console.error('Error fetching raw data:', error)
      throw this.handleApiError(error)
    }
  }

  /**
   * 서버 헬스 체크
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health')
      return response.status === 200
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }

  /**
   * 쿼리 파라미터 빌드 헬퍼
   */
  private static buildQueryParams(filters?: DashboardFilters): string | null {
    if (!filters) return null

    const params = new URLSearchParams()

    if (filters.repos?.length) {
      params.append('repos', filters.repos.join(','))
    }
    if (filters.date_from) {
      params.append('date_from', filters.date_from)
    }
    if (filters.date_to) {
      params.append('date_to', filters.date_to)
    }
    if (filters.work_day_types?.length) {
      params.append('work_day_types', filters.work_day_types.join(','))
    }
    if (filters.release_types?.length) {
      params.append('release_types', filters.release_types.join(','))
    }
    if (filters.time_periods?.length) {
      params.append('time_periods', filters.time_periods.join(','))
    }
    if (filters.include_prereleases !== undefined) {
      params.append('include_prereleases', filters.include_prereleases.toString())
    }
    if (filters.include_drafts !== undefined) {
      params.append('include_drafts', filters.include_drafts.toString())
    }

    const queryString = params.toString()
    return queryString || null
  }

  /**
   * API 에러 처리 헬퍼
   */
  private static handleApiError(error: any): Error {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // 서버 응답 에러
        const message =
          error.response.data?.error ||
          error.response.data?.message ||
          `HTTP ${error.response.status}`
        return new Error(`API Error: ${message}`)
      } else if (error.request) {
        // 네트워크 에러
        return new Error('Network Error: Unable to connect to server')
      }
    }

    return error instanceof Error ? error : new Error('Unknown error occurred')
  }
}

export default DashboardService
