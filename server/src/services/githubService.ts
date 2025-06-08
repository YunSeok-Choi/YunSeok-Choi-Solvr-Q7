import { ReleaseInfo, GithubReleaseResponse } from '../types'

export class GithubService {
  private readonly baseUrl = 'https://api.github.com'

  constructor() {}

  /**
   * GitHub 저장소의 release 정보를 가져옵니다
   * @param repoOwner 저장소 소유자 (예: "daangn")
   * @param repoName 저장소 이름 (예: "stackflow")
   * @returns Promise<ReleaseInfo[]> release 정보 배열
   */
  async fetchGithubReleases(repoOwner: string, repoName: string): Promise<ReleaseInfo[]> {
    try {
      const url = `${this.baseUrl}/repos/${repoOwner}/${repoName}/releases`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Release-Stats-App'
        }
      })

      if (!response.ok) {
        throw new Error(`GitHub API 요청 실패: ${response.status} ${response.statusText}`)
      }

      const releases: GithubReleaseResponse[] = await response.json()

      return releases.map(
        (release): ReleaseInfo => ({
          repo: repoName,
          tag: release.tag_name,
          publishedAt: release.published_at
        })
      )
    } catch (error) {
      console.error(`Failed to fetch releases for ${repoOwner}/${repoName}:`, error)
      throw new Error(`${repoOwner}/${repoName} 저장소의 release 정보를 가져오는데 실패했습니다`)
    }
  }

  /**
   * 여러 저장소의 release 정보를 동시에 가져옵니다
   * @param repositories 저장소 정보 배열 [{ owner, name }]
   * @returns Promise<ReleaseInfo[]> 모든 저장소의 release 정보 배열
   */
  async fetchMultipleRepoReleases(
    repositories: Array<{ owner: string; name: string }>
  ): Promise<ReleaseInfo[]> {
    try {
      const promises = repositories.map(repo => this.fetchGithubReleases(repo.owner, repo.name))

      const results = await Promise.allSettled(promises)
      const successfulResults: ReleaseInfo[] = []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulResults.push(...result.value)
        } else {
          console.error(
            `Failed to fetch releases for ${repositories[index].owner}/${repositories[index].name}:`,
            result.reason
          )
        }
      })

      return successfulResults
    } catch (error) {
      console.error('Failed to fetch multiple repo releases:', error)
      throw new Error('여러 저장소의 release 정보를 가져오는데 실패했습니다')
    }
  }

  /**
   * daangn 조직의 stackflow와 seed-design 저장소 release 정보를 가져옵니다
   * @returns Promise<ReleaseInfo[]> 두 저장소의 모든 release 정보
   */
  async fetchDaangnReleases(): Promise<ReleaseInfo[]> {
    const repositories = [
      { owner: 'daangn', name: 'stackflow' },
      { owner: 'daangn', name: 'seed-design' }
    ]

    return this.fetchMultipleRepoReleases(repositories)
  }
}
