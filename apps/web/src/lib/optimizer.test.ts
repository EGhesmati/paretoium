import { describe, expect, it } from "vitest";
import { runLocalParetoFallback, type OptimizerRequest } from "./optimizer";

describe("optimizer payload contract & 3-objective Pareto fallback", () => {
  it("serializes nodes, prerequisites, and constraints", () => {
    const payload: OptimizerRequest = {
      nodes: [
        {
          id: "CS101",
          name: "Intro to Computer Science",
          code: "CS101",
          study_hours: 20,
          difficulty: 1,
        },
      ],
      edges: [{ from: "CS101", to: "CS102", type: "AND" }],
      constraints: { max_study_hours: 40, max_difficulty: 3 },
    };

    expect(JSON.parse(JSON.stringify(payload))).toEqual(payload);
  });

  it("computes distinct Express and Deep Mastery paths and shifts dynamically with Max Depth", () => {
    const baseRequest: OptimizerRequest = {
      nodes: [
        { id: "CS101", name: "CS101", study_hours: 0, difficulty: 0 },
        { id: "WEB101", name: "WEB101", study_hours: 15, difficulty: 1 },
        { id: "WEB102", name: "WEB102", study_hours: 35, difficulty: 3 },
        { id: "CS102", name: "CS102", study_hours: 40, difficulty: 2 },
        { id: "CS203", name: "CS203", study_hours: 30, difficulty: 2 },
        { id: "CS201", name: "CS201", study_hours: 35, difficulty: 3 },
        { id: "CS202", name: "CS202", study_hours: 45, difficulty: 4 },
        { id: "CS301", name: "CS301", study_hours: 30, difficulty: 3 },
        { id: "CS302", name: "CS302", study_hours: 50, difficulty: 5 },
        { id: "CAP500", name: "CAP500", study_hours: 60, difficulty: 5 },
      ],
      edges: [
        { from: "CS101", to: "WEB101", type: "AND" },
        { from: "WEB101", to: "WEB102", type: "AND" },
        { from: "WEB102", to: "CAP500", type: "AND" },
        { from: "CS101", to: "CS102", type: "AND" },
        { from: "CS102", to: "CS203", type: "AND" },
        { from: "CS203", to: "WEB102", type: "AND" },
        { from: "CS102", to: "CS201", type: "AND" },
        { from: "CS201", to: "CS301", type: "AND" },
        { from: "CS201", to: "CS202", type: "AND" },
        { from: "CS202", to: "CS301", type: "AND" },
        { from: "CS301", to: "CS302", type: "AND" },
        { from: "CS302", to: "CAP500", type: "AND" },
      ],
      constraints: {
        target_course_ids: ["CAP500"],
        completed_course_ids: ["CS101"],
        max_study_hours: 280,
        max_difficulty: 25,
        max_depth: 7,
      },
    };

    const res7 = runLocalParetoFallback(baseRequest);
    expect(res7.express_path?.path).toEqual(["CS101", "WEB101", "WEB102", "CAP500"]);
    expect(res7.deep_mastery_path?.path).toEqual([
      "CS101",
      "CS102",
      "CS201",
      "CS202",
      "CS301",
      "CS302",
      "CAP500",
    ]);

    const res6 = runLocalParetoFallback({
      ...baseRequest,
      constraints: { ...baseRequest.constraints, max_depth: 6 },
    });
    expect(res6.deep_mastery_path?.path).toEqual([
      "CS101",
      "CS102",
      "CS201",
      "CS301",
      "CS302",
      "CAP500",
    ]);

    const res5 = runLocalParetoFallback({
      ...baseRequest,
      constraints: { ...baseRequest.constraints, max_depth: 5 },
    });
    expect(res5.deep_mastery_path?.path).toHaveLength(5);

    const res8 = runLocalParetoFallback({
      ...baseRequest,
      constraints: {
        ...baseRequest.constraints,
        max_study_hours: 350,
        max_difficulty: 35,
        max_depth: 8,
      },
    });
    expect(res8.deep_mastery_path?.path).toHaveLength(8);
    expect(res8.deep_mastery_path?.coverage_pct).toBeGreaterThan(
      res8.express_path?.coverage_pct ?? 0,
    );
    expect(res8.express_path?.missing_prereqs?.length).toBeGreaterThan(0);
  });
});
