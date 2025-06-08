// API Response Types
export interface DashboardMetric {
  name: string
  description: string
  value: number | string
  unit: string
  format: 'number' | 'percentage' | 'duration' | 'ratio'
  change?: {
    value: number
    period: string
    trend: 'up' | 'down' | 'stable'
  }
}

export interface DashboardAggregation {
  key: string
  value: number
  percentage: number
}

export interface TimeSeriesDataPoint {
  date: string
  timestamp: number
  value: number
  cumulative_value: number
}

export interface RawReleaseData {
  id: string
  repo_name: string
  tag_name: string
  release_name: string
  published_at: string
  published_date: string
  published_year: number
  published_month: number
  published_day: number
  published_quarter: number
  published_day_of_week: number
  published_day_name: string
  published_month_name: string
  is_weekend: boolean
  work_day_type: 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY'
  release_type: string
  version_major: number | null
  version_minor: number | null
  version_patch: number | null
  is_prerelease: boolean
  time_period: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'
  hour_of_day: number
  days_since_last_release: number | null
  release_sequence_number: number
}

export interface DashboardData {
  raw_data: RawReleaseData[]
  summary_metrics: DashboardMetric[]
  aggregations: {
    by_repo: DashboardAggregation[]
    by_date: DashboardAggregation[]
    by_day_of_week: DashboardAggregation[]
    by_month: DashboardAggregation[]
    by_quarter: DashboardAggregation[]
    by_time_period: DashboardAggregation[]
    by_release_type: DashboardAggregation[]
  }
  time_series: TimeSeriesDataPoint[]
  data_freshness: {
    last_updated: string
    data_range: {
      earliest_release: string
      latest_release: string
    }
  }
  filters_applied: Record<string, any>
  pagination_info: {
    total_records: number
    page: number
    limit: number
    total_pages: number
  }
}

// Chart Configuration Types
export interface ChartConfig {
  id: string
  title: string
  description: string
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'metric-card'
  dataKey: keyof DashboardData
  xAxis?: string
  yAxis?: string
  colors?: string[]
  size: 'sm' | 'md' | 'lg' | 'xl'
  refreshInterval?: number
}

// Filter Types
export interface DashboardFilters {
  repos?: string[]
  date_from?: string
  date_to?: string
  work_day_types?: string[]
  release_types?: string[]
  time_periods?: string[]
  include_prereleases?: boolean
  include_drafts?: boolean
}

// Component Props Types
export interface DashboardLayoutProps {
  children: React.ReactNode
  isLoading?: boolean
  error?: string | null
}

export interface ChartCardProps {
  config: ChartConfig
  data: any
  isLoading?: boolean
  error?: string | null
  className?: string
}

export interface MetricCardProps {
  metric: DashboardMetric
  className?: string
}

export interface FilterPanelProps {
  filters: DashboardFilters
  onFiltersChange: (filters: DashboardFilters) => void
  availableRepos: string[]
  isLoading?: boolean
}
