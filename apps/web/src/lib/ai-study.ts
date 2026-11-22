import { findTopicBlueprint } from "./study-knowledge-base";

export interface StudyGuideConcept {
  term: string;
  explanation: string;
}

export interface StudyGuideSection {
  heading: string;
  body: string;
}

export interface StudyGuideModule {
  title: string;
  summary: string;
  sections: StudyGuideSection[];
  codeOrFormula?: string;
  takeaways: string[];
}

export interface StudyGuide {
  overview: string;
  keyConcepts: StudyGuideConcept[];
  mentalModel: string;
  workedExample: string;
  commonPitfalls: string[];
  practiceTask: string;
  modules?: StudyGuideModule[];
}

export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  difficulty: "foundation" | "applied" | "challenge";
}

function stripJsonFences(raw: string): string {
  const withoutThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fenced = withoutThink.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ? fenced[1].trim() : withoutThink;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return candidate.slice(firstBrace, lastBrace + 1);
  }
  return candidate;
}

export function buildStudyGuidePrompt(params: {
  nodeName: string;
  description?: string;
  topic?: string;
  studyHours?: number;
  difficulty?: number;
  prerequisites?: string[];
}): string {
  const prereqText =
    params.prerequisites && params.prerequisites.length > 0
      ? params.prerequisites.join(", ")
      : "None (entry-level node)";

  return [
    `You are a senior university professor writing a comprehensive, 4-page technical study guide specifically for "${params.nodeName}".`,
    `Curriculum subject: ${params.topic ?? "Computer Science"}`,
    `Estimated effort: ${params.studyHours ?? "N/A"} hours | Difficulty: ${params.difficulty ?? "N/A"}/5`,
    `Prerequisites: ${prereqText}`,
    `Additional context: ${params.description ?? "None"}`,
    "",
    "Return ONLY valid JSON matching this exact schema (no markdown fences, no extra text):",
    "{",
    '  "overview": "3-4 detailed sentences explaining the core problem domain, theoretical foundations, and real-world engineering role of this specific topic.",',
    '  "keyConcepts": [',
    '    { "term": "Specific domain term", "explanation": "Thorough 2-3 sentence technical explanation with concrete formulas, algorithms, or invariants." }',
    "  ],",
    '  "mentalModel": "A deep architectural intuition or physical analogy specific to this topic.",',
    '  "workedExample": "A complete, real, runnable code snippet, mathematical derivation, or protocol trace specific to this topic.",',
    '  "commonPitfalls": ["Specific technical mistake in this topic, why it happens, and the exact fix."],',
    '  "practiceTask": "A concrete hands-on engineering lab for this topic with clear deliverables and verification criteria.",',
    '  "modules": [',
    "    {",
    '      "title": "Page 1 · [Topic-Specific Chapter Title]",',
    '      "summary": "2-3 sentences introducing the chapter scope.",',
    '      "sections": [',
    '        { "heading": "Specific subtopic heading", "body": "Detailed 3-5 sentence technical explanation with concrete examples from this topic." }',
    "      ],",
    '      "codeOrFormula": "Real code snippet, equation, SQL query, assembly trace, or command specific to this chapter.",',
    '      "takeaways": ["Concrete technical takeaway 1", "Concrete technical takeaway 2", "Concrete technical takeaway 3"]',
    "    }",
    "  ]",
    "}",
    "",
    "Strict Requirements:",
    `- Every single section, concept, code block, and example MUST be specifically about "${params.nodeName}" (in ${params.topic ?? "Computer Science"}).`,
    "- NEVER use generic placeholder text like 'Approach A vs Approach B' or 'executePipeline'.",
    "- Provide 5 keyConcepts, 4 commonPitfalls, and 4 complete modules (Page 1..Page 4).",
    "- Each module must include 2-3 detailed sections, a real topic-specific codeOrFormula block, and 3 takeaways.",
  ].join("\n");
}

