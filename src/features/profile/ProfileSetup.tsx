import { useMemo, useState } from 'react'
import { useApp } from '../../app/AppProvider'
import type { Project } from '../../app/types'

function clampHours(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.round(n * 4) / 4)
}

function newProject(name: string, color: string): Project {
  return {
    id: crypto.randomUUID(),
    name,
    color,
    minHours: 0,
    targetHours: 0,
    maxHours: 0,
  }
}

const DEFAULT_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#22c55e', '#06b6d4', '#a855f7']

export default function ProfileSetup() {
  const { dispatch } = useApp()

  const [weeklyBudgetHours, setWeeklyBudgetHours] = useState<number>(40)
  const [projects, setProjects] = useState<Project[]>(() => [
    newProject('client work', DEFAULT_COLORS[1]),
    newProject('core dev', DEFAULT_COLORS[0]),
  ])

  const [newName, setNewName] = useState<string>('')

  const canCreate = weeklyBudgetHours > 0 && projects.length > 0 && projects.every((p) => p.name.trim().length > 0)

  const usedColors = useMemo(() => new Set(projects.map((p) => p.color)), [projects])

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
        <h1 className="text-2xl font-semibold tracking-tight">set up your profile</h1>
        <p className="mt-2 text-sm text-zinc-400">basic config now. we can refine later.</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-xs font-medium text-zinc-400">weekly budget (hours)</label>
            <input
              type="number"
              step={0.25}
              min={0}
              value={weeklyBudgetHours}
              onChange={(e) => setWeeklyBudgetHours(clampHours(Number(e.target.value)))}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
            />
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-2 text-sm font-semibold text-zinc-200">projects</div>

          <div className="space-y-2">
            {projects.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/30 p-3">
                <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
                <input
                  value={p.name}
                  onChange={(e) =>
                    setProjects((prev) => prev.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))
                  }
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-sm outline-none focus:border-zinc-600"
                />

                <button
                  type="button"
                  onClick={() => setProjects((prev) => prev.filter((x) => x.id !== p.id))}
                  className="rounded-lg px-2 py-1 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="new project name"
              className="w-56 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
            />

            <div className="flex items-center gap-1">
              {DEFAULT_COLORS.map((c) => {
                const disabled = usedColors.has(c)
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      const name = newName.trim()
                      if (!name) return
                      setProjects((prev) => [...prev, newProject(name, c)])
                      setNewName('')
                    }}
                    className={[
                      'h-7 w-7 rounded-full border',
                      disabled ? 'cursor-not-allowed border-zinc-900 opacity-30' : 'border-zinc-800 hover:border-zinc-600',
                    ].join(' ')}
                    style={{ background: c }}
                    title={disabled ? 'in use' : `add with ${c}`}
                  />
                )
              })}
            </div>
          </div>

          <p className="mt-2 text-xs text-zinc-500">you can edit targets/min/max in the profile panel.</p>
        </div>

        <div className="mt-10 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={!canCreate}
            onClick={() => {
              dispatch({ type: 'profile/create', payload: { weeklyBudgetHours, projects } })
            }}
            className={[
              'rounded-xl px-4 py-2 text-sm font-semibold transition',
              canCreate ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-800 text-zinc-500',
            ].join(' ')}
          >
            create profile
          </button>
        </div>
      </div>
    </div>
  )
}