import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ReleaseStatsService } from '../../src/services/releaseStatsService'
import { GithubService } from '../../src/services/githubService'
import { ReleaseInfo } from '../../src/types'

describe('ReleaseStatsService', () => {
  let releaseStatsService: ReleaseStatsService
  let mockGithubService: Partial<GithubService>
  let consoleLogSpy: any

  beforeEach(() => {
    // Create a proper mock for GithubService
    mockGithubService = {
      fetchDaangnReleases: vi.fn(),
      fetchGithubReleases: vi.fn(),
      fetchMultipleRepoReleases: vi.fn()
    }

    // Mock console.log to prevent CSV generation logs
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    releaseStatsService = new ReleaseStatsService(mockGithubService as GithubService)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getReleaseStats', () => {
    it('should return default values when githubService is not provided', async () => {
      // Arrange
      const serviceWithoutGithub = new ReleaseStatsService()

      // Act
      const result = await serviceWithoutGithub.getReleaseStats()

      // Assert
      expect(result).toEqual({
        totalReleases: 0,
        yearlyStats: {},
        weeklyStats: {},
        dailyStats: {},
        repoStats: {},
        latestReleases: [],
        message: 'GitHub service not available'
      })
    })

    it('should return empty stats when no releases are found', async () => {
      // Arrange
      vi.mocked(mockGithubService.fetchDaangnReleases!).mockResolvedValue([])

      // Act
      const result = await releaseStatsService.getReleaseStats()

      // Assert
      expect(result).toEqual({
        totalReleases: 0,
        yearlyStats: {},
        weeklyStats: {},
        dailyStats: {},
        repoStats: {},
        latestReleases: [],
        message: 'No releases found for the specified repositories'
      })
    })

    it('should calculate yearly statistics correctly (weekdays only)', async () => {
      // Arrange - All releases are on weekdays
      const mockReleases: ReleaseInfo[] = [
        { repo: 'stackflow', tag: 'v1.0.0', publishedAt: '2023-01-15T10:00:00Z' }, // 일요일 - 주말
        { repo: 'stackflow', tag: 'v1.1.0', publishedAt: '2023-06-20T15:30:00Z' }, // 화요일 - 평일
        { repo: 'seed-design', tag: 'v2.0.0', publishedAt: '2024-01-10T12:00:00Z' }, // 수요일 - 평일
        { repo: 'seed-design', tag: 'v2.1.0', publishedAt: '2024-03-25T08:45:00Z' }, // 월요일 - 평일
        { repo: 'seed-design', tag: 'v2.2.0', publishedAt: '2024-07-30T16:20:00Z' } // 화요일 - 평일
      ]

      vi.mocked(mockGithubService.fetchDaangnReleases!).mockResolvedValue(mockReleases)

      // Act
      const result = await releaseStatsService.getReleaseStats()

      // Assert - 평일만 계산되어야 함 (2023-01-15는 일요일이므로 제외)
      expect(result.yearlyStats).toEqual({
        '2023': 1, // 화요일 1개만
        '2024': 3 // 모두 평일
      })
      expect(result.totalReleases).toBe(5) // 전체 릴리즈는 주말 포함
    })

    it('should exclude weekend releases from main statistics', async () => {
      // Arrange - Mix of weekday and weekend releases
      const mockReleases: ReleaseInfo[] = [
        { repo: 'stackflow', tag: 'v1.0.0', publishedAt: '2024-01-15T10:00:00Z' }, // 월요일 - 평일
        { repo: 'stackflow', tag: 'v1.1.0', publishedAt: '2024-01-13T15:30:00Z' }, // 토요일 - 주말
        { repo: 'seed-design', tag: 'v2.0.0', publishedAt: '2024-01-14T12:00:00Z' }, // 일요일 - 주말
        { repo: 'seed-design', tag: 'v2.1.0', publishedAt: '2024-01-16T08:45:00Z' } // 화요일 - 평일
      ]

      vi.mocked(mockGithubService.fetchDaangnReleases!).mockResolvedValue(mockReleases)

      // Act
      const result = await releaseStatsService.getReleaseStats()

      // Assert
      expect(result.totalReleases).toBe(4) // 전체 릴리즈
      expect(result.yearlyStats).toEqual({
        '2024': 2 // 평일 릴리즈만 (월요일, 화요일)
      })
      expect(result.dailyStats).toEqual({
        '2024-01-15': 1, // 월요일
        '2024-01-16': 1 // 화요일
        // 주말(토요일, 일요일)은 제외됨
      })
    })

    it('should calculate weekly statistics correctly using ISO weeks (weekdays only)', async () => {
      // Arrange
      const mockReleases: ReleaseInfo[] = [
        // 2024년 1월 15일 (월요일) - 2024-W03
        { repo: 'stackflow', tag: 'v1.0.0', publishedAt: '2024-01-15T10:00:00Z' },
        { repo: 'stackflow', tag: 'v1.1.0', publishedAt: '2024-01-16T15:30:00Z' }, // 화요일
        // 2024년 2월 5일 (월요일) - 2024-W06
        { repo: 'seed-design', tag: 'v2.0.0', publishedAt: '2024-02-05T12:00:00Z' },
        // 2024년 12월 30일 (월요일) - 2025-W01 (ISO week)
        { repo: 'seed-design', tag: 'v2.1.0', publishedAt: '2024-12-30T08:45:00Z' },
        // 주말 릴리즈 추가 - 통계에서 제외되어야 함
        { repo: 'stackflow', tag: 'v1.2.0', publishedAt: '2024-01-14T12:00:00Z' } // 일요일 - 주말
      ]

      vi.mocked(mockGithubService.fetchDaangnReleases!).mockResolvedValue(mockReleases)

      // Act
      const result = await releaseStatsService.getReleaseStats()

      // Assert - 주말 릴리즈는 제외됨
      expect(result.weeklyStats).toEqual({
        '2024-W03': 2, // 1월 15-16일 (평일만)
        '2024-W06': 1, // 2월 5일
        '2025-W01': 1 // 12월 30일 (ISO week 기준으로 2025년 1주차)
      })
    })

    it('should calculate daily statistics correctly (weekdays only)', async () => {
      // Arrange
      const mockReleases: ReleaseInfo[] = [
        { repo: 'stackflow', tag: 'v1.0.0', publishedAt: '2024-01-15T10:00:00Z' }, // 월요일
        { repo: 'stackflow', tag: 'v1.1.0', publishedAt: '2024-01-15T15:30:00Z' }, // 월요일
        { repo: 'seed-design', tag: 'v2.0.0', publishedAt: '2024-01-16T12:00:00Z' }, // 화요일
        { repo: 'seed-design', tag: 'v2.1.0', publishedAt: '2024-02-10T08:45:00Z' }, // 토요일 - 주말
        { repo: 'stackflow', tag: 'v1.2.0', publishedAt: '2024-02-11T09:00:00Z' } // 일요일 - 주말
      ]

      vi.mocked(mockGithubService.fetchDaangnReleases!).mockResolvedValue(mockReleases)

      // Act
      const result = await releaseStatsService.getReleaseStats()

      // Assert - 주말은 제외되어야 함
      expect(result.dailyStats).toEqual({
        '2024-01-15': 2, // 월요일 릴리즈 2개
        '2024-01-16': 1 // 화요일 릴리즈 1개
        // 2024-02-10 (토요일)과 2024-02-11 (일요일)은 제외됨
      })
    })

    it('should calculate repository statistics correctly', async () => {
      // Arrange
      const mockReleases: ReleaseInfo[] = [
        { repo: 'stackflow', tag: 'v1.0.0', publishedAt: '2024-01-15T10:00:00Z' },
        { repo: 'stackflow', tag: 'v1.1.0', publishedAt: '2024-01-16T15:30:00Z' },
        { repo: 'stackflow', tag: 'v1.2.0', publishedAt: '2024-02-01T12:00:00Z' },
        { repo: 'seed-design', tag: 'v2.0.0', publishedAt: '2024-01-10T08:45:00Z' },
        { repo: 'seed-design', tag: 'v2.1.0', publishedAt: '2024-02-05T14:20:00Z' }
      ]

      vi.mocked(mockGithubService.fetchDaangnReleases!).mockResolvedValue(mockReleases)

      // Act
      const result = await releaseStatsService.getReleaseStats()

      // Assert
      expect(result.repoStats).toEqual({
        stackflow: 3,
        'seed-design': 2
      })
    })

    it('should return latest releases sorted by date', async () => {
      // Arrange
      const mockReleases: ReleaseInfo[] = [
        { repo: 'stackflow', tag: 'v1.0.0', publishedAt: '2024-01-15T10:00:00Z' },
        { repo: 'seed-design', tag: 'v2.0.0', publishedAt: '2024-03-10T12:00:00Z' },
        { repo: 'stackflow', tag: 'v1.1.0', publishedAt: '2024-02-20T15:30:00Z' },
        { repo: 'seed-design', tag: 'v2.1.0', publishedAt: '2024-04-05T08:45:00Z' }
      ]

      vi.mocked(mockGithubService.fetchDaangnReleases!).mockResolvedValue(mockReleases)

      // Act
      const result = await releaseStatsService.getReleaseStats()

      // Assert
      expect(result.latestReleases).toEqual([
        { repo: 'seed-design', tag: 'v2.1.0', publishedAt: '2024-04-05T08:45:00Z' },
        { repo: 'seed-design', tag: 'v2.0.0', publishedAt: '2024-03-10T12:00:00Z' },
        { repo: 'stackflow', tag: 'v1.1.0', publishedAt: '2024-02-20T15:30:00Z' },
        { repo: 'stackflow', tag: 'v1.0.0', publishedAt: '2024-01-15T10:00:00Z' }
      ])
    })

    it('should calculate metadata correctly', async () => {
      // Arrange
      const mockReleases: ReleaseInfo[] = [
        { repo: 'stackflow', tag: 'v1.0.0', publishedAt: '2024-01-15T10:00:00Z' },
        { repo: 'seed-design', tag: 'v2.0.0', publishedAt: '2024-03-10T12:00:00Z' }
      ]

      vi.mocked(mockGithubService.fetchDaangnReleases!).mockResolvedValue(mockReleases)

      // Act
      const result = await releaseStatsService.getReleaseStats()

      // Assert
      expect(result.metadata).toMatchObject({
        firstReleaseDate: '2024-01-15',
        lastReleaseDate: '2024-03-10',
        recentReleasesLast30Days: expect.any(Number)
      })
      expect(result.metadata?.dataFetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should handle github service errors', async () => {
      // Arrange
      vi.mocked(mockGithubService.fetchDaangnReleases!).mockRejectedValue(
        new Error('GitHub API error')
      )

      // Act
      const result = await releaseStatsService.getReleaseStats()

      // Assert
      expect(result).toEqual({
        totalReleases: 0,
        yearlyStats: {},
        weeklyStats: {},
        dailyStats: {},
        repoStats: {},
        latestReleases: [],
        error: 'Failed to fetch release statistics',
        message: 'Error occurred while fetching release data'
      })
    })

    it('should include CSV file path in metadata when successful', async () => {
      // Arrange
      const mockReleases: ReleaseInfo[] = [
        { repo: 'stackflow', tag: 'v1.0.0', publishedAt: '2024-01-15T10:00:00Z' }
      ]

      vi.mocked(mockGithubService.fetchDaangnReleases!).mockResolvedValue(mockReleases)

      // Act
      const result = await releaseStatsService.getReleaseStats()

      // Assert
      expect(result.metadata?.csvFilePath).toBeDefined()
      expect(result.metadata?.csvFilePath).toContain('release-statistics.csv')
      expect(result.message).toBe('Release stats fetched and calculated successfully')
    })
  })

  describe('ISO Week calculation edge cases', () => {
    it('should calculate ISO weeks correctly for year boundaries (weekdays only)', async () => {
      // Arrange - Test cases for ISO week edge cases (평일만 포함)
      const mockReleases: ReleaseInfo[] = [
        // January 1, 2024 (Monday) - Should be 2024-W01 - 평일
        { repo: 'test', tag: 'v1.0.0', publishedAt: '2024-01-01T10:00:00Z' },
        // December 31, 2023 (Sunday) - Should be 2023-W52 in ISO - 주말이므로 제외됨
        { repo: 'test', tag: 'v1.1.0', publishedAt: '2023-12-31T10:00:00Z' },
        // December 30, 2024 (Monday) - Should be 2025-W01 in ISO - 평일
        { repo: 'test', tag: 'v1.2.0', publishedAt: '2024-12-30T10:00:00Z' }
      ]

      vi.mocked(mockGithubService.fetchDaangnReleases!).mockResolvedValue(mockReleases)

      // Act
      const result = await releaseStatsService.getReleaseStats()

      // Assert - 주말은 제외되므로 2023-12-31 (일요일)은 weeklyStats에 포함되지 않음
      expect(result.weeklyStats).toEqual({
        '2024-W01': 1, // Jan 1, 2024 (월요일)
        '2025-W01': 1 // Dec 30, 2024 (월요일)
        // 2023-W52는 일요일이므로 제외됨
      })

      // 전체 릴리즈 수는 주말 포함
      expect(result.totalReleases).toBe(3)
    })
  })
})
