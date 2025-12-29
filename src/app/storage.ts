import type { UserProfile } from './types'

const KEY = 'time-tracker.profile.v1'

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserProfile
  } catch {
    return null
  }
}

export function saveProfile(profile: UserProfile | null) {
  try {
    if (!profile) {
      localStorage.removeItem(KEY)
      return
    }
    localStorage.setItem(KEY, JSON.stringify(profile))
  } catch {
    // ignore storage failures
  }
}