import { Suspense } from "react";
import { CurriculumCanvas, type CanvasCourse, type CanvasEdge } from "@/components/curriculum-canvas";
import { prisma } from "@/lib/prisma";

const principles = [
  {
    number: "01",
    title: "Start with prerequisites",
    description:
      "Courses and their requirements form a graph, so a path respects what needs to come first.",
  },
  {
    number: "02",
    title: "Compare the trade-offs",
    description:
      "The optimizer tracks study hours and difficulty separately instead of hiding them in one score.",
  },
  {
    number: "03",
    title: "Choose what fits",
    description:
      "Compare faster and less-difficult options, then decide which trade-off works for you.",
  },
];

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
  ["CS201", "CS202"], ["CS102", "CS203"], ["CS202", "CS301"],
  ["CS301", "CS302"], ["CS203", "CS302"], ["CS102", "CS303"],
  ["MATH102", "AI101"], ["CS102", "AI101"], ["AI101", "AI102"],
  ["CS101", "WEB101"], ["WEB101", "WEB102"], ["CS203", "WEB102"],
  ["CS302", "CAP500"], ["WEB102", "CAP500"],
] as const;

const fallbackEdges: CanvasEdge[] = prerequisitePairs.map(([sourceCode, targetCode]) => ({
  sourceId: sourceCode,
  targetId: targetCode,
  sourceCode,
  targetCode,
}));

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

    return {
      courses: dbCourses.map((course) => ({
        id: course.code,
        code: course.code,
        title: course.title,
        studyHours: course.studyHours,
        difficulty: course.difficulty,
      })),
      edges: dbEdges.map((edge) => ({
        sourceId: edge.source.course.code,
        targetId: edge.target.course.code,
        sourceCode: edge.source.course.code,
        targetCode: edge.target.course.code,
      })),
    };
  } catch {
    return { courses: fallbackCourses, edges: fallbackEdges };
  }
}

async function CurriculumSection() {
  const { courses: courseNodes, edges: canvasEdges } = await loadCurriculum();
  return (
    <section className="canvas-section" id="canvas" aria-labelledby="canvas-title">
      <div className="canvas-heading">
        <div>
          <p className="eyebrow">Live curriculum map</p>
          <h2 id="canvas-title">Explore the course graph</h2>
        </div>
        <p>{courseNodes.length} seeded courses · {canvasEdges.length} prerequisite connections</p>
      </div>
      <div className="curriculum-canvas">
        <CurriculumCanvas courses={courseNodes} edges={canvasEdges} />
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a aria-label="Paretoium home" className="wordmark" href="#">
          <span aria-hidden="true" className="wordmark-mark">p</span>
          paretoium
        </a>
        <nav aria-label="Main navigation" className="main-nav">
          <a href="#approach">Our approach</a>
          <a className="nav-cta" href="#canvas">Meet the optimizer ↗</a>
        </nav>
      </header>

      <section aria-labelledby="hero-title" className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span aria-hidden="true" className="eyebrow-dot" />
            A course path optimizer
          </p>
          <h1 id="hero-title">
            Your next step
            <br />
            <span>starts with a plan.</span>
          </h1>
          <p className="hero-description">
            Plan a route through your courses with prerequisites in mind.
            Paretoium compares study time and difficulty to help you see the trade-offs.
          </p>
          <a className="button button-primary" href="#canvas">
            Explore the course graph ↓
          </a>
        </div>

        <aside aria-label="What the optimizer does" className="optimizer-card" id="optimizer">
          <div className="card-topline">
            <span className="card-kicker">THE ENGINE</span>
            <span className="status-pill"><span aria-hidden="true" />Go · available</span>
          </div>
          <h2>More than one way forward.</h2>
          <p>The Go engine checks prerequisite graphs and finds paths that balance two goals.</p>
          <div className="objective-list">
            <div className="objective-row">
              <span className="objective-icon hours-icon" aria-hidden="true">↗</span>
              <span><strong>Study time</strong><small>Find a faster route</small></span>
            </div>
            <div className="objective-row">
              <span className="objective-icon difficulty-icon" aria-hidden="true">◒</span>
              <span><strong>Difficulty</strong><small>Find a gentler route</small></span>
            </div>
          </div>
        </aside>
      </section>

      <Suspense
        fallback={
          <section className="canvas-section" id="canvas" aria-labelledby="canvas-title">
            <div className="canvas-heading">
              <div>
                <p className="eyebrow">Live curriculum map</p>
                <h2 id="canvas-title">Explore the course graph</h2>
              </div>
              <p>{fallbackCourses.length} seeded courses · {fallbackEdges.length} prerequisite connections</p>
            </div>
            <div className="curriculum-canvas">
              <CurriculumCanvas courses={fallbackCourses} edges={fallbackEdges} />
            </div>
          </section>
        }
      >
        <CurriculumSection />
      </Suspense>

      <section aria-labelledby="approach-title" className="approach" id="approach">
        <div className="section-heading">
          <p className="eyebrow">A clearer way to decide</p>
          <h2 id="approach-title">
            You bring the goals.<br /><span>We map the options.</span>
          </h2>
        </div>
        <div className="principle-list">
          {principles.map((principle) => (
            <article className="principle" key={principle.number}>
              <span className="principle-number">{principle.number}</span>
              <div><h3>{principle.title}</h3><p>{principle.description}</p></div>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <a className="wordmark footer-wordmark" href="#">
          <span aria-hidden="true" className="wordmark-mark">p</span>
          paretoium
        </a>
        <p>Make your next learning move with clarity.</p>
      </footer>
    </main>
  );
}
