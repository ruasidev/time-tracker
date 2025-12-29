import { useEffect, useMemo } from 'react'
import type { Project, WorkDay } from '../../app/types'
import { actualsByProjectForWeek, targetsByProject, weekIsoDates, dayTotalHours } from '../../app/selectors'

type Props = {
  open: boolean
  onClose: () => void
  weeklyBudgetHours: number
  projects: Project[]
  workDays: WorkDay[]
  weekStart: Date
}

type Tone = 'good' | 'warn' | 'bad'

function fmt(n: number): string {
  const x = Math.round(n * 4) / 4
  return `${x.toFixed(2)}h`
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function toneFor(delta: number, withinRange: boolean): Tone {
  if (!withinRange) return 'bad'
  if (Math.abs(delta) <= 1) return 'good'
  return 'warn'
}

function toneBadge(t: Tone): string {
  return t === 'good'
    ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200'
    : t === 'warn'
    ? 'border-amber-500/30 bg-amber-500/15 text-amber-200'
    : 'border-red-500/30 bg-red-500/15 text-red-200'
}

function toneFill(t: Tone): string {
  return t === 'good' ? 'bg-emerald-400' : t === 'warn' ? 'bg-amber-400' : 'bg-red-400'
}

function getProject(projects: Project[], projectId: string): Project | null {
  return projects.find((p) => p.id === projectId) ?? null
}

function Gauge({
  actual,
  min,
  target,
  max,
  tone,
  labelLeft,
  labelMid,
  labelRight,
}: {
  actual: number
  min: number
  target: number
  max: number
  tone: Tone
  labelLeft: string
  labelMid: string
  labelRight: string
}) {
  const safeMax = Math.max(0, max)
  const safeMin = Math.max(0, min)
  const safeTarget = Math.max(0, target)
  const safeActual = Math.max(0, actual)

  const fillPct = safeMax > 0 ? clamp((safeActual / safeMax) * 100, 0, 100) : 0
  const minPct = safeMax > 0 ? clamp((safeMin / safeMax) * 100, 0, 100) : 0
  const targetPct = safeMax > 0 ? clamp((safeTarget / safeMax) * 100, 0, 100) : 0

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-[11px] text-zinc-500">
        <span>
          {labelLeft} {fmt(safeMin)}
        </span>
        <span>
          {labelMid} {fmt(safeTarget)}
        </span>
        <span>
          {labelRight} {fmt(safeMax)}
        </span>
      </div>

      <div className="mt-2">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div className={['h-full transition-all', toneFill(tone)].join(' ')} style={{ width: `${fillPct}%` }} />
          <div className="absolute -top-0.75 h-4 w-0.5 rounded bg-zinc-200/25" style={{ left: `${minPct}%` }} />
          <div className="absolute -top-1 h-5 w-0.5 rounded bg-zinc-200/70" style={{ left: `${targetPct}%` }} />
        </div>
      </div>
    </div>
  )
}

