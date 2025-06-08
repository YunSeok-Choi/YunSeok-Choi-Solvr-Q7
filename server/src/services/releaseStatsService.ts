import { GithubService } from './githubService'
import { ReleaseInfo } from '../types'
import { promises as fs } from 'fs'
import path from 'path'

export class ReleaseStatsService {
  constructor(private readonly githubService?: GithubService) {
    // githubService는 선택적 의존성으로 설정
  }

  /**
   * ISO 주차를 계산합니다
   * @param date 날짜
   * @returns ISO 주차 (YYYY-WW 형식)
   */
  private getISOWeek(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    return `${d.getUTCFullYear()}-W${weekNumber.toString().padStart(2, '0')}`
  }

  /**
   * 날짜를 YYYY-MM-DD 형식으로 변환합니다
   * @param date 날짜
   * @returns YYYY-MM-DD 형식의 문자열
   */
  private formatDateToDay(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  /**
   * 릴리즈 데이터를 기반으로 상세 통계를 계산합니다
   * @param releases 릴리즈 정보 배열
   * @returns 계산된 통계 객체
   */
  private calculateDetailedStats(releases: ReleaseInfo[]) {
    const yearlyStats: Record<string, number> = {}
    const weeklyStats: Record<string, number> = {}
    const dailyStats: Record<string, number> = {}
    const repoStats: Record<string, number> = {}

    releases.forEach(release => {
      const publishedDate = new Date(release.publishedAt)
      const year = publishedDate.getFullYear().toString()
      const week = this.getISOWeek(publishedDate)
      const day = this.formatDateToDay(publishedDate)

      // 연도별 통계
      yearlyStats[year] = (yearlyStats[year] || 0) + 1

      // 주차별 통계 (ISO 주차)
      weeklyStats[week] = (weeklyStats[week] || 0) + 1

      // 일간별 통계
      dailyStats[day] = (dailyStats[day] || 0) + 1

      // 저장소별 통계
      repoStats[release.repo] = (repoStats[release.repo] || 0) + 1
    })

    return {
      yearlyStats,
      weeklyStats,
      dailyStats,
      repoStats
    }
  }

  /**
   * 최신 릴리즈들을 날짜순으로 정렬하여 반환합니다
   * @param releases 릴리즈 정보 배열
   * @param limit 반환할 개수 (기본값: 10)
   * @returns 정렬된 최신 릴리즈 배열
   */
  private getLatestReleases(releases: ReleaseInfo[], limit: number = 10): ReleaseInfo[] {
    return releases
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit)
  }

  /**
   * 저장소별 주차별 통계를 계산합니다
   * @param releases 릴리즈 정보 배열
   * @returns 저장소별 주차별 통계 객체
   */
  private calculateRepoWeeklyStats(
    releases: ReleaseInfo[]
  ): Record<string, Record<string, number>> {
    const repoWeeklyStats: Record<string, Record<string, number>> = {}

    releases.forEach(release => {
      const publishedDate = new Date(release.publishedAt)
      const week = this.getISOWeek(publishedDate)

      if (!repoWeeklyStats[release.repo]) {
        repoWeeklyStats[release.repo] = {}
      }

      repoWeeklyStats[release.repo][week] = (repoWeeklyStats[release.repo][week] || 0) + 1
    })

    return repoWeeklyStats
  }

