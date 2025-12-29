import Dashboard from '../features/dashboard/Dashboard'
import ProfileSetup from '../features/profile/ProfileSetup'
import ProfileSettings from '../features/profile/ProfileSettings'
import { useApp } from './AppProvider'

export default function App() {
  const { state } = useApp()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {state.profile ? <Dashboard /> : <ProfileSetup />}
      <ProfileSettings />
    </div>
  )
}