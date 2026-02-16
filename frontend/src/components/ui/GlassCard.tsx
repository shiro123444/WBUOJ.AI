import { type ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  as?: 'div' | 'section' | 'article'
}

export function GlassCard({ children, className = '', hover = true, onClick, as: Tag = 'div' }: GlassCardProps) {
  return (
    <Tag
      className={`${hover ? 'glass-card cursor-pointer' : 'glass-card-static'} ${className}`}
      onClick={onClick}
    >
      {children}
    </Tag>
  )
}

export function GlassMeshBackground() {
  return <div className="glass-mesh-bg" aria-hidden="true" />
}

export function GlassPageWrapper({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="relative min-h-screen">
      <GlassMeshBackground />
      <div className={`relative z-10 ${className}`}>
        {children}
      </div>
    </div>
  )
}