  /**
   * 통합된 하나의 CSV 파일을 생성합니다
   * @param releases 릴리즈 정보 배열
   * @returns Promise<string> 생성된 파일 경로
   */
  private async generateUnifiedCSV(releases: ReleaseInfo[]): Promise<string> {
    try {
      const { yearlyStats, weeklyStats, dailyStats, repoStats } =
        this.calculateDetailedStats(releases)

      // 통합 CSV 데이터 생성
      const csvSections: string[] = []

      // 1. 헤더 섹션
      csvSections.push('=== RELEASE STATISTICS SUMMARY ===')
      csvSections.push(`Total Releases,${releases.length}`)
      csvSections.push(
        `Date Range,${this.formatDateToDay(new Date(Math.min(...releases.map(r => new Date(r.publishedAt).getTime()))))} to ${this.formatDateToDay(new Date(Math.max(...releases.map(r => new Date(r.publishedAt).getTime()))))}`
      )
      csvSections.push(`Generated At,${new Date().toISOString()}`)
      csvSections.push('')

      // 2. 저장소별 통계 섹션
      csvSections.push('=== REPOSITORY STATISTICS ===')
      csvSections.push(
        'repo_name,total_releases,first_release_date,last_release_date,avg_days_between_releases,most_active_month'
      )

      Object.entries(repoStats).forEach(([repoName, count]) => {
        const repoReleases = releases
          .filter(r => r.repo === repoName)
          .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())

        const firstRelease = this.formatDateToDay(new Date(repoReleases[0].publishedAt))
        const lastRelease = this.formatDateToDay(
          new Date(repoReleases[repoReleases.length - 1].publishedAt)
        )

        let avgDays = 0
        if (repoReleases.length > 1) {
          const totalDays =
            new Date(repoReleases[repoReleases.length - 1].publishedAt).getTime() -
            new Date(repoReleases[0].publishedAt).getTime()
          avgDays = Math.round(totalDays / (1000 * 60 * 60 * 24) / (repoReleases.length - 1))
        }

        const monthCounts: Record<string, number> = {}
        repoReleases.forEach(release => {
          const month = new Date(release.publishedAt).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long'
          })
          monthCounts[month] = (monthCounts[month] || 0) + 1
        })

        const mostActiveMonth =
          Object.entries(monthCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'

        csvSections.push(
          `${repoName},${count},${firstRelease},${lastRelease},${avgDays},${mostActiveMonth}`
        )
      })
      csvSections.push('')

      // 3. 연간 통계 섹션
      csvSections.push('=== YEARLY STATISTICS ===')
      csvSections.push(
        'year,total_releases,stackflow_releases,seed_design_releases,release_percentage'
      )

      Object.entries(yearlyStats).forEach(([year, count]) => {
        const stackflowCount = releases.filter(
          r => new Date(r.publishedAt).getFullYear().toString() === year && r.repo === 'stackflow'
        ).length

        const seedDesignCount = releases.filter(
          r => new Date(r.publishedAt).getFullYear().toString() === year && r.repo === 'seed-design'
        ).length

        const percentage = ((count / releases.length) * 100).toFixed(2)
        csvSections.push(`${year},${count},${stackflowCount},${seedDesignCount},${percentage}%`)
      })
      csvSections.push('')

      // 4. 주간 통계 섹션 (상위 10개만)
      csvSections.push('=== TOP WEEKLY STATISTICS ===')
      csvSections.push('year,week,repo_name,release_count,week_total')

      const repoWeeklyStats = this.calculateRepoWeeklyStats(releases)
      const allWeeks: Array<{
        year: string
        week: string
        repo: string
        count: number
        weekTotal: number
      }> = []

      Object.entries(repoWeeklyStats).forEach(([repoName, weeklyData]) => {
        Object.entries(weeklyData).forEach(([weekStr, count]) => {
          const [year, weekPart] = weekStr.split('-W')

          // 해당 주차의 총 릴리즈 수 계산
          const weekTotal = Object.values(repoWeeklyStats).reduce((total, repoWeeks) => {
            return total + (repoWeeks[weekStr] || 0)
          }, 0)

          allWeeks.push({ year, week: weekPart, repo: repoName, count, weekTotal })
        })
      })

      // 주차별 총 릴리즈 수로 정렬하고 상위 10개만
      allWeeks
        .sort((a, b) => b.weekTotal - a.weekTotal)
        .slice(0, 10)
        .forEach(({ year, week, repo, count, weekTotal }) => {
          csvSections.push(`${year},${week.padStart(2, '0')},${repo},${count},${weekTotal}`)
        })
      csvSections.push('')

      // 5. 개별 릴리즈 상세 정보 섹션
      csvSections.push('=== DETAILED RELEASE INFORMATION ===')
      csvSections.push(
        'repo_name,tag,published_date,published_year,published_month,published_week,published_day_of_week,days_since_last_release,repo_cumulative_count'
      )

