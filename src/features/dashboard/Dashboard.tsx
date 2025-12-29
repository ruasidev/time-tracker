import { useMemo, useState } from 'react'
import { useApp } from '../../app/AppProvider'
import { isoToday, startOfWeekMonday } from '../../app/selectors'
import WeekOverview from './WeekOverview'
import WorkDayPanel from '../workday/WorkDayPanel'
import WeeklyReportDrawer from '../report/WeeklyReportDrawer'

export default function Dashboard() {
  const { state, dispatch } = useApp()
  const profile = state.profile
  if (!profile) return null

  const [selectedDate, setSelectedDate] = useState<string>(isoToday())
  const [reportOpen, setReportOpen] = useState<boolean>(false)
  const weekStart = useMemo(() => startOfWeekMonday(new Date()), [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-zinc-400">internal time tracker</div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-100 hover:border-zinc-700"
          >
            report
          </button>

          <button
            type="button"
            onClick={() => dispatch({ type: 'settings/open' })}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-100 hover:border-zinc-700"
          >
            profile
          </button>
        </div>
      </div>

      {/* key change: items-start so grid children don't stretch to equal height */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div className="h-fit">
          <WeekOverview
            weeklyBudgetHours={profile.weeklyBudgetHours}
            projects={profile.projects}
            workDays={profile.workDays}
            weekStart={weekStart}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        <div className="h-fit">
          <WorkDayPanel
            date={selectedDate}
            projects={profile.projects}
            workDays={profile.workDays}
            onAdd={(input) => dispatch({ type: 'entry/add', payload: { input } })}
            onRemove={(date, entryId) => dispatch({ type: 'entry/remove', payload: { date, entryId } })}
          />
        </div>
      </div>

      <WeeklyReportDrawer
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        weeklyBudgetHours={profile.weeklyBudgetHours}
        projects={profile.projects}
        workDays={profile.workDays}
        weekStart={weekStart}
      />
    </div>
  )
}