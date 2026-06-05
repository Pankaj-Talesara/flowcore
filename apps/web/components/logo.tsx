export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="var(--primary)" />
        {/* trigger → step → execution: three nodes, two connectors */}
        <circle cx="9" cy="16" r="3" fill="var(--primary-foreground)" />
        <circle cx="16" cy="16" r="3" fill="var(--primary-foreground)" />
        <circle cx="23" cy="16" r="3" fill="var(--primary-foreground)" />
        <path
          d="M12 16h1M19 16h1"
          stroke="var(--primary-foreground)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-lg font-semibold tracking-tight">Flowcore</span>
    </span>
  )
}
