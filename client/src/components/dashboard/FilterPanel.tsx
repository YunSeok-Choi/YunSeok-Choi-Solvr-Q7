import React, { useState } from 'react'
import { X, Filter, Calendar, GitBranch, Clock, Tag } from 'lucide-react'
import type { FilterPanelProps } from '../../types/dashboard'

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  availableRepos,
  isLoading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const workDayTypes = [
    { value: 'WEEKDAY', label: '평일' },
    { value: 'WEEKEND', label: '주말' },
    { value: 'HOLIDAY', label: '휴일' }
  ]

  const releaseTypes = [
    { value: 'major', label: 'Major' },
    { value: 'minor', label: 'Minor' },
    { value: 'patch', label: 'Patch' },
    { value: 'pre-release', label: 'Pre-release' }
  ]

  const timePeriods = [
    { value: 'MORNING', label: '오전 (6-12시)' },
    { value: 'AFTERNOON', label: '오후 (12-18시)' },
    { value: 'EVENING', label: '저녁 (18-24시)' },
    { value: 'NIGHT', label: '새벽 (0-6시)' }
  ]

  const handleRepoChange = (repo: string, checked: boolean) => {
    const newRepos = checked
      ? [...(filters.repos || []), repo]
      : (filters.repos || []).filter(r => r !== repo)

    onFiltersChange({ ...filters, repos: newRepos })
  }

  const handleWorkDayTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked
      ? [...(filters.work_day_types || []), type]
      : (filters.work_day_types || []).filter(t => t !== type)

    onFiltersChange({ ...filters, work_day_types: newTypes })
  }

  const handleReleaseTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked
      ? [...(filters.release_types || []), type]
      : (filters.release_types || []).filter(t => t !== type)

    onFiltersChange({ ...filters, release_types: newTypes })
  }

  const handleTimePeriodChange = (period: string, checked: boolean) => {
    const newPeriods = checked
      ? [...(filters.time_periods || []), period]
      : (filters.time_periods || []).filter(p => p !== period)

    onFiltersChange({ ...filters, time_periods: newPeriods })
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = () => {
    return !!(
      filters.repos?.length ||
      filters.date_from ||
      filters.date_to ||
      filters.work_day_types?.length ||
      filters.release_types?.length ||
      filters.time_periods?.length ||
      filters.include_prereleases !== undefined ||
      filters.include_drafts !== undefined
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 헤더 */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">필터</h3>
          {hasActiveFilters() && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              활성
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters() && (
            <button
              onClick={e => {
                e.stopPropagation()
                clearAllFilters()
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              초기화
            </button>
          )}
          <X
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-45' : ''
            }`}
          />
        </div>
      </div>

      {/* 필터 내용 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-6">
          {/* 날짜 범위 */}
          <div>
            <div className="flex items-center mb-3">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <label className="text-sm font-medium text-gray-900">날짜 범위</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">시작일</label>
                <input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={e => onFiltersChange({ ...filters, date_from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">종료일</label>
                <input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={e => onFiltersChange({ ...filters, date_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* 저장소 */}
          <div>
            <div className="flex items-center mb-3">
              <GitBranch className="h-4 w-4 text-gray-500 mr-2" />
              <label className="text-sm font-medium text-gray-900">저장소</label>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {availableRepos.map(repo => (
                <label key={repo} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={filters.repos?.includes(repo) || false}
                    onChange={e => handleRepoChange(repo, e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <span className="text-gray-700 truncate">{repo}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 요일 타입 */}
          <div>
            <div className="flex items-center mb-3">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <label className="text-sm font-medium text-gray-900">요일 타입</label>
            </div>
            <div className="space-y-2">
              {workDayTypes.map(type => (
                <label key={type.value} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={filters.work_day_types?.includes(type.value) || false}
                    onChange={e => handleWorkDayTypeChange(type.value, e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <span className="text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 릴리즈 타입 */}
          <div>
            <div className="flex items-center mb-3">
              <Tag className="h-4 w-4 text-gray-500 mr-2" />
              <label className="text-sm font-medium text-gray-900">릴리즈 타입</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {releaseTypes.map(type => (
                <label key={type.value} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={filters.release_types?.includes(type.value) || false}
                    onChange={e => handleReleaseTypeChange(type.value, e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <span className="text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 시간대 */}
          <div>
            <div className="flex items-center mb-3">
              <Clock className="h-4 w-4 text-gray-500 mr-2" />
              <label className="text-sm font-medium text-gray-900">시간대</label>
            </div>
            <div className="space-y-2">
              {timePeriods.map(period => (
                <label key={period.value} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={filters.time_periods?.includes(period.value) || false}
                    onChange={e => handleTimePeriodChange(period.value, e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <span className="text-gray-700">{period.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 추가 옵션 */}
          <div>
            <label className="text-sm font-medium text-gray-900 mb-3 block">추가 옵션</label>
            <div className="space-y-2">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={filters.include_prereleases || false}
                  onChange={e =>
                    onFiltersChange({ ...filters, include_prereleases: e.target.checked })
                  }
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <span className="text-gray-700">프리릴리즈 포함</span>
              </label>
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={filters.include_drafts || false}
                  onChange={e => onFiltersChange({ ...filters, include_drafts: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <span className="text-gray-700">드래프트 포함</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FilterPanel
