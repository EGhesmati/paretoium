export interface GeneratedCourse {
  id: string;
  code: string;
  title: string;
  studyHours: number;
  difficulty: number;
}

export interface GeneratedEdge {
  sourceId: string;
  targetId: string;
  sourceCode: string;
  targetCode: string;
}

export interface GeneratedCurriculum {
  topic: string;
  courses: GeneratedCourse[];
  edges: GeneratedEdge[];
  fallback: boolean;
}

function toPrefix(topic: string): string {
  const letters = topic
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 4);
  return letters.length >= 2 ? letters : "TOP";
}

export interface CurriculumConstraints {
  maxHours?: number;
  maxDifficulty?: number;
  maxDepth?: number;
}

const PRESET_CURRICULA: Record<string, Array<[string, string, number, number]>> = {
  "machine learning": [
    ["ML101", "Python, NumPy & Vectorized Linear Algebra", 20, 1],
    ["ML102", "Probability, Bayes & Statistical Inference", 25, 2],
    ["ML201", "Supervised Learning: Regression, Trees & SVMs", 30, 2],
    ["ML202", "Gradient Descent, Backpropagation & Neural Nets", 40, 4],
    ["ML203", "Feature Engineering, Cross-Validation & Data Pipelines", 25, 2],
    ["ML301", "Applied ML Prototyping & Scikit-Learn Workflows", 30, 3],
    ["ML302", "Deep Learning: CNNs, Sequence Models & Transformers", 45, 4],
    ["ML303", "MLOps, Model Serving, Quantization & Drift Monitoring", 50, 5],
    ["ML400", "End-to-End Machine Learning System Capstone", 40, 4],
  ],
  "full-stack web": [
    ["FSW101", "Semantic HTML5, CSS Grid & Browser Rendering", 15, 1],
    ["FSW102", "TypeScript, Async Event Loop & DOM Architecture", 25, 2],
    ["FSW201", "React State, Reconciliation & Component Patterns", 30, 2],
    ["FSW202", "Relational Databases, PostgreSQL Indexing & Prisma", 35, 4],
    ["FSW203", "HTTP Caching, REST APIs & Tooling Workflows", 20, 2],
    ["FSW301", "Next.js App Router, Server & Client Components", 30, 3],
    ["FSW302", "Session Auth, OWASP Security (CSRF/XSS/SQLi) & Rate Limiting", 40, 4],
    ["FSW303", "Distributed Caching, WebSockets & Performance Tuning", 45, 5],
    ["FSW400", "Production Full-Stack Web Application Capstone", 40, 4],
  ],
  cybersecurity: [
    ["CYB101", "TCP/IP Networking, CIDR Subnetting & Packet Analysis", 20, 1],
    ["CYB102", "Linux OS Internals, Permissions & Process Isolation", 25, 2],
    ["CYB201", "Applied Cryptography: AES-GCM, RSA, ECDHE & Hashing", 30, 3],
    ["CYB202", "TLS 1.3 Handshake, PKI Certificates & Network Defense", 35, 4],
    ["CYB203", "Security Tooling: Wireshark, Nmap & Threat Modeling", 20, 2],
    ["CYB301", "Web Application Security: OWASP, SQLi, XSS, CSRF & SSRF", 30, 3],
    ["CYB302", "Binary Exploitation, Memory Safety & Sandboxing", 45, 4],
    ["CYB303", "Zero-Trust Architecture, SIEM & Incident Response", 45, 5],
    ["CYB400", "Full-Spectrum Security Audit & Hardening Capstone", 40, 4],
  ],
  "distributed systems": [
    ["DS101", "RPCs, Serialization, Sockets & Network Failure Models", 20, 1],
    ["DS102", "Logical Time: Lamport Timestamps & Vector Clocks", 25, 2],
    ["DS201", "Replication, Quorum Intersection (R+W>N) & Read Repair", 30, 3],
    ["DS202", "Raft & Paxos Consensus, Leader Election & Split-Brain", 45, 4],
    ["DS203", "Consistent Hashing, Virtual Nodes & Sharding", 25, 2],
    ["DS301", "Idempotent Retries, Message Queues & Pub/Sub Workflows", 30, 3],
    ["DS302", "Distributed Transactions: 2-Phase Commit vs. Sagas", 40, 4],
    ["DS303", "CAP/PACELC Trade-offs, CRDTs & Multi-Region Dynamo", 50, 5],
    ["DS400", "Fault-Tolerant Distributed Key-Value Store Capstone", 45, 4],
  ],
  english: [
    ["ENG101", "English Grammar, Parts of Speech & Sentence Structure", 15, 1],
    ["ENG102", "Core Vocabulary, Collocations & Reading Comprehension", 20, 2],
    ["ENG201", "Paragraph Composition, Clarity & Active Voice", 25, 2],
    ["ENG202", "Advanced Syntax, Clause Architecture & Punctuation", 35, 4],
    ["ENG203", "Listening, Pronunciation & Conversational Fluency", 20, 2],
    ["ENG301", "Persuasive Essay Writing & Rhetorical Argumentation", 25, 3],
    ["ENG302", "Literary Analysis, Tone, Metaphor & Critical Reading", 40, 4],
    ["ENG303", "Academic & Professional Research Writing Style", 45, 5],
    ["ENG400", "Comprehensive English Portfolio & Rhetoric Capstone", 35, 4],
  ],
};