export function buildFallbackStudyGuide(params: {
  nodeName: string;
  topic?: string;
  studyHours?: number;
  difficulty?: number;
  prerequisites?: string[];
}): StudyGuide {
  const blueprint = findTopicBlueprint(params.nodeName, params.topic);
  if (blueprint) {
    return {
      ...blueprint.guide,
      overview: `${params.nodeName} (${params.studyHours ?? 30}h · Difficulty ${params.difficulty ?? 3}/5): ${blueprint.guide.overview}`,
    };
  }

  const cleanTitle = params.nodeName.replace(/^[A-Z]+\d+:\s*/i, "").trim();
  const subject = params.topic?.trim() || cleanTitle;
  const prereqs =
    params.prerequisites && params.prerequisites.length > 0
      ? params.prerequisites.join(", ")
      : `foundational ${subject} principles`;
  const hours = params.studyHours ?? 30;
  const diff = params.difficulty ?? 3;

  const workedExample = [
    `Worked Case Study & Step-by-Step Analysis — ${cleanTitle} (${subject}):`,
    `1. Context & Goal: Apply ${cleanTitle} using foundations from ${prereqs}.`,
    `2. Step-by-Step Breakdown:`,
    `   • Step A (Identify Core Elements): Break the ${cleanTitle} problem into its primary components and constraints.`,
    `   • Step B (Apply Domain Method): Execute the standard ${cleanTitle} technique and record intermediate observations.`,
    `   • Step C (Verify & Refine): Cross-check the result against ${subject} quality criteria and edge cases.`,
    `3. Self-Check Question: Can you explain why each step in ${cleanTitle} is necessary and what changes if an assumption from ${prereqs} is altered?`,
  ].join("\n");

  const keyConcepts: StudyGuideConcept[] = [
    {
      term: `${cleanTitle} Core Representation`,
      explanation: `How ${cleanTitle} models domain entities, state transitions, and quantitative metrics within ${subject}.`,
    },
    {
      term: `Prerequisite Synthesis (${prereqs})`,
      explanation: `Directly applies primitives from ${prereqs} to solve higher-order problems in ${cleanTitle}.`,
    },
    {
      term: `Algorithmic & Performance Bounds in ${cleanTitle}`,
      explanation: `Analyzes how compute cost, memory layout, and precision trade off as ${subject} workloads scale.`,
    },
    {
      term: `Empirical Verification & Edge-Case Invariants`,
      explanation: `Defines deterministic test assertions and boundary checks (zero, degenerate, and high-load inputs) for ${cleanTitle}.`,
    },
    {
      term: `Production Integration in ${subject}`,
      explanation: `How ${cleanTitle} composes with downstream modules in a complete ${subject} pipeline.`,
    },
  ];

  const commonPitfalls = [
    `Applying ${cleanTitle} formulas or APIs as black boxes without checking the assumptions required by ${prereqs}.`,
    `Failing to test degenerate boundary inputs (empty datasets, zero divisors, or extreme scale) in ${cleanTitle}.`,
    `Mixing state mutation with observation in ${subject} pipelines, causing non-deterministic bugs.`,
    `Optimizing prematurely before profiling where ${cleanTitle} spends time and memory.`,
  ];

  const modules: StudyGuideModule[] = [
    {
      title: `Page 1 · ${cleanTitle}: Core Model & First Principles`,
      summary: `Foundational theory of ${cleanTitle} inside ${subject}, and how it extends ${prereqs}.`,
      sections: [
        {
          heading: `What Problem ${cleanTitle} Solves in ${subject}`,
          body: `${params.nodeName} (${hours}h, difficulty ${diff}/5) establishes the core representation and analytical tools needed for ${cleanTitle}. Without these guarantees, downstream ${subject} systems suffer from brittle edge cases and unpredictable scaling.`,
        },
        {
          heading: `Building on ${prereqs}`,
          body: `Before implementing ${cleanTitle}, ensure you can trace how ${prereqs} define the input domain and invariants that ${cleanTitle} transforms.`,
        },
      ],
      codeOrFormula: `Formal Pipeline for ${params.nodeName}:
Prerequisites (${prereqs})
   --> Input Representation & Normalization
   --> ${cleanTitle} Core Transformation
   --> Invariant & Postcondition Verification`,
      takeaways: [
        `Identify the exact input preconditions and output postconditions of ${cleanTitle}.`,
        `Connect every new abstraction in ${cleanTitle} back to ${prereqs}.`,
        `Keep core ${subject} domain logic pure and deterministic.`,
      ],
    },
    {
      title: `Page 2 · ${cleanTitle}: Internal Mechanics & Quantitative Analysis`,
      summary: `Step-by-step mechanics, mathematical/algorithmic scaling, and design trade-offs in ${cleanTitle}.`,
      sections: [
        {
          heading: `Step-by-Step Execution Mechanics`,
          body: `Every operation in ${cleanTitle} transforms structured inputs through well-defined intermediate states. Tracking the invariant at each step lets you prove correctness and isolate bottlenecks.`,
        },
        {
          heading: `Scaling & Complexity Trade-offs`,
          body: `In ${subject}, optimizing for minimum latency often trades off against memory footprint or preprocessing cost. Measure your workload distribution before choosing between eager precomputation and on-demand evaluation.`,
        },
      ],
      codeOrFormula: `Quantitative Analysis for ${cleanTitle}:
1. State Size:      O(N) primary records in ${subject}
2. Fast Query Path: Pre-indexed / vectorized lookup -> O(log N) or O(1)
3. Update Path:     Incremental invariant maintenance without full O(N^2) rebuild`,
      takeaways: [
        ...keyConcepts.slice(0, 3).map((c) => `${c.term}: ${c.explanation}`),
      ],
    },
    {
      title: `Page 3 · ${cleanTitle}: Worked Implementation & Trace`,
      summary: `Concrete code implementation and verification trace for ${cleanTitle}.`,
      sections: [
        {
          heading: `Defensive Implementation Pattern`,
          body: `Validate inputs at the module boundary, compute the core ${cleanTitle} metric deterministically, and return structured results with explicit validity flags.`,
        },
      ],
      codeOrFormula: workedExample,
      takeaways: [
        `Trace the worked example above with both a normal input array and an empty boundary array.`,
        `Verify that numerical outputs remain finite and well-conditioned.`,
        `Separate pure ${cleanTitle} calculation from external I/O.`,
      ],
    },
    {
      title: `Page 4 · ${cleanTitle}: Pitfalls, Edge Cases & Mastery Lab`,
      summary: `Common mistakes in ${cleanTitle} and a hands-on project to verify mastery.`,
      sections: [
        {
          heading: `Failure Modes in ${cleanTitle}`,
          body: commonPitfalls.join(" "),
        },
        {
          heading: `Hands-On Lab Specification`,
          body: `Implement a standalone module for ${cleanTitle} in ${subject}, write automated unit tests covering normal and edge cases, and benchmark its runtime scaling.`,
        },
      ],
      codeOrFormula: `Lab Verification Checklist for ${params.nodeName}:
[x] Precondition check for ${prereqs}
[x] Core ${cleanTitle} implementation passing 100% of unit & boundary tests
[x] Score >= 75% on the Practice Quiz tab to mark ${params.nodeName} verified`,
      takeaways: [
        ...commonPitfalls.slice(0, 2),
        "Switch to the Practice Quiz tab and score >= 75% to verify mastery.",
      ],
    },
  ];

  return {
    overview: `${params.nodeName} is an essential ${hours}-hour module in ${subject} (difficulty ${diff}/5) building upon ${prereqs}.`,
    keyConcepts,
    mentalModel: `Think of ${cleanTitle} as a verifiable transformation layer in ${subject} that turns ${prereqs} into production-grade capabilities.`,
    workedExample,
    commonPitfalls,
    practiceTask: `Build and test a standalone implementation of ${cleanTitle} (${subject}) covering normal, boundary, and adversarial inputs.`,
    modules,
  };
}

