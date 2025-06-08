import { FastifyRequest, FastifyReply } from 'fastify'
import { RawDataService } from '../services/rawDataService'
import { GithubService } from '../services/githubService'
import { DashboardFilterOptions } from '../types'

export class DashboardController {
  private readonly rawDataService: RawDataService

  constructor() {
    const githubService = new GithubService()
    this.rawDataService = new RawDataService(githubService)
  }

  /**
   * 대시보드 데이터를 조회합니다
   * GET /api/dashboard
   */
  async getDashboardData(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('📊 Dashboard data request received')

      // 쿼리 파라미터에서 필터 옵션 추출
      const query = request.query as Record<string, any>
      const filters: DashboardFilterOptions = {}

      // 저장소 필터 (콤마로 구분된 문자열)
      if (query.repos) {
        filters.repo_names = query.repos.split(',').map((repo: string) => repo.trim())
      }

      // 날짜 범위 필터
      if (query.date_from) {
        filters.date_from = query.date_from
      }
      if (query.date_to) {
        filters.date_to = query.date_to
      }

      // 근무일 타입 필터
      if (query.work_day_types) {
        filters.work_day_types = query.work_day_types.split(',').map((type: string) => type.trim())
      }

      // 릴리즈 타입 필터
      if (query.release_types) {
        filters.release_types = query.release_types.split(',').map((type: string) => type.trim())
      }

      // 시간대 필터
      if (query.time_periods) {
        filters.time_periods = query.time_periods.split(',').map((period: string) => period.trim())
      }

      // 불린 필터들
      if (query.include_prereleases !== undefined) {
        filters.include_prereleases = query.include_prereleases === 'true'
      }
      if (query.include_drafts !== undefined) {
        filters.include_drafts = query.include_drafts === 'true'
      }

      // 릴리즈 간격 필터
      if (query.min_days_between_releases) {
        filters.min_days_between_releases = parseInt(query.min_days_between_releases, 10)
      }
      if (query.max_days_between_releases) {
        filters.max_days_between_releases = parseInt(query.max_days_between_releases, 10)
      }

      console.log('🔍 Applied filters:', filters)

      // 대시보드 데이터 조회
      const dashboardData = await this.rawDataService.getDashboardData(filters)

      console.log('📊 Dashboard data structure:', {
        summary_metrics_count: dashboardData?.summary_metrics?.length || 0,
        raw_data_count: dashboardData?.raw_data?.length || 0,
        time_series_count: dashboardData?.time_series?.length || 0,
        aggregations_keys: dashboardData?.aggregations
          ? Object.keys(dashboardData.aggregations)
          : [],
        filters_applied: dashboardData?.filters_applied || {},
        has_data_freshness: !!dashboardData?.data_freshness,
        has_pagination_info: !!dashboardData?.pagination_info
      })

      console.log(
        `✅ Dashboard data generated successfully - ${dashboardData?.raw_data?.length || 0} records`
      )

      return reply.status(200).send({
        success: true,
        data: dashboardData,
        message: '대시보드 데이터를 성공적으로 조회했습니다'
      })
    } catch (error) {
      console.error('❌ Dashboard data retrieval failed:', error)

      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        message: '대시보드 데이터 조회에 실패했습니다'
      })
    }
  }

  /**
   * Raw 데이터만 조회합니다 (경량화된 응답)
   * GET /api/dashboard/raw
   */
  async getRawData(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('📋 Raw data request received')

      // 쿼리 파라미터에서 필터 옵션 추출 (위와 동일한 로직)
      const query = request.query as Record<string, any>
      const filters: DashboardFilterOptions = {}

      if (query.repos) {
        filters.repo_names = query.repos.split(',').map((repo: string) => repo.trim())
      }
      if (query.date_from) filters.date_from = query.date_from
      if (query.date_to) filters.date_to = query.date_to
      if (query.work_day_types) {
        filters.work_day_types = query.work_day_types.split(',').map((type: string) => type.trim())
      }
      if (query.release_types) {
        filters.release_types = query.release_types.split(',').map((type: string) => type.trim())
      }
      if (query.time_periods) {
        filters.time_periods = query.time_periods.split(',').map((period: string) => period.trim())
      }
      if (query.include_prereleases !== undefined) {
        filters.include_prereleases = query.include_prereleases === 'true'
      }
      if (query.include_drafts !== undefined) {
        filters.include_drafts = query.include_drafts === 'true'
      }
      if (query.min_days_between_releases) {
        filters.min_days_between_releases = parseInt(query.min_days_between_releases, 10)
      }
      if (query.max_days_between_releases) {
        filters.max_days_between_releases = parseInt(query.max_days_between_releases, 10)
      }

      // 페이지네이션 옵션
      const page = parseInt((query.page as string) || '1', 10)
      const limit = parseInt((query.limit as string) || '50', 10)
      const offset = (page - 1) * limit

      console.log('🔍 Raw data filters:', filters)
      console.log('📄 Pagination:', { page, limit, offset })

      // 대시보드 데이터 조회 (raw_data만 사용)
      const dashboardData = await this.rawDataService.getDashboardData(filters)
      const rawData = dashboardData.raw_data

      // 페이지네이션 적용
      const paginatedData = rawData.slice(offset, offset + limit)
      const totalPages = Math.ceil(rawData.length / limit)

      console.log(
        `✅ Raw data retrieved successfully - ${paginatedData.length}/${rawData.length} records`
      )

      return reply.status(200).send({
        success: true,
        data: paginatedData,
        pagination: {
          total: rawData.length,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters_applied: filters,
        message: 'Raw 데이터를 성공적으로 조회했습니다'
      })
    } catch (error) {
      console.error('❌ Raw data retrieval failed:', error)

      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        message: 'Raw 데이터 조회에 실패했습니다'
      })
    }
  }

  /**
   * 대시보드 메트릭만 조회합니다 (최소한의 응답)
   * GET /api/dashboard/metrics
   */
  async getMetrics(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('📈 Metrics request received')

      // 필터 옵션 추출 (간소화)
      const query = request.query as Record<string, any>
      const filters: DashboardFilterOptions = {}

      if (query.repos) {
        filters.repo_names = query.repos.split(',').map((repo: string) => repo.trim())
      }
      if (query.date_from) filters.date_from = query.date_from
      if (query.date_to) filters.date_to = query.date_to
      if (query.work_day_types) {
        filters.work_day_types = query.work_day_types.split(',').map((type: string) => type.trim())
      }

      // 대시보드 데이터 조회 (metrics만 사용)
      const dashboardData = await this.rawDataService.getDashboardData(filters)

      console.log(
        `✅ Metrics retrieved successfully - ${dashboardData.summary_metrics.length} metrics`
      )

      return reply.status(200).send({
        success: true,
        data: {
          summary_metrics: dashboardData.summary_metrics,
          data_freshness: dashboardData.data_freshness
        },
        filters_applied: filters,
        message: '대시보드 메트릭을 성공적으로 조회했습니다'
      })
    } catch (error) {
      console.error('❌ Metrics retrieval failed:', error)

      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        message: '메트릭 조회에 실패했습니다'
      })
    }
  }

  /**
   * 집계 데이터만 조회합니다
   * GET /api/dashboard/aggregations
   */
  async getAggregations(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('📊 Aggregations request received')

      // 필터 옵션 추출
      const query = request.query as Record<string, any>
      const filters: DashboardFilterOptions = {}

      if (query.repos) {
        filters.repo_names = query.repos.split(',').map((repo: string) => repo.trim())
      }
      if (query.date_from) filters.date_from = query.date_from
      if (query.date_to) filters.date_to = query.date_to
      if (query.work_day_types) {
        filters.work_day_types = query.work_day_types.split(',').map((type: string) => type.trim())
      }

      // 특정 집계 타입 필터
      const aggregationType = query.type as string // by_repo, by_date, by_day_of_week 등

      // 대시보드 데이터 조회 (aggregations만 사용)
      const dashboardData = await this.rawDataService.getDashboardData(filters)

      let responseData = dashboardData.aggregations

      // 특정 집계 타입만 요청된 경우
      if (aggregationType && responseData[aggregationType as keyof typeof responseData]) {
        responseData = {
          [aggregationType]: responseData[aggregationType as keyof typeof responseData]
        } as any
      }

      console.log(`✅ Aggregations retrieved successfully`)

      return reply.status(200).send({
        success: true,
        data: responseData,
        filters_applied: filters,
        message: '집계 데이터를 성공적으로 조회했습니다'
      })
    } catch (error) {
      console.error('❌ Aggregations retrieval failed:', error)

      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        message: '집계 데이터 조회에 실패했습니다'
      })
    }
  }

  /**
   * 시계열 데이터만 조회합니다
   * GET /api/dashboard/timeseries
   */
  async getTimeSeries(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('📈 Time series request received')

      // 필터 옵션 추출
      const query = request.query as Record<string, any>
      const filters: DashboardFilterOptions = {}

      if (query.repos) {
        filters.repo_names = query.repos.split(',').map((repo: string) => repo.trim())
      }
      if (query.date_from) filters.date_from = query.date_from
      if (query.date_to) filters.date_to = query.date_to
      if (query.work_day_types) {
        filters.work_day_types = query.work_day_types.split(',').map((type: string) => type.trim())
      }

      // 대시보드 데이터 조회 (time_series만 사용)
      const dashboardData = await this.rawDataService.getDashboardData(filters)

      console.log(
        `✅ Time series retrieved successfully - ${dashboardData.time_series.length} data points`
      )

      return reply.status(200).send({
        success: true,
        data: dashboardData.time_series,
        filters_applied: filters,
        data_range: dashboardData.data_freshness.data_range,
        message: '시계열 데이터를 성공적으로 조회했습니다'
      })
    } catch (error) {
      console.error('❌ Time series retrieval failed:', error)

      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        message: '시계열 데이터 조회에 실패했습니다'
      })
    }
  }
}
