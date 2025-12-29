type Props = {
  onOpenReport: () => void
}

export default function WeekOverviewActions({ onOpenReport }: Props) {
  return (
    <button
      type="button"
      onClick={onOpenReport}
      className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-semibold text-zinc-100 hover:border-zinc-700"
    >
      weekly report
    </button>
  )
}