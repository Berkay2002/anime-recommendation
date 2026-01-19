interface AnimeDetailStatsProps {
  stats: Array<{
    label: string
    value: string | number
  }>
}

export default function AnimeDetailStats({ stats }: AnimeDetailStatsProps) {
  return (
    <dl className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className='rounded-2xl border border-border/50 bg-background/60 p-4'
        >
          <dt className='text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground'>
            {stat.label}
          </dt>
          <dd className='text-lg font-semibold text-foreground'>
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
