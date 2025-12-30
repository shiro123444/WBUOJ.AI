import { Chip, Spinner } from '@heroui/react'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline'
import type { JudgeStatus } from '../../types'

interface StatusBadgeProps {
  status: JudgeStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'dot'
}

type ChipColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'

const STATUS_CONFIG: Record<JudgeStatus, {
  label: string
  shortLabel: string
  color: ChipColor
  icon: React.ComponentType<{ className?: string }>
}> = {
  pending: {
    label: '等待中',
    shortLabel: 'Pending',
    color: 'default',
    icon: ClockIcon,
  },
  judging: {
    label: '评测中',
    shortLabel: 'Judging',
    color: 'primary',
    icon: ClockIcon,
  },
  accepted: {
    label: '通过',
    shortLabel: 'AC',
    color: 'success',
    icon: CheckCircleIcon,
  },
  wrong_answer: {
    label: '答案错误',
    shortLabel: 'WA',
    color: 'danger',
    icon: XCircleIcon,
  },
  time_limit_exceeded: {
    label: '超时',
    shortLabel: 'TLE',
    color: 'warning',
    icon: ClockIcon,
  },
  memory_limit_exceeded: {
    label: '内存超限',
    shortLabel: 'MLE',
    color: 'secondary',
    icon: CpuChipIcon,
  },
  runtime_error: {
    label: '运行错误',
    shortLabel: 'RE',
    color: 'danger',
    icon: ExclamationTriangleIcon,
  },
  compile_error: {
    label: '编译错误',
    shortLabel: 'CE',
    color: 'warning',
    icon: ExclamationTriangleIcon,
  },
}

const ICON_SIZE_CLASSES = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export function StatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true,
  variant = 'flat'
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  const isAnimating = status === 'judging' || status === 'pending'

  const startContent = showIcon ? (
    isAnimating ? (
      <Spinner size="sm" color="current" />
    ) : (
      <Icon className={ICON_SIZE_CLASSES[size]} />
    )
  ) : undefined

  return (
    <Chip
      color={config.color}
      size={size}
      variant={variant}
      startContent={startContent}
      classNames={{
        base: 'font-medium',
        content: 'flex items-center gap-1',
      }}
    >
      {config.label}
    </Chip>
  )
}

export function getStatusLabel(status: JudgeStatus): string {
  return STATUS_CONFIG[status]?.label || status
}

export function getStatusShortLabel(status: JudgeStatus): string {
  return STATUS_CONFIG[status]?.shortLabel || status
}