export function ensureStudyGuideModules(guide: StudyGuide): StudyGuideModule[] {
  if (Array.isArray(guide.modules) && guide.modules.length > 0) {
    return guide.modules;
  }

  return [
    {
      title: "Page 1 · Overview & Core Foundations",
      summary: guide.overview,
      sections: [
        {
          heading: "Executive Overview",
          body: guide.overview,
        },
        ...(guide.mentalModel
          ? [
              {
                heading: "Core Mental Model",
                body: guide.mentalModel,
              },
            ]
          : []),
      ],
      takeaways: guide.keyConcepts.slice(0, 3).map((c) => `${c.term}: ${c.explanation}`),
    },
    {
      title: "Page 2 · Key Concepts & Technical Deep Dive",
      summary:
        "Detailed breakdown of the core abstractions, invariants, and terminology for this course.",
      sections: guide.keyConcepts.map((c) => ({
        heading: c.term,
        body: c.explanation,
      })),
      takeaways: guide.keyConcepts.map((c) => c.term),
    },
    {
      title: "Page 3 · Worked Example & Execution Trace",
      summary:
        "Concrete walkthrough demonstrating how the concepts operate in code or formal steps.",
      sections: [
        {
          heading: "Step-by-Step Walkthrough",
          body:
            guide.mentalModel ||
            "Trace each transformation carefully and verify that invariants hold at every step.",
        },
      ],
      codeOrFormula: guide.workedExample || undefined,
      takeaways: [
        "Trace the worked example on minimal and boundary inputs.",
        "Verify how each step connects back to the core concepts on Page 2.",
      ],
    },
    {
      title: "Page 4 · Common Pitfalls & Hands-On Lab",
      summary:
        "Frequent mistakes to avoid and a practical engineering exercise to prove mastery.",
      sections: [
        ...(guide.commonPitfalls.length > 0
          ? [
              {
                heading: "Common Pitfalls & Edge Cases",
                body: guide.commonPitfalls.map((p, i) => `${i + 1}. ${p}`).join("\n\n"),
              },
            ]
          : []),
        ...(guide.practiceTask
          ? [
              {
                heading: "Hands-On Mastery Lab",
                body: guide.practiceTask,
              },
            ]
          : []),
      ],
      takeaways:
        guide.commonPitfalls.length > 0
          ? guide.commonPitfalls
          : ["Complete the hands-on task and take the Practice Quiz to verify mastery."],
    },
  ];
}