function isLanguageOrHumanitiesTopic(topic: string): boolean {
  const lower = topic.toLowerCase();
  return [
    "english",
    "spanish",
    "french",
    "german",
    "japanese",
    "arabic",
    "turkish",
    "chinese",
    "language",
    "writing",
    "literature",
    "grammar",
    "rhetoric",
    "history",
    "philosophy",
    "psychology",
  ].some((kw) => lower.includes(kw));
}

export function buildFallbackCurriculum(
  topic: string,
  constraints?: CurriculumConstraints,
): Omit<GeneratedCurriculum, "fallback"> {
  const cleanTopic = topic.trim() || "Computer Science";
  const prefix = toPrefix(cleanTopic);

  // Scale hours and difficulty smoothly to fit the learner's requested budget
  const targetDeepHours = Math.max(40, Math.min(400, constraints?.maxHours ?? 210));
  const hourScale = targetDeepHours / 200;
  const scaleHours = (base: number) =>
    Math.max(5, Math.min(90, Math.round((base * hourScale) / 5) * 5));

  const targetMaxDiff = Math.max(5, Math.min(40, constraints?.maxDifficulty ?? 20));
  const diffScale = targetMaxDiff / 20;
  const scaleDiff = (base: number) =>
    Math.max(1, Math.min(5, Math.round(base * diffScale)));

  const presetRows = PRESET_CURRICULA[cleanTopic.toLowerCase()];
  if (presetRows) {
    const courses: GeneratedCourse[] = presetRows.map(([code, title, h, d]) => ({
      id: code,
      code,
      title,
      studyHours: scaleHours(h),
      difficulty: scaleDiff(d),
    }));
    const p = courses[0].code.replace(/\d+$/, "");
    const pairs: Array<[string, string]> = [
      [`${p}101`, `${p}301`],
      [`${p}101`, `${p}102`],
      [`${p}101`, `${p}203`],
      [`${p}102`, `${p}201`],
      [`${p}102`, `${p}202`],
      [`${p}201`, `${p}202`],
      [`${p}203`, `${p}301`],
      [`${p}201`, `${p}301`],
      [`${p}202`, `${p}302`],
      [`${p}302`, `${p}303`],
      [`${p}301`, `${p}400`],
      [`${p}303`, `${p}400`],
    ];
    return {
      topic: cleanTopic,
      courses,
      edges: pairs.map(([sourceId, targetId]) => ({
        sourceId,
        targetId,
        sourceCode: sourceId,
        targetCode: targetId,
      })),
    };
  }

  const isLang = isLanguageOrHumanitiesTopic(cleanTopic);

  const courses: GeneratedCourse[] = isLang
    ? [
        {
          id: `${prefix}101`,
          code: `${prefix}101`,
          title: `${cleanTopic}: Grammar, Syntax & Core Foundations`,
          studyHours: scaleHours(15),
          difficulty: scaleDiff(1),
        },
        {
          id: `${prefix}102`,
          code: `${prefix}102`,
          title: `${cleanTopic}: Essential Vocabulary & Reading Comprehension`,
          studyHours: scaleHours(20),
          difficulty: scaleDiff(2),
        },
        {
          id: `${prefix}201`,
          code: `${prefix}201`,
          title: `${cleanTopic}: Paragraph Composition & Clear Expression`,
          studyHours: scaleHours(25),
          difficulty: scaleDiff(2),
        },
        {
          id: `${prefix}202`,
          code: `${prefix}202`,
          title: `${cleanTopic}: Advanced Clause Structure & Stylistic Nuance`,
          studyHours: scaleHours(35),
          difficulty: scaleDiff(4),
        },
        {
          id: `${prefix}203`,
          code: `${prefix}203`,
          title: `${cleanTopic}: Active Listening & Conversational Fluency`,
          studyHours: scaleHours(20),
          difficulty: scaleDiff(2),
        },
        {
          id: `${prefix}301`,
          code: `${prefix}301`,
          title: `${cleanTopic}: Persuasive Writing & Rhetorical Structure`,
          studyHours: scaleHours(25),
          difficulty: scaleDiff(3),
        },
        {
          id: `${prefix}302`,
          code: `${prefix}302`,
          title: `${cleanTopic}: Critical Analysis, Tone & Interpretation`,
          studyHours: scaleHours(40),
          difficulty: scaleDiff(4),
        },
        {
          id: `${prefix}303`,
          code: `${prefix}303`,
          title: `${cleanTopic}: Academic & Professional Mastery`,
          studyHours: scaleHours(45),
          difficulty: scaleDiff(5),
        },
        {
          id: `${prefix}400`,
          code: `${prefix}400`,
          title: `${cleanTopic}: Comprehensive Portfolio Capstone`,
          studyHours: scaleHours(35),
          difficulty: scaleDiff(4),
        },
      ]
    : [
        {
          id: `${prefix}101`,
          code: `${prefix}101`,
          title: `${cleanTopic}: First Principles & Core Foundations`,
          studyHours: scaleHours(15),
          difficulty: scaleDiff(1),
        },
        {
          id: `${prefix}102`,
          code: `${prefix}102`,
          title: `${cleanTopic}: Essential Concepts & Methods`,
          studyHours: scaleHours(20),
          difficulty: scaleDiff(2),
        },
        {
          id: `${prefix}201`,
          code: `${prefix}201`,
          title: `Applied ${cleanTopic} Practice & Case Studies`,
          studyHours: scaleHours(25),
          difficulty: scaleDiff(2),
        },
        {
          id: `${prefix}202`,
          code: `${prefix}202`,
          title: `${cleanTopic}: Deep Theory & Analytical Models`,
          studyHours: scaleHours(35),
          difficulty: scaleDiff(4),
        },
        {
          id: `${prefix}203`,
          code: `${prefix}203`,
          title: `${cleanTopic}: Practical Workflows & Technique`,
          studyHours: scaleHours(20),
          difficulty: scaleDiff(2),
        },
        {
          id: `${prefix}301`,
          code: `${prefix}301`,
          title: `${cleanTopic}: Guided Project & Synthesis`,
          studyHours: scaleHours(25),
          difficulty: scaleDiff(3),
        },
        {
          id: `${prefix}302`,
          code: `${prefix}302`,
          title: `${cleanTopic}: Advanced Strategy & Critique`,
          studyHours: scaleHours(40),
          difficulty: scaleDiff(4),
        },
        {
          id: `${prefix}303`,
          code: `${prefix}303`,
          title: `${cleanTopic}: Expert Mastery & Specialization`,
          studyHours: scaleHours(45),
          difficulty: scaleDiff(5),
        },
        {
          id: `${prefix}400`,
          code: `${prefix}400`,
          title: `${cleanTopic}: Comprehensive Mastery Capstone`,
          studyHours: scaleHours(35),
          difficulty: scaleDiff(4),
        },
      ];

  // Multi-branch DAG with 5 distinct Pareto routes across depths 3, 4, 5, 6, and 7:
  // - Depth 3 (Ultra-Express): 101 -> 301 -> 400
  // - Depth 4 (Express):       101 -> 203 -> 301 -> 400
  // - Depth 5 (Balanced):      101 -> 102 -> 201 -> 301 -> 400
  // - Depth 6 (Deep):          101 -> 102 -> 202 -> 302 -> 303 -> 400
  // - Depth 7 (Full Mastery):  101 -> 102 -> 201 -> 202 -> 302 -> 303 -> 400
  const pairs: Array<[string, string]> = [
    [`${prefix}101`, `${prefix}301`],
    [`${prefix}101`, `${prefix}102`],
    [`${prefix}101`, `${prefix}203`],
    [`${prefix}102`, `${prefix}201`],
    [`${prefix}102`, `${prefix}202`],
    [`${prefix}201`, `${prefix}202`],
    [`${prefix}203`, `${prefix}301`],
    [`${prefix}201`, `${prefix}301`],
    [`${prefix}202`, `${prefix}302`],
    [`${prefix}302`, `${prefix}303`],
    [`${prefix}301`, `${prefix}400`],
    [`${prefix}303`, `${prefix}400`],
  ];

  const edges: GeneratedEdge[] = pairs.map(([sourceId, targetId]) => ({
    sourceId,
    targetId,
    sourceCode: sourceId,
    targetCode: targetId,
  }));

  return { topic: cleanTopic, courses, edges };
}

