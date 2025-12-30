import { useState } from 'react'
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { Difficulty } from '../../types'

interface ProblemFilterProps {
  selectedDifficulty: Difficulty | undefined
  selectedTags: string[]
  availableTags: string[]
  onDifficultyChange: (difficulty: Difficulty | undefined) => void
  onTagsChange: (tags: string[]) => void
  onReset: () => void
}

const difficulties: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
]

export function ProblemFilter({
  selectedDifficulty,
  selectedTags,
  availableTags,
  onDifficultyChange,
  onTagsChange,
  onReset,
}: ProblemFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasActiveFilters = selectedDifficulty || selectedTags.length > 0

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <FunnelIcon className="h-5 w-5" />
          <span className="font-medium">筛选</span>
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
              {(selectedDifficulty ? 1 : 0) + selectedTags.length}
            </span>
          )}
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-4 w-4" />
            清除筛选
          </button>
        )}
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Difficulty Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              难度
            </h4>
            <div className="flex flex-wrap gap-2">
              {difficulties.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onDifficultyChange(selectedDifficulty === value ? undefined : value)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedDifficulty === value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                标签
              </h4>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display (when collapsed) */}
      {!isExpanded && hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedDifficulty && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
              {difficulties.find(d => d.value === selectedDifficulty)?.label}
              <button
                onClick={() => onDifficultyChange(undefined)}
                className="hover:text-blue-600"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedTags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
            >
              {tag}
              <button
                onClick={() => handleTagToggle(tag)}
                className="hover:text-blue-600"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
