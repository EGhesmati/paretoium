import { describe, expect, it } from "vitest";
import {
  buildFallbackQuiz,
  buildFallbackStudyGuide,
  ensureStudyGuideModules,
  parseQuizQuestions,
  parseStudyGuide,
} from "./ai-study";

describe("ai-study helpers", () => {
  it("parses fenced JSON study guides and synthesizes multi-page modules when omitted", () => {
    const raw = [
      "```json",
      JSON.stringify({
        overview: "Graphs model pairwise relationships between entities.",
        keyConcepts: [
          { term: "DAG", explanation: "A directed graph with no directed cycles." },
        ],
        mentalModel: "Think of prerequisites as one-way doors.",
        workedExample: "CS101 -> CS102 -> CS201",
        commonPitfalls: ["Forgetting to check for cycles before topo sort."],
        practiceTask: "Implement Kahn's algorithm.",
      }),
      "```",
    ].join("\n");

    const guide = parseStudyGuide(raw);
    expect(guide).not.toBeNull();
    expect(guide?.keyConcepts).toHaveLength(1);
    expect(guide?.commonPitfalls).toHaveLength(1);
    expect(guide?.modules?.length).toBeGreaterThanOrEqual(4);
  });

  it("parses structured multiple-choice quizzes and validates options", () => {
    const raw = JSON.stringify({
      questions: [
        {
          question: "Which algorithm finds topological order?",
          options: ["Kahn's", "Dijkstra", "Prim", "Kruskal"],
          correctIndex: 0,
          explanation: "Kahn's algorithm peels zero-indegree nodes.",
          difficulty: "foundation",
        },
        {
          question: "What breaks topological sorting?",
          options: ["Self-loop or cycle", "Isolated node", "Weighted edges", "Multiple roots"],
          correctIndex: 0,
          explanation: "Cycles have no valid linear ordering.",
          difficulty: "applied",
        },
      ],
    });

    const questions = parseQuizQuestions(raw);
    expect(questions).toHaveLength(2);
    expect(questions?.[0].correctIndex).toBe(0);
  });

  it("builds multi-page domain-specific study guides and quizzes across subjects", () => {
    const dsaGuide = buildFallbackStudyGuide({ nodeName: "CS102: Data Structures & Algorithms" });
    const dbGuide = buildFallbackStudyGuide({ nodeName: "CS203: Database Systems" });
    const mlGuide = buildFallbackStudyGuide({
      nodeName: "ML202: Gradient Descent, Backpropagation & Neural Nets",
      topic: "Machine Learning",
    });
    const quiz = buildFallbackQuiz({ nodeName: "CS203: Database Systems" });

    expect(dsaGuide.workedExample).toContain("dijkstra");
    expect(dbGuide.workedExample).toContain("CREATE INDEX");
    expect(mlGuide.workedExample).toContain("trainLogisticStep");
    expect(ensureStudyGuideModules(dbGuide)).toHaveLength(4);
    expect(quiz.length).toBeGreaterThanOrEqual(4);

    const engGuide = buildFallbackStudyGuide({
      nodeName: "ENG101: English Grammar, Parts of Speech & Sentence Structure",
      topic: "English",
    });
    const engQuiz = buildFallbackQuiz({
      nodeName: "ENG101: English Grammar, Parts of Speech & Sentence Structure",
      topic: "English",
    });
    expect(engGuide.workedExample).toContain("Dangling Modifier");
    expect(engGuide.overview.toLowerCase()).not.toContain("data structures");
    expect(engQuiz[0].question).toContain("comma splice");
  });
});
