import { Chip } from '@heroui/react'
import type { Difficulty } from '../../types'

interface DifficultyBadgeProps {
  difficulty: Difficulty
  size?: 'sm' | 'md' | 'lg'
  variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'dot'
}

const difficultyConfig: Record<Difficulty, { 
  label: string
  color: 'success' | 'warning' | 'danger'
}> = {
  easy: {
    label: '简单',
    color: 'success',
  },
  medium: {
    label: '中等',
    color: 'warning',
  },
  hard: {
    label: '困难',
    color: 'danger',
  },
}

export function DifficultyBadge({ 
  difficulty, 
  size = 'md',
  variant = 'flat'
}: DifficultyBadgeProps) {
  const config = difficultyConfig[difficulty]

  return (
    <Chip
      color={config.color}
      size={size}
      variant={variant}
      classNames={{
        base: 'font-medium',
      }}
    >
      {config.label}
    </Chip>
  )
}
