import { User, NewUser, UpdateUser } from '../db/schema'

// 사용자 관련 타입
export { User, NewUser, UpdateUser }

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 페이지네이션 응답 타입
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  limit: number
  totalPages: number
}

// 사용자 역할 타입
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}

// 사용자 생성 DTO
export interface CreateUserDto {
  name: string
  email: string
  role?: UserRole
}

// 사용자 수정 DTO
export interface UpdateUserDto {
  name?: string
  email?: string
  role?: UserRole
}

// GitHub Release 관련 타입
export interface ReleaseInfo {
  readonly repo: string
  readonly tag: string
  readonly publishedAt: string
}

// GitHub API Release 응답 타입
export interface GithubReleaseResponse {
  readonly id: number
  readonly tag_name: string
  readonly name: string
  readonly body: string
  readonly published_at: string
  readonly created_at: string
  readonly draft: boolean
  readonly prerelease: boolean
  readonly html_url: string
  readonly author: {
    readonly login: string
    readonly id: number
    readonly avatar_url: string
  }
  readonly assets: Array<{
    readonly id: number
    readonly name: string
    readonly size: number
    readonly download_count: number
  }>
}

// =================================================================
// RAW DATA DASHBOARD를 위한 확장된 데이터 타입들
// =================================================================

/**
 * 대시보드용 원시 릴리즈 데이터 - 모든 분석 가능한 필드 포함
 */
export interface RawReleaseData {
  // 기본 식별 정보
  readonly id: string // 고유 ID (repo_tag_timestamp 조합)
  readonly repo_name: string // 저장소 이름
  readonly repo_owner: string // 저장소 소유자 (daangn)
  readonly tag_name: string // 릴리즈 태그 (v1.0.0)
  readonly release_name: string // 릴리즈 이름/제목

  // 시간 관련 데이터
  readonly published_at: string // 원본 발행일시 (ISO string)
  readonly published_timestamp: number // Unix timestamp
  readonly published_date: string // YYYY-MM-DD 형식
  readonly published_time: string // HH:MM:SS 형식
  readonly published_year: number // 연도
  readonly published_month: number // 월 (1-12)
  readonly published_day: number // 일 (1-31)
  readonly published_quarter: number // 분기 (1-4)
  readonly published_week_number: number // 연중 주차 (1-53)
  readonly published_iso_week: string // ISO 주차 (YYYY-WW)
  readonly published_day_of_week: number // 요일 (0=일요일, 6=토요일)
  readonly published_day_name: string // 요일명 (Monday, Tuesday, ...)
  readonly published_month_name: string // 월명 (January, February, ...)

  // 근무일/주말 분류
  readonly is_weekend: boolean // 주말 릴리즈 여부
  readonly is_holiday: boolean // 공휴일 릴리즈 여부 (향후 확장)
  readonly work_day_type: 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY' // 근무일 타입

  // 릴리즈 메타데이터
  readonly release_body: string // 릴리즈 노트 내용
  readonly release_body_length: number // 릴리즈 노트 길이
  readonly has_release_notes: boolean // 릴리즈 노트 존재 여부
  readonly release_type: string // 릴리즈 타입 (major, minor, patch, pre-release)
  readonly version_major: number | null // 메이저 버전 번호
  readonly version_minor: number | null // 마이너 버전 번호
  readonly version_patch: number | null // 패치 버전 번호
  readonly is_prerelease: boolean // 사전 릴리즈 여부
  readonly is_draft: boolean // 드래프트 여부

  // 시간 간격 분석용 데이터
  readonly days_since_last_release: number | null // 이전 릴리즈로부터 경과일
  readonly days_since_first_release: number // 첫 릴리즈로부터 경과일
  readonly days_until_next_release: number | null // 다음 릴리즈까지 일수
  readonly release_sequence_number: number // 저장소 내 릴리즈 순번
  readonly total_releases_in_repo: number // 저장소 총 릴리즈 수