export function parseStudyGuide(rawText: string): StudyGuide | null {
  try {
    const parsed = JSON.parse(stripJsonFences(rawText)) as Partial<StudyGuide>;
    if (!parsed || typeof parsed !== "object") return null;
    const overview = typeof parsed.overview === "string" ? parsed.overview.trim() : "";
    if (!overview) return null;

    const keyConcepts: StudyGuideConcept[] = Array.isArray(parsed.keyConcepts)
      ? parsed.keyConcepts
          .filter(
            (c): c is StudyGuideConcept =>
              Boolean(c) &&
              typeof c.term === "string" &&
              typeof c.explanation === "string" &&
              c.term.trim().length > 0 &&
              c.explanation.trim().length > 0,
          )
          .slice(0, 8)
      : [];

    const commonPitfalls = Array.isArray(parsed.commonPitfalls)
      ? parsed.commonPitfalls
          .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
          .slice(0, 6)
      : [];

    const modules: StudyGuideModule[] = Array.isArray(parsed.modules)
      ? parsed.modules
          .filter((m): m is StudyGuideModule => {
            if (!m || typeof m !== "object") return false;
            return typeof m.title === "string" && m.title.trim().length > 0;
          })
          .map((m) => ({
            title: m.title.trim(),
            summary: typeof m.summary === "string" ? m.summary.trim() : "",
            sections: Array.isArray(m.sections)
              ? m.sections
                  .filter(
                    (s): s is StudyGuideSection =>
                      Boolean(s) &&
                      typeof s.heading === "string" &&
                      typeof s.body === "string" &&
                      s.heading.trim().length > 0 &&
                      s.body.trim().length > 0,
                  )
                  .map((s) => ({
                    heading: s.heading.trim(),
                    body: s.body.trim(),
                  }))
              : [],
            codeOrFormula:
              typeof m.codeOrFormula === "string" && m.codeOrFormula.trim().length > 0
                ? m.codeOrFormula.trim()
                : undefined,
            takeaways: Array.isArray(m.takeaways)
              ? m.takeaways
                  .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
                  .map((t) => t.trim())
              : [],
          }))
          .slice(0, 6)
      : [];

    const baseGuide: StudyGuide = {
      overview,
      keyConcepts,
      mentalModel:
        typeof parsed.mentalModel === "string" ? parsed.mentalModel.trim() : "",
      workedExample:
        typeof parsed.workedExample === "string" ? parsed.workedExample.trim() : "",
      commonPitfalls,
      practiceTask:
        typeof parsed.practiceTask === "string" ? parsed.practiceTask.trim() : "",
    };

    baseGuide.modules =
      modules.length > 0 ? modules : ensureStudyGuideModules(baseGuide);

    return baseGuide;
  } catch {
    return null;
  }
}