function wouldCreateCycle(
  adj: Map<string, string[]>,
  from: string,
  to: string,
): boolean {
  if (from === to) return true;
  const visited = new Set<string>();
  const stack = [to];
  while (stack.length > 0) {
    const curr = stack.pop()!;
    if (curr === from) return true;
    if (visited.has(curr)) continue;
    visited.add(curr);
    for (const next of adj.get(curr) ?? []) {
      stack.push(next);
    }
  }
  return false;
}

function extractJsonObject(raw: string): string {
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

export function sanitizeGeneratedCurriculum(
  rawText: string,
  topic: string,
): Omit<GeneratedCurriculum, "fallback"> | null {
  const cleaned = extractJsonObject(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as { courses?: unknown; edges?: unknown };
  if (!Array.isArray(record.courses) || record.courses.length < 3) return null;

  const courses: GeneratedCourse[] = [];
  const seenIds = new Set<string>();

  for (const item of record.courses.slice(0, 14)) {
    if (!item || typeof item !== "object") continue;
    const c = item as Record<string, unknown>;
    const rawCode = String(c.code ?? c.id ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "");
    const title = String(c.title ?? c.name ?? "").trim();
    if (!rawCode || !title || seenIds.has(rawCode)) continue;

    const studyHours = Math.max(
      5,
      Math.min(100, Math.round(Number(c.studyHours ?? c.study_hours ?? 25) || 25)),
    );
    const difficulty = Math.max(
      1,
      Math.min(5, Math.round(Number(c.difficulty ?? 3) || 3)),
    );

    seenIds.add(rawCode);
    courses.push({
      id: rawCode,
      code: rawCode,
      title,
      studyHours,
      difficulty,
    });
  }

  if (courses.length < 3) return null;

  const adj = new Map<string, string[]>();
  const edges: GeneratedEdge[] = [];
  const seenEdges = new Set<string>();

  if (Array.isArray(record.edges)) {
    for (const item of record.edges) {
      if (!item || typeof item !== "object") continue;
      const e = item as Record<string, unknown>;
      const sourceId = String(
        e.sourceId ?? e.from ?? e.from_id ?? e.source ?? e.prereq ?? "",
      )
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, "");
      const targetId = String(
        e.targetId ?? e.to ?? e.to_id ?? e.target ?? e.dependent ?? "",
      )
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, "");
      const edgeKey = `${sourceId}->${targetId}`;
      if (
        !seenIds.has(sourceId) ||
        !seenIds.has(targetId) ||
        seenEdges.has(edgeKey) ||
        wouldCreateCycle(adj, sourceId, targetId)
      ) {
        continue;
      }
      seenEdges.add(edgeKey);
      const list = adj.get(sourceId) ?? [];
      list.push(targetId);
      adj.set(sourceId, list);
      edges.push({
        sourceId,
        targetId,
        sourceCode: sourceId,
        targetCode: targetId,
      });
    }
  }

  if (edges.length === 0) {
    for (let i = 0; i < courses.length - 1; i++) {
      edges.push({
        sourceId: courses[i].id,
        targetId: courses[i + 1].id,
        sourceCode: courses[i].code,
        targetCode: courses[i + 1].code,
      });
    }
  }

  return { topic: topic.trim(), courses, edges };
}
