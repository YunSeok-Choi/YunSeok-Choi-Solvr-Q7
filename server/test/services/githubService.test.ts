import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GithubService } from '../../src/services/githubService'

// Mock the entire fetch globally
global.fetch = vi.fn()

describe('GithubService', () => {
  let githubService: GithubService
  let fetchSpy: any
  let consoleErrorSpy: any

  beforeEach(() => {
    githubService = new GithubService()
    fetchSpy = vi.mocked(fetch)
    fetchSpy.mockClear()

    // Mock console.error to suppress error messages in tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('fetchGithubReleasesExtended', () => {
    it('should fetch extended releases successfully', async () => {
      // Arrange
      const mockReleases = [
        {
          id: 1,
          tag_name: 'v1.0.0',
          published_at: '2024-01-15T10:00:00Z',
          name: 'Release 1.0.0',
          body: 'First release',
          draft: false,
          prerelease: false,
          created_at: '2024-01-15T09:00:00Z',
          author: {
            login: 'testuser',
            id: 123
          },
          assets: []
        }
      ]

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockReleases
      } as any)

      // Act
      const result = await githubService.fetchGithubReleasesExtended('testowner', 'testrepo')

      // Assert
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(fetchSpy).toHaveBeenCalledWith(
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
          ...mockReleases[0],
          repo: 'testrepo'
        }
      ])
    })

    it('should throw error when GitHub API returns non-ok response', async () => {
      // Arrange
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as any)

      // Act & Assert
      await expect(
        githubService.fetchGithubReleasesExtended('testowner', 'nonexistent')
      ).rejects.toThrow(
        'testowner/nonexistent 저장소의 확장된 release 정보를 가져오는데 실패했습니다'
      )
    })

    it('should throw error when network request fails', async () => {
      // Arrange
      fetchSpy.mockRejectedValueOnce(new Error('Network error'))

      // Act & Assert
      await expect(
        githubService.fetchGithubReleasesExtended('testowner', 'testrepo')
      ).rejects.toThrow('testowner/testrepo 저장소의 확장된 release 정보를 가져오는데 실패했습니다')
    })
  })

  describe('fetchGithubReleases', () => {
    it('should fetch releases successfully and return formatted data', async () => {
      // Arrange
      const mockReleases = [
        {
          id: 1,
          tag_name: 'v1.0.0',
          published_at: '2024-01-15T10:00:00Z',
          name: 'Release 1.0.0',
          body: 'First release',
          draft: false,
          prerelease: false,
          created_at: '2024-01-15T09:00:00Z',
          author: { login: 'testuser', id: 123 },
          assets: []
        },
        {
          id: 2,
          tag_name: 'v1.1.0',
          published_at: '2024-02-20T15:30:00Z',
          name: 'Release 1.1.0',
          body: 'Second release',
          draft: false,
          prerelease: false,
          created_at: '2024-02-20T14:00:00Z',
          author: { login: 'testuser', id: 123 },
          assets: []
        }
      ]

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockReleases
      } as any)

      // Act
      const result = await githubService.fetchGithubReleases('testowner', 'testrepo')

      // Assert
      expect(fetchSpy).toHaveBeenCalledTimes(1)
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
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => []
      } as any)

      // Act
      const result = await githubService.fetchGithubReleases('testowner', 'testrepo')

      // Assert
      expect(result).toEqual([])
    })

    it('should throw error when GitHub API returns non-ok response', async () => {
      // Arrange
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as any)

      // Act & Assert
      await expect(githubService.fetchGithubReleases('testowner', 'nonexistent')).rejects.toThrow(
        'testowner/nonexistent 저장소의 release 정보를 가져오는데 실패했습니다'
      )
    })

    it('should throw error when network request fails', async () => {
      // Arrange
      fetchSpy.mockRejectedValueOnce(new Error('Network error'))

      // Act & Assert
      await expect(githubService.fetchGithubReleases('testowner', 'testrepo')).rejects.toThrow(
        'testowner/testrepo 저장소의 release 정보를 가져오는데 실패했습니다'
      )
    })

    it('should handle rate limiting (403 status)', async () => {
      // Arrange
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      } as any)

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
          id: 1,
          tag_name: 'v1.0.0',
          published_at: '2024-01-15T10:00:00Z',
          name: 'Release 1.0.0',
          body: 'First release',
          draft: false,
          prerelease: false,
          created_at: '2024-01-15T09:00:00Z',
          author: { login: 'user1', id: 123 },
          assets: []
        }
      ]

      const mockReleases2 = [
        {
          id: 2,
          tag_name: 'v2.0.0',
          published_at: '2024-02-15T10:00:00Z',
          name: 'Release 2.0.0',
          body: 'Second release',
          draft: false,
          prerelease: false,
          created_at: '2024-02-15T09:00:00Z',
          author: { login: 'user2', id: 456 },
          assets: []
        }
      ]

      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockReleases1
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockReleases2
        } as any)

      const repositories = [
        { owner: 'owner1', name: 'repo1' },
        { owner: 'owner2', name: 'repo2' }
      ]

      // Act
      const result = await githubService.fetchMultipleRepoReleases(repositories)

      // Assert
      expect(fetchSpy).toHaveBeenCalledTimes(2)
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
          id: 1,
          tag_name: 'v1.0.0',
          published_at: '2024-01-15T10:00:00Z',
          name: 'Release 1.0.0',
          body: 'First release',
          draft: false,
          prerelease: false,
          created_at: '2024-01-15T09:00:00Z',
          author: { login: 'user1', id: 123 },
          assets: []
        }
      ]

      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockReleases1
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        } as any)

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
          id: 1,
          tag_name: 'v1.0.0',
          published_at: '2024-01-15T10:00:00Z',
          name: 'Stackflow Release',
          body: 'Stackflow release',
          draft: false,
          prerelease: false,
          created_at: '2024-01-15T09:00:00Z',
          author: { login: 'daangn-dev', id: 789 },
          assets: []
        }
      ]

      const mockSeedDesignReleases = [
        {
          id: 2,
          tag_name: 'v2.0.0',
          published_at: '2024-02-15T10:00:00Z',
          name: 'Seed Design Release',
          body: 'Seed Design release',
          draft: false,
          prerelease: false,
          created_at: '2024-02-15T09:00:00Z',
          author: { login: 'daangn-design', id: 987 },
          assets: []
        }
      ]

      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockStackflowReleases
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockSeedDesignReleases
        } as any)

      // Act
      const result = await githubService.fetchDaangnReleases()

      // Assert
      expect(fetchSpy).toHaveBeenCalledTimes(2)
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.github.com/repos/daangn/stackflow/releases',
        expect.any(Object)
      )
      expect(fetchSpy).toHaveBeenCalledWith(
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

    it('should handle empty results from daangn repositories', async () => {
      // Arrange
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => []
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => []
        } as any)

      // Act
      const result = await githubService.fetchDaangnReleases()

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('fetchDaangnReleasesExtended', () => {
    it('should fetch extended releases from daangn repositories', async () => {
      // Arrange
      const mockStackflowReleases = [
        {
          id: 1,
          tag_name: 'v1.0.0',
          published_at: '2024-01-15T10:00:00Z',
          name: 'Stackflow Release',
          body: 'Stackflow release',
          draft: false,
          prerelease: false,
          created_at: '2024-01-15T09:00:00Z',
          author: { login: 'daangn-dev', id: 789 },
          assets: []
        }
      ]

      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockStackflowReleases
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => []
        } as any)

      // Act
      const result = await githubService.fetchDaangnReleasesExtended()

      // Assert
      expect(fetchSpy).toHaveBeenCalledTimes(2)
      expect(result).toEqual([
        {
          ...mockStackflowReleases[0],
          repo: 'stackflow'
        }
      ])
    })
  })
})
