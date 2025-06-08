import { GithubService } from './githubService'
import {
  RawReleaseData,
  DashboardResponse,
  DashboardFilterOptions,
  DashboardMetric,
  DashboardAggregation,
  TimeSeriesDataPoint,
  GithubReleaseResponse
} from '../types'

export class RawDataService {
  constructor(private readonly githubService: GithubService) {}

  /**
   * 버전 문자열을 파싱하여 major, minor, patch 버전을 추출합니다
   */
  private parseVersion(tagName: string): {
    major: number | null
    minor: number | null
    patch: number | null
    type: string
  } {
    // v1.2.3, 1.2.3, v1.2.3-beta.1 등의 패턴 매칭
    const versionMatch = tagName.match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-(.+))?$/)

    if (!versionMatch) {
      return { major: null, minor: null, patch: null, type: 'unknown' }
    }

    const [, major, minor, patch, prerelease] = versionMatch
    const hasPrerelease = !!prerelease

    let type = 'patch'
    if (hasPrerelease) {
      type = 'pre-release'
    } else if (!patch) {
      type = !minor ? 'major' : 'minor'
    }

    return {
      major: parseInt(major, 10),
      minor: minor ? parseInt(minor, 10) : null,
      patch: patch ? parseInt(patch, 10) : null,
      type
    }
  }

  /**
   * 시간대를 분류합니다 (KST 기준)
   */
  private getTimePeriod(hour: number): 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' {
    if (hour >= 6 && hour < 12) return 'MORNING'
    if (hour >= 12 && hour < 18) return 'AFTERNOON'
    if (hour >= 18 && hour < 22) return 'EVENING'
    return 'NIGHT'
  }

  /**
   * ISO 주차를 계산합니다
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
   * 분기를 계산합니다
   */
  private getQuarter(month: number): number {
    return Math.ceil(month / 3)
  }

  /**
   * 두 날짜 사이의 일수를 계산합니다
   */
  private getDaysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * 요일명을 반환합니다
   */
  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayOfWeek]
  }

  /**
   * 월명을 반환합니다
   */
  private getMonthName(month: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ]
    return months[month - 1]
  }

  /**
   * GitHub API 응답을 Raw 데이터로 변환합니다
   */
  private transformToRawData(
    releases: Array<GithubReleaseResponse & { repo: string }>,
    repoOwner: string = 'daangn'
  ): RawReleaseData[] {
    // 저장소별로 정렬된 릴리즈 맵 생성
    const releasesByRepo = new Map<string, Array<GithubReleaseResponse & { repo: string }>>()

    releases.forEach(release => {
      if (!releasesByRepo.has(release.repo)) {
        releasesByRepo.set(release.repo, [])
      }
      releasesByRepo.get(release.repo)!.push(release)
    })

    // 각 저장소별로 시간순 정렬
    releasesByRepo.forEach(repoReleases => {
      repoReleases.sort(
        (a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
      )
    })

    // 날짜별 릴리즈 카운트 계산
    const releaseCountByDate = new Map<string, number>()
    const releaseCountByWeek = new Map<string, number>()
    const releaseCountByMonth = new Map<string, number>()

    releases.forEach(release => {
      const publishedDate = new Date(release.published_at)
      const dateKey = publishedDate.toISOString().split('T')[0]
      const weekKey = this.getISOWeek(publishedDate)
      const monthKey = `${publishedDate.getFullYear()}-${(publishedDate.getMonth() + 1).toString().padStart(2, '0')}`

      releaseCountByDate.set(dateKey, (releaseCountByDate.get(dateKey) || 0) + 1)
      releaseCountByWeek.set(weekKey, (releaseCountByWeek.get(weekKey) || 0) + 1)
      releaseCountByMonth.set(monthKey, (releaseCountByMonth.get(monthKey) || 0) + 1)
    })

    // Raw 데이터 변환
    return releases.map(release => {
      const publishedDate = new Date(release.published_at)
      const repoReleases = releasesByRepo.get(release.repo)!
      const releaseIndex = repoReleases.findIndex(r => r.id === release.id)

      // 버전 정보 파싱
      const versionInfo = this.parseVersion(release.tag_name)

      // 시간 관련 계산
      const publishedTimestamp = publishedDate.getTime()
      const publishedDateStr = publishedDate.toISOString().split('T')[0]
      const publishedTime = publishedDate.toTimeString().split(' ')[0]
      const publishedYear = publishedDate.getFullYear()
      const publishedMonth = publishedDate.getMonth() + 1
      const publishedDay = publishedDate.getDate()
      const publishedQuarter = this.getQuarter(publishedMonth)
      const publishedWeekNumber = Math.ceil(publishedDate.getDate() / 7)
      const publishedISOWeek = this.getISOWeek(publishedDate)
      const publishedDayOfWeek = publishedDate.getDay()
      const publishedDayName = this.getDayName(publishedDayOfWeek)
      const publishedMonthName = this.getMonthName(publishedMonth)

      // 근무일/주말 분류
      const isWeekend = publishedDayOfWeek === 0 || publishedDayOfWeek === 6
      const workDayType = isWeekend ? 'WEEKEND' : 'WEEKDAY'

      // 릴리즈 간격 계산
      const previousRelease = releaseIndex > 0 ? repoReleases[releaseIndex - 1] : null
      const nextRelease =
        releaseIndex < repoReleases.length - 1 ? repoReleases[releaseIndex + 1] : null
      const firstRelease = repoReleases[0]

      const daysSinceLastRelease = previousRelease
        ? this.getDaysBetween(new Date(previousRelease.published_at), publishedDate)
        : null
      const daysSinceFirstRelease = this.getDaysBetween(
        new Date(firstRelease.published_at),
        publishedDate
      )
      const daysUntilNextRelease = nextRelease
        ? this.getDaysBetween(publishedDate, new Date(nextRelease.published_at))
        : null

      // 컨텍스트 정보
      const dateKey = publishedDateStr
      const weekKey = publishedISOWeek
      const monthKey = `${publishedYear}-${publishedMonth.toString().padStart(2, '0')}`

      const sameDayReleases = (releaseCountByDate.get(dateKey) || 0) - 1 // 자기 자신 제외
      const sameWeekReleases = (releaseCountByWeek.get(weekKey) || 0) - 1
      const sameMonthReleases = (releaseCountByMonth.get(monthKey) || 0) - 1

      // 패턴 분석
      const hourOfDay = publishedDate.getHours()
      const timePeriod = this.getTimePeriod(hourOfDay)
      const isMonthStart = publishedDay <= 7
      const isMonthEnd = publishedDay > 23 // 대략적인 월말 기준
      const isYearStart = publishedMonth === 1
      const isYearEnd = publishedMonth === 12

      return {
        // 기본 식별 정보
        id: `${release.repo}_${release.tag_name}_${publishedTimestamp}`,
        repo_name: release.repo,
        repo_owner: repoOwner,
        tag_name: release.tag_name,
        release_name: release.name || release.tag_name,

        // 시간 관련 데이터
        published_at: release.published_at,
        published_timestamp: publishedTimestamp,
        published_date: publishedDateStr,
        published_time: publishedTime,
        published_year: publishedYear,
        published_month: publishedMonth,
        published_day: publishedDay,
        published_quarter: publishedQuarter,
        published_week_number: publishedWeekNumber,
        published_iso_week: publishedISOWeek,
        published_day_of_week: publishedDayOfWeek,
        published_day_name: publishedDayName,
        published_month_name: publishedMonthName,

        // 근무일/주말 분류
        is_weekend: isWeekend,
        is_holiday: false, // 향후 확장
        work_day_type: workDayType,

        // 릴리즈 메타데이터
        release_body: release.body || '',
        release_body_length: (release.body || '').length,
        has_release_notes: !!(release.body && release.body.trim()),
        release_type: versionInfo.type,
        version_major: versionInfo.major,
        version_minor: versionInfo.minor,
        version_patch: versionInfo.patch,
        is_prerelease: release.prerelease,
        is_draft: release.draft,

        // 시간 간격 분석용 데이터
        days_since_last_release: daysSinceLastRelease,
        days_since_first_release: daysSinceFirstRelease,
        days_until_next_release: daysUntilNextRelease,
        release_sequence_number: releaseIndex + 1,
        total_releases_in_repo: repoReleases.length,

        // 컨텍스트 정보
        same_day_releases: sameDayReleases,
        same_week_releases: sameWeekReleases,
        same_month_releases: sameMonthReleases,

        // 패턴 분석용
        hour_of_day: hourOfDay,
        time_period: timePeriod,
        is_month_start: isMonthStart,
        is_month_end: isMonthEnd,
        is_year_start: isYearStart,
        is_year_end: isYearEnd,

        // 집계용 키들
        date_key: dateKey.replace(/-/g, ''),
        week_key: weekKey,
        month_key: monthKey,
        quarter_key: `${publishedYear}-Q${publishedQuarter}`,
        year_key: publishedYear.toString()
      } as RawReleaseData
    })
  }

  /**
   * 필터를 적용하여 데이터를 필터링합니다
   */
  private applyFilters(data: RawReleaseData[], filters: DashboardFilterOptions): RawReleaseData[] {
    return data.filter(item => {
      // 저장소 필터
      if (filters.repo_names && filters.repo_names.length > 0) {
        if (!filters.repo_names.includes(item.repo_name)) return false
      }

      // 날짜 범위 필터
      if (filters.date_from) {
        if (item.published_date < filters.date_from) return false
      }
      if (filters.date_to) {
        if (item.published_date > filters.date_to) return false
      }

      // 근무일 타입 필터
      if (filters.work_day_types && filters.work_day_types.length > 0) {
        if (!filters.work_day_types.includes(item.work_day_type)) return false
      }

      // 릴리즈 타입 필터
      if (filters.release_types && filters.release_types.length > 0) {
        if (!filters.release_types.includes(item.release_type)) return false
      }

      // 시간대 필터
      if (filters.time_periods && filters.time_periods.length > 0) {
        if (!filters.time_periods.includes(item.time_period)) return false
      }

      // 사전 릴리즈 필터
      if (filters.include_prereleases === false && item.is_prerelease) return false

      // 드래프트 필터
      if (filters.include_drafts === false && item.is_draft) return false

      // 릴리즈 간격 필터
      if (filters.min_days_between_releases && item.days_since_last_release !== null) {
        if (item.days_since_last_release < filters.min_days_between_releases) return false
      }
      if (filters.max_days_between_releases && item.days_since_last_release !== null) {
        if (item.days_since_last_release > filters.max_days_between_releases) return false
      }

      return true
    })
  }

  /**
   * 집계 데이터를 생성합니다
   */
  private generateAggregations(data: RawReleaseData[]) {
    const totalCount = data.length

    // 저장소별 집계
    const byRepo = this.aggregateBy(data, 'repo_name', totalCount)

    // 날짜별 집계
    const byDate = this.aggregateBy(data, 'published_date', totalCount)

    // 요일별 집계
    const byDayOfWeek = this.aggregateBy(data, 'published_day_name', totalCount)

    // 월별 집계
    const byMonth = this.aggregateBy(data, 'month_key', totalCount)

    // 분기별 집계
    const byQuarter = this.aggregateBy(data, 'quarter_key', totalCount)

    // 시간대별 집계
    const byTimePeriod = this.aggregateBy(data, 'time_period', totalCount)

    // 릴리즈 타입별 집계
    const byReleaseType = this.aggregateBy(data, 'release_type', totalCount)

    return {
      by_repo: byRepo,
      by_date: byDate,
      by_day_of_week: byDayOfWeek,
      by_month: byMonth,
      by_quarter: byQuarter,
      by_time_period: byTimePeriod,
      by_release_type: byReleaseType
    }
  }

  /**
   * 특정 키로 데이터를 집계합니다
   */
  private aggregateBy(
    data: RawReleaseData[],
    key: keyof RawReleaseData,
    totalCount: number
  ): DashboardAggregation[] {
    const counts = new Map<string, number>()

    data.forEach(item => {
      const value = String(item[key])
      counts.set(value, (counts.get(value) || 0) + 1)
    })

    return Array.from(counts.entries())
      .map(([k, value]) => ({
        key: k,
        value,
        percentage: totalCount > 0 ? (value / totalCount) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value)
  }

  /**
   * 시계열 데이터를 생성합니다
   */
  private generateTimeSeries(data: RawReleaseData[]): TimeSeriesDataPoint[] {
    const dailyCounts = new Map<string, number>()

    data.forEach(item => {
      const date = item.published_date
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1)
    })

    const sortedDates = Array.from(dailyCounts.keys()).sort()
    let cumulativeValue = 0

    return sortedDates.map(date => {
      const value = dailyCounts.get(date) || 0
      cumulativeValue += value

      return {
        timestamp: new Date(date).getTime(),
        date,
        value,
        cumulative_value: cumulativeValue
      }
    })
  }

  /**
   * 주요 메트릭을 계산합니다
   */
  private calculateMetrics(data: RawReleaseData[]): DashboardMetric[] {
    if (!data || data.length === 0) {
      return [
        {
          name: 'Total Releases',
          description: '전체 릴리즈 수',
          value: 0,
          unit: '개',
          format: 'number'
        },
        {
          name: 'Active Repositories',
          description: '활성 저장소 수',
          value: 0,
          unit: '개',
          format: 'number'
        },
        {
          name: 'Weekday Release Rate',
          description: '평일 릴리즈 비율',
          value: 0,
          unit: '%',
          format: 'percentage'
        },
        {
          name: 'Pre-release Rate',
          description: '사전 릴리즈 비율',
          value: 0,
          unit: '%',
          format: 'percentage'
        },
        {
          name: 'Average Release Interval',
          description: '평균 릴리즈 간격',
          value: 0,
          unit: '일',
          format: 'duration'
        },
        {
          name: 'Days Since Latest Release',
          description: '최근 릴리즈로부터 경과일',
          value: 0,
          unit: '일',
          format: 'duration'
        }
      ]
    }

    const totalReleases = data.length
    const uniqueRepos = new Set(data.map(d => d.repo_name)).size
    const weekdayReleases = data.filter(d => d.work_day_type === 'WEEKDAY').length
    const weekendReleases = data.filter(d => d.work_day_type === 'WEEKEND').length
    const preReleases = data.filter(d => d.is_prerelease).length

    // 평균 릴리즈 간격 계산
    const releaseIntervals = data
      .filter(d => d.days_since_last_release !== null)
      .map(d => d.days_since_last_release!)
    const avgReleaseInterval =
      releaseIntervals.length > 0
        ? releaseIntervals.reduce((sum, days) => sum + days, 0) / releaseIntervals.length
        : 0

    // 최근 릴리즈 날짜
    const latestRelease = data.reduce((latest, current) =>
      new Date(current.published_at) > new Date(latest.published_at) ? current : latest
    )
    const daysSinceLatest = Math.floor(
      (Date.now() - new Date(latestRelease.published_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    return [
      {
        name: 'Total Releases',
        description: '전체 릴리즈 수',
        value: totalReleases,
        unit: '개',
        format: 'number'
      },
      {
        name: 'Active Repositories',
        description: '활성 저장소 수',
        value: uniqueRepos,
        unit: '개',
        format: 'number'
      },
      {
        name: 'Weekday Release Rate',
        description: '평일 릴리즈 비율',
        value: totalReleases > 0 ? (weekdayReleases / totalReleases) * 100 : 0,
        unit: '%',
        format: 'percentage'
      },
      {
        name: 'Pre-release Rate',
        description: '사전 릴리즈 비율',
        value: totalReleases > 0 ? (preReleases / totalReleases) * 100 : 0,
        unit: '%',
        format: 'percentage'
      },
      {
        name: 'Average Release Interval',
        description: '평균 릴리즈 간격',
        value: Math.round(avgReleaseInterval),
        unit: '일',
        format: 'duration'
      },
      {
        name: 'Days Since Latest Release',
        description: '최근 릴리즈로부터 경과일',
        value: daysSinceLatest,
        unit: '일',
        format: 'duration'
      }
    ]
  }

  /**
   * daangn 조직의 raw 데이터를 가져와서 대시보드 응답을 생성합니다
   */
  async getDashboardData(filters: DashboardFilterOptions = {}): Promise<DashboardResponse> {
    try {
      console.log('🚀 Starting dashboard data generation...')

      // GitHub에서 확장된 원본 데이터 가져오기 대신 목업 데이터 사용
      const enhancedReleases = this.getMockData()
      console.log(`📦 Mock data generated: ${enhancedReleases.length} releases`)

      // Raw 데이터로 변환
      let rawData: RawReleaseData[] = []
      try {
        rawData = this.transformToRawData(enhancedReleases)
        console.log(`🔄 Raw data transformed: ${rawData.length} items`)
      } catch (transformError) {
        console.error('❌ Transform error:', transformError)
        rawData = []
      }

      // 필터 적용
      let filteredData: RawReleaseData[] = []
      try {
        filteredData = this.applyFilters(rawData, filters)
        console.log(`🔍 Filters applied: ${filteredData.length} items remaining`)
      } catch (filterError) {
        console.error('❌ Filter error:', filterError)
        filteredData = rawData
      }

      // 집계 데이터 생성
      let aggregations: any = {}
      try {
        aggregations = this.generateAggregations(filteredData)
        console.log('📊 Aggregations generated')
      } catch (aggError) {
        console.error('❌ Aggregation error:', aggError)
        aggregations = {
          by_repo: [],
          by_date: [],
          by_day_of_week: [],
          by_month: [],
          by_quarter: [],
          by_time_period: [],
          by_release_type: []
        }
      }

      // 시계열 데이터 생성
      let timeSeries: TimeSeriesDataPoint[] = []
      try {
        timeSeries = this.generateTimeSeries(filteredData)
        console.log(`📈 Time series generated: ${timeSeries.length} points`)
      } catch (timeError) {
        console.error('❌ Time series error:', timeError)
        timeSeries = []
      }

      // 메트릭 계산
      let summaryMetrics: DashboardMetric[] = []
      try {
        summaryMetrics = this.calculateMetrics(filteredData)
        console.log(`📋 Metrics calculated: ${summaryMetrics.length} metrics`)
      } catch (metricError) {
        console.error('❌ Metrics error:', metricError)
        summaryMetrics = []
      }

      // 데이터 신선도 정보
      const sortedByDate = [...filteredData].sort(
        (a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
      )
      const earliestRelease = sortedByDate[0]?.published_date || ''
      const latestRelease = sortedByDate[sortedByDate.length - 1]?.published_date || ''

      // pagination_info 추가
      const paginationInfo = {
        total_records: filteredData.length,
        page: 1,
        limit: filteredData.length,
        total_pages: 1
      }

      const response: DashboardResponse = {
        summary_metrics: summaryMetrics,
        raw_data: filteredData,
        time_series: timeSeries,
        aggregations,
        filters_applied: filters,
        data_freshness: {
          last_updated: new Date().toISOString(),
          data_range: {
            earliest_release: earliestRelease,
            latest_release: latestRelease
          }
        },
        pagination_info: paginationInfo
      }

      console.log('✅ Dashboard response created successfully')
      return response
    } catch (error) {
      console.error('❌ Dashboard data generation failed:', error)
      // 최소한의 응답 반환
      return {
        summary_metrics: [],
        raw_data: [],
        time_series: [],
        aggregations: {
          by_repo: [],
          by_date: [],
          by_day_of_week: [],
          by_month: [],
          by_quarter: [],
          by_time_period: [],
          by_release_type: []
        },
        filters_applied: filters,
        data_freshness: {
          last_updated: new Date().toISOString(),
          data_range: {
            earliest_release: '',
            latest_release: ''
          }
        },
        pagination_info: {
          total_records: 0,
          page: 1,
          limit: 0,
          total_pages: 0
        }
      }
    }
  }

  /**
   * 목업 데이터를 생성합니다 (테스트 및 개발용)
   */
  private getMockData(): Array<GithubReleaseResponse & { repo: string }> {
    const now = new Date()
    const mockReleases: Array<GithubReleaseResponse & { repo: string }> = []

    // stackflow 저장소 목업 데이터
    for (let i = 0; i < 15; i++) {
      const daysAgo = i * 7 + Math.floor(Math.random() * 7)
      const releaseDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

      mockReleases.push({
        id: 1000000 + i,
        tag_name: `v1.${15 - i}.${Math.floor(Math.random() * 10)}`,
        name: `Release v1.${15 - i}.${Math.floor(Math.random() * 10)}`,
        body: `Release notes for version 1.${15 - i}`,
        published_at: releaseDate.toISOString(),
        created_at: releaseDate.toISOString(),
        draft: false,
        prerelease: Math.random() > 0.8,
        html_url: `https://github.com/daangn/stackflow/releases/tag/v1.${15 - i}.${Math.floor(Math.random() * 10)}`,
        tarball_url: '',
        zipball_url: '',
        author: {
          login: 'developer',
          id: 12345,
          avatar_url: '',
          html_url: 'https://github.com/developer'
        },
        assets: [],
        repo: 'stackflow'
      })
    }

    // seed-design 저장소 목업 데이터
    for (let i = 0; i < 20; i++) {
      const daysAgo = i * 5 + Math.floor(Math.random() * 5)
      const releaseDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

      mockReleases.push({
        id: 2000000 + i,
        tag_name: `v2.${20 - i}.${Math.floor(Math.random() * 10)}`,
        name: `Design System v2.${20 - i}.${Math.floor(Math.random() * 10)}`,
        body: `Design system release notes for version 2.${20 - i}`,
        published_at: releaseDate.toISOString(),
        created_at: releaseDate.toISOString(),
        draft: false,
        prerelease: Math.random() > 0.9,
        html_url: `https://github.com/daangn/seed-design/releases/tag/v2.${20 - i}.${Math.floor(Math.random() * 10)}`,
        tarball_url: '',
        zipball_url: '',
        author: {
          login: 'designer',
          id: 67890,
          avatar_url: '',
          html_url: 'https://github.com/designer'
        },
        assets: [],
        repo: 'seed-design'
      })
    }

    return mockReleases.sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    )
  }
}
