import { useMemo, useState } from 'react'
import type { Project, WorkDay } from '../../app/types'
import type { AddEntryInput } from '../../app/store'

type Props = {
  date: string
  projects: Project[]
  workDays: WorkDay[]
  onAdd: (input: AddEntryInput) => void
  onRemove: (date: string, entryId: string) => void
}

function clampQuarter(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.round(n * 4) / 4)
}

function fmtHours(n: number): string {
  const x = clampQuarter(n)
  return `${x.toFixed(2)}h`
}

function hoursOptions(maxHours: number = 24): number[] {
  const out: number[] = []
  const steps = Math.round(maxHours * 4)
  for (let i = 1; i <= steps; i++) out.push(i / 4)
  return out
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      ta.style.top = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

export default function WorkDayPanel({ date, projects, workDays, onAdd, onRemove }: Props) {
  const day = useMemo(() => workDays.find((d) => d.date === date) ?? null, [workDays, date])

  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? '')
  const [hours, setHours] = useState<number>(0.25)
  const [note, setNote] = useState<string>('')

  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const dayTotal = useMemo(() => (day ? day.entries.reduce((s, e) => s + e.hours, 0) : 0), [day])
  const hasEntries = Boolean(day?.entries.length)
  const canAdd = projectId.length > 0 && hours > 0 && Number.isFinite(hours)

  const hourOpts = useMemo(() => hoursOptions(24), [])

  const controlBase =
    'w-full rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-zinc-100 outline-none focus:border-zinc-600'
  const selectControl = `${controlBase} h-10 px-3 pr-8`
  const hoursSelectControl = `${controlBase} h-10 px-2.5 pr-7 tabular-nums`
  const textareaControl = `${controlBase} min-h-[84px] resize-y px-3 py-2 leading-relaxed`

  function submit() {
    if (!canAdd) return
    onAdd({
      date,
      projectId,
      hours: clampQuarter(hours),
      note: note.trim() ? note.trim() : undefined,
    })
    setNote('')
    setHours(0.25)
  }

  async function handleCopy() {
    if (!day?.entries.length) return

    const lines = day.entries.map((e) => {
      const p = projects.find((x) => x.id === e.projectId)
      const name = p?.name ?? 'unknown project'
      const base = `- ${name} — ${fmtHours(e.hours)}`
      return e.note?.trim() ? `${base} — ${e.note.trim()}` : base
    })

    const ok = await copyToClipboard(lines.join('\n'))
    setCopyState(ok ? 'copied' : 'failed')
    window.setTimeout(() => setCopyState('idle'), 1200)
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">day</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {date}
            <span className="mx-2 text-zinc-700">•</span>
            <span className="text-zinc-200">{fmtHours(dayTotal)}</span>
          </p>
        </div>

        <button
          type="button"
          disabled={!hasEntries}
          onClick={handleCopy}
          className={[
            'shrink-0 rounded-xl border px-3 py-2 text-sm font-semibold transition',
            hasEntries
              ? 'border-zinc-800 bg-zinc-950 text-zinc-100 hover:border-zinc-700'
              : 'cursor-not-allowed border-zinc-900 bg-zinc-950/30 text-zinc-500',
          ].join(' ')}
        >
          {copyState === 'copied' ? 'copied' : copyState === 'failed' ? 'failed' : 'copy day log'}
        </button>
      </div>

      <div className="mt-4">
        {day?.entries.length ? (
          <div className="space-y-2">
            {day.entries.map((e) => {
              const p = projects.find((x) => x.id === e.projectId)
              return (
                <div
                  key={e.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ background: p?.color ?? '#999' }} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="font-medium text-zinc-100">{p?.name ?? 'unknown project'}</span>
                          <span className="text-sm text-zinc-400">{fmtHours(e.hours)}</span>
                        </div>

                        {e.note ? (
                          <div className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-zinc-400">
                            {e.note}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(date, e.id)}
                    className="shrink-0 rounded-lg px-2 py-1 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                  >
                    remove
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/20 p-4">
            <div className="text-sm font-medium text-zinc-200">no entries yet</div>
            <div className="mt-1 text-sm text-zinc-400">add one below to start tracking.</div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-zinc-200">add entry</div>
            <div className="mt-1 text-xs text-zinc-500">enter submits, shift+enter newline</div>
          </div>
          <div className="text-xs text-zinc-500">0.25 increments up to 24h</div>
        </div>

        {/* on desktop, lock widths so hours never gets crushed */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_7.5rem] sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">project</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={selectControl}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">hours</label>
            <select
              value={String(hours)}
              onChange={(e) => setHours(Number(e.target.value))}
              className={hoursSelectControl}
            >
              {hourOpts.map((h) => (
                <option key={h} value={String(h)}>
                  {fmtHours(h)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-transparent">add</label>
            <button
              type="button"
              disabled={!canAdd}
              onClick={submit}
              className={[
                'h-10 w-full rounded-xl text-sm font-semibold transition',
                canAdd ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'cursor-not-allowed bg-zinc-800 text-zinc-500',
              ].join(' ')}
            >
              add
            </button>
          </div>
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-zinc-400">note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional notes (shift+enter for newline)"
            className={textareaControl}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}