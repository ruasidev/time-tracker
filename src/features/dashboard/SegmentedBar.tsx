import type { Project } from '../../app/types'

type Props = {
  projects: Project[]
  values: Record<string, number>
  total: number
  label: string

  hoveredProjectId: string | null
  onHover: (projectId: string | null, clientX: number) => void
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export default function SegmentedBar({
  projects,
  values,
  total,
  label,
  hoveredProjectId,
  onHover,
}: Props) {
  const safeTotal = total > 0 ? total : 1

  const used = projects.reduce((sum, p) => sum + (values[p.id] ?? 0), 0)
  const remainder = Math.max(0, safeTotal - used)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-200">{label}</span>
        <span className="text-xs text-zinc-500">{used.toFixed(2)}h</span>
      </div>

      <div
        className="h-3 w-full overflow-hidden rounded-full bg-zinc-800"
        onMouseLeave={() => onHover(null, 0)}
      >
        <div className="flex h-full w-full">
          {projects.map((p) => {
            const v = values[p.id] ?? 0
            const widthPct = (v / safeTotal) * 100

            const isActive = hoveredProjectId === p.id
            const isDimmed = hoveredProjectId !== null && !isActive

            // if width is basically zero, it becomes hard to hover.
            // give a tiny min width for usability *only when value > 0*.
            const effectiveWidthPct = v > 0 ? Math.max(widthPct, 1.25) : 0

            return (
              <button
                key={p.id}
                type="button"
                className={[
                  'h-full outline-none transition-opacity',
                  isDimmed ? 'opacity-30' : 'opacity-100',
                  'focus-visible:ring-2 focus-visible:ring-zinc-300/60',
                ].join(' ')}
                style={{ width: `${effectiveWidthPct}%`, background: p.color }}
                aria-label={`${label} ${p.name}: ${v.toFixed(2)} hours`}
                onMouseEnter={(e) => onHover(p.id, e.clientX)}
                onMouseMove={(e) => onHover(p.id, e.clientX)}
                onFocus={(e) => {
                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
                  onHover(p.id, clamp(rect.left + rect.width / 2, rect.left, rect.right))
                }}
                onBlur={() => onHover(null, 0)}
              />
            )
          })}

          {remainder > 0 ? (
            <div
              className={[
                'h-full bg-zinc-800 transition-opacity',
                hoveredProjectId ? 'opacity-30' : 'opacity-100',
              ].join(' ')}
              style={{ width: `${(remainder / safeTotal) * 100}%` }}
              aria-hidden="true"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}