export function formatStudyGuideAsText(guide: StudyGuide): string {
  const parts: string[] = [guide.overview];
  if (guide.keyConcepts.length > 0) {
    parts.push(
      "Key Concepts:\n" +
        guide.keyConcepts.map((c) => `- ${c.term}: ${c.explanation}`).join("\n"),
    );
  }
  if (guide.mentalModel) {
    parts.push(`Mental Model:\n${guide.mentalModel}`);
  }
  if (guide.workedExample) {
    parts.push(`Worked Example:\n${guide.workedExample}`);
  }
  if (guide.commonPitfalls.length > 0) {
    parts.push(
      "Common Pitfalls:\n" + guide.commonPitfalls.map((p) => `- ${p}`).join("\n"),
    );
  }
  if (guide.practiceTask) {
    parts.push(`Practice Task:\n${guide.practiceTask}`);
  }
  return parts.join("\n\n");
}

export function buildQuizPrompt(params: {
  nodeName: string;
  description?: string;
  topic?: string;
  difficulty?: number;
  prerequisites?: string[];
}): string {
  const prereqText =
    params.prerequisites && params.prerequisites.length > 0
      ? params.prerequisites.join(", ")
      : "None";

  return [
    `Create a 4-question multiple-choice diagnostic quiz specifically for "${params.nodeName}".`,
    `Curriculum topic: ${params.topic ?? "General"} | Difficulty: ${params.difficulty ?? "N/A"}/5`,
    `Prerequisites: ${prereqText}`,
    `Context: ${params.description ?? "None"}`,
    "",
    "Return ONLY valid JSON matching this exact schema (no markdown fences, no extra text):",
    "{",
    '  "questions": [',
    "    {",
    '      "question": "Clear, specific technical or code/math scenario question about this exact topic.",',
    '      "options": ["Option A", "Option B", "Option C", "Option D"],',
    '      "correctIndex": 0,',
    '      "explanation": "1-2 sentences explaining why the correct option is right and why distractors fail.",',
    '      "difficulty": "foundation" | "applied" | "challenge"',
    "    }",
    "  ]",
    "}",
    "",
    "Requirements:",
    "- Include 1 foundation, 2 applied, and 1 challenge question.",
    "- Every question must test concrete technical knowledge of this specific topic.",
    "- Every question must have exactly 4 plausible, distinct options (no 'All of the above').",
    "- Vary correctIndex across 0, 1, 2, 3.",
  ].join("\n");
}

