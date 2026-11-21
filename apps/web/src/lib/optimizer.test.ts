import { describe, expect, it } from "vitest";
import type { OptimizerRequest } from "./optimizer";

describe("optimizer payload contract", () => {
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
});
