import { useMemo, useRef, useState } from 'react'
import type { Project, WorkDay } from '../../app/types'
import SegmentedBar from './SegmentedBar'
import { actualsByProjectForWeek, targetsByProject, weekIsoDates, dayTotalHours } from '../../app/selectors'

type Props = {
  weeklyBudgetHours: number
  projects: Project[]
  workDays: WorkDay[]
  weekStart: Date
  selectedDate: string
  onSelectDate: (iso: string) => void
}

type Hover = {
  projectId: string
  clientX: number
} | null

type Tone = 'good' | 'warn' | 'bad'

function fmt(n: number): string {
  const x = Math.round(n * 4) / 4
  return `${x.toFixed(2)}h`
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function deltaTone(delta: number, withinRange: boolean): Tone {
  if (!withinRange) return 'bad'
  if (Math.abs(delta) <= 1) return 'good'
  return 'warn'
}

function toneClasses(t: Tone): string {
  return t === 'good'
    ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200'
    : t === 'warn'
    ? 'border-amber-500/30 bg-amber-500/15 text-amber-200'
    : 'border-red-500/30 bg-red-500/15 text-red-200'
}

function barClasses(t: Tone): string {
  return t === 'good' ? 'bg-emerald-400' : t === 'warn' ? 'bg-amber-400' : 'bg-red-400'
}

export default function WeekOverview({
  weeklyBudgetHours,
  projects,
  workDays,
  weekStart,
  selectedDate,
  onSelectDate,
}: Props) {
  const actuals = actualsByProjectForWeek(projects, workDays, weekStart)
  const targets = targetsByProject(projects)

  const days = useMemo(() => {
    return weekIsoDates(weekStart).map((iso) => {
      const day = workDays.find((d) => d.date === iso) ?? null
      return { iso, total: dayTotalHours(day) }
    })
  }, [weekStart, workDays])

  const budgetUsed = useMemo(() => {
    return projects.reduce((sum, p) => sum + (actuals[p.id] ?? 0), 0)
  }, [projects, actuals])

  const budgetRemaining = Math.max(0, weeklyBudgetHours - budgetUsed)

  const [hover, setHover] = useState<Hover>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const hoveredProjectId = hover?.projectId ?? null
  const hoveredProject = hoveredProjectId ? projects.find((p) => p.id === hoveredProjectId) ?? null : null

  const hoveredStats = useMemo(() => {
    if (!hoveredProject) return null

    const actual = actuals[hoveredProject.id] ?? 0
    const target = targets[hoveredProject.id] ?? 0
    const delta = actual - target
    const withinRange = actual >= hoveredProject.minHours && actual <= hoveredProject.maxHours
    const tone = deltaTone(delta, withinRange)

    return { actual, target, delta, withinRange, tone }
  }, [hoveredProject, actuals, targets])

  // tooltip lane positioning (keep it inside card)
  const tooltipLaneHeight = 132
  const tooltipLeft = useMemo(() => {
    if (!hover || !containerRef.current) return 0
    const rect = containerRef.current.getBoundingClientRect()
    const x = hover.clientX - rect.left
    return clamp(x, 180, rect.width - 180)
  }, [hover])

  return (
    <div ref={containerRef} className="relative rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">weekly overview</h1>
          <p className="mt-1 text-sm text-zinc-400">
            budget: <span className="text-zinc-200">{weeklyBudgetHours}h</span>{' '}
            <span className="text-zinc-600">/</span>{' '}
            used: <span className="text-zinc-200">{fmt(budgetUsed)}</span>{' '}
            <span className="text-zinc-600">/</span>{' '}
            remaining: <span className="text-zinc-200">{fmt(budgetRemaining)}</span>
          </p>
        </div>
      </div>

      {/* tooltip lane */}
      <div className="relative mt-5" style={{ height: tooltipLaneHeight }}>
        {hoveredProject && hoveredStats ? (
          <div
            className="pointer-events-none absolute top-0 z-20 w-90 -translate-x-1/2 rounded-2xl border border-zinc-700 bg-zinc-950/95 p-4 shadow-xl backdrop-blur"
            style={{ left: tooltipLeft }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: hoveredProject.color }} />
                  <div className="truncate text-sm font-semibold text-zinc-100">{hoveredProject.name}</div>
                </div>

                <div className="mt-1 text-xs text-zinc-400">
                  actual <span className="font-semibold text-zinc-200">{fmt(hoveredStats.actual)}</span>{' '}
                  <span className="text-zinc-600">/</span>{' '}
                  target <span className="font-semibold text-zinc-200">{fmt(hoveredStats.target)}</span>
                </div>
              </div>

              <div className={['shrink-0 rounded-xl border px-2.5 py-1 text-xs font-semibold', toneClasses(hoveredStats.tone)].join(' ')}>
                {hoveredStats.delta >= 0 ? '+' : ''}
                {fmt(hoveredStats.delta)}
              </div>
            </div>

            {/* gauge: min / target / max */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>min {fmt(hoveredProject.minHours)}</span>
                <span>target {fmt(hoveredStats.target)}</span>
                <span>max {fmt(hoveredProject.maxHours)}</span>
              </div>

              {(() => {
                const max = Math.max(0, hoveredProject.maxHours)
                const min = Math.max(0, hoveredProject.minHours)
                const target = Math.max(0, hoveredStats.target)
                const actual = Math.max(0, hoveredStats.actual)

                const fillPct = max > 0 ? clamp((actual / max) * 100, 0, 100) : 0
                const minPct = max > 0 ? clamp((min / max) * 100, 0, 100) : 0
                const targetPct = max > 0 ? clamp((target / max) * 100, 0, 100) : 0

                return (
                  <div className="mt-2">
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div className={['h-full transition-all', barClasses(hoveredStats.tone)].join(' ')} style={{ width: `${fillPct}%` }} />

                      {/* min marker (subtle) */}
                      <div
                        className="absolute -top-0.75 h-4 w-0.5 rounded bg-zinc-200/25"
                        style={{ left: `${minPct}%` }}
                      />

                      {/* target marker (stronger) */}
                      <div
                        className="absolute -top-1 h-5 w-0.5 rounded bg-zinc-200/70"
                        style={{ left: `${targetPct}%` }}
                      />
                    </div>

                    <div className="mt-2 text-xs text-zinc-400">
                      {hoveredStats.actual < hoveredStats.target ? (
                        <span>
                          <span className="font-semibold text-zinc-200">{fmt(hoveredStats.target - hoveredStats.actual)}</span>{' '}
                          under target
                        </span>
                      ) : hoveredStats.actual > hoveredStats.target ? (
                        <span>
                          <span className="font-semibold text-zinc-200">{fmt(hoveredStats.actual - hoveredStats.target)}</span>{' '}
                          over target
                        </span>
                      ) : (
                        <span>exactly on target</span>
                      )}
                      {!hoveredStats.withinRange ? (
                        <span className="ml-2 text-red-200/80">
                          out of range ({fmt(hoveredProject.minHours)}–{fmt(hoveredProject.maxHours)})
                        </span>
                      ) : null}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            hover a segment to see details
          </div>
        )}
      </div>

      {/* bars */}
      <div className="mt-2 space-y-5">
        <SegmentedBar
          label="actual"
          projects={projects}
          values={actuals}
          total={weeklyBudgetHours}
          hoveredProjectId={hoveredProjectId}
          onHover={(projectId, clientX) => setHover(projectId ? { projectId, clientX } : null)}
        />

        <SegmentedBar
          label="target"
          projects={projects}
          values={targets}
          total={weeklyBudgetHours}
          hoveredProjectId={hoveredProjectId}
          onHover={(projectId, clientX) => setHover(projectId ? { projectId, clientX } : null)}
        />
      </div>

      {/* days */}
      <div className="mt-6">
        <div className="text-sm font-medium text-zinc-200">days</div>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {days.map((d) => {
            const active = d.iso === selectedDate
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => onSelectDate(d.iso)}
                className={[
                  'rounded-xl border px-2 py-2 text-left transition',
                  active ? 'border-zinc-600 bg-zinc-800' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700',
                ].join(' ')}
              >
                <div className="text-xs text-zinc-400">{d.iso.slice(5)}</div>
                <div className="text-sm font-semibold text-zinc-100">{d.total.toFixed(2)}h</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}