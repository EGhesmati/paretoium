"use client";

import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import { CourseNode, type CourseNodeStatus } from "@/components/course-node";
import { ParetoFrontierChart } from "@/components/pareto-frontier-chart";
import {
  ensureStudyGuideModules,
  type QuizQuestion,
  type StudyGuide,
} from "@/lib/ai-study";
import type { OptimizerResponse, ParetoPathLabel } from "@/lib/optimizer";

export interface CanvasCourse {
  id: string;
  code: string;
  title: string;
  studyHours: number;
  difficulty: number;
}

export interface CanvasEdge {
  sourceId: string;
  targetId: string;
  sourceCode: string;
  targetCode: string;
}

interface GraphSnapshot {
  courses: CanvasCourse[];
  edges: CanvasEdge[];
  activeTopic: string;
  graphSource: "seeded" | "gemini" | "fallback";
  targetCourseId: string;
  completedIds: string[];
  verifiedIds: string[];
}

const NODE_WIDTH = 204;
const NODE_HEIGHT = 72;
const nodeTypes = { course: CourseNode };

const QUICK_TOPICS = [
  "Machine Learning",
  "Full-Stack Web",
  "Cybersecurity",
  "Distributed Systems",
];

function computeDagrePositions(
  courses: CanvasCourse[],
  edges: CanvasEdge[],
  rankdir: "LR" | "TB",
): Map<string, { x: number; y: number }> {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir,
    ranker: "network-simplex",
    nodesep: rankdir === "TB" ? 28 : 26,
    ranksep: rankdir === "TB" ? 56 : 72,
    edgesep: 18,
    marginx: 24,
    marginy: 24,
  });

  for (const course of courses) {
    graph.setNode(course.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    graph.setEdge(edge.sourceId, edge.targetId);
  }

  dagre.layout(graph);

  const positions = new Map<string, { x: number; y: number }>();
  for (const course of courses) {
    const pos = graph.node(course.id);
    if (pos) {
      positions.set(course.id, {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      });
    }
  }
  return positions;
}

function getCourseStatus(
  course: CanvasCourse,
  completedIds: Set<string>,
  prereqsByTarget: Map<string, string[]>,
): CourseNodeStatus {
  if (completedIds.has(course.id)) return "completed";
  const prereqs = prereqsByTarget.get(course.id) ?? [];
  const prereqsMet = prereqs.every((id) => completedIds.has(id));
  if (!prereqsMet) return "locked";
  if (course.difficulty >= 4) return "hard";
  return "available";
}

function defaultTargetForGraph(
  courses: CanvasCourse[],
  edges: CanvasEdge[],
): string {
  if (courses.length === 0) return "";
  const capstone = courses.find(
    (c) =>
      c.code.startsWith("CAP") ||
      c.code.endsWith("400") ||
      c.code.endsWith("500") ||
      c.title.toLowerCase().includes("capstone"),
  );
  if (capstone) return capstone.id;

  const sources = new Set(edges.map((e) => e.sourceId));
  const inDegree = new Map<string, number>();
  for (const e of edges) {
    inDegree.set(e.targetId, (inDegree.get(e.targetId) ?? 0) + 1);
  }
  const sinks = courses.filter((c) => !sources.has(c.id));
  if (sinks.length > 0) {
    sinks.sort(
      (a, b) => (inDegree.get(b.id) ?? 0) - (inDegree.get(a.id) ?? 0),
    );
    return sinks[0].id;
  }
  return courses[courses.length - 1]?.id ?? "";
}

function defaultRootForGraph(
  courses: CanvasCourse[],
  edges: CanvasEdge[],
): string {
  if (courses.length === 0) return "";
  const cs101 = courses.find(
    (c) => c.code === "CS101" || c.code.endsWith("101"),
  );
  if (cs101) return cs101.id;

  const targets = new Set(edges.map((e) => e.targetId));
  const outDegree = new Map<string, number>();
  for (const e of edges) {
    outDegree.set(e.sourceId, (outDegree.get(e.sourceId) ?? 0) + 1);
  }
  const roots = courses.filter((c) => !targets.has(c.id));
  if (roots.length > 0) {
    roots.sort(
      (a, b) => (outDegree.get(b.id) ?? 0) - (outDegree.get(a.id) ?? 0),
    );
    return roots[0].id;
  }
  return courses[0].id;
}

