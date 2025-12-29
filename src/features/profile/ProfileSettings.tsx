import { useEffect, useState } from 'react'
import { useApp } from '../../app/AppProvider'
import type { Project } from '../../app/types'

function newProject(): Project {
  return {
    id: crypto.randomUUID(),
    name: 'new project',
    color: '#3f3f46',
    minHours: 0,
    targetHours: 0,
    maxHours: 0,
  }
}

function fmtHours(n: number): string {
  const x = Math.round(n * 4) / 4
  return `${x.toFixed(2)}h`
}

function clampQuarter(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.round(n * 4) / 4)
}

function sumTargets(projects: Project[]): number {
  return projects.reduce((sum, p) => sum + (Number.isFinite(p.targetHours) ? p.targetHours : 0), 0)
}

export default function ProfileSettings() {
  const { state, dispatch } = useApp()
  const profile = state.profile

  const [draftBudget, setDraftBudget] = useState<number>(profile?.weeklyBudgetHours ?? 40)

  // keep draft in sync with profile changes
  useEffect(() => {
    if (profile) setDraftBudget(profile.weeklyBudgetHours)
  }, [profile])

  // lock background scroll while panel is open
  useEffect(() => {
    if (!state.settingsOpen) return

    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [state.settingsOpen])

  if (!profile) return null
  if (!state.settingsOpen) return null

  // ---- targets progress (safe after null guard) ----
  const budget = profile.weeklyBudgetHours
  const totalTargets = sumTargets(profile.projects)
  const remaining = budget - totalTargets

  const ratio = budget > 0 ? totalTargets / budget : 0
  const pct = Math.max(0, Math.min(100, ratio * 100))

  const status: 'perfect' | 'under' | 'over' =
    remaining === 0 ? 'perfect' : remaining > 0 ? 'under' : 'over'

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => dispatch({ type: 'settings/close' })}
      />

      <div className="absolute right-0 top-0 h-dvh w-full max-w-xl overflow-y-auto overscroll-contain border-l border-zinc-800 bg-zinc-950 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">profile</h2>
            <p className="mt-1 text-sm text-zinc-400">projects and budgets</p>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: 'settings/close' })}
            className="rounded-xl px-2 py-1 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
          >
            close
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* targets progress */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-200">target hours</div>
                <div className="mt-1 text-sm text-zinc-400">
                  total: <span className="font-semibold text-zinc-100">{fmtHours(totalTargets)}</span>{' '}
                  <span className="text-zinc-500">/</span>{' '}
                  budget: <span className="font-semibold text-zinc-100">{fmtHours(budget)}</span>
                </div>
              </div>

              <div
                className={[
                  'rounded-xl border px-3 py-1 text-sm font-semibold',
                  status === 'perfect'
                    ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200'
                    : status === 'under'
                    ? 'border-amber-500/30 bg-amber-500/15 text-amber-200'
                    : 'border-red-500/30 bg-red-500/15 text-red-200',
                ].join(' ')}
              >
                {status === 'perfect'
                  ? 'exact'
                  : status === 'under'
                  ? `${fmtHours(remaining)} remaining`
                  : `${fmtHours(Math.abs(remaining))} over`}
              </div>
            </div>

            <div className="mt-4">
              <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={[
                    'h-full transition-all',
                    status === 'perfect'
                      ? 'bg-emerald-400'
                      : status === 'under'
                      ? 'bg-amber-400'
                      : 'bg-red-400',
                  ].join(' ')}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                <span>0h</span>
                <span>{fmtHours(budget)}</span>
              </div>

              {status === 'over' ? (
                <div className="mt-2 text-xs text-red-200/80">
                  over budget: lower some targets or raise weekly budget.
                </div>
              ) : status === 'under' ? (
                <div className="mt-2 text-xs text-amber-200/80">
                  under budget: you still have unallocated hours.
                </div>
              ) : (
                <div className="mt-2 text-xs text-emerald-200/80">
                  targets match the weekly budget.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-sm font-semibold text-zinc-200">weekly budget</div>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                step={0.25}
                min={0}
                value={draftBudget}
                onChange={(e) => setDraftBudget(clampQuarter(Number(e.target.value)))}
                className="w-40 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
              />
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: 'profile/setWeeklyBudget',
                    payload: { weeklyBudgetHours: draftBudget },
                  })
                }
                className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-white"
              >
                save
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-zinc-200">projects</div>
              <button
                type="button"
                onClick={() => dispatch({ type: 'project/add', payload: { project: newProject() } })}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-semibold hover:border-zinc-700"
              >
                add project
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {profile.projects.map((p) => (
                <div key={p.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={p.color}
                      onChange={(e) =>
                        dispatch({
                          type: 'project/update',
                          payload: { project: { ...p, color: e.target.value } },
                        })
                      }
                      className="w-28 rounded-xl border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs outline-none focus:border-zinc-600"
                      title="hex color"
                    />
                    <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />

                    <input
                      value={p.name}
                      onChange={(e) =>
                        dispatch({
                          type: 'project/update',
                          payload: { project: { ...p, name: e.target.value } },
                        })
                      }
                      className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                    />

                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'project/remove', payload: { projectId: p.id } })}
                      className="rounded-xl px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
                    >
                      remove
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-400">min</label>
                      <input
                        type="number"
                        step={0.25}
                        min={0}
                        value={p.minHours}
                        onChange={(e) =>
                          dispatch({
                            type: 'project/update',
                            payload: { project: { ...p, minHours: clampQuarter(Number(e.target.value)) } },
                          })
                        }
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-400">target</label>
                      <input
                        type="number"
                        step={0.25}
                        min={0}
                        value={p.targetHours}
                        onChange={(e) =>
                          dispatch({
                            type: 'project/update',
                            payload: { project: { ...p, targetHours: clampQuarter(Number(e.target.value)) } },
                          })
                        }
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-400">max</label>
                      <input
                        type="number"
                        step={0.25}
                        min={0}
                        value={p.maxHours}
                        onChange={(e) =>
                          dispatch({
                            type: 'project/update',
                            payload: { project: { ...p, maxHours: clampQuarter(Number(e.target.value)) } },
                          })
                        }
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                      />
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-zinc-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-4">
            <div className="text-sm font-semibold text-red-200">danger zone</div>
            <p className="mt-1 text-sm text-red-200/70">this wipes local data.</p>
            <button
              type="button"
              onClick={() => dispatch({ type: 'profile/reset' })}
              className="mt-3 rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-400"
            >
              reset profile
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}