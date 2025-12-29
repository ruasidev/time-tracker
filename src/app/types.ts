export type Project = {
  id: string
  name: string
  color: string // tailwind-ish hex works fine
  minHours: number
  targetHours: number
  maxHours: number
}

export type WorkEntry = {
  id: string
  projectId: string
  hours: number // increments of 0.25
  note?: string
  createdAt: string // ISO
}

export type WorkDay = {
  date: string // YYYY-MM-DD
  entries: WorkEntry[]
}

export type UserProfile = {
  weeklyBudgetHours: number
  projects: Project[]
  workDays: WorkDay[]
  createdAt: string
  updatedAt: string
}
