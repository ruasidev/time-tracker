import type { Project, WorkDay } from './types'

export function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function toLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d)
  const day = x.getDay() // 0 sun .. 6 sat
  const diff = (day + 6) % 7 // monday -> 0
  x.setDate(x.getDate() - diff)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isInWeek(iso: string, weekStart: Date): boolean {
  const d = toLocalDate(iso)
  const start = new Date(weekStart)
  const end = addDays(start, 7)
  return d >= start && d < end
}

export function weekIsoDates(weekStart: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => toIsoDate(addDays(weekStart, i)))
}

export function targetsByProject(projects: Project[]): Record<string, number> {
  return Object.fromEntries(projects.map((p) => [p.id, p.targetHours]))
}

export function actualsByProjectForWeek(
  projects: Project[],
  workDays: WorkDay[],
  weekStart: Date
): Record<string, number> {
  const map: Record<string, number> = Object.fromEntries(projects.map((p) => [p.id, 0]))

  for (const day of workDays) {
    if (!isInWeek(day.date, weekStart)) continue
    for (const e of day.entries) {
      map[e.projectId] = (map[e.projectId] ?? 0) + e.hours
    }
  }

  return map
}

export function dayTotalHours(day: WorkDay | null): number {
  if (!day) return 0
  return day.entries.reduce((sum, e) => sum + e.hours, 0)
}