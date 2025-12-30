import { useMemo } from 'react'
import { Progress } from '@heroui/react'

interface PasswordStrengthProps {
  password: string
  showLabel?: boolean
  className?: string
}

interface StrengthResult {
  score: number // 0-4
  label: string
  color: 'danger' | 'warning' | 'primary' | 'success'
  feedback: string[]
}

/**
 * Evaluates password strength
 * Returns a score from 0-4 and feedback
 */
function evaluatePassword(password: string): StrengthResult {
  const feedback: string[] = []
  let score = 0

  if (password.length === 0) {
    return { score: 0, label: '', color: 'danger', feedback: [] }
  }

  // Length checks
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('至少8个字符')
  }

  if (password.length >= 12) {
    score += 1
  }

  // Character type checks
  if (/[a-z]/.test(password)) {
    score += 0.5
  } else {
    feedback.push('添加小写字母')
  }

  if (/[A-Z]/.test(password)) {
    score += 0.5
  } else {
    feedback.push('添加大写字母')
  }

  if (/\d/.test(password)) {
    score += 0.5
  } else {
    feedback.push('添加数字')
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 0.5
  } else {
    feedback.push('添加特殊字符')
  }

  // Normalize score to 0-4
  score = Math.min(Math.round(score), 4)

  // Determine label and color
  const labels: Record<number, { label: string; color: StrengthResult['color'] }> = {
    0: { label: '非常弱', color: 'danger' },
    1: { label: '弱', color: 'danger' },
    2: { label: '一般', color: 'warning' },
    3: { label: '强', color: 'primary' },
    4: { label: '非常强', color: 'success' },
  }

  return {
    score,
    label: labels[score].label,
    color: labels[score].color,
    feedback,
  }
}

/**
 * PasswordStrength - Visual password strength indicator
 * 
 * Shows a progress bar and feedback for password strength.
 * 
 * @example
 * ```tsx
 * <PasswordStrength password={password} showLabel />
 * ```
 */
export function PasswordStrength({
  password,
  showLabel = true,
  className = '',
}: PasswordStrengthProps) {
  const strength = useMemo(() => evaluatePassword(password), [password])

  if (password.length === 0) {
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Progress
          size="sm"
          value={(strength.score / 4) * 100}
          color={strength.color}
          className="flex-1"
          aria-label="密码强度"
        />
        {showLabel && (
          <span className={`ml-3 text-sm font-medium text-${strength.color}`}>
            {strength.label}
          </span>
        )}
      </div>
      
      {strength.feedback.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {strength.feedback.map((tip, index) => (
            <span
              key={index}
              className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
            >
              {tip}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default PasswordStrength
