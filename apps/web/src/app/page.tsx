import { Suspense } from "react";
import { AuthNav } from "@/components/auth-nav";
import { BrandLogo } from "@/components/brand-logo";
import {
  CurriculumCanvas,
  type CanvasCourse,
  type CanvasEdge,
} from "@/components/curriculum-canvas";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const courses = [
  ["CS101", "Intro to Computer Science", 20, 1],
  ["CS102", "Data Structures & Algorithms", 40, 2],
  ["CS201", "Computer Architecture", 35, 3],
  ["CS202", "Operating Systems", 45, 4],
  ["CS203", "Database Systems", 30, 2],
  ["CS301", "Networking", 30, 3],
  ["CS302", "Distributed Systems", 50, 5],
  ["CS303", "Compiler Design", 50, 5],
  ["MATH101", "Discrete Mathematics", 25, 2],
  ["MATH102", "Linear Algebra", 30, 3],
  ["AI101", "Intro to AI", 35, 3],
  ["AI102", "Machine Learning", 45, 4],
  ["WEB101", "Web Development Fundamentals", 15, 1],
  ["WEB102", "Full-Stack Web Dev", 35, 3],
  ["CAP500", "Capstone Project", 60, 5],
] as const;

const fallbackCourses: CanvasCourse[] = courses.map(
  ([code, title, studyHours, difficulty]) => ({
    id: code,
    code,
    title,
    studyHours,
    difficulty,
  }),
);

const prerequisitePairs = [
  ["CS101", "CS102"], ["MATH101", "CS102"], ["CS102", "CS201"],
  ["CS201", "CS202"], ["CS201", "CS301"], ["CS102", "CS203"], ["CS202", "CS301"],
  ["CS301", "CS302"], ["CS203", "CS302"], ["CS102", "CS303"], ["CS303", "CAP500"],
  ["MATH102", "AI101"], ["CS102", "AI101"], ["AI101", "AI102"], ["AI102", "CAP500"],
  ["CS101", "WEB101"], ["WEB101", "WEB102"], ["CS203", "WEB102"],
  ["CS302", "CAP500"], ["WEB102", "CAP500"],
] as const;

const fallbackEdges: CanvasEdge[] = prerequisitePairs.map(
  ([sourceCode, targetCode]) => ({
    sourceId: sourceCode,
    targetId: targetCode,
    sourceCode,
    targetCode,
  }),
);

async function loadCurriculum(): Promise<{
  courses: CanvasCourse[];
  edges: CanvasEdge[];
}> {
  if (!process.env.DATABASE_URL) {
    return { courses: fallbackCourses, edges: fallbackEdges };
  }

  try {
    const [dbCourses, dbEdges] = await Promise.all([
      prisma.course.findMany({ orderBy: { code: "asc" } }),
      prisma.edge.findMany({
        include: {
          source: { include: { course: true } },
          target: { include: { course: true } },
        },
      }),
    ]);

    if (dbCourses.length === 0) {
      return { courses: fallbackCourses, edges: fallbackEdges };
    }

    const edgeSet = new Set(
      dbEdges.map((e) => `${e.source.course.code}->${e.target.course.code}`),
    );
    const mergedEdges: CanvasEdge[] = dbEdges.map((edge) => ({
      sourceId: edge.source.course.code,
      targetId: edge.target.course.code,
      sourceCode: edge.source.course.code,
      targetCode: edge.target.course.code,
    }));

    for (const [src, tgt] of [
      ["CS201", "CS301"],
      ["AI102", "CAP500"],
      ["CS303", "CAP500"],
    ] as const) {
      if (!edgeSet.has(`${src}->${tgt}`)) {
        mergedEdges.push({
          sourceId: src,
          targetId: tgt,
          sourceCode: src,
          targetCode: tgt,
        });
      }
    }

    return {
      courses: dbCourses.map((course) => ({
        id: course.code,
        code: course.code,
        title: course.title,
        studyHours: course.studyHours,
        difficulty: course.difficulty,
      })),
      edges: mergedEdges,
    };
  } catch {
    return { courses: fallbackCourses, edges: fallbackEdges };
  }
}

async function CurriculumSection() {
  const { courses: courseNodes, edges: canvasEdges } = await loadCurriculum();
  return (
    <section
      id="canvas"
      aria-label="Course Path Optimizer Workspace"
      className="max-w-[1440px] mx-auto px-4 sm:px-6 pb-8"
    >
      <CurriculumCanvas courses={courseNodes} edges={canvasEdges} />
    </section>
  );
}

async function HeaderAuth() {
  const user = await getSessionUser();
  return <AuthNav user={user} />;
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-ground)] text-[var(--ink-primary)] flex flex-col">
      <header className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a
              aria-label="Paretoium home"
              className="inline-flex items-center"
              href="#"
            >
              <BrandLogo />
            </a>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[var(--bg-recessed)] text-[var(--ink-secondary)] border border-[var(--border-subtle)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-jade)]" />
              Go Pareto Engine · Gemini
            </span>
          </div>

          <nav aria-label="Main navigation" className="flex items-center gap-3">
            <a
              href="#canvas"
              className="hidden md:inline text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition"
            >
              Workspace
            </a>
            <a
              href="#methodology"
              className="hidden md:inline text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition"
            >
              Methodology
            </a>
            <ThemeToggle />
            <Suspense
              fallback={<span className="text-xs text-[var(--ink-muted)]">...</span>}
            >
              <HeaderAuth />
            </Suspense>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section
          aria-labelledby="hero-title"
          className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-5 pb-4"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <h1
                id="hero-title"
                className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink-primary)]"
              >
                Curriculum Path Optimizer
              </h1>
              <p className="text-sm text-[var(--ink-secondary)] mt-0.5 max-w-2xl">
                Balance study hours against cumulative difficulty across prerequisite graphs, then inspect any course for an AI study guide and diagnostic quiz.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-[var(--ink-secondary)] shrink-0">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[var(--accent-coral)] rounded-full" />
                Express (Min Hours)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[var(--accent-jade)] rounded-full" />
                Deep Mastery (Min Difficulty)
              </span>
            </div>
          </div>
        </section>

        <Suspense
          fallback={
            <section
              id="canvas"
              className="max-w-[1440px] mx-auto px-4 sm:px-6 pb-8"
            >
              <CurriculumCanvas
                courses={fallbackCourses}
                edges={fallbackEdges}
              />
            </section>
          }
        >
          <CurriculumSection />
        </Suspense>
      </main>

      <footer
        id="methodology"
        className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-[var(--ink-secondary)]">
          <div className="max-w-3xl leading-relaxed">
            <strong className="text-[var(--ink-primary)]">Paretoium</strong>{" "}
            models curriculum prerequisites as a directed acyclic graph and runs
            a multi-objective label-setting search in Go to surface
            non-dominated study routes.
          </div>
          <div className="font-mono text-[11px] text-[var(--ink-muted)] shrink-0">
            Go Optimizer · Next.js · Neon PostgreSQL · Gemini
          </div>
        </div>
      </footer>
    </div>
  );
}
