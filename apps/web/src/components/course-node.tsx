"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export type CourseNodeStatus = "completed" | "available" | "locked" | "hard";

export interface CourseNodeData extends Record<string, unknown> {
  code: string;
  title: string;
  studyHours: number;
  difficulty: number;
  status: CourseNodeStatus;
  inActivePath: boolean;
  pathStepIndex?: number;
  isTarget?: boolean;
  hasActivePath: boolean;
  pathMode: "express" | "deep_mastery";
  layoutDir?: "LR" | "TB";
  selected: boolean;
}

const STATUS_DOT: Record<CourseNodeStatus, { color: string; title: string }> = {
  completed: { color: "bg-[#36BA98]", title: "Completed" },
  available: { color: "bg-[#F4A261]", title: "Ready" },
  locked: { color: "bg-[var(--border-strong)]", title: "Locked" },
  hard: { color: "bg-[#E9C46A]", title: "Advanced" },
};

export function CourseNode({ data }: NodeProps) {
  const nodeData = data as CourseNodeData;
  const dot = STATUS_DOT[nodeData.status] ?? STATUS_DOT.available;
  const isLR = (nodeData.layoutDir ?? "TB") === "LR";

  const isDimmed =
    nodeData.hasActivePath && !nodeData.inActivePath && !nodeData.selected;

  const isExpress = nodeData.pathMode === "express";

  const cardSurface = nodeData.inActivePath
    ? isExpress
      ? "bg-[var(--bg-surface)] border-[1.5px] border-[#E76F51]"
      : "bg-[var(--bg-surface)] border-[1.5px] border-[#36BA98]"
    : nodeData.status === "completed"
      ? "bg-[var(--accent-jade-soft)] border border-[var(--accent-jade-border)] hover:border-[#36BA98]"
      : "bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)]";

  const selectedRing = nodeData.selected
    ? "!border-[1.5px] !border-[var(--ink-primary)] ring-2 ring-[#F4A261]/35"
    : "";

  const handleColor = nodeData.inActivePath
    ? isExpress
      ? "!bg-[#E76F51]"
      : "!bg-[#36BA98]"
    : "!bg-[var(--border-strong)]";

  return (
    <div
      className={`group relative w-[204px] rounded-lg px-3 py-2.5 text-left transition-colors duration-150 ${cardSurface} ${selectedRing} ${
        isDimmed ? "opacity-50 hover:opacity-90" : "opacity-100"
      }`}
    >
      <Handle
        type="target"
        position={isLR ? Position.Left : Position.Top}
        className={`!w-2 !h-2 !border !border-[var(--bg-surface)] transition-colors ${handleColor}`}
      />

      {/* Top row: Step number + Code + Hours */}
      <div className="flex items-center justify-between gap-1.5 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {nodeData.inActivePath && typeof nodeData.pathStepIndex === "number" ? (
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-px rounded text-[10px] font-bold tabular-nums shrink-0 ${
                isExpress
                  ? "bg-[#E76F51] text-white"
                  : "bg-[#36BA98] text-[#141210]"
              }`}
            >
              {nodeData.pathStepIndex}
              {nodeData.isTarget ? " · GOAL" : ""}
            </span>
          ) : (
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${dot.color}`}
              title={dot.title}
            />
          )}
          <span className="font-mono text-[11px] font-semibold text-[var(--ink-secondary)] truncate">
            {nodeData.code}
          </span>
        </div>

        <span className="font-mono text-[10.5px] font-medium text-[var(--ink-muted)] tabular-nums shrink-0">
          {nodeData.studyHours}h · D{nodeData.difficulty}
        </span>
      </div>

      {/* Course Title */}
      <div className="text-[12.5px] font-semibold text-[var(--ink-primary)] leading-snug line-clamp-2">
        {nodeData.title}
      </div>

      <Handle
        type="source"
        position={isLR ? Position.Right : Position.Bottom}
        className={`!w-2 !h-2 !border !border-[var(--bg-surface)] transition-colors ${handleColor}`}
      />
    </div>
  );
}