export function buildFallbackQuiz(params: {
  nodeName: string;
  topic?: string;
  prerequisites?: string[];
}): QuizQuestion[] {
  const blueprint = findTopicBlueprint(params.nodeName, params.topic);
  if (blueprint && blueprint.quiz.length > 0) {
    return blueprint.quiz;
  }

  const cleanTitle = params.nodeName.replace(/^[A-Z]+\d+:\s*/i, "").trim();
  const prereq =
    params.prerequisites && params.prerequisites.length > 0
      ? params.prerequisites[0]
      : "foundational prerequisites";

  return [
    {
      question: `When implementing ${cleanTitle}, why must you verify the invariants established in ${prereq} first?`,
      options: [
        `Because ${cleanTitle} relies directly on the data representations and precondition guarantees from ${prereq}`,
        "Because prerequisites are only used for UI styling",
        "Because edge cases cannot occur when prerequisites are skipped",
        "To avoid writing unit tests",
      ],
      correctIndex: 0,
      explanation: `${cleanTitle} builds directly on ${prereq}; violating upstream invariants leads to subtle state corruption under edge-case inputs.`,
      difficulty: "foundation",
    },
    {
      question: `Which verification strategy best proves your ${cleanTitle} implementation is correct?`,
      options: [
        "Testing a single happy-path input manually",
        `Running automated unit tests covering empty, singleton, boundary, and high-scale inputs while asserting ${cleanTitle} invariants`,
        "Ignoring asymptotic time and memory complexity",
        "Coupling core calculation logic directly to network I/O",
      ],
      correctIndex: 1,
      explanation:
        "Boundary and invariant testing catches off-by-one, overflow, and degenerate-input bugs that single happy-path checks miss.",
      difficulty: "applied",
    },
    {
      question: `When scaling ${cleanTitle} to production workloads, how should you evaluate architectural trade-offs?`,
      options: [
        "Always optimize for write speed regardless of read frequency",
        "Profile the actual read/write ratio, latency percentiles (p95/p99), and memory footprint before choosing between eager precomputation and on-demand evaluation",
        "Use O(N^2) nested scans for all dataset sizes",
        "Disable error handling to save CPU cycles",
      ],
      correctIndex: 1,
      explanation:
        "Quantitative profiling of workload distributions and p99 tail latency ensures you optimize the real bottleneck.",
      difficulty: "challenge",
    },
  ];
}

export function parseQuizQuestions(rawText: string): QuizQuestion[] | null {
  try {
    const parsed = JSON.parse(stripJsonFences(rawText)) as {
      questions?: unknown[];
    };
    if (!parsed || !Array.isArray(parsed.questions)) return null;

    const valid: QuizQuestion[] = [];
    for (const item of parsed.questions.slice(0, 6)) {
      if (!item || typeof item !== "object") continue;
      const q = item as Record<string, unknown>;
      const question = typeof q.question === "string" ? q.question.trim() : "";
      const options = Array.isArray(q.options)
        ? q.options
            .filter((o): o is string => typeof o === "string" && o.trim().length > 0)
            .map((o) => o.trim())
        : [];
      const correctIndex = Number(q.correctIndex);
      const explanation =
        typeof q.explanation === "string" ? q.explanation.trim() : "";
      const rawDiff = typeof q.difficulty === "string" ? q.difficulty : "applied";
      const difficulty: QuizQuestion["difficulty"] =
        rawDiff === "foundation" || rawDiff === "applied" || rawDiff === "challenge"
          ? rawDiff
          : "applied";

      if (
        question &&
        options.length === 4 &&
        Number.isInteger(correctIndex) &&
        correctIndex >= 0 &&
        correctIndex <= 3
      ) {
        valid.push({
          question,
          options: [options[0], options[1], options[2], options[3]],
          correctIndex,
          explanation:
            explanation ||
            "Review the core concept to confirm why this answer holds.",
          difficulty,
        });
      }
    }

    return valid.length >= 2 ? valid : null;
  } catch {
    return null;
  }
}

export function formatQuizAsText(questions: QuizQuestion[]): string {
  const letters = ["A", "B", "C", "D"];
  return questions
    .map((q, idx) => {
      const opts = q.options.map((o, i) => `  ${letters[i]}. ${o}`).join("\n");
      return `${idx + 1}. ${q.question}\n${opts}\n  Answer: ${letters[q.correctIndex]} — ${q.explanation}`;
    })
    .join("\n\n");
}
