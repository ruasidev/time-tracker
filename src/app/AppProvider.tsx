import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { loadProfile, saveProfile } from './storage'
import { reducer } from './store'
import type { Action, AppState } from './store'
import type { UserProfile } from './types'

type AppContextValue = {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const initialProfile: UserProfile | null = loadProfile()

  const [state, dispatch] = useReducer(reducer, {
    profile: initialProfile,
    settingsOpen: false,
  })

  useEffect(() => {
    saveProfile(state.profile)
  }, [state.profile])

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}