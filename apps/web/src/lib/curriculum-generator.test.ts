import { describe, expect, it } from "vitest";
import {
  buildFallbackCurriculum,
  sanitizeGeneratedCurriculum,
} from "./curriculum-generator";

describe("curriculum generator helpers", () => {
  it("builds a valid DAG fallback for any topic", () => {
    const result = buildFallbackCurriculum("Machine Learning");
    expect(result.courses.length).toBeGreaterThanOrEqual(8);
    expect(result.edges.length).toBeGreaterThanOrEqual(8);
    expect(result.courses[0].code).toBe("ML101");
  });

  it("scales fallback curriculum hours and difficulty to learner constraints", () => {
    const compact = buildFallbackCurriculum("Machine Learning", {
      maxHours: 80,
      maxDifficulty: 10,
      maxDepth: 3,
    });
    const deep = buildFallbackCurriculum("Machine Learning", {
      maxHours: 320,
      maxDifficulty: 30,
      maxDepth: 8,
    });
    const compactSum = compact.courses.reduce((s, c) => s + c.studyHours, 0);
    const deepSum = deep.courses.reduce((s, c) => s + c.studyHours, 0);
    expect(compactSum).toBeLessThan(deepSum);
    expect(
      compact.edges.some((e) => e.sourceId === "ML101" && e.targetId === "ML301"),
    ).toBe(true);
  });

  it("sanitizes fenced JSON and strips cycles", () => {
    const raw = [
      "```json",
      JSON.stringify({
        courses: [
          { code: "A101", title: "Basics", studyHours: 10, difficulty: 1 },
          { code: "A102", title: "Intermediate", studyHours: 20, difficulty: 2 },
          { code: "A201", title: "Advanced", studyHours: 30, difficulty: 4 },
        ],
        edges: [
          { from: "A101", to: "A102" },
          { from: "A102", to: "A201" },
          { from: "A201", to: "A101" }, // cycle should be removed
        ],
      }),
      "```",
    ].join("\n");

    const sanitized = sanitizeGeneratedCurriculum(raw, "Test Topic");
    expect(sanitized).not.toBeNull();
    expect(sanitized?.edges).toHaveLength(2);
  });

  it("builds domain-appropriate courses for non-CS subjects like English without Data Structures or Algorithms", () => {
    const eng = buildFallbackCurriculum("English");
    expect(eng.courses[0].code).toBe("ENG101");
    const allTitles = eng.courses.map((c) => c.title.toLowerCase()).join(" ");
    expect(allTitles).toContain("grammar");
    expect(allTitles).not.toContain("data structures");
    expect(allTitles).not.toContain("algorithms");
  });
});
