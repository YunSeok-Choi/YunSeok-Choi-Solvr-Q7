import { FastifyInstance } from 'fastify'
import { DashboardController } from '../controllers/dashboardController'

export async function dashboardRoutes(fastify: FastifyInstance) {
  const dashboardController = new DashboardController()

  // 전체 대시보드 데이터 조회
  fastify.get(
    '/dashboard',
    {
      schema: {
        description: '전체 대시보드 데이터를 조회합니다',
        tags: ['dashboard'],
        querystring: {
          type: 'object',
          properties: {
            repos: {
              type: 'string',
              description: '저장소 이름들 (콤마로 구분, 예: stackflow,seed-design)'
            },
            date_from: {
              type: 'string',
              format: 'date',
              description: '시작 날짜 (YYYY-MM-DD)'
            },
            date_to: {
              type: 'string',
              format: 'date',
              description: '종료 날짜 (YYYY-MM-DD)'
            },
            work_day_types: {
              type: 'string',
              description: '근무일 타입들 (콤마로 구분, 예: WEEKDAY,WEEKEND)'
            },
            release_types: {
              type: 'string',
              description: '릴리즈 타입들 (콤마로 구분, 예: major,minor,patch)'
            },
            time_periods: {
              type: 'string',
              description: '시간대들 (콤마로 구분, 예: MORNING,AFTERNOON)'
            },
            include_prereleases: {
              type: 'boolean',
              description: '사전 릴리즈 포함 여부'
            },
            include_drafts: {
              type: 'boolean',
              description: '드래프트 포함 여부'
            },
            min_days_between_releases: {
              type: 'integer',
              minimum: 0,
              description: '최소 릴리즈 간격 (일)'
            },
            max_days_between_releases: {
              type: 'integer',
              minimum: 0,
              description: '최대 릴리즈 간격 (일)'
            }
          }
        },
        response: {
          200: {
            description: '성공적인 응답',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              message: { type: 'string' }
            }
          },
          500: {
            description: '서버 오류',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    dashboardController.getDashboardData.bind(dashboardController)
  )

  // Raw 데이터만 조회 (페이지네이션 지원)
  fastify.get(
    '/dashboard/raw',
    {
      schema: {
        description: 'Raw 릴리즈 데이터를 페이지네이션과 함께 조회합니다',
        tags: ['dashboard'],
        querystring: {
          type: 'object',
          properties: {
            repos: { type: 'string', description: '저장소 이름들 (콤마로 구분)' },
            date_from: { type: 'string', format: 'date', description: '시작 날짜' },
            date_to: { type: 'string', format: 'date', description: '종료 날짜' },
            work_day_types: { type: 'string', description: '근무일 타입들 (콤마로 구분)' },
            release_types: { type: 'string', description: '릴리즈 타입들 (콤마로 구분)' },
            time_periods: { type: 'string', description: '시간대들 (콤마로 구분)' },
            include_prereleases: { type: 'boolean', description: '사전 릴리즈 포함 여부' },
            include_drafts: { type: 'boolean', description: '드래프트 포함 여부' },
            min_days_between_releases: {
              type: 'integer',
              minimum: 0,
              description: '최소 릴리즈 간격'
            },
            max_days_between_releases: {
              type: 'integer',
              minimum: 0,
              description: '최대 릴리즈 간격'
            },
            page: { type: 'integer', minimum: 1, default: 1, description: '페이지 번호' },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 200,
              default: 50,
              description: '페이지당 항목 수'
            }
          }
        },
        response: {
          200: {
            description: '성공적인 응답',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array' },
              pagination: { type: 'object' },
              filters_applied: { type: 'object' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    dashboardController.getRawData.bind(dashboardController)
  )

  // 대시보드 메트릭만 조회
  fastify.get(
    '/dashboard/metrics',
    {
      schema: {
        description: '대시보드 주요 메트릭만 조회합니다',
        tags: ['dashboard'],
        querystring: {
          type: 'object',
          properties: {
            repos: { type: 'string', description: '저장소 이름들 (콤마로 구분)' },
            date_from: { type: 'string', format: 'date', description: '시작 날짜' },
            date_to: { type: 'string', format: 'date', description: '종료 날짜' },
            work_day_types: { type: 'string', description: '근무일 타입들 (콤마로 구분)' }
          }
        },
        response: {
          200: {
            description: '성공적인 응답',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  summary_metrics: { type: 'array' },
                  data_freshness: { type: 'object' }
                }
              },
              filters_applied: { type: 'object' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    dashboardController.getMetrics.bind(dashboardController)
  )

  // 집계 데이터만 조회
  fastify.get(
    '/dashboard/aggregations',
    {
      schema: {
        description: '집계 데이터만 조회합니다',
        tags: ['dashboard'],
        querystring: {
          type: 'object',
          properties: {
            repos: { type: 'string', description: '저장소 이름들 (콤마로 구분)' },
            date_from: { type: 'string', format: 'date', description: '시작 날짜' },
            date_to: { type: 'string', format: 'date', description: '종료 날짜' },
            work_day_types: { type: 'string', description: '근무일 타입들 (콤마로 구분)' },
            type: {
              type: 'string',
              enum: [
                'by_repo',
                'by_date',
                'by_day_of_week',
                'by_month',
                'by_quarter',
                'by_time_period',
                'by_release_type'
              ],
              description: '특정 집계 타입만 조회 (선택사항)'
            }
          }
        },
        response: {
          200: {
            description: '성공적인 응답',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              filters_applied: { type: 'object' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    dashboardController.getAggregations.bind(dashboardController)
  )

  // 시계열 데이터만 조회
  fastify.get(
    '/dashboard/timeseries',
    {
      schema: {
        description: '시계열 데이터만 조회합니다',
        tags: ['dashboard'],
        querystring: {
          type: 'object',
          properties: {
            repos: { type: 'string', description: '저장소 이름들 (콤마로 구분)' },
            date_from: { type: 'string', format: 'date', description: '시작 날짜' },
            date_to: { type: 'string', format: 'date', description: '종료 날짜' },
            work_day_types: { type: 'string', description: '근무일 타입들 (콤마로 구분)' }
          }
        },
        response: {
          200: {
            description: '성공적인 응답',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array' },
              filters_applied: { type: 'object' },
              data_range: { type: 'object' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    dashboardController.getTimeSeries.bind(dashboardController)
  )
}