      const sortedReleases = [...releases].sort(
        (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      )

      const repoCumulativeCounts: Record<string, number> = {}

      sortedReleases.forEach((release, index) => {
        const publishedDate = new Date(release.publishedAt)
        const year = publishedDate.getFullYear()
        const month = publishedDate.getMonth() + 1
        const week = this.getISOWeek(publishedDate)
        const dayOfWeek = publishedDate.toLocaleDateString('ko-KR', { weekday: 'long' })
        const formattedDate = this.formatDateToDay(publishedDate)

        // 저장소별 누적 카운트
        repoCumulativeCounts[release.repo] = (repoCumulativeCounts[release.repo] || 0) + 1

        // 이전 릴리즈와의 날짜 차이 계산 (전체 릴리즈 기준)
        let daysSinceLastRelease = ''
        if (index > 0) {
          const prevDate = new Date(sortedReleases[index - 1].publishedAt)
          const diffTime = publishedDate.getTime() - prevDate.getTime()
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          daysSinceLastRelease = diffDays.toString()
        }

        csvSections.push(
          `${release.repo},${release.tag},${formattedDate},${year},${month.toString().padStart(2, '0')},${week},${dayOfWeek},${daysSinceLastRelease},${repoCumulativeCounts[release.repo]}`
        )
      })

      const csvContent = csvSections.join('\n')
      const filePath = path.join(process.cwd(), 'release-statistics.csv')

      await fs.writeFile(filePath, csvContent, 'utf-8')
      console.log(`Unified CSV file generated: release-statistics.csv`)

      return filePath
    } catch (error) {
      console.error('Error generating unified CSV file:', error)
      throw new Error('Failed to generate unified CSV file')
    }
  }

  async getReleaseStats() {
    try {
      if (!this.githubService) {
        // githubService가 없는 경우 기본값 반환
        return {
          totalReleases: 0,
          yearlyStats: {},
          weeklyStats: {},
          dailyStats: {},
          repoStats: {},
          latestReleases: [],
          message: 'GitHub service not available'
        }
      }

      // daangn 조직의 stackflow와 seed-design 저장소 release 정보 가져오기
      const releases: ReleaseInfo[] = await this.githubService.fetchDaangnReleases()

      if (releases.length === 0) {
        return {
          totalReleases: 0,
          yearlyStats: {},
          weeklyStats: {},
          dailyStats: {},
          repoStats: {},
          latestReleases: [],
          message: 'No releases found for the specified repositories'
        }
      }

      // 상세 통계 계산
      const { yearlyStats, weeklyStats, dailyStats, repoStats } =
        this.calculateDetailedStats(releases)

      // 최신 릴리즈 정렬
      const latestReleases = this.getLatestReleases(releases, 15)

      // 추가 메타데이터 계산
      const firstReleaseDate = releases.reduce((earliest, release) => {
        const releaseDate = new Date(release.publishedAt)
        return releaseDate < earliest ? releaseDate : earliest
      }, new Date(releases[0].publishedAt))

      const lastReleaseDate = releases.reduce((latest, release) => {
        const releaseDate = new Date(release.publishedAt)
        return releaseDate > latest ? releaseDate : latest
      }, new Date(releases[0].publishedAt))

      // 최근 30일간 릴리즈 수
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentReleases = releases.filter(
        release => new Date(release.publishedAt) >= thirtyDaysAgo
      ).length

      // 통합 CSV 파일 생성
      let csvFilePath: string | null = null
      try {
        csvFilePath = await this.generateUnifiedCSV(releases)
      } catch (csvError) {
        console.error('CSV generation failed:', csvError)
        // CSV 생성 실패는 전체 동작을 중단시키지 않음
      }

      return {
        totalReleases: releases.length,
        yearlyStats,
        weeklyStats,
        dailyStats,
        repoStats,
        latestReleases,
        metadata: {
          firstReleaseDate: this.formatDateToDay(firstReleaseDate),
          lastReleaseDate: this.formatDateToDay(lastReleaseDate),
          recentReleasesLast30Days: recentReleases,
          dataFetchedAt: new Date().toISOString(),
          csvFilePath: csvFilePath || 'CSV generation failed'
        },
        message: 'Release stats fetched and calculated successfully'
      }
    } catch (error) {
      console.error('Error fetching release stats:', error)
      return {
        totalReleases: 0,
        yearlyStats: {},
        weeklyStats: {},
        dailyStats: {},
        repoStats: {},
        latestReleases: [],
        error: 'Failed to fetch release statistics',
        message: 'Error occurred while fetching release data'
      }
    }
  }
}
