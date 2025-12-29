import type { Project, UserProfile, WorkEntry, WorkDay } from './types'

export type AppState = {
  profile: UserProfile | null
  settingsOpen: boolean
}

export type AddEntryInput = {
  date: string
  projectId: string
  hours: number
  note?: string
}

export type ProjectInput = {
  name: string
  color: string
  minHours: number
  targetHours: number
  maxHours: number
}

export type Action =
  | { type: 'settings/open' }
  | { type: 'settings/close' }
  | { type: 'profile/create'; payload: { weeklyBudgetHours: number; projects: Project[] } }
  | { type: 'profile/reset' }
  | { type: 'profile/setWeeklyBudget'; payload: { weeklyBudgetHours: number } }
  | { type: 'project/add'; payload: { project: Project } }
  | { type: 'project/update'; payload: { project: Project } }
  | { type: 'project/remove'; payload: { projectId: string } }
  | { type: 'entry/add'; payload: { input: AddEntryInput } }
  | { type: 'entry/remove'; payload: { date: string; entryId: string } }

function nowIso(): string {
  return new Date().toISOString()
}

function upsertDay(workDays: WorkDay[], date: string, entry: WorkEntry): WorkDay[] {
  const idx = workDays.findIndex((d) => d.date === date)
  if (idx === -1) return [...workDays, { date, entries: [entry] }]

  const existing = workDays[idx]
  const updated: WorkDay = { ...existing, entries: [...existing.entries, entry] }
  return [...workDays.slice(0, idx), updated, ...workDays.slice(idx + 1)]
}

function removeEntry(workDays: WorkDay[], date: string, entryId: string): WorkDay[] {
  const idx = workDays.findIndex((d) => d.date === date)
  if (idx === -1) return workDays

  const day = workDays[idx]
  const nextEntries = day.entries.filter((e) => e.id !== entryId)
  const nextDays =
    nextEntries.length === 0
      ? workDays.filter((d) => d.date !== date)
      : [...workDays.slice(0, idx), { ...day, entries: nextEntries }, ...workDays.slice(idx + 1)]

  return nextDays
}

function removeProjectEverywhere(profile: UserProfile, projectId: string): UserProfile {
  const projects = profile.projects.filter((p) => p.id !== projectId)

  const workDays = profile.workDays
    .map((d) => ({ ...d, entries: d.entries.filter((e) => e.projectId !== projectId) }))
    .filter((d) => d.entries.length > 0)

  return { ...profile, projects, workDays }
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'settings/open':
      return { ...state, settingsOpen: true }
    case 'settings/close':
      return { ...state, settingsOpen: false }

    case 'profile/create': {
      const ts = nowIso()
      const profile: UserProfile = {
        weeklyBudgetHours: action.payload.weeklyBudgetHours,
        projects: action.payload.projects,
        workDays: [],
        createdAt: ts,
        updatedAt: ts,
      }
      return { ...state, profile }
    }

    case 'profile/reset':
      return { profile: null, settingsOpen: false }

    case 'profile/setWeeklyBudget': {
      if (!state.profile) return state
      const updated: UserProfile = {
        ...state.profile,
        weeklyBudgetHours: action.payload.weeklyBudgetHours,
        updatedAt: nowIso(),
      }
      return { ...state, profile: updated }
    }

    case 'project/add': {
      if (!state.profile) return state
      const updated: UserProfile = {
        ...state.profile,
        projects: [...state.profile.projects, action.payload.project],
        updatedAt: nowIso(),
      }
      return { ...state, profile: updated }
    }

    case 'project/update': {
      if (!state.profile) return state
      const updated: UserProfile = {
        ...state.profile,
        projects: state.profile.projects.map((p) => (p.id === action.payload.project.id ? action.payload.project : p)),
        updatedAt: nowIso(),
      }
      return { ...state, profile: updated }
    }

    case 'project/remove': {
      if (!state.profile) return state
      const updated = removeProjectEverywhere(state.profile, action.payload.projectId)
      return { ...state, profile: { ...updated, updatedAt: nowIso() } }
    }

    case 'entry/add': {
      if (!state.profile) return state
      const { input } = action.payload

      const entry: WorkEntry = {
        id: crypto.randomUUID(),
        projectId: input.projectId,
        hours: input.hours,
        note: input.note,
        createdAt: nowIso(),
      }

      const updated: UserProfile = {
        ...state.profile,
        workDays: upsertDay(state.profile.workDays, input.date, entry),
        updatedAt: nowIso(),
      }

      return { ...state, profile: updated }
    }

    case 'entry/remove': {
      if (!state.profile) return state
      const updated: UserProfile = {
        ...state.profile,
        workDays: removeEntry(state.profile.workDays, action.payload.date, action.payload.entryId),
        updatedAt: nowIso(),
      }
      return { ...state, profile: updated }
    }

    default:
      return state
  }
}