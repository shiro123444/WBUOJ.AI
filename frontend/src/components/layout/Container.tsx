import type { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: boolean
}

const sizeClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
}

/**
 * Container - A responsive container component
 * 
 * Provides consistent max-width and padding across the app.
 * Automatically adjusts padding for different screen sizes.
 * 
 * @example
 * ```tsx
 * <Container size="xl">
 *   <h1>Page Content</h1>
 * </Container>
 * ```
 */
export function Container({
  children,
  className = '',
  size = 'xl',
  padding = true,
}: ContainerProps) {
  return (
    <div
      className={`
        mx-auto w-full
        ${sizeClasses[size]}
        ${padding ? 'px-4 sm:px-6 lg:px-8' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

/**
 * PageContainer - A full-page container with vertical padding
 * 
 * Use this for main page content areas.
 */
export function PageContainer({
  children,
  className = '',
  size = 'xl',
}: Omit<ContainerProps, 'padding'>) {
  return (
    <Container size={size} className={`py-6 sm:py-8 lg:py-12 ${className}`}>
      {children}
    </Container>
  )
}

export default Container