export default function WeeklyReportDrawer({
  open,
  onClose,
  weeklyBudgetHours,
  projects,
  workDays,
  weekStart,
}: Props) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const actuals = actualsByProjectForWeek(projects, workDays, weekStart)
  const targets = targetsByProject(projects)

  const days = useMemo(() => {
    return weekIsoDates(weekStart).map((iso) => {
      const day = workDays.find((d) => d.date === iso) ?? null
      return { iso, day, total: dayTotalHours(day) }
    })
  }, [weekStart, workDays])

  const totals = useMemo(() => {
    const used = projects.reduce((sum, p) => sum + (actuals[p.id] ?? 0), 0)
    const remaining = weeklyBudgetHours - used
    const min = projects.reduce((sum, p) => sum + Math.max(0, p.minHours), 0)
    const max = projects.reduce((sum, p) => sum + Math.max(0, p.maxHours), 0)
    return { used, remaining, min, max }
  }, [projects, actuals, weeklyBudgetHours])

  const perProject = useMemo(() => {
    return projects
      .map((p) => {
        const actual = actuals[p.id] ?? 0
        const target = targets[p.id] ?? 0
        const delta = actual - target
        const within = actual >= p.minHours && actual <= p.maxHours
        const status = toneFor(delta, within)
        return { project: p, actual, target, delta, within, status }
      })
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  }, [projects, actuals, targets])

  const highlights = useMemo(() => {
    const over = perProject.filter((x) => x.delta > 0).sort((a, b) => b.delta - a.delta)[0] ?? null
    const under = perProject.filter((x) => x.delta < 0).sort((a, b) => a.delta - b.delta)[0] ?? null
    return { over, under }
  }, [perProject])

  if (!open) return null

  // budget tone based on weekly budget target (not max)
  const budgetTone: Tone =
    totals.used <= weeklyBudgetHours ? 'good' : totals.used <= weeklyBudgetHours * 1.1 ? 'warn' : 'bad'

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="close report" onClick={onClose} className="absolute inset-0 bg-black/60" />

      <div className="absolute right-0 top-0 h-dvh w-full max-w-3xl overflow-y-auto overscroll-contain border-l border-zinc-800 bg-zinc-950 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">weekly report</h2>
            <p className="mt-1 text-sm text-zinc-400">
              week of <span className="text-zinc-200">{weekIsoDates(weekStart)[0]}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
          >
            close
          </button>
        </div>

        {/* summary */}
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-200">budget summary</div>
              <div className="mt-1 text-sm text-zinc-400">
                budget <span className="text-zinc-200">{fmt(weeklyBudgetHours)}</span>
                <span className="mx-2 text-zinc-700">•</span>
                used <span className="text-zinc-200">{fmt(totals.used)}</span>
                <span className="mx-2 text-zinc-700">•</span>
                remaining{' '}
                <span className={totals.remaining >= 0 ? 'text-zinc-200' : 'text-red-200'}>{fmt(totals.remaining)}</span>
              </div>
            </div>

            <div className={['rounded-xl border px-3 py-1.5 text-xs font-semibold', toneBadge(budgetTone)].join(' ')}>
              {totals.used <= weeklyBudgetHours ? 'within budget' : 'over budget'}
            </div>
          </div>

          {/* scale to MAX (sum of project max hours) */}
          <Gauge
            actual={totals.used}
            min={totals.min}
            target={weeklyBudgetHours}
            max={Math.max(weeklyBudgetHours, totals.max)}
            tone={budgetTone}
            labelLeft="min"
            labelMid="budget"
            labelRight="max"
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
              <div className="text-xs font-semibold text-zinc-400">biggest under</div>
              {highlights.under ? (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: highlights.under.project.color }} />
                    <div className="truncate text-sm font-semibold text-zinc-100">{highlights.under.project.name}</div>
                  </div>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-200">
                    {fmt(highlights.under.delta)}
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-zinc-500">none</div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
              <div className="text-xs font-semibold text-zinc-400">biggest over</div>
              {highlights.over ? (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: highlights.over.project.color }} />
                    <div className="truncate text-sm font-semibold text-zinc-100">{highlights.over.project.name}</div>
                  </div>
                  <div className="rounded-xl border border-red-500/30 bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-200">
                    +{fmt(highlights.over.delta)}
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-zinc-500">none</div>
              )}
            </div>
          </div>
        </div>

        {/* projects */}
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-sm font-semibold text-zinc-200">projects</div>
          <div className="mt-4 space-y-2">
            {perProject.map((x) => (
              <div key={x.project.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: x.project.color }} />
                      <div className="truncate text-sm font-semibold text-zinc-100">{x.project.name}</div>
                    </div>

                    <div className="mt-1 text-xs text-zinc-400">
                      actual <span className="text-zinc-200">{fmt(x.actual)}</span>
                      <span className="mx-2 text-zinc-700">•</span>
                      target <span className="text-zinc-200">{fmt(x.target)}</span>
                      <span className="mx-2 text-zinc-700">•</span>
                      range{' '}
                      <span className="text-zinc-200">
                        {fmt(x.project.minHours)}–{fmt(x.project.maxHours)}
                      </span>
                    </div>
                  </div>

                  <div className={['rounded-xl border px-2.5 py-1 text-xs font-semibold', toneBadge(x.status)].join(' ')}>
                    {x.delta >= 0 ? '+' : ''}
                    {fmt(x.delta)}
                  </div>
                </div>

                <Gauge
                  actual={x.actual}
                  min={x.project.minHours}
                  target={x.target}
                  max={x.project.maxHours}
                  tone={x.status}
                  labelLeft="min"
                  labelMid="target"
                  labelRight="max"
                />

                {!x.within ? (
                  <div className="mt-2 text-xs text-red-200/80">
                    out of range ({fmt(x.project.minHours)}–{fmt(x.project.maxHours)})
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* timeline */}
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-sm font-semibold text-zinc-200">timeline</div>

          <div className="mt-4 space-y-3">
            {days.map((d) => (
              <div key={d.iso} className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-zinc-100">{d.iso}</div>
                  <div className="text-sm text-zinc-300">{fmt(d.total)}</div>
                </div>

                {d.day?.entries?.length ? (
                  <div className="mt-3 space-y-3">
                    {d.day.entries.map((e) => {
                      const p = getProject(projects, e.projectId)
                      return (
                        <div key={e.id} className="rounded-xl border border-zinc-800/80 bg-zinc-950/20 p-3">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: p?.color ?? '#777' }} />
                            <span className="font-medium text-zinc-200">{p?.name ?? 'unknown'}</span>
                            <span className="text-zinc-600">•</span>
                            <span className="tabular-nums text-zinc-300">{fmt(e.hours)}</span>
                          </div>

                          {e.note ? (
                            <div className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-zinc-400">
                              {e.note}
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-zinc-500">no entries</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="h-10" />
      </div>
    </div>
  )
}