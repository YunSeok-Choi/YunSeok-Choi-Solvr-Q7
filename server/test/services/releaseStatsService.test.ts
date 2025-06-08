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

    it('should calculate yearly statistics correctly', async () => {
      // Arrange
      const mockReleases: ReleaseInfo[] = [
        { repo: 'stackflow', tag: 'v1.0.0', publishedAt: '2023-01-15T10:00:00Z' },
        { repo: 'stackflow', tag: 'v1.1.0', publishedAt: '2023-06-20T15:30:00Z' },
        { repo: 'seed-design', tag: 'v2.0.0', publishedAt: '2024-01-10T12:00:00Z' },
        { repo: 'seed-design', tag: 'v2.1.0', publishedAt: '2024-03-25T08:45:00Z' },
        { repo: 'seed-design', tag: 'v2.2.0', publishedAt: '2024-07-30T16:20:00Z' }
      ]

      vi.mocked(mockGithubService.fetchDaangnReleases!).mockResolvedValue(mockReleases)

      // Act
      const result = await releaseStatsService.getReleaseStats()

      // Assert
      expect(result.yearlyStats).toEqual({
        '2023': 2,
        '2024': 3
      })
      expect(result.totalReleases).toBe(5)
    })

    it('should calculate weekly statistics correctly using ISO weeks', async () => {
      // Arrange
      const mockReleases: ReleaseInfo[] = [
        // 2024년 1월 15일 (월요일) - 2024-W03
        { repo: 'stackflow', tag: 'v1.0.0', publishedAt: '2024-01-15T10:00:00Z' },
        { repo: 'stackflow', tag: 'v1.1.0', publishedAt: '2024-01-16T15:30:00Z' },
        // 2024년 2월 5일 (월요일) - 2024-W06
        { repo: 'seed-design', tag: 'v2.0.0', publishedAt: '2024-02-05T12:00:00Z' },
        // 2024년 12월 30일 (월요일) - 2025-W01 (ISO week)
        { repo: 'seed-design', tag: 'v2.1.0', publishedAt: '2024-12-30T08:45:00Z' }
      ]

      vi.mocked(mockGithubService.fetchDaangnReleases!).mockResolvedValue(mockReleases)

      // Act
      const result = await releaseStatsService.getReleaseStats()

      // Assert
      expect(result.weeklyStats).toEqual({
        '2024-W03': 2, // 1월 15-16일
        '2024-W06': 1, // 2월 5일
        '2025-W01': 1 // 12월 30일 (ISO week 기준으로 2025년 1주차)
      })
    })

    it('should calculate daily statistics correctly', async () => {
      // Arrange
      const mockReleases: ReleaseInfo[] = [
        { repo: 'stackflow', tag: 'v1.0.0', publishedAt: '2024-01-15T10:00:00Z' },
        { repo: 'stackflow', tag: 'v1.1.0', publishedAt: '2024-01-15T15:30:00Z' },
        { repo: 'seed-design', tag: 'v2.0.0', publishedAt: '2024-01-16T12:00:00Z' },
        { repo: 'seed-design', tag: 'v2.1.0', publishedAt: '2024-02-10T08:45:00Z' }
      ]

      vi.mocked(mockGithubService.fetchDaangnReleases!).mockResolvedValue(mockReleases)

      // Act
      const result = await releaseStatsService.getReleaseStats()

      // Assert
      expect(result.dailyStats).toEqual({
        '2024-01-15': 2,
        '2024-01-16': 1,
        '2024-02-10': 1
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
    it('should calculate ISO weeks correctly for year boundaries', async () => {
      // Arrange - Test cases for ISO week edge cases
      const mockReleases: ReleaseInfo[] = [
        // January 1, 2024 (Monday) - Should be 2024-W01
        { repo: 'test', tag: 'v1.0.0', publishedAt: '2024-01-01T10:00:00Z' },
        // December 31, 2023 (Sunday) - Should be 2023-W52 in ISO
        { repo: 'test', tag: 'v1.1.0', publishedAt: '2023-12-31T10:00:00Z' },
        // December 30, 2024 (Monday) - Should be 2025-W01 in ISO
        { repo: 'test', tag: 'v1.2.0', publishedAt: '2024-12-30T10:00:00Z' }
      ]

      vi.mocked(mockGithubService.fetchDaangnReleases!).mockResolvedValue(mockReleases)

      // Act
      const result = await releaseStatsService.getReleaseStats()

      // Assert
      expect(result.weeklyStats).toEqual({
        '2024-W01': 1, // Jan 1, 2024
        '2023-W52': 1, // Dec 31, 2023
        '2025-W01': 1 // Dec 30, 2024
      })
    })
  })
})
