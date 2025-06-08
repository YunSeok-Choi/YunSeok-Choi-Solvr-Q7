import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { RawDataService } from '../../src/services/rawDataService'
import { GithubService } from '../../src/services/githubService'
import { GithubReleaseResponse } from '../../src/types'

// Mock GitHub Service
vi.mock('../../src/services/githubService')

describe('RawDataService', () => {
  let rawDataService: RawDataService
  let mockGithubService: any
  let consoleErrorSpy: any

  // 테스트용 mock 데이터
  const mockReleases: (GithubReleaseResponse & { repo: string })[] = [
    {
      id: 1,
      tag_name: 'v1.0.0',
      name: 'Version 1.0.0',
      body: 'First major release',
      published_at: '2024-01-15T09:00:00Z', // 월요일 - 평일
      created_at: '2024-01-15T08:30:00Z',
      draft: false,
      prerelease: false,
      html_url: 'https://github.com/daangn/stackflow/releases/tag/v1.0.0',
      author: {
        login: 'developer1',
        id: 123,
        avatar_url: 'https://github.com/avatars/developer1.png'
      },
      assets: [],
      repo: 'stackflow'
    },
    {
      id: 2,
      tag_name: 'v2.0.0-beta.1',
      name: 'Version 2.0.0 Beta 1',
      body: 'Beta release for version 2.0.0',
      published_at: '2024-02-10T14:30:00Z', // 토요일 - 주말
      created_at: '2024-02-10T14:00:00Z',
      draft: false,
      prerelease: true,
      html_url: 'https://github.com/daangn/stackflow/releases/tag/v2.0.0-beta.1',
      author: {
        login: 'developer2',
        id: 456,
        avatar_url: 'https://github.com/avatars/developer2.png'
      },
      assets: [],
      repo: 'stackflow'
    },
    {
      id: 3,
      tag_name: 'v1.5.0',
      name: 'Version 1.5.0',
      body: 'Minor release with new features',
      published_at: '2024-01-16T11:15:00Z', // 화요일 - 평일
      created_at: '2024-01-16T11:00:00Z',
      draft: false,
      prerelease: false,
      html_url: 'https://github.com/daangn/seed-design/releases/tag/v1.5.0',
      author: {
        login: 'developer3',
        id: 789,
        avatar_url: 'https://github.com/avatars/developer3.png'
      },
      assets: [],
      repo: 'seed-design'
    }
  ]

  beforeEach(() => {
    // GitHub Service mock 설정
    mockGithubService = {
      fetchDaangnReleasesExtended: vi.fn().mockResolvedValue(mockReleases)
    }

    rawDataService = new RawDataService(mockGithubService as GithubService)

    // Mock console.error to suppress error messages in tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore()
    }
  })

  describe('getDashboardData', () => {
    it('필터 없이 전체 대시보드 데이터를 정상적으로 조회해야 함', async () => {
      const result = await rawDataService.getDashboardData()

      expect(result).toBeDefined()
      expect(result.raw_data).toHaveLength(3)
      expect(result.summary_metrics).toBeInstanceOf(Array)
      expect(result.aggregations).toBeDefined()
      expect(result.time_series).toBeInstanceOf(Array)
      expect(result.data_freshness).toBeDefined()
    })

    it('저장소 필터를 적용하여 데이터를 필터링해야 함', async () => {
      const filters = {
        repo_names: ['stackflow']
      }

      const result = await rawDataService.getDashboardData(filters)

      expect(result.raw_data).toHaveLength(2)
      expect(result.raw_data.every(item => item.repo_name === 'stackflow')).toBe(true)
      expect(result.filters_applied).toEqual(filters)
    })

    it('날짜 범위 필터를 적용하여 데이터를 필터링해야 함', async () => {
      const filters = {
        date_from: '2024-01-16',
        date_to: '2024-02-28'
      }

      const result = await rawDataService.getDashboardData(filters)

      expect(result.raw_data).toHaveLength(2) // v1.5.0과 v2.0.0-beta.1
      expect(result.filters_applied).toEqual(filters)
    })

    it('근무일 타입 필터를 적용하여 주말 릴리즈를 제외해야 함', async () => {
      const filters = {
        work_day_types: ['WEEKDAY' as const]
      }

      const result = await rawDataService.getDashboardData(filters)

      expect(result.raw_data.every(item => item.work_day_type === 'WEEKDAY')).toBe(true)
      expect(result.raw_data).toHaveLength(2) // v1.0.0과 v1.5.0 (평일만)
      expect(result.raw_data.some(item => item.tag_name === 'v2.0.0-beta.1')).toBe(false) // 토요일 릴리즈 제외
    })

    it('사전 릴리즈를 제외하도록 필터링해야 함', async () => {
      const filters = {
        include_prereleases: false
      }

      const result = await rawDataService.getDashboardData(filters)

      expect(result.raw_data.every(item => !item.is_prerelease)).toBe(true)
      expect(result.raw_data).toHaveLength(2) // beta 버전 제외
    })
  })

  describe('Raw 데이터 변환', () => {
    it('GitHub API 응답을 올바른 Raw 데이터 형식으로 변환해야 함', async () => {
      const result = await rawDataService.getDashboardData()
      const rawData = result.raw_data

      // 첫 번째 릴리즈 검증
      const firstRelease = rawData.find(item => item.tag_name === 'v1.0.0')
      expect(firstRelease).toBeDefined()
      expect(firstRelease!.repo_name).toBe('stackflow')
      expect(firstRelease!.release_type).toBe('patch') // v1.0.0은 patch 타입
      expect(firstRelease!.version_major).toBe(1)
      expect(firstRelease!.version_minor).toBe(0)
      expect(firstRelease!.version_patch).toBe(0)
      expect(firstRelease!.is_prerelease).toBe(false)
      expect(firstRelease!.work_day_type).toBe('WEEKDAY')

      // 베타 릴리즈 검증
      const betaRelease = rawData.find(item => item.tag_name === 'v2.0.0-beta.1')
      expect(betaRelease).toBeDefined()
      expect(betaRelease!.release_type).toBe('pre-release')
      expect(betaRelease!.is_prerelease).toBe(true)

      // 평일 릴리즈 검증 (v1.5.0은 이제 화요일)
      const minorRelease = rawData.find(item => item.tag_name === 'v1.5.0')
      expect(minorRelease).toBeDefined()
      expect(minorRelease!.work_day_type).toBe('WEEKDAY')
      expect(minorRelease!.is_weekend).toBe(false)
      expect(minorRelease!.release_type).toBe('patch') // v1.5.0도 patch 타입
    })

    it('시간 관련 필드들이 올바르게 계산되어야 함', async () => {
      const result = await rawDataService.getDashboardData()
      const rawData = result.raw_data

      rawData.forEach(item => {
        // 기본 시간 필드 확인
        expect(item.published_timestamp).toBeTypeOf('number')
        expect(item.published_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(item.published_time).toMatch(/^\d{2}:\d{2}:\d{2}$/)
        expect(item.published_year).toBeTypeOf('number')
        expect(item.published_month).toBeGreaterThan(0)
        expect(item.published_month).toBeLessThan(13)
        expect(item.published_day).toBeGreaterThan(0)
        expect(item.published_day).toBeLessThan(32)
        expect(item.published_quarter).toBeGreaterThan(0)
        expect(item.published_quarter).toBeLessThan(5)

        // ISO 주차 형식 확인
        expect(item.published_iso_week).toMatch(/^\d{4}-W\d{2}$/)

        // 요일 관련 확인
        expect(item.published_day_of_week).toBeGreaterThanOrEqual(0)
        expect(item.published_day_of_week).toBeLessThan(7)
        expect(item.published_day_name).toBeTypeOf('string')
        expect(item.published_month_name).toBeTypeOf('string')
      })
    })

    it('집계용 키들이 올바른 형식으로 생성되어야 함', async () => {
      const result = await rawDataService.getDashboardData()
      const rawData = result.raw_data

      rawData.forEach(item => {
        expect(item.date_key).toMatch(/^\d{8}$/) // YYYYMMDD
        expect(item.week_key).toMatch(/^\d{4}-W\d{2}$/) // YYYY-WW
        expect(item.month_key).toMatch(/^\d{4}-\d{2}$/) // YYYY-MM
        expect(item.quarter_key).toMatch(/^\d{4}-Q\d$/) // YYYY-Q#
        expect(item.year_key).toMatch(/^\d{4}$/) // YYYY
      })
    })
  })

  describe('메트릭 계산', () => {
    it('주요 메트릭들이 올바르게 계산되어야 함', async () => {
      const result = await rawDataService.getDashboardData()
      const metrics = result.summary_metrics

      expect(metrics).toBeInstanceOf(Array)
      expect(metrics.length).toBeGreaterThan(0)

      // 필수 메트릭 확인
      const totalReleasesMetric = metrics.find(m => m.name === 'Total Releases')
      expect(totalReleasesMetric).toBeDefined()
      expect(totalReleasesMetric!.value).toBe(3)

      const activeReposMetric = metrics.find(m => m.name === 'Active Repositories')
      expect(activeReposMetric).toBeDefined()
      expect(activeReposMetric!.value).toBe(2)

      const weekdayRateMetric = metrics.find(m => m.name === 'Weekday Release Rate')
      expect(weekdayRateMetric).toBeDefined()
      if (weekdayRateMetric) {
        expect(Number(weekdayRateMetric.value)).toBeCloseTo(66.67, 1) // 2/3 * 100 (2개 평일, 1개 주말)
      }
    })
  })

  describe('집계 데이터', () => {
    it('저장소별 집계가 올바르게 생성되어야 함', async () => {
      const result = await rawDataService.getDashboardData()
      const repoAggregations = result.aggregations.by_repo

      expect(repoAggregations).toHaveLength(2)
      expect(repoAggregations.find(a => a.key === 'stackflow')?.value).toBe(2)
      expect(repoAggregations.find(a => a.key === 'seed-design')?.value).toBe(1)
    })

    it('요일별 집계가 올바르게 생성되어야 함', async () => {
      const result = await rawDataService.getDashboardData()
      const dayAggregations = result.aggregations.by_day_of_week

      expect(dayAggregations).toBeInstanceOf(Array)
      expect(dayAggregations.every(a => a.percentage >= 0 && a.percentage <= 100)).toBe(true)
    })

    it('릴리즈 타입별 집계가 올바르게 생성되어야 함', async () => {
      const result = await rawDataService.getDashboardData()
      const typeAggregations = result.aggregations.by_release_type

      expect(typeAggregations.find(a => a.key === 'patch')?.value).toBe(2) // v1.0.0과 v1.5.0
      expect(typeAggregations.find(a => a.key === 'pre-release')?.value).toBe(1) // v2.0.0-beta.1
    })
  })

  describe('시계열 데이터', () => {
    it('시계열 데이터가 올바르게 생성되어야 함', async () => {
      const result = await rawDataService.getDashboardData()
      const timeSeries = result.time_series

      expect(timeSeries).toBeInstanceOf(Array)
      expect(timeSeries.length).toBeGreaterThan(0)

      timeSeries.forEach(point => {
        expect(point.timestamp).toBeTypeOf('number')
        expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(point.value).toBeGreaterThanOrEqual(0)
        expect(point.cumulative_value).toBeGreaterThanOrEqual(0)
      })

      // 누적값이 단조증가하는지 확인
      for (let i = 1; i < timeSeries.length; i++) {
        expect(timeSeries[i].cumulative_value).toBeGreaterThanOrEqual(
          timeSeries[i - 1].cumulative_value
        )
      }
    })
  })

  describe('데이터 신선도', () => {
    it('데이터 신선도 정보가 올바르게 설정되어야 함', async () => {
      const result = await rawDataService.getDashboardData()
      const freshness = result.data_freshness

      expect(freshness.last_updated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(freshness.data_range.earliest_release).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(freshness.data_range.latest_release).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('오류 처리', () => {
    it('GitHub API 오류 시 적절한 오류를 던져야 함', async () => {
      mockGithubService.fetchDaangnReleasesExtended.mockRejectedValue(
        new Error('GitHub API rate limit exceeded')
      )

      await expect(rawDataService.getDashboardData()).rejects.toThrow(
        '대시보드 데이터 생성에 실패했습니다'
      )
    })
  })
})
