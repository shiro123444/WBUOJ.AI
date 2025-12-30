import { useState, useCallback } from 'react'
import { Input } from '@heroui/react'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

export interface ValidationRule {
  validate: (value: string) => boolean
  message: string
}

export interface FormInputProps {
  name: string
  label: string
  value: string
  onChange: (name: string, value: string) => void
  validationRules?: ValidationRule[]
  validateOnBlur?: boolean
  validateOnChange?: boolean
  showSuccessState?: boolean
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  isRequired?: boolean
  isDisabled?: boolean
  className?: string
  description?: string
  autoComplete?: string
}

/**
 * FormInput - A form input component with real-time validation
 * 
 * Features:
 * - Real-time validation with customizable rules
 * - Visual feedback (success/error states)
 * - Accessible error messages
 * - Integration with Hero UI Input
 * 
 * @example
 * ```tsx
 * <FormInput
 *   name="email"
 *   label="邮箱"
 *   value={email}
 *   onChange={(name, value) => setEmail(value)}
 *   validationRules={[
 *     { validate: (v) => v.length > 0, message: '邮箱不能为空' },
 *     { validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: '请输入有效的邮箱地址' },
 *   ]}
 * />
 * ```
 */
export function FormInput({
  name,
  label,
  value,
  onChange,
  validationRules = [],
  validateOnBlur = true,
  validateOnChange = false,
  showSuccessState = true,
  type = 'text',
  placeholder,
  isRequired = false,
  isDisabled = false,
  className = '',
  description,
  autoComplete,
}: FormInputProps) {
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validate = useCallback((val: string): string | null => {
    for (const rule of validationRules) {
      if (!rule.validate(val)) {
        return rule.message
      }
    }
    return null
  }, [validationRules])

  const handleChange = (newValue: string) => {
    onChange(name, newValue)
    if (validateOnChange && touched) {
      setError(validate(newValue))
    }
  }

  const handleBlur = () => {
    setTouched(true)
    if (validateOnBlur) {
      setError(validate(value))
    }
  }

  const isValid = touched && !error && value.length > 0
  const isInvalid = touched && !!error

  const getColor = () => {
    if (isInvalid) return 'danger' as const
    if (isValid && showSuccessState) return 'success' as const
    return 'default' as const
  }

  return (
    <Input
      label={label}
      value={value}
      onValueChange={handleChange}
      onBlur={handleBlur}
      isInvalid={isInvalid}
      errorMessage={error || undefined}
      color={getColor()}
      type={type}
      placeholder={placeholder}
      isRequired={isRequired}
      isDisabled={isDisabled}
      className={className}
      description={description}
      autoComplete={autoComplete}
      endContent={
        isValid && showSuccessState ? (
          <CheckCircleIcon className="w-5 h-5 text-success" />
        ) : isInvalid ? (
          <ExclamationCircleIcon className="w-5 h-5 text-danger" />
        ) : null
      }
    />
  )
}

// Common validation rules
export const validationRules = {
  required: (message = '此字段为必填项'): ValidationRule => ({
    validate: (value) => value.trim().length > 0,
    message,
  }),
  
  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => value.length >= min,
    message: message || `至少需要 ${min} 个字符`,
  }),
  
  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => value.length <= max,
    message: message || `最多 ${max} 个字符`,
  }),
  
  email: (message = '请输入有效的邮箱地址'): ValidationRule => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),
  
  username: (message = '用户名只能包含字母、数字和下划线，长度3-20'): ValidationRule => ({
    validate: (value) => /^[a-zA-Z0-9_]{3,20}$/.test(value),
    message,
  }),
  
  password: (message = '密码至少8位，包含大小写字母和数字'): ValidationRule => ({
    validate: (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value),
    message,
  }),
  
  match: (matchValue: string, message = '两次输入不一致'): ValidationRule => ({
    validate: (value) => value === matchValue,
    message,
  }),
}

export default FormInput