export function CurriculumCanvas({
  courses: initialCourses,
  edges: initialEdges,
}: {
  courses: CanvasCourse[];
  edges: CanvasEdge[];
}) {
  const [courses, setCourses] = useState<CanvasCourse[]>(initialCourses);
  const [edges, setEdges] = useState<CanvasEdge[]>(initialEdges);
  const [activeTopic, setActiveTopic] = useState<string>("Computer Science");
  const [graphSource, setGraphSource] = useState<"seeded" | "gemini" | "fallback">("seeded");
  const [previousSnapshot, setPreviousSnapshot] = useState<GraphSnapshot | null>(null);

  const [topicInput, setTopicInput] = useState<string>("");
  const [generatingGraph, setGeneratingGraph] = useState<boolean>(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [targetCourseId, setTargetCourseId] = useState<string>(() =>
    defaultTargetForGraph(initialCourses, initialEdges),
  );
  const [maxHours, setMaxHours] = useState<number>(280);
  const [maxDifficulty, setMaxDifficulty] = useState<number>(25);
  const [maxDepth, setMaxDepth] = useState<number>(7);
  const [pathMode, setPathMode] = useState<"express" | "deep_mastery">("deep_mastery");
  const [layoutDir, setLayoutDir] = useState<"LR" | "TB">("TB");
  const [viewMode, setViewMode] = useState<"graph" | "roadmap">("graph");
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    const root = defaultRootForGraph(initialCourses, initialEdges);
    return root ? [root] : [];
  });
  const [verifiedIds, setVerifiedIds] = useState<string[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showCanvasHint, setShowCanvasHint] = useState<boolean>(true);

  const [optResult, setOptResult] = useState<OptimizerResponse | null>(null);
  const [customParetoIndex, setCustomParetoIndex] = useState<number | null>(null);
  const [showFrontierExplorer, setShowFrontierExplorer] = useState<boolean>(false);
  const [loadingOpt, setLoadingOpt] = useState<boolean>(false);
  const [optError, setOptError] = useState<string | null>(null);

  const [aiTab, setAiTab] = useState<"summary" | "quiz">("summary");
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiGuide, setAiGuide] = useState<StudyGuide | null>(null);
  const [guidePageIndex, setGuidePageIndex] = useState<number>(0);
  const [showAllGuidePages, setShowAllGuidePages] = useState<boolean>(false);
  const [wideReader, setWideReader] = useState<boolean>(false);
  const [aiQuestions, setAiQuestions] = useState<QuizQuestion[] | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [aiFallback, setAiFallback] = useState<boolean>(false);
  const [aiErrorReason, setAiErrorReason] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  function clearAiState() {
    setAiText(null);
    setAiGuide(null);
    setGuidePageIndex(0);
    setShowAllGuidePages(false);
    setAiQuestions(null);
    setQuizAnswers({});
    setAiFallback(false);
    setAiErrorReason(null);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (selectedCourseId) {
          setSelectedCourseId(null);
        } else if (showFrontierExplorer) {
          setShowFrontierExplorer(false);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedCourseId, showFrontierExplorer]);

  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const verifiedSet = useMemo(() => new Set(verifiedIds), [verifiedIds]);

  const allSinkCourseIds = useMemo(() => {
    const sources = new Set(edges.map((e) => e.sourceId));
    const sinks = courses.filter((c) => !sources.has(c.id)).map((c) => c.id);
    return sinks.length > 0 ? sinks : courses.map((c) => c.id);
  }, [courses, edges]);

  const prereqsByTarget = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const edge of edges) {
      const list = map.get(edge.targetId) ?? [];
      list.push(edge.sourceId);
      map.set(edge.targetId, list);
    }
    return map;
  }, [edges]);

  const positions = useMemo(
    () => computeDagrePositions(courses, edges, layoutDir),
    [courses, edges, layoutDir],
  );

  async function handleGenerateCurriculum(topicToBuild: string) {
    const clean = topicToBuild.trim();
    if (!clean) return;
    setGeneratingGraph(true);
    setGenError(null);

    const snapshot: GraphSnapshot = {
      courses,
      edges,
      activeTopic,
      graphSource,
      targetCourseId,
      completedIds,
      verifiedIds,
    };

    try {
      const response = await fetch("/api/generate-curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: clean,
          maxHours,
          maxDifficulty,
          maxDepth,
        }),
      });
      const data = (await response.json()) as {
        topic?: string;
        courses?: CanvasCourse[];
        edges?: CanvasEdge[];
        fallback?: boolean;
        errorReason?: string;
        error?: string;
      };
      if (!response.ok || !data.courses || !data.edges) {
        throw new Error(data.error ?? "Failed to generate curriculum");
      }

      setPreviousSnapshot(snapshot);
      setCourses(data.courses);
      setEdges(data.edges);
      setActiveTopic(data.topic ?? clean);
      setGraphSource(data.fallback ? "fallback" : "gemini");
      if (data.fallback && data.errorReason) {
        setGenError(`Using domain template (${data.errorReason})`);
      }
      setTargetCourseId(defaultTargetForGraph(data.courses, data.edges));
      const newRoot = defaultRootForGraph(data.courses, data.edges);
      setCompletedIds(newRoot ? [newRoot] : []);
      setVerifiedIds([]);
      setSelectedCourseId(null);
      clearAiState();
    } catch (error) {
      setGenError(
        error instanceof Error ? error.message : "Could not generate graph",
      );
    } finally {
      setGeneratingGraph(false);
    }
  }

  function handleUndoGraphSwitch() {
    if (!previousSnapshot) return;
    setCourses(previousSnapshot.courses);
    setEdges(previousSnapshot.edges);
    setActiveTopic(previousSnapshot.activeTopic);
    setGraphSource(previousSnapshot.graphSource);
    setTargetCourseId(previousSnapshot.targetCourseId);
    setCompletedIds(previousSnapshot.completedIds);
    setVerifiedIds(previousSnapshot.verifiedIds);
    setPreviousSnapshot(null);
    setSelectedCourseId(null);
    clearAiState();
    setGenError(null);
  }

  function handleResetToSeeded() {
    setPreviousSnapshot({
      courses,
      edges,
      activeTopic,
      graphSource,
      targetCourseId,
      completedIds,
      verifiedIds,
    });
    setCourses(initialCourses);
    setEdges(initialEdges);
    setActiveTopic("Computer Science");
    setGraphSource("seeded");
    setTargetCourseId(defaultTargetForGraph(initialCourses, initialEdges));
    const seedRoot = defaultRootForGraph(initialCourses, initialEdges);
    setCompletedIds(seedRoot ? [seedRoot] : []);
    setVerifiedIds([]);
    setSelectedCourseId(null);
    clearAiState();
    setGenError(null);
  }

  useEffect(() => {
    if (courses.length === 0) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingOpt(true);
      setOptError(null);

      try {
        const payload = {
          nodes: courses.map((course) => ({
            id: course.id,
            name: course.title,
            code: course.code,
            study_hours: completedSet.has(course.id) ? 0 : course.studyHours,
            difficulty: completedSet.has(course.id) ? 0 : course.difficulty,
            status: getCourseStatus(course, completedSet, prereqsByTarget),
          })),
          edges: edges.map((edge) => ({
            from: edge.sourceId,
            to: edge.targetId,
            type: "AND" as const,
          })),
          constraints: {
            target_course_ids:
              targetCourseId === "__ALL_MILESTONES__"
                ? allSinkCourseIds
                : targetCourseId
                  ? [targetCourseId]
                  : [],
            completed_course_ids: completedIds,
            max_study_hours: maxHours,
            max_difficulty: maxDifficulty,
            max_depth: maxDepth,
          },
        };

        const response = await fetch("/api/optimizer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        const data = (await response.json()) as OptimizerResponse & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error ?? "Optimizer request failed");
        }
        setOptResult(data);
        setCustomParetoIndex(null);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setOptError(
            error instanceof Error ? error.message : "Failed to optimize paths",
          );
        }
      } finally {
        setLoadingOpt(false);
      }
    }, 260);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    courses,
    edges,
    targetCourseId,
    allSinkCourseIds,
    maxHours,
    maxDifficulty,
    maxDepth,
    completedIds,
    completedSet,
    prereqsByTarget,
  ]);

  const activePath: ParetoPathLabel | null =
    customParetoIndex !== null && optResult?.pareto_frontier?.[customParetoIndex]
      ? optResult.pareto_frontier[customParetoIndex]
      : pathMode === "express"
        ? (optResult?.express_path ?? null)
        : (optResult?.deep_mastery_path ?? null);

  const activePathSet = useMemo(
    () => new Set(activePath?.path ?? []),
    [activePath],
  );

  const activePathStepMap = useMemo(() => {
    const map = new Map<string, number>();
    const list = activePath?.path ?? [];
    list.forEach((id, idx) => map.set(id, idx + 1));
    return map;
  }, [activePath]);

  const activeEdgePairs = useMemo(() => {
    const pairs = new Set<string>();
    const list = activePath?.path ?? [];
    for (let i = 0; i < list.length - 1; i++) {
      pairs.add(`${list[i]}->${list[i + 1]}`);
    }
    for (const edge of edges) {
      if (activePathSet.has(edge.sourceId) && activePathSet.has(edge.targetId)) {
        pairs.add(`${edge.sourceId}->${edge.targetId}`);
      }
    }
    return pairs;
  }, [activePath, edges, activePathSet]);

  const flowNodes: Node[] = useMemo(
    () =>
      courses.map((course) => ({
        id: course.id,
        type: "course",
        position: positions.get(course.id) ?? { x: 0, y: 0 },
        data: {
          code: course.code,
          title: course.title,
          studyHours: course.studyHours,
          difficulty: course.difficulty,
          status: getCourseStatus(course, completedSet, prereqsByTarget),
          inActivePath: activePathSet.has(course.id),
          pathStepIndex: activePathStepMap.get(course.id),
          isTarget: course.id === targetCourseId,
          hasActivePath: activePathSet.size > 0,
          pathMode,
          layoutDir,
          selected: selectedCourseId === course.id,
        },
      })),
    [
      courses,
      positions,
      completedSet,
      prereqsByTarget,
      activePathSet,
      activePathStepMap,
      targetCourseId,
      pathMode,
      layoutDir,
      selectedCourseId,
    ],
  );

  const activeStroke = pathMode === "express" ? "#E76F51" : "#36BA98";

  const flowEdges: Edge[] = useMemo(
    () =>
      edges.map((edge) => {
        const isHighlighted = activeEdgePairs.has(
          `${edge.sourceId}->${edge.targetId}`,
        );

        return {
          id: `${edge.sourceId}-${edge.targetId}`,
          source: edge.sourceId,
          target: edge.targetId,
          type: "smoothstep",
          pathOptions: { borderRadius: 6 },
          animated: false,
          zIndex: isHighlighted ? 10 : 0,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: isHighlighted ? 14 : 12,
            height: isHighlighted ? 14 : 12,
            color: isHighlighted ? activeStroke : "var(--edge-arrow-inactive)",
          },
          style: {
            stroke: isHighlighted ? activeStroke : "var(--edge-inactive)",
            strokeWidth: isHighlighted ? 2.25 : 1.25,
            opacity: activePathSet.size > 0 && !isHighlighted ? 0.55 : 1,
          },
        };
      }),
    [edges, activeEdgePairs, activePathSet, activeStroke],
  );

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );

  const selectedPrereqs = useMemo(() => {
    if (!selectedCourse) return [];
    const ids = prereqsByTarget.get(selectedCourse.id) ?? [];
    return courses.filter((c) => ids.includes(c.id));
  }, [selectedCourse, prereqsByTarget, courses]);

  function handleSelectQuizOption(qIdx: number, optIdx: number) {
    if (!aiQuestions || !selectedCourse) return;
    const nextAnswers = { ...quizAnswers, [qIdx]: optIdx };
    setQuizAnswers(nextAnswers);

    if (Object.keys(nextAnswers).length === aiQuestions.length) {
      const correctCount = aiQuestions.filter(
        (q, i) => nextAnswers[i] === q.correctIndex,
      ).length;
      if (correctCount / aiQuestions.length >= 0.75) {
        const cid = selectedCourse.id;
        setVerifiedIds((prev) => (prev.includes(cid) ? prev : [...prev, cid]));
        setCompletedIds((prev) => (prev.includes(cid) ? prev : [...prev, cid]));
      }
    }
  }

  function handleCoverAllTopicsPreset() {
    setTargetCourseId("__ALL_MILESTONES__");
    setMaxHours(550);
    setMaxDifficulty(50);
    setMaxDepth(15);
    setCustomParetoIndex(null);
  }

  function handleAutoRelaxConstraints() {
    setMaxHours(550);
    setMaxDifficulty(50);
    setMaxDepth(15);
    setCustomParetoIndex(null);
  }

  function toggleCompleted(courseId: string) {
    setCompletedIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  }

  async function runAiAction(kind: "summary" | "quiz", courseOverride?: CanvasCourse) {
    const target = courseOverride ?? selectedCourse;
    if (!target) return;
    const targetPrereqIds = new Set(prereqsByTarget.get(target.id) ?? []);
    const targetPrereqs = courses.filter((c) => targetPrereqIds.has(c.id));

    setAiTab(kind);
    setAiLoading(true);
    clearAiState();

    try {
      const endpoint =
        kind === "summary" ? "/api/node-summary" : "/api/quiz-generation";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeName: `${target.code}: ${target.title}`,
          topic: activeTopic,
          studyHours: target.studyHours,
          difficulty: target.difficulty,
          prerequisites: targetPrereqs.map((p) => `${p.code}: ${p.title}`),
          description: `Part of "${activeTopic}". ${target.studyHours} study hours, difficulty ${target.difficulty}/5.`,
        }),
      });
      const data = (await response.json()) as {
        text?: string;
        guide?: StudyGuide | null;
        questions?: QuizQuestion[] | null;
        fallback?: boolean;
        errorReason?: string;
        error?: string;
      };
      setAiFallback(Boolean(data.fallback));
      setAiErrorReason(data.errorReason ?? data.error ?? null);
      if (kind === "summary" && data.guide) {
        setAiGuide(data.guide);
      } else if (
        kind === "quiz" &&
        Array.isArray(data.questions) &&
        data.questions.length > 0
      ) {
        setAiQuestions(data.questions);
      } else {
        setAiText(data.text ?? data.error ?? "No response returned.");
      }
    } catch {
      setAiFallback(true);
      setAiErrorReason("Network error reaching AI study assistant.");
      setAiText("Failed to reach AI study assistant.");
    } finally {
      setAiLoading(false);
    }
  }

  // Auto-load the 4-Page Study Guide immediately whenever a course node is selected
  useEffect(() => {
    if (!selectedCourse) return;
    void runAiAction("summary", selectedCourse);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse?.id]);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Top Curriculum Bar */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerateCurriculum(topicInput);
            }}
            className="flex flex-1 items-center gap-2"
          >
            <label htmlFor="topic-input" className="sr-only">
              Curriculum topic
            </label>
            <input
              id="topic-input"
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Generate a prerequisite graph for any subject (e.g. Compilers, Rust, Linear Algebra)..."
              className="flex-1 min-w-0 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-ground)] px-3.5 py-2 text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:bg-[var(--bg-surface)] focus:border-[var(--accent-coral)] focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={generatingGraph || !topicInput.trim()}
              className="px-4 py-2 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-semibold hover:bg-[var(--btn-primary-hover)] disabled:opacity-45 transition cursor-pointer whitespace-nowrap"
            >
              {generatingGraph ? "Mapping..." : "Generate Graph"}
            </button>
            {graphSource !== "seeded" && (
              <button
                type="button"
                onClick={handleResetToSeeded}
                className="px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--ink-primary)] text-xs font-semibold hover:bg-[var(--bg-recessed)] transition cursor-pointer whitespace-nowrap"
              >
                Reset CS
              </button>
            )}
          </form>

          <div className="flex flex-wrap items-center gap-1.5 lg:border-l lg:border-[var(--border-subtle)] lg:pl-3">
            <span className="text-[11px] font-medium text-[var(--ink-muted)] mr-0.5">
              Presets:
            </span>
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                disabled={generatingGraph}
                onClick={() => {
                  setTopicInput(topic);
                  handleGenerateCurriculum(topic);
                }}
                className={`text-xs font-medium px-2.5 py-1 rounded-md border transition cursor-pointer ${
                  activeTopic.toLowerCase() === topic.toLowerCase()
                    ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] border-[var(--btn-primary-bg)]"
                    : "bg-[var(--bg-recessed)] text-[var(--ink-primary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {(genError || previousSnapshot) && (
          <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
            {genError ? (
              <span className="text-[var(--accent-coral-ink)] font-medium" role="alert">
                {genError}
              </span>
            ) : (
              <span className="text-[var(--ink-secondary)]">
                Active curriculum:{" "}
                <strong className="text-[var(--ink-primary)]">{activeTopic}</strong>{" "}
                (
                {graphSource === "seeded"
                  ? "Neon DB"
                  : graphSource === "gemini"
                    ? "Gemini AI"
                    : "Template"}
                )
              </span>
            )}
            {previousSnapshot && (
              <button
                type="button"
                onClick={handleUndoGraphSwitch}
                className="text-xs font-semibold text-[var(--accent-coral-ink)] hover:underline cursor-pointer"
              >
                Undo switch to {previousSnapshot.activeTopic}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Workbench */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch">
        {/* Left Control Rail */}
        <aside
          aria-label="Optimizer constraints and route controls"
          className="w-full lg:w-[300px] shrink-0 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-xs flex flex-col justify-between gap-4 lg:h-[640px] lg:overflow-y-auto"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-[var(--ink-muted)]">
                  Active Graph
                </div>
                <div className="text-sm font-bold text-[var(--ink-primary)] truncate">
                  {activeTopic}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-recessed)] text-[var(--ink-secondary)] text-[11px] font-medium shrink-0">
                {graphSource === "seeded"
                  ? "Neon DB"
                  : graphSource === "gemini"
                    ? "Gemini AI"
                    : "Template"}
              </span>
            </div>

            <div>
              <label
                htmlFor="target-course"
                className="block text-xs font-semibold text-[var(--ink-primary)] mb-1.5"
              >
                Target Milestone
              </label>
              <select
                id="target-course"
                value={targetCourseId}
                onChange={(e) => setTargetCourseId(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-ground)] px-2.5 py-2 text-xs font-medium text-[var(--ink-primary)] focus:bg-[var(--bg-surface)] focus:border-[var(--accent-coral)] focus:outline-none"
              >
                <option value="__ALL_MILESTONES__">
                  Cover All Tracks &amp; Milestones
                </option>
                {courses.map((course) => {
                  const isDone = completedSet.has(course.id);
                  return (
                    <option key={course.id} value={course.id}>
                      {isDone ? "✓ " : ""}
                      {course.code} — {course.title}
                      {isDone ? " (Completed)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-[var(--ink-primary)]">
                  Path Strategy
                </span>
                <button
                  type="button"
                  onClick={handleCoverAllTopicsPreset}
                  className="text-[11px] font-semibold text-[var(--accent-jade-ink)] hover:underline cursor-pointer"
                >
                  Cover 100%
                </button>
              </div>
              <div
                role="tablist"
                aria-label="Path optimization strategy"
                className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[var(--bg-recessed)] border border-[var(--border-subtle)]"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={pathMode === "express" && customParetoIndex === null}
                  onClick={() => {
                    setPathMode("express");
                    setCustomParetoIndex(null);
                  }}
                  className={`py-2 px-2 rounded-md text-xs font-semibold transition cursor-pointer flex flex-col items-start ${
                    pathMode === "express" && customParetoIndex === null
                      ? "bg-[#E76F51] text-white shadow-xs"
                      : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                  }`}
                >
                  <span>Express</span>
                  {optResult?.express_path && (
                    <span
                      className={`text-[10px] font-mono tabular-nums mt-0.5 ${
                        pathMode === "express" && customParetoIndex === null
                          ? "text-white/90"
                          : "text-[var(--ink-muted)]"
                      }`}
                    >
                      {optResult.express_path.total_hours}h ·{" "}
                      {optResult.express_path.path.length}c
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={
                    pathMode === "deep_mastery" && customParetoIndex === null
                  }
                  onClick={() => {
                    setPathMode("deep_mastery");
                    setCustomParetoIndex(null);
                  }}
                  className={`py-2 px-2 rounded-md text-xs font-semibold transition cursor-pointer flex flex-col items-start ${
                    pathMode === "deep_mastery" && customParetoIndex === null
                      ? "bg-[#36BA98] text-[#141210] shadow-xs"
                      : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                  }`}
                >
                  <span>Deep Mastery</span>
                  {optResult?.deep_mastery_path && (
                    <span
                      className={`text-[10px] font-mono tabular-nums mt-0.5 ${
                        pathMode === "deep_mastery" && customParetoIndex === null
                          ? "text-[#141210]/80"
                          : "text-[var(--ink-muted)]"
                      }`}
                    >
                      {optResult.deep_mastery_path.total_hours}h ·{" "}
                      {optResult.deep_mastery_path.path.length}c
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="max-hours" className="font-semibold text-[var(--ink-primary)]">
                    Time Budget
                  </label>
                  <span className="font-mono font-semibold text-[var(--ink-primary)] tabular-nums">
                    {maxHours}h
                  </span>
                </div>
                <input
                  id="max-hours"
                  type="range"
                  min={40}
                  max={550}
                  step={10}
                  value={maxHours}
                  onChange={(e) => setMaxHours(Number(e.target.value))}
                  className="w-full accent-[#E76F51] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="max-diff" className="font-semibold text-[var(--ink-primary)]">
                    Difficulty Cap
                  </label>
                  <span className="font-mono font-semibold text-[var(--ink-primary)] tabular-nums">
                    {maxDifficulty} pts
                  </span>
                </div>
                <input
                  id="max-diff"
                  type="range"
                  min={5}
                  max={50}
                  step={1}
                  value={maxDifficulty}
                  onChange={(e) => setMaxDifficulty(Number(e.target.value))}
                  className="w-full accent-[#36BA98] cursor-pointer"
                />
                <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                  Cumulative sum of 1–5 course difficulty across the route.
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="max-depth" className="font-semibold text-[var(--ink-primary)]">
                    Max Courses
                  </label>
                  <span className="font-mono font-semibold text-[var(--ink-primary)] tabular-nums">
                    {maxDepth}
                  </span>
                </div>
                <input
                  id="max-depth"
                  type="range"
                  min={2}
                  max={15}
                  step={1}
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(Number(e.target.value))}
                  className="w-full accent-[#F4A261] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Live Route Telemetry */}
          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2.5 text-xs">
            {loadingOpt ? (
              <div className="text-[var(--ink-secondary)] font-medium">
                Computing Pareto frontier in Go engine...
              </div>
            ) : optError ? (
              <div className="rounded-lg border border-[var(--accent-coral-border)] bg-[var(--accent-coral-soft)] p-2.5 text-[var(--accent-coral-ink)] font-medium">
                {optError}
              </div>
            ) : activePath ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                      customParetoIndex !== null
                        ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]"
                        : pathMode === "express"
                          ? "bg-[#E76F51] text-white"
                          : "bg-[#36BA98] text-[#141210]"
                    }`}
                  >
                    {customParetoIndex !== null
                      ? `Pareto #${customParetoIndex + 1}`
                      : pathMode === "express"
                        ? "Express Route"
                        : "Deep Mastery"}
                  </span>
                  {typeof activePath.coverage_pct === "number" && (
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border tabular-nums ${
                        activePath.coverage_pct >= 75
                          ? "bg-[var(--accent-jade-soft)] text-[var(--accent-jade-ink)] border-[var(--accent-jade-border)]"
                          : activePath.coverage_pct >= 50
                            ? "bg-[var(--accent-saffron-soft)] text-[var(--accent-saffron-ink)] border-[var(--accent-saffron-border)]"
                            : "bg-[var(--accent-apricot-soft)] text-[var(--accent-apricot-ink)] border-[var(--accent-apricot-border)]"
                      }`}
                    >
                      {activePath.coverage_pct}% Coverage
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-[var(--bg-ground)] border border-[var(--border-subtle)] p-2 text-center tabular-nums">
                  <div>
                    <div className="text-[10px] text-[var(--ink-muted)]">Hours</div>
                    <div className="font-mono font-bold text-[var(--ink-primary)]">
                      {activePath.total_hours}h
                    </div>
                  </div>
                  <div className="border-x border-[var(--border-subtle)]">
                    <div className="text-[10px] text-[var(--ink-muted)]">Diff Sum</div>
                    <div className="font-mono font-bold text-[var(--ink-primary)]">
                      {activePath.total_difficulty}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--ink-muted)]">Courses</div>
                    <div className="font-mono font-bold text-[var(--ink-primary)]">
                      {activePath.path.length}
                    </div>
                  </div>
                </div>

                <div className="font-mono text-[11px] text-[var(--ink-secondary)] leading-relaxed break-words">
                  {activePath.path.join(" → ")}
                </div>

                {Array.isArray(activePath.missing_prereqs) &&
                  activePath.missing_prereqs.length > 0 && (
                    <div className="rounded-lg border border-[var(--accent-saffron-border)] bg-[var(--accent-saffron-soft)] p-2.5 text-[11px] text-[var(--accent-saffron-ink)] space-y-1.5">
                      <div>
                        <strong className="font-semibold">Foundation gap:</strong>{" "}
                        skips{" "}
                        <span className="font-mono font-semibold">
                          {activePath.missing_prereqs.join(", ")}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCoverAllTopicsPreset}
                        className="w-full py-1 rounded bg-[#E9C46A] text-[#1C1915] font-semibold hover:brightness-95 transition cursor-pointer"
                      >
                        Cover All Foundations →
                      </button>
                    </div>
                  )}

                {optResult?.pareto_frontier &&
                  optResult.pareto_frontier.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowFrontierExplorer((prev) => !prev)}
                      className="w-full py-2 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-ground)] hover:bg-[var(--bg-recessed)] text-[var(--ink-primary)] font-semibold transition cursor-pointer flex items-center justify-between"
                    >
                      <span>
                        Pareto Frontier ({optResult.pareto_frontier.length})
                      </span>
                      <span className="text-[10px]">
                        {showFrontierExplorer ? "Hide ▴" : "Explore ▾"}
                      </span>
                    </button>
                  )}
              </>
            ) : (
              <div className="rounded-lg border border-[var(--accent-apricot-border)] bg-[var(--accent-apricot-soft)] p-3 space-y-2">
                <p className="text-[var(--accent-apricot-ink)] font-medium leading-snug">
                  No route fits within {maxHours}h / {maxDifficulty} diff /{" "}
                  {maxDepth} courses.
                </p>
                <button
                  type="button"
                  onClick={handleAutoRelaxConstraints}
                  className="w-full py-1.5 px-2.5 rounded-md bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] font-semibold hover:bg-[var(--btn-primary-hover)] transition cursor-pointer"
                >
                  Auto-relax constraints
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Center Interactive Graph / Roadmap Canvas */}
        <div className="relative flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] overflow-hidden shadow-xs h-[580px] lg:h-[640px]">
          <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div
              role="tablist"
              aria-label="Workspace view"
              className="pointer-events-auto inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-xs p-1 shadow-xs"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "graph"}
                onClick={() => setViewMode("graph")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  viewMode === "graph"
                    ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]"
                    : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                }`}
              >
                Graph
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "roadmap"}
                onClick={() => setViewMode("roadmap")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  viewMode === "roadmap"
                    ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]"
                    : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                }`}
              >
                Roadmap
              </button>
            </div>

            {viewMode === "graph" && (
              <div className="pointer-events-auto inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-xs p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setLayoutDir("TB")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                    layoutDir === "TB"
                      ? "bg-[var(--bg-recessed)] text-[var(--ink-primary)]"
                      : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                  }`}
                >
                  Hierarchy ↓
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutDir("LR")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                    layoutDir === "LR"
                      ? "bg-[var(--bg-recessed)] text-[var(--ink-primary)]"
                      : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                  }`}
                >
                  Flow →
                </button>
              </div>
            )}
          </div>

          {showFrontierExplorer &&
            optResult?.pareto_frontier &&
            optResult.pareto_frontier.length > 0 && (
              <div className="absolute top-14 left-3 z-20 w-[372px] max-w-[calc(100%-24px)] rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3.5 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--ink-primary)]">
                    Pareto Frontier Explorer
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFrontierExplorer(false)}
                    aria-label="Close Pareto frontier explorer"
                    className="rounded p-1 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <ParetoFrontierChart
                  frontier={optResult.pareto_frontier}
                  expressPath={optResult.express_path}
                  deepMasteryPath={optResult.deep_mastery_path}
                  activePath={activePath}
                  onSelectOption={(idx, kind) => {
                    setCustomParetoIndex(idx);
                    if (kind === "express") setPathMode("express");
                    else if (kind === "deep_mastery") setPathMode("deep_mastery");
                  }}
                />
              </div>
            )}

          {generatingGraph && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[var(--bg-ground)]/85 backdrop-blur-xs px-6 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--border-strong)] border-t-[#E76F51] animate-spin mb-3" />
              <p className="text-sm font-semibold text-[var(--ink-primary)]">
                Mapping prerequisite graph for &ldquo;{topicInput}&rdquo;...
              </p>
              <p className="text-xs text-[var(--ink-secondary)] mt-1">
                Building courses, dependency edges, and running Go Pareto optimization.
              </p>
            </div>
          )}

          {viewMode === "graph" ? (
            <>
              <ReactFlow
                key={`${layoutDir}-${activeTopic}`}
                nodes={flowNodes}
                edges={flowEdges}
                nodeTypes={nodeTypes}
                onNodeClick={(event, node) => {
                  if (event.altKey || event.shiftKey) {
                    toggleCompleted(node.id);
                    return;
                  }
                  setSelectedCourseId(node.id);
                  clearAiState();
                }}
                fitView
                fitViewOptions={{ padding: 0.18 }}
                minZoom={0.25}
                maxZoom={1.5}
                nodesConnectable={false}
                nodesDraggable
                proOptions={{ hideAttribution: true }}
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  color="var(--canvas-dot)"
                  gap={28}
                  size={1}
                />
                <Controls showInteractive={false} position="bottom-left" />
              </ReactFlow>

              {showCanvasHint && !selectedCourse && (
                <div className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 z-10 hidden sm:flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 px-3 py-1.5 text-[11px] text-[var(--ink-secondary)] shadow-xs">
                  <span>
                    Click any node for Study Guide &amp; Quiz ·{" "}
                    <kbd className="font-mono text-[10px] px-1 py-0.5 rounded bg-[var(--bg-recessed)] text-[var(--ink-primary)]">
                      Alt+Click
                    </kbd>{" "}
                    to mark done
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCanvasHint(false)}
                    aria-label="Dismiss hint"
                    className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="h-full overflow-y-auto pt-16 pb-6 px-5">
              {activePath ? (
                <div className="max-w-2xl mx-auto space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-[var(--ink-secondary)] mb-2">
                    <span>
                      Recommended{" "}
                      <strong className="text-[var(--ink-primary)]">
                        {pathMode === "express" ? "Express" : "Deep Mastery"}
                      </strong>{" "}
                      sequence ({activePath.path.length} courses)
                    </span>
                    <span>Click any step for Study Guide &amp; Quiz</span>
                  </div>
                  {activePath.path.map((courseId, idx) => {
                    const course = courses.find((c) => c.id === courseId);
                    if (!course) return null;
                    const isDone = completedSet.has(course.id);
                    const isSelected = selectedCourseId === course.id;
                    return (
                      <div
                        key={course.id}
                        className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition ${
                          isSelected
                            ? "border-[var(--ink-primary)] bg-[var(--bg-surface)] ring-2 ring-[#F4A261]/35 shadow-xs"
                            : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            clearAiState();
                          }}
                          className="flex items-center gap-3.5 text-left flex-1 min-w-0 cursor-pointer"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 tabular-nums ${
                              isDone
                                ? "bg-[#36BA98] text-[#141210]"
                                : pathMode === "express"
                                  ? "bg-[#E76F51] text-white"
                                  : "bg-[#36BA98] text-[#141210]"
                            }`}
                          >
                            {isDone ? "✓" : idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-[var(--ink-secondary)]">
                                {course.code}
                              </span>
                              <span className="text-sm font-semibold text-[var(--ink-primary)] truncate">
                                {course.title}
                              </span>
                            </div>
                            <div className="text-xs text-[var(--ink-secondary)] mt-0.5 tabular-nums">
                              {course.studyHours}h study · Difficulty{" "}
                              {course.difficulty}/5
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleCompleted(course.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer shrink-0 ${
                            isDone
                              ? "border-[var(--accent-jade-border)] bg-[var(--accent-jade-soft)] text-[var(--accent-jade-ink)]"
                              : "border-[var(--border-strong)] bg-[var(--bg-ground)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)]"
                          }`}
                        >
                          {isDone ? "Completed" : "Mark Done"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <p className="text-sm text-[var(--ink-secondary)] mb-3">
                    No route fits your current constraints.
                  </p>
                  <button
                    type="button"
                    onClick={handleAutoRelaxConstraints}
                    className="px-4 py-2 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-semibold hover:bg-[var(--btn-primary-hover)] transition cursor-pointer"
                  >
                    Auto-relax constraints
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Docked Course Inspector */}
        {selectedCourse && (
          <aside
            aria-label={`Course details for ${selectedCourse.code}`}
            className={`w-full ${
              wideReader ? "lg:w-[540px]" : "lg:w-[400px]"
            } shrink-0 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-xs flex flex-col lg:h-[640px] overflow-y-auto transition-[width] duration-150`}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <span className="font-mono text-xs font-semibold text-[var(--ink-secondary)]">
                  {selectedCourse.code}
                </span>
                <h3 className="text-base font-bold text-[var(--ink-primary)] leading-snug mt-0.5">
                  {selectedCourse.title}
                </h3>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setWideReader((prev) => !prev)}
                  className="hidden lg:inline-flex items-center px-2 py-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-ground)] text-[11px] font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] transition cursor-pointer"
                  title={wideReader ? "Switch to compact width" : "Expand reader width"}
                >
                  {wideReader ? "Compact" : "Expand ↔"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCourseId(null)}
                  aria-label="Close inspector (Escape)"
                  title="Close (Esc)"
                  className="rounded-lg p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] transition cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3.5 tabular-nums">
              <div className="rounded-lg bg-[var(--bg-ground)] border border-[var(--border-subtle)] p-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Study Time
                </div>
                <div className="text-sm font-bold text-[var(--ink-primary)] mt-0.5">
                  {selectedCourse.studyHours} hours
                </div>
              </div>
              <div className="rounded-lg bg-[var(--bg-ground)] border border-[var(--border-subtle)] p-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Difficulty
                </div>
                <div className="text-sm font-bold text-[var(--ink-primary)] mt-0.5">
                  {selectedCourse.difficulty} / 5
                </div>
              </div>
            </div>

            {selectedPrereqs.length > 0 && (
              <div className="mb-3.5">
                <div className="text-[11px] font-semibold text-[var(--ink-secondary)] mb-1.5">
                  Prerequisites
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPrereqs.map((pre) => (
                    <button
                      key={pre.id}
                      type="button"
                      onClick={() => {
                        setSelectedCourseId(pre.id);
                        clearAiState();
                      }}
                      className="text-xs font-mono px-2 py-1 rounded-md bg-[var(--bg-recessed)] border border-[var(--border-subtle)] text-[var(--ink-primary)] hover:border-[var(--border-strong)] transition cursor-pointer"
                    >
                      {pre.code}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => toggleCompleted(selectedCourse.id)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer mb-4 ${
                completedSet.has(selectedCourse.id)
                  ? "bg-[#36BA98] text-[#141210] hover:brightness-95"
                  : "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-hover)]"
              }`}
            >
              {completedSet.has(selectedCourse.id)
                ? verifiedSet.has(selectedCourse.id)
                  ? "✓ Verified by Diagnostic Quiz (Undo)"
                  : "✓ Marked Completed (Take Quiz to Verify)"
                : "Mark as Completed"}
            </button>

            {/* AI Study Assistant */}
            <div className="border-t border-[var(--border-subtle)] pt-3.5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-xs font-bold text-[var(--ink-primary)]">
                  AI Study Assistant
                </div>
                {(aiGuide || aiQuestions || aiText) && !aiLoading && (
                  <span
                    title={aiErrorReason ?? undefined}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      aiFallback
                        ? "bg-[var(--accent-saffron-soft)] text-[var(--accent-saffron-ink)] border-[var(--accent-saffron-border)]"
                        : "bg-[var(--accent-jade-soft)] text-[var(--accent-jade-ink)] border-[var(--accent-jade-border)]"
                    }`}
                  >
                    {aiFallback ? "Fallback Mode" : "Gemini AI"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => runAiAction("summary")}
                  disabled={aiLoading}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    aiTab === "summary" && (aiGuide || aiText)
                      ? "border-[var(--btn-primary-bg)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]"
                      : "border-[var(--border-strong)] bg-[var(--bg-ground)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)]"
                  }`}
                >
                  Study Guide
                </button>
                <button
                  type="button"
                  onClick={() => runAiAction("quiz")}
                  disabled={aiLoading}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    aiTab === "quiz" && (aiQuestions || aiText)
                      ? "border-[var(--btn-primary-bg)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]"
                      : "border-[var(--border-strong)] bg-[var(--bg-ground)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)]"
                  }`}
                >
                  Practice Quiz
                </button>
              </div>

              {aiFallback && aiErrorReason && !aiLoading && (
                <div className="mb-3 rounded-lg border border-[var(--accent-saffron-border)] bg-[var(--accent-saffron-soft)] px-3 py-2 text-[11px] text-[var(--accent-saffron-ink)] leading-snug">
                  <strong className="font-semibold">Using fallback:</strong>{" "}
                  {aiErrorReason}
                </div>
              )}

              {aiLoading && (
                <div className="rounded-lg bg-[var(--bg-ground)] border border-[var(--border-subtle)] p-3 text-xs text-[var(--ink-secondary)] animate-pulse">
                  Generating{" "}
                  {aiTab === "summary"
                    ? "structured study guide"
                    : "diagnostic quiz"}
                  ...
                </div>
              )}

              {aiGuide && !aiLoading && (() => {
                const modules = ensureStudyGuideModules(aiGuide);
                const safeIdx = Math.min(guidePageIndex, Math.max(0, modules.length - 1));
                const visibleModules = showAllGuidePages
                  ? modules.map((m, idx) => ({ mod: m, idx }))
                  : [{ mod: modules[safeIdx], idx: safeIdx }];

                return (
                  <div className="space-y-3 text-xs text-[var(--ink-primary)] leading-relaxed">
                    {/* Multi-Page Syllabus Navigation Header */}
                    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-ground)] p-2.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-[var(--ink-primary)]">
                          Multi-Page Study Guide ({modules.length} Chapters)
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAllGuidePages((prev) => !prev)}
                          className="text-[11px] font-semibold text-[var(--accent-coral-ink)] hover:underline cursor-pointer"
                        >
                          {showAllGuidePages ? "Single-Page View" : "View All Pages"}
                        </button>
                      </div>

                      {!showAllGuidePages && (
                        <div
                          role="tablist"
                          aria-label="Study guide chapters"
                          className="grid grid-cols-4 gap-1"
                        >
                          {modules.map((mod, idx) => {
                            const active = idx === safeIdx;
                            return (
                              <button
                                key={idx}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setGuidePageIndex(idx)}
                                title={mod.title}
                                className={`py-1.5 px-2 rounded text-[11px] font-semibold transition cursor-pointer truncate ${
                                  active
                                    ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]"
                                    : "bg-[var(--bg-surface)] text-[var(--ink-secondary)] border border-[var(--border-subtle)] hover:text-[var(--ink-primary)]"
                                }`}
                              >
                                Page {idx + 1}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Active Chapter(s) */}
                    {visibleModules.map(({ mod, idx }) => (
                      <article
                        key={idx}
                        className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-3"
                      >
                        <div className="border-b border-[var(--border-subtle)] pb-2.5">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--accent-coral-ink)]">
                              Chapter {idx + 1} of {modules.length}
                            </span>
                            <span className="text-[10px] text-[var(--ink-muted)] tabular-nums">
                              {selectedCourse.code}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-[var(--ink-primary)] leading-snug">
                            {mod.title}
                          </h4>
                          {mod.summary && (
                            <p className="text-[var(--ink-secondary)] mt-1">
                              {mod.summary}
                            </p>
                          )}
                        </div>

                        {/* Deep Technical Sections */}
                        {mod.sections.length > 0 && (
                          <div className="space-y-2.5">
                            {mod.sections.map((sec, sIdx) => (
                              <div
                                key={sIdx}
                                className="rounded-lg bg-[var(--bg-ground)] border border-[var(--border-subtle)] p-2.5"
                              >
                                <div className="font-bold text-[var(--ink-primary)] mb-1">
                                  {sec.heading}
                                            </div>
                                <p className="text-[var(--ink-secondary)] whitespace-pre-line">
                                  {sec.body}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Page 1 extra: Mental Model */}
                        {idx === 0 && aiGuide.mentalModel && (
                          <div className="rounded-lg bg-[var(--accent-jade-soft)] border border-[var(--accent-jade-border)] p-3">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-jade-ink)] mb-1">
                              Core Mental Model
                            </div>
                            <p className="text-[var(--ink-primary)]">
                              {aiGuide.mentalModel}
                            </p>
                          </div>
                        )}

                        {/* Page 2 extra: Key Concepts Glossary */}
                        {idx === 1 && aiGuide.keyConcepts.length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1.5">
                              Core Concepts Glossary ({aiGuide.keyConcepts.length})
                            </div>
                            <div className="space-y-1.5">
                              {aiGuide.keyConcepts.map((concept, cIdx) => (
                                <div
                                  key={cIdx}
                                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-ground)] p-2.5"
                                >
                                  <div className="font-semibold text-[var(--ink-primary)]">
                                    {concept.term}
                                  </div>
                                  <p className="text-[var(--ink-secondary)] mt-0.5">
                                    {concept.explanation}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Chapter Code / Formula / Architecture Block */}
                        {mod.codeOrFormula && (
                          <div className="rounded-lg bg-[#1C1915] text-[#FAF7F2] p-3 border border-[var(--border-subtle)]">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#E9C46A] mb-1.5">
                              Implementation / Formal Trace
                            </div>
                            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed overflow-x-auto">
                              {mod.codeOrFormula}
                            </pre>
                          </div>
                        )}

                        {/* Page 4 extras: Common Pitfalls & Hands-On Lab */}
                        {idx === modules.length - 1 && (
                          <>
                            {aiGuide.commonPitfalls.length > 0 && (
                              <div className="rounded-lg bg-[var(--accent-coral-soft)] border border-[var(--accent-coral-border)] p-3">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-coral-ink)] mb-1">
                                  Common Pitfalls to Avoid
                                </div>
                                <ul className="list-disc pl-4 space-y-1 text-[var(--ink-primary)]">
                                  {aiGuide.commonPitfalls.map((pitfall, pIdx) => (
                                    <li key={pIdx}>{pitfall}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {aiGuide.practiceTask && (
                              <div className="rounded-lg bg-[var(--accent-apricot-soft)] border border-[var(--accent-apricot-border)] p-3">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-apricot-ink)] mb-1">
                                  Hands-On Mastery Project
                                </div>
                                <p className="text-[var(--ink-primary)]">
                                  {aiGuide.practiceTask}
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        {/* Chapter Takeaways */}
                        {mod.takeaways.length > 0 && (
                          <div className="rounded-lg bg-[var(--bg-recessed)] border border-[var(--border-subtle)] p-2.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-secondary)] mb-1">
                              Chapter {idx + 1} Key Takeaways
                            </div>
                            <ul className="list-disc pl-4 space-y-1 text-[var(--ink-primary)]">
                              {mod.takeaways.map((item, tIdx) => (
                                <li key={tIdx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </article>
                    ))}

                    {/* Bottom Page Stepper */}
                    {!showAllGuidePages && (
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          disabled={safeIdx === 0}
                          onClick={() =>
                            setGuidePageIndex((p) => Math.max(0, p - 1))
                          }
                          className="px-3 py-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-ground)] text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)] disabled:opacity-40 transition cursor-pointer"
                        >
                          ← Prev Page
                        </button>
                        <span className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
                          Page {safeIdx + 1} / {modules.length}
                        </span>
                        {safeIdx < modules.length - 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setGuidePageIndex((p) =>
                                Math.min(modules.length - 1, p + 1),
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] text-xs font-semibold hover:bg-[var(--btn-primary-hover)] transition cursor-pointer"
                          >
                            Next Page →
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => runAiAction("quiz")}
                            className="px-3 py-1.5 rounded-lg bg-[#36BA98] text-[#141210] text-xs font-semibold hover:brightness-95 transition cursor-pointer"
                          >
                            Take Practice Quiz →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {aiQuestions && !aiLoading && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-[var(--bg-ground)] border border-[var(--border-subtle)] px-3 py-2">
                    <span className="font-semibold text-[var(--ink-primary)] tabular-nums">
                      Score:{" "}
                      {
                        aiQuestions.filter(
                          (q, idx) => quizAnswers[idx] === q.correctIndex,
                        ).length
                      }{" "}
                      / {aiQuestions.length}
                    </span>
                    {Object.keys(quizAnswers).length > 0 && (
                      <button
                        type="button"
                        onClick={() => setQuizAnswers({})}
                        className="text-[11px] font-semibold text-[var(--accent-coral-ink)] hover:underline cursor-pointer"
                      >
                        Reset Quiz
                      </button>
                    )}
                  </div>

                  {Object.keys(quizAnswers).length === aiQuestions.length && (
                    <div
                      className={`rounded-lg border p-3 text-xs leading-snug ${
                        aiQuestions.filter(
                          (q, idx) => quizAnswers[idx] === q.correctIndex,
                        ).length /
                          aiQuestions.length >=
                        0.75
                          ? "border-[var(--accent-jade-border)] bg-[var(--accent-jade-soft)] text-[var(--accent-jade-ink)]"
                          : "border-[var(--accent-saffron-border)] bg-[var(--accent-saffron-soft)] text-[var(--accent-saffron-ink)]"
                      }`}
                    >
                      {aiQuestions.filter(
                        (q, idx) => quizAnswers[idx] === q.correctIndex,
                      ).length /
                        aiQuestions.length >=
                      0.75 ? (
                        <div>
                          <strong className="font-bold">✓ Mastery Verified.</strong>{" "}
                          {selectedCourse.code} is marked completed and the Go
                          Pareto engine has re-optimized your remaining route.
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div>
                            <strong className="font-bold">
                              Review Recommended (&lt;75%):
                            </strong>{" "}
                            Strengthen your foundations before moving past{" "}
                            {selectedCourse.code}.
                          </div>
                          {selectedPrereqs.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 pt-1">
                              <span className="text-[11px]">
                                Review prerequisite:
                              </span>
                              {selectedPrereqs.map((pre) => (
                                <button
                                  key={pre.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCourseId(pre.id);
                                    clearAiState();
                                  }}
                                  className="px-2 py-0.5 rounded bg-[var(--bg-surface)]/60 hover:bg-[var(--bg-surface)] font-mono text-[11px] font-semibold cursor-pointer"
                                >
                                  {pre.code}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {aiQuestions.map((q, qIdx) => {
                    const picked = quizAnswers[qIdx];
                    const answered = picked !== undefined;
                    const letters = ["A", "B", "C", "D"];

                    return (
                      <div
                        key={qIdx}
                        className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-[var(--ink-primary)] leading-snug">
                            {qIdx + 1}. {q.question}
                          </p>
                          <span className="shrink-0 px-1.5 py-0.5 rounded bg-[var(--bg-recessed)] text-[10px] font-semibold uppercase text-[var(--ink-secondary)]">
                            {q.difficulty}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = optIdx === q.correctIndex;
                            const isPicked = picked === optIdx;
                            let btnClass =
                              "border-[var(--border-subtle)] bg-[var(--bg-ground)] text-[var(--ink-primary)] hover:bg-[var(--bg-recessed)]";
                            if (answered) {
                              if (isCorrect) {
                                btnClass =
                                  "border-[var(--accent-jade-border)] bg-[var(--accent-jade-soft)] text-[var(--accent-jade-ink)] font-medium";
                              } else if (isPicked) {
                                btnClass =
                                  "border-[var(--accent-coral-border)] bg-[var(--accent-coral-soft)] text-[var(--accent-coral-ink)]";
                              } else {
                                btnClass =
                                  "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-muted)]";
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                disabled={answered}
                                onClick={() =>
                                  handleSelectQuizOption(qIdx, optIdx)
                                }
                                className={`w-full text-left rounded-md border px-2.5 py-2 transition flex items-start gap-2 ${btnClass} ${
                                  answered ? "cursor-default" : "cursor-pointer"
                                }`}
                              >
                                <span className="font-mono font-bold shrink-0">
                                  {letters[optIdx]}.
                                </span>
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {answered && (
                          <div
                            className={`rounded-md px-2.5 py-2 text-[11px] leading-snug ${
                              picked === q.correctIndex
                                ? "bg-[var(--accent-jade-soft)] text-[var(--accent-jade-ink)]"
                                : "bg-[var(--accent-coral-soft)] text-[var(--accent-coral-ink)]"
                            }`}
                          >
                            <span className="font-semibold">
                              {picked === q.correctIndex
                                ? "Correct. "
                                : "Not quite. "}
                            </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {aiText && !aiGuide && !aiQuestions && !aiLoading && (
                <div className="rounded-lg bg-[var(--bg-ground)] border border-[var(--border-subtle)] p-3 text-xs text-[var(--ink-secondary)] whitespace-pre-wrap leading-relaxed">
                  {aiText}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
