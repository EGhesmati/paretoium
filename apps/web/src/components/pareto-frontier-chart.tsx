"use client";

import type { ParetoPathLabel } from "@/lib/optimizer";

interface ParetoFrontierChartProps {
  frontier: ParetoPathLabel[];
  expressPath?: ParetoPathLabel | null;
  deepMasteryPath?: ParetoPathLabel | null;
  activePath: ParetoPathLabel | null;
  onSelectOption: (index: number, kind: "express" | "deep_mastery" | "custom") => void;
}

export function ParetoFrontierChart({
  frontier,
  expressPath,
  deepMasteryPath,
  activePath,
  onSelectOption,
}: ParetoFrontierChartProps) {
  if (frontier.length === 0) return null;

  const width = 340;
  const height = 164;
  const padLeft = 38;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 28;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const hoursList = frontier.map((o) => o.total_hours);
  const diffList = frontier.map((o) => o.total_difficulty);

  const minH = Math.min(...hoursList);
  const maxH = Math.max(...hoursList);
  const minD = Math.min(...diffList);
  const maxD = Math.max(...diffList);

  const spanH = maxH - minH || 10;
  const spanD = maxD - minD || 4;

  const points = frontier.map((opt, idx) => {
    const x = padLeft + ((opt.total_hours - minH) / spanH) * plotW;
    const y = padTop + plotH - ((opt.total_difficulty - minD) / spanD) * plotH;
    const key = opt.path.join(",");
    const isExpress = expressPath?.path.join(",") === key;
    const isDeep = deepMasteryPath?.path.join(",") === key;
    const isCurrent = activePath?.path.join(",") === key;
    return { opt, idx, x, y, isExpress, isDeep, isCurrent };
  });

  const sortedForLine = [...points].sort((a, b) => a.x - b.x || b.y - a.y);
  const polylinePoints = sortedForLine.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-ground)] p-2.5">
        <div className="flex items-center justify-between text-[11px] text-[var(--ink-secondary)] mb-1.5 px-1">
          <span className="font-semibold text-[var(--ink-primary)]">
            Pareto Trade-Off Curve
          </span>
          <span className="tabular-nums">{frontier.length} non-dominated routes</span>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label="Pareto frontier scatter plot comparing study hours and cumulative difficulty"
        >
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={padTop + plotH}
            stroke="var(--border-strong)"
            strokeWidth="1"
          />
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={padLeft + plotW}
            y2={padTop + plotH}
            stroke="var(--border-strong)"
            strokeWidth="1"
          />
          <line
            x1={padLeft}
            y1={padTop + plotH / 2}
            x2={padLeft + plotW}
            y2={padTop + plotH / 2}
            stroke="var(--border-subtle)"
            strokeDasharray="3 3"
            strokeWidth="1"
          />

          <text
            x={padLeft - 6}
            y={padTop + 4}
            textAnchor="end"
            fontSize="9"
            fill="var(--ink-muted)"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {maxD}
          </text>
          <text
            x={padLeft - 6}
            y={padTop + plotH}
            textAnchor="end"
            fontSize="9"
            fill="var(--ink-muted)"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {minD}
          </text>
          <text
            x={padLeft}
            y={height - 6}
            textAnchor="start"
            fontSize="9"
            fill="var(--ink-muted)"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {minH}h
          </text>
          <text
            x={padLeft + plotW / 2}
            y={height - 6}
            textAnchor="middle"
            fontSize="9"
            fill="var(--ink-secondary)"
          >
            Study Hours →
          </text>
          <text
            x={padLeft + plotW}
            y={height - 6}
            textAnchor="end"
            fontSize="9"
            fill="var(--ink-muted)"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {maxH}h
          </text>

          {sortedForLine.length > 1 && (
            <polyline
              fill="none"
              stroke="#F4A261"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              points={polylinePoints}
            />
          )}

          {points.map(({ opt, idx, x, y, isExpress, isDeep, isCurrent }) => {
            const fill = isExpress
              ? "#E76F51"
              : isDeep
                ? "#36BA98"
                : "#E9C46A";
            return (
              <g
                key={`${idx}-${opt.path.join("-")}`}
                className="cursor-pointer"
                onClick={() =>
                  onSelectOption(
                    idx,
                    isExpress ? "express" : isDeep ? "deep_mastery" : "custom",
                  )
                }
              >
                {isCurrent && (
                  <circle
                    cx={x}
                    cy={y}
                    r={9}
                    fill="none"
                    stroke="var(--ink-primary)"
                    strokeWidth="1.75"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isCurrent ? 5.5 : 4.5}
                  fill={fill}
                  stroke="var(--bg-surface)"
                  strokeWidth="1.5"
                >
                  <title>
                    {`Option #${idx + 1}: ${opt.total_hours}h · diff ${opt.total_difficulty} · ${opt.path.length} courses`}
                  </title>
                </circle>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
        {points.map(({ opt, idx, isExpress, isDeep, isCurrent }) => (
          <button
            key={`${idx}-${opt.path.join("-")}`}
            type="button"
            onClick={() =>
              onSelectOption(
                idx,
                isExpress ? "express" : isDeep ? "deep_mastery" : "custom",
              )
            }
            className={`text-left rounded-lg border px-2.5 py-2 transition cursor-pointer ${
              isCurrent
                ? "border-[var(--ink-primary)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]"
                : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] text-[var(--ink-primary)]"
            }`}
          >
            <div className="flex items-center justify-between gap-1.5 mb-0.5">
              <span className="text-[11px] font-semibold">
                #{idx + 1}
                {isExpress ? " · Express" : isDeep ? " · Deep" : ""}
              </span>
              <span
                className={`text-[10px] font-mono tabular-nums ${
                  isCurrent ? "opacity-80" : "text-[var(--ink-secondary)]"
                }`}
              >
                {opt.total_hours}h · d{opt.total_difficulty} · {opt.path.length}c
              </span>
            </div>
            <div
              className={`font-mono text-[10px] truncate ${
                isCurrent ? "opacity-70" : "text-[var(--ink-muted)]"
              }`}
            >
              {opt.path.join(" → ")}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
