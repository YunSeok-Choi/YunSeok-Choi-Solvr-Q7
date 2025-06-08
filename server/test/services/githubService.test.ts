import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GithubService } from '../../src/services/githubService'

// Global fetch mock
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('GithubService', () => {
  let githubService: GithubService

  beforeEach(() => {
    githubService = new GithubService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetchGithubReleases', () => {
    it('should fetch releases successfully and return formatted data', async () => {
      // Arrange
      const mockReleases = [
        {
          tag_name: 'v1.0.0',
          published_at: '2024-01-15T10:00:00Z',
          name: 'Release 1.0.0',
          body: 'First release'
        },
        {
          tag_name: 'v1.1.0',
          published_at: '2024-02-20T15:30:00Z',
          name: 'Release 1.1.0',
          body: 'Second release'
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockReleases
      })

      // Act
      const result = await githubService.fetchGithubReleases('testowner', 'testrepo')

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/testowner/testrepo/releases',
        {
          method: 'GET',
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Release-Stats-App'
          }
        }
      )

      expect(result).toEqual([
        {
          repo: 'testrepo',
          tag: 'v1.0.0',
          publishedAt: '2024-01-15T10:00:00Z'
        },
        {
          repo: 'testrepo',
          tag: 'v1.1.0',
          publishedAt: '2024-02-20T15:30:00Z'
        }
      ])
    })

    it('should handle empty releases array', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => []
      })

      // Act
      const result = await githubService.fetchGithubReleases('testowner', 'testrepo')

      // Assert
      expect(result).toEqual([])
    })

    it('should throw error when GitHub API returns non-ok response', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      // Act & Assert
      await expect(githubService.fetchGithubReleases('testowner', 'nonexistent')).rejects.toThrow(
        'testowner/nonexistent 저장소의 release 정보를 가져오는데 실패했습니다'
      )
    })

    it('should throw error when network request fails', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      // Act & Assert
      await expect(githubService.fetchGithubReleases('testowner', 'testrepo')).rejects.toThrow(
        'testowner/testrepo 저장소의 release 정보를 가져오는데 실패했습니다'
      )
    })

    it('should handle rate limiting (403 status)', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      })

      // Act & Assert
      await expect(githubService.fetchGithubReleases('testowner', 'testrepo')).rejects.toThrow(
        'testowner/testrepo 저장소의 release 정보를 가져오는데 실패했습니다'
      )
    })
  })

  describe('fetchMultipleRepoReleases', () => {
    it('should fetch releases from multiple repositories successfully', async () => {
      // Arrange
      const mockReleases1 = [
        {
          tag_name: 'v1.0.0',
          published_at: '2024-01-15T10:00:00Z',
          name: 'Release 1.0.0',
          body: 'First release'
        }
      ]

      const mockReleases2 = [
        {
          tag_name: 'v2.0.0',
          published_at: '2024-02-15T10:00:00Z',
          name: 'Release 2.0.0',
          body: 'Second release'
        }
      ]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockReleases1
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockReleases2
        })

      const repositories = [
        { owner: 'owner1', name: 'repo1' },
        { owner: 'owner2', name: 'repo2' }
      ]

      // Act
      const result = await githubService.fetchMultipleRepoReleases(repositories)

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result).toEqual([
        {
          repo: 'repo1',
          tag: 'v1.0.0',
          publishedAt: '2024-01-15T10:00:00Z'
        },
        {
          repo: 'repo2',
          tag: 'v2.0.0',
          publishedAt: '2024-02-15T10:00:00Z'
        }
      ])
    })

    it('should handle partial failures and return successful results', async () => {
      // Arrange
      const mockReleases1 = [
        {
          tag_name: 'v1.0.0',
          published_at: '2024-01-15T10:00:00Z',
          name: 'Release 1.0.0',
          body: 'First release'
        }
      ]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockReleases1
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        })

      const repositories = [
        { owner: 'owner1', name: 'repo1' },
        { owner: 'owner2', name: 'nonexistent' }
      ]

      // Act
      const result = await githubService.fetchMultipleRepoReleases(repositories)

      // Assert
      expect(result).toEqual([
        {
          repo: 'repo1',
          tag: 'v1.0.0',
          publishedAt: '2024-01-15T10:00:00Z'
        }
      ])
    })
  })

  describe('fetchDaangnReleases', () => {
    it('should fetch releases from daangn repositories', async () => {
      // Arrange
      const mockStackflowReleases = [
        {
          tag_name: 'v1.0.0',
          published_at: '2024-01-15T10:00:00Z',
          name: 'Stackflow Release',
          body: 'Stackflow release'
        }
      ]

      const mockSeedDesignReleases = [
        {
          tag_name: 'v2.0.0',
          published_at: '2024-02-15T10:00:00Z',
          name: 'Seed Design Release',
          body: 'Seed Design release'
        }
      ]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockStackflowReleases
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockSeedDesignReleases
        })

      // Act
      const result = await githubService.fetchDaangnReleases()

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/daangn/stackflow/releases',
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/daangn/seed-design/releases',
        expect.any(Object)
      )

      expect(result).toEqual([
        {
          repo: 'stackflow',
          tag: 'v1.0.0',
          publishedAt: '2024-01-15T10:00:00Z'
        },
        {
          repo: 'seed-design',
          tag: 'v2.0.0',
          publishedAt: '2024-02-15T10:00:00Z'
        }
      ])
    })
  })
})
