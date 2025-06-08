import * as fs from 'fs'
import * as path from 'path'
import { GithubReleaseResponse } from '../types'

interface LocalReleaseData {
  repositories: Array<{
    owner: string
    name: string
    releases: GithubReleaseResponse[]
  }>
  metadata: {
    last_updated: string
    data_version: string
    total_repositories: number
    total_releases: number
  }
}

export class DataService {
  private static instance: DataService
  private releaseData: LocalReleaseData | null = null
  public dataPath: string

  private constructor() {
    this.dataPath = path.join(__dirname, '../../data/releases.json')
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService()
    }
    return DataService.instance
  }

  /**
   * 서버 시작 시 로컬 데이터를 메모리에 로드
   */
  async loadData(): Promise<void> {
    try {
      console.log('📂 Loading release data from local file...')

      if (!fs.existsSync(this.dataPath)) {
        throw new Error(`Data file not found: ${this.dataPath}`)
      }

      const fileContent = fs.readFileSync(this.dataPath, 'utf-8')
      this.releaseData = JSON.parse(fileContent)

      console.log('✅ Release data loaded successfully:', {
        repositories: this.releaseData?.repositories.length || 0,
        total_releases: this.releaseData?.metadata.total_releases || 0,
        last_updated: this.releaseData?.metadata.last_updated || 'unknown'
      })

      // 데이터 검증
      this.validateData()
    } catch (error) {
      console.error('❌ Failed to load release data:', error)
      throw error
    }
  }

  /**
   * 데이터 유효성 검증
   */
  private validateData(): void {
    if (!this.releaseData) {
      throw new Error('No data loaded')
    }

    if (!Array.isArray(this.releaseData.repositories)) {
      throw new Error('Invalid data format: repositories must be an array')
    }

    if (this.releaseData.repositories.length === 0) {
      console.warn('⚠️ Warning: No repositories found in data')
    }

    // 각 저장소의 릴리즈 데이터 검증
    for (const repo of this.releaseData.repositories) {
      if (!repo.name || !repo.owner) {
        throw new Error(`Invalid repository data: missing name or owner`)
      }

      if (!Array.isArray(repo.releases)) {
        throw new Error(
          `Invalid repository data: releases must be an array for ${repo.owner}/${repo.name}`
        )
      }
    }
  }

  /**
   * 모든 릴리즈 데이터를 flat 배열로 반환 (기존 API 호환성)
   */
  getAllReleases(): Array<GithubReleaseResponse & { repo: string }> {
    if (!this.releaseData) {
      throw new Error('Data not loaded. Call loadData() first.')
    }

    const allReleases: Array<GithubReleaseResponse & { repo: string }> = []

    for (const repository of this.releaseData.repositories) {
      for (const release of repository.releases) {
        allReleases.push({
          ...release,
          repo: repository.name
        })
      }
    }

    // 날짜 순으로 정렬 (최신 순)
    return allReleases.sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    )
  }

  /**
   * 특정 저장소의 릴리즈 데이터 반환
   */
  getRepositoryReleases(repoName: string): GithubReleaseResponse[] {
    if (!this.releaseData) {
      throw new Error('Data not loaded. Call loadData() first.')
    }

    const repository = this.releaseData.repositories.find(repo => repo.name === repoName)
    if (!repository) {
      throw new Error(`Repository not found: ${repoName}`)
    }

    return repository.releases.sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    )
  }

  /**
   * 저장소 목록 반환
   */
  getRepositories(): Array<{ owner: string; name: string; releaseCount: number }> {
    if (!this.releaseData) {
      throw new Error('Data not loaded. Call loadData() first.')
    }

    return this.releaseData.repositories.map(repo => ({
      owner: repo.owner,
      name: repo.name,
      releaseCount: repo.releases.length
    }))
  }

  /**
   * 데이터 메타정보 반환
   */
  getMetadata() {
    if (!this.releaseData) {
      throw new Error('Data not loaded. Call loadData() first.')
    }

    return this.releaseData.metadata
  }

  /**
   * 데이터 로드 상태 확인
   */
  isDataLoaded(): boolean {
    return this.releaseData !== null
  }

  /**
   * 데이터 다시 로드 (운영 중 업데이트용)
   */
  async reloadData(): Promise<void> {
    console.log('🔄 Reloading release data...')
    this.releaseData = null
    await this.loadData()
  }

  /**
   * 통계 정보 반환
   */
  getStats() {
    if (!this.releaseData) {
      throw new Error('Data not loaded. Call loadData() first.')
    }

    const allReleases = this.getAllReleases()
    const now = new Date()

    // 최근 30일 릴리즈
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentReleases = allReleases.filter(
      release => new Date(release.published_at) >= thirtyDaysAgo
    )

    // 사전 릴리즈 통계
    const prereleases = allReleases.filter(release => release.prerelease)

    // 저장소별 통계
    const repoStats = this.releaseData.repositories.reduce(
      (acc, repo) => {
        acc[repo.name] = repo.releases.length
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total_releases: allReleases.length,
      total_repositories: this.releaseData.repositories.length,
      recent_releases_30d: recentReleases.length,
      prerelease_count: prereleases.length,
      prerelease_rate: allReleases.length > 0 ? (prereleases.length / allReleases.length) * 100 : 0,
      repository_stats: repoStats,
      data_freshness: {
        last_updated: this.releaseData.metadata.last_updated,
        data_version: this.releaseData.metadata.data_version
      }
    }
  }
}