  // 컨텍스트 정보
  readonly same_day_releases: number // 같은 날 다른 저장소 릴리즈 수
  readonly same_week_releases: number // 같은 주 다른 저장소 릴리즈 수
  readonly same_month_releases: number // 같은 달 다른 저장소 릴리즈 수

  // 패턴 분석용
  readonly hour_of_day: number // 시간 (0-23)
  readonly time_period: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' // 시간대 구분
  readonly is_month_start: boolean // 월초 릴리즈 여부 (1-7일)
  readonly is_month_end: boolean // 월말 릴리즈 여부 (마지막 7일)
  readonly is_year_start: boolean // 연초 릴리즈 여부 (1월)
  readonly is_year_end: boolean // 연말 릴리즈 여부 (12월)

  // 집계용 키들
  readonly date_key: string // YYYYMMDD 형식 키
  readonly week_key: string // YYYY-WW 형식 키
  readonly month_key: string // YYYY-MM 형식 키
  readonly quarter_key: string // YYYY-Q# 형식 키
  readonly year_key: string // YYYY 형식 키
}

/**
 * 대시보드 필터링을 위한 옵션들
 */
export interface DashboardFilterOptions {
  repo_names?: string[] // 저장소 필터
  date_from?: string // 시작일 (YYYY-MM-DD)
  date_to?: string // 종료일 (YYYY-MM-DD)
  work_day_types?: ('WEEKDAY' | 'WEEKEND' | 'HOLIDAY')[] // 근무일 타입 필터
  release_types?: string[] // 릴리즈 타입 필터
  time_periods?: ('MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT')[] // 시간대 필터
  include_prereleases?: boolean // 사전 릴리즈 포함 여부
  include_drafts?: boolean // 드래프트 포함 여부
  min_days_between_releases?: number // 최소 릴리즈 간격 필터
  max_days_between_releases?: number // 최대 릴리즈 간격 필터
}

/**
 * 대시보드 집계 데이터 타입들
 */
export interface DashboardAggregation {
  key: string // 집계 키 (날짜, 저장소명 등)
  value: number // 집계 값
  percentage: number // 전체 대비 비율
  metadata?: Record<string, any> // 추가 메타데이터
}

/**
 * 시계열 데이터 포인트
 */
export interface TimeSeriesDataPoint {
  timestamp: number // Unix timestamp
  date: string // YYYY-MM-DD 형식
  value: number // 측정값
  cumulative_value?: number // 누적값
  moving_average?: number // 이동평균
  trend?: 'UP' | 'DOWN' | 'STABLE' // 트렌드 방향
}

/**
 * 대시보드 메트릭 정의
 */
export interface DashboardMetric {
  name: string // 메트릭 이름
  description: string // 메트릭 설명
  value: number // 현재 값
  previous_value?: number // 이전 값 (비교용)
  change_percentage?: number // 변화율
  trend?: 'UP' | 'DOWN' | 'STABLE' // 트렌드
  unit?: string // 단위 (개, %, 일 등)
  format?: 'number' | 'percentage' | 'duration' | 'date' // 표시 형식
}

/**
 * 대시보드 전체 응답 데이터
 */
export interface DashboardResponse {
  summary_metrics: DashboardMetric[] // 주요 지표들
  raw_data: RawReleaseData[] // 원시 데이터
  time_series: TimeSeriesDataPoint[] // 시계열 데이터
  aggregations: {
    by_repo: DashboardAggregation[] // 저장소별 집계
    by_date: DashboardAggregation[] // 날짜별 집계
    by_day_of_week: DashboardAggregation[] // 요일별 집계
    by_month: DashboardAggregation[] // 월별 집계
    by_quarter: DashboardAggregation[] // 분기별 집계
    by_time_period: DashboardAggregation[] // 시간대별 집계
    by_release_type: DashboardAggregation[] // 릴리즈 타입별 집계
  }
  filters_applied: DashboardFilterOptions // 적용된 필터
  data_freshness: {
    last_updated: string // 마지막 업데이트 시간
    data_range: {
      earliest_release: string // 가장 오래된 릴리즈
      latest_release: string // 가장 최근 릴리즈
    }
  }
}
