export function BrandLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const iconSize = size === "sm" ? 28 : 32;
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="1"
          y="1"
          width="38"
          height="38"
          rx="9"
          fill="#1C1915"
          stroke="var(--border-strong)"
          strokeWidth="1.5"
        />
        {/* Pareto Frontier Curve */}
        <path
          d="M 9 29 Q 14 14 31 10"
          stroke="#E9C46A"
          strokeOpacity="0.55"
          strokeWidth="1.75"
          strokeDasharray="3 2.5"
          strokeLinecap="round"
        />
        {/* Express & Deep Mastery Segments */}
        <line
          x1="10"
          y1="28"
          x2="18"
          y2="17"
          stroke="#E76F51"
          strokeWidth="2.25"
          strokeLinecap="round"
        />
        <line
          x1="18"
          y1="17"
          x2="30"
          y2="11"
          stroke="#36BA98"
          strokeWidth="2.25"
          strokeLinecap="round"
        />
        {/* Nodes */}
        <circle cx="10" cy="28" r="2.75" fill="#FAF7F2" />
        <circle
          cx="18"
          cy="17"
          r="3"
          fill="#F4A261"
          stroke="#1C1915"
          strokeWidth="1.25"
        />
        <circle
          cx="30"
          cy="11"
          r="3"
          fill="#36BA98"
          stroke="#FAF7F2"
          strokeWidth="1.25"
        />
      </svg>
      <span className="text-base font-bold tracking-tight text-[var(--ink-primary)]">
        Paretoium
      </span>
    </span>
  );
}
