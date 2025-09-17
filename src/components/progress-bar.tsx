interface ProgressBarProps {
  progress: number
  className?: string
}

export function ProgressBar({ progress, className = "" }: ProgressBarProps) {
  // Assurer que la progression est entre 0 et 100
  const safeProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${safeProgress}%` }}
        data-progress={safeProgress}
      />
      {/* Add a hidden element with progress value for printing */}
      <div className="progress-bar-print hidden print:block" data-progress={safeProgress}>
        <div className="progress-value" style={{ width: `${safeProgress}%` }}></div>
      </div>
    </div>
  )
}
