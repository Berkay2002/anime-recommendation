import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: string | ReactNode
  description?: string
  id?: string
  className?: string
  titleClassName?: string
  descriptionClassName?: string
}

export default function SectionHeader({
  title,
  description,
  id,
  className,
  titleClassName,
  descriptionClassName,
  ...props
}: SectionHeaderProps) {
  return (
    <div id={id} className={cn('space-y-1', className)} {...props}>
      <h2
        className={cn(
          'text-2xl font-semibold tracking-tight text-foreground',
          titleClassName
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'text-sm text-muted-foreground',
            descriptionClassName
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}
