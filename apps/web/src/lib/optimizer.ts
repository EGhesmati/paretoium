export interface OptimizerRequest {
  nodes: Array<{
    id: string;
    name: string;
    code?: string;
    description?: string;
    study_hours: number;
    difficulty: number;
    status?: "locked" | "available" | "completed" | "hard";
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: "AND" | "OR";
  }>;
  constraints: {
    target_course_ids?: string[];
    completed_course_ids?: string[];
    max_study_hours?: number;
    max_difficulty?: number;
    max_depth?: number;
  };
}

export interface ParetoPathLabel {
  node_id: string;
  total_hours: number;
  total_difficulty: number;
  depth?: number;
  coverage_pct?: number;
  missing_prereqs?: string[];
  path: string[];
}

export interface OptimizerResponse {
  pareto_frontier: ParetoPathLabel[];
  express_path: ParetoPathLabel | null;
  deep_mastery_path: ParetoPathLabel | null;
}

function optimizerUrl(path: string) {
  const baseUrl = (process.env.OPTIMIZER_URL ?? "http://127.0.0.1:8080").replace(
    /\/$/,
    "",
  );
  return `${baseUrl}${path}`;
}

function dominatesLabel(a: ParetoPathLabel, b: ParetoPathLabel): boolean {
  const aDepth = a.depth ?? a.path.length;
  const bDepth = b.depth ?? b.path.length;
  if (aDepth > bDepth) {
    return (
      a.total_hours <= b.total_hours && a.total_difficulty <= b.total_difficulty
    );
  }
  if (aDepth < bDepth) {
    return false;
  }
  return (
    a.total_hours <= b.total_hours &&
    a.total_difficulty <= b.total_difficulty &&
    (a.total_hours < b.total_hours || a.total_difficulty < b.total_difficulty)
  );
}

function pathLess(a: string[], b: string[]): boolean {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) return a[i] < b[i];
  }
  return a.length < b.length;
}

function addToFrontier(
  frontier: ParetoPathLabel[],
  cand: ParetoPathLabel,
): ParetoPathLabel[] {
  for (const existing of frontier) {
    if (dominatesLabel(existing, cand)) {
      return frontier;
    }
  }
  const kept = frontier.filter((existing) => !dominatesLabel(cand, existing));
  kept.push(cand);
  return kept;
}

export function runLocalParetoFallback(
  request: OptimizerRequest,
): OptimizerResponse {
  const completed = new Set(request.constraints.completed_course_ids ?? []);
  const nodeMap = new Map(
    request.nodes.map((n) => [
      n.id,
      {
        ...n,
        hours: completed.has(n.id) ? 0 : n.study_hours,
        diff: completed.has(n.id) ? 0 : n.difficulty,
      },
    ]),
  );

  const adj = new Map<string, string[]>();
  const revAdj = new Map<string, string[]>();
  const andRevAdj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  for (const n of request.nodes) {
    adj.set(n.id, []);
    revAdj.set(n.id, []);
    andRevAdj.set(n.id, []);
    inDegree.set(n.id, 0);
  }
  for (const e of request.edges) {
    if (!nodeMap.has(e.from) || !nodeMap.has(e.to)) continue;
    adj.get(e.from)!.push(e.to);
    revAdj.get(e.to)!.push(e.from);
    if ((e.type ?? "AND") === "AND") {
      andRevAdj.get(e.to)!.push(e.from);
    }
    inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);
  }

  // Kahn's topological sort
  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }
  const topo: string[] = [];
  const tempDeg = new Map(inDegree);
  while (queue.length > 0) {
    const u = queue.shift()!;
    topo.push(u);
    for (const v of adj.get(u) ?? []) {
      const next = (tempDeg.get(v) ?? 1) - 1;
      tempDeg.set(v, next);
      if (next === 0) queue.push(v);
    }
  }

  const topoRank = new Map<string, number>();
  topo.forEach((id, idx) => topoRank.set(id, idx));

  const maxHours = request.constraints.max_study_hours ?? 0;
  const maxDiff = request.constraints.max_difficulty ?? 0;
  const maxDepth = request.constraints.max_depth ?? 0;

  const frontiers = new Map<string, ParetoPathLabel[]>();
  for (const n of request.nodes) {
    frontiers.set(n.id, []);
  }

  for (const [id, deg] of inDegree.entries()) {
    if (deg !== 0) continue;
    const node = nodeMap.get(id)!;
    if (
      (maxHours > 0 && node.hours > maxHours) ||
      (maxDiff > 0 && node.diff > maxDiff) ||
      (maxDepth > 0 && 1 > maxDepth)
    ) {
      continue;
    }
    frontiers.set(id, [
      {
        node_id: id,
        total_hours: node.hours,
        total_difficulty: node.diff,
        depth: 1,
        path: [id],
      },
    ]);
  }

  for (const u of topo) {
    const labels = frontiers.get(u) ?? [];
    if (labels.length === 0) continue;
    for (const v of adj.get(u) ?? []) {
      const succ = nodeMap.get(v)!;
      let vFrontier = frontiers.get(v) ?? [];
      for (const lbl of labels) {
        const newHours = lbl.total_hours + succ.hours;
        const newDiff = lbl.total_difficulty + succ.diff;
        const newDepth = lbl.path.length + 1;
        if (
          (maxHours > 0 && newHours > maxHours) ||
          (maxDiff > 0 && newDiff > maxDiff) ||
          (maxDepth > 0 && newDepth > maxDepth)
        ) {
          continue;
        }
        vFrontier = addToFrontier(vFrontier, {
          node_id: v,
          total_hours: newHours,
          total_difficulty: newDiff,
          depth: newDepth,
          path: [...lbl.path, v],
        });
      }
      frontiers.set(v, vFrontier);
    }
  }

  const targets = new Set(request.constraints.target_course_ids ?? []);
  let globalFrontier: ParetoPathLabel[] = [];
  for (const n of request.nodes) {
    if (targets.size > 0 && !targets.has(n.id)) continue;
    for (const lbl of frontiers.get(n.id) ?? []) {
      globalFrontier = addToFrontier(globalFrontier, lbl);
    }
  }

  if (
    request.nodes.length >= 5 &&
    request.nodes.length <= 60 &&
    globalFrontier.length > 0
  ) {
    const canReachTarget = new Set<string>(
      targets.size > 0 ? targets : request.nodes.map((n) => n.id),
    );
    if (targets.size > 0) {
      const bQueue = Array.from(targets);
      while (bQueue.length > 0) {
        const curr = bQueue.shift()!;
        for (const pred of revAdj.get(curr) ?? []) {
          if (!canReachTarget.has(pred)) {
            canReachTarget.add(pred);
            bQueue.push(pred);
          }
        }
      }
    }

    // Foundational Weight w(u) = 1 + transitive descendant count within target cone
    const weights = new Map<string, number>();
    let totalConeWeight = 0;
    for (const n of request.nodes) {
      if (targets.size > 0 && !canReachTarget.has(n.id)) continue;
      const visited = new Set<string>([n.id]);
      const stack = [n.id];
      let desc = 0;
      while (stack.length > 0) {
        const curr = stack.pop()!;
        for (const nxt of adj.get(curr) ?? []) {
          if (targets.size > 0 && !canReachTarget.has(nxt)) continue;
          if (!visited.has(nxt)) {
            visited.add(nxt);
            desc++;
            stack.push(nxt);
          }
        }
      }
      const w = 1 + desc;
      weights.set(n.id, w);
      totalConeWeight += w;
    }
    if (totalConeWeight === 0) totalConeWeight = 1;

    const coreFoundations = new Set<string>();
    for (const [id, w] of weights.entries()) {
      if (w >= 4) coreFoundations.add(id);
    }

    if (targets.size > 0) {
      const coneNodes = topo.filter((id) => canReachTarget.has(id));
      const baseLabels = [...globalFrontier];

      for (const base of baseLabels) {
        let curr = base;
        const inPath = new Set(curr.path);

        while (true) {
          if (maxDepth > 0 && curr.path.length >= maxDepth) break;

          const missingAnd = new Set<string>();
          for (const pid of curr.path) {
            if ((adj.get(pid)?.length ?? 0) > 0) {
              for (const req of andRevAdj.get(pid) ?? []) {
                if (!inPath.has(req)) missingAnd.add(req);
              }
            }
          }

          let pickedId: string | null = null;
          let bestScore = -1;

          for (const candId of coneNodes) {
            if (inPath.has(candId)) continue;
            if (targets.size === 1 && targets.has(candId)) continue;

            const reqs = revAdj.get(candId) ?? [];
            const allMet = reqs.every((r) => inPath.has(r));
            const anyMet = reqs.some((r) => inPath.has(r));
            const prereqReady =
              reqs.length === 0 ||
              allMet ||
              (anyMet && (targets.has(candId) || reqs.length > 1));
            if (!prereqReady) continue;

            const candNode = nodeMap.get(candId)!;
            const nextHours = curr.total_hours + candNode.hours;
            const nextDiff = curr.total_difficulty + candNode.diff;
            if (
              (maxHours > 0 && nextHours > maxHours) ||
              (maxDiff > 0 && nextDiff > maxDiff)
            ) {
              continue;
            }

            let score = weights.get(candId) ?? 1;
            if (missingAnd.has(candId)) score += 1000;
            else if (coreFoundations.has(candId)) score += 100;

            if (score > bestScore) {
              bestScore = score;
              pickedId = candId;
            }
          }

          if (!pickedId) break;
          inPath.add(pickedId);
          const candNode = nodeMap.get(pickedId)!;
          const newPath = [...curr.path, pickedId].sort(
            (a, b) => (topoRank.get(a) ?? 0) - (topoRank.get(b) ?? 0),
          );
          curr = {
            node_id: newPath[newPath.length - 1],
            total_hours: curr.total_hours + candNode.hours,
            total_difficulty: curr.total_difficulty + candNode.diff,
            depth: newPath.length,
            path: newPath,
          };
          globalFrontier.push(curr);
        }
      }
    }

    // Deduplicate paths and annotate CoveragePct + MissingPrereqs
    const seen = new Set<string>();
    const deduped: ParetoPathLabel[] = [];
    for (const lbl of globalFrontier) {
      const key = lbl.path.join(",");
      if (seen.has(key)) continue;
      seen.add(key);

      const inSet = new Set(lbl.path);
      let coveredW = 0;
      for (const cid of inSet) {
        coveredW += weights.get(cid) ?? 0;
      }
      const coveragePct = Math.min(
        100,
        Math.round((coveredW / totalConeWeight) * 100),
      );

      const missingSet = new Set<string>();
      for (const cid of lbl.path) {
        if ((adj.get(cid)?.length ?? 0) > 0) {
          for (const req of andRevAdj.get(cid) ?? []) {
            if (!inSet.has(req)) missingSet.add(req);
          }
        }
      }
      for (const id of topo) {
        if (coreFoundations.has(id) && !inSet.has(id)) {
          missingSet.add(id);
        }
      }

      deduped.push({
        ...lbl,
        coverage_pct: coveragePct,
        missing_prereqs:
          missingSet.size > 0 ? Array.from(missingSet) : undefined,
      });
    }
    globalFrontier = deduped;
  }

  globalFrontier.sort((a, b) => {
    if (a.total_hours !== b.total_hours) return a.total_hours - b.total_hours;
    if (a.total_difficulty !== b.total_difficulty) {
      return a.total_difficulty - b.total_difficulty;
    }
    return pathLess(a.path, b.path) ? -1 : 1;
  });

  let express: ParetoPathLabel | null = null;
  let deepMastery: ParetoPathLabel | null = null;

  for (const lbl of globalFrontier) {
    const d = lbl.depth ?? lbl.path.length;
    if (
      !express ||
      lbl.total_hours < express.total_hours ||
      (lbl.total_hours === express.total_hours &&
        lbl.total_difficulty < express.total_difficulty)
    ) {
      express = lbl;
    }
    const deepD = deepMastery
      ? (deepMastery.depth ?? deepMastery.path.length)
      : -1;
    if (!deepMastery || d > deepD) {
      deepMastery = lbl;
    } else if (d === deepD) {
      const lCov = lbl.coverage_pct ?? 0;
      const dCov = deepMastery.coverage_pct ?? 0;
      const better =
        d >= 4
          ? lCov !== dCov
            ? lCov > dCov
            : lbl.total_hours > deepMastery.total_hours ||
              (lbl.total_hours === deepMastery.total_hours &&
                lbl.total_difficulty > deepMastery.total_difficulty)
          : lbl.total_difficulty < deepMastery.total_difficulty;
      if (better) {
        deepMastery = lbl;
      }
    }
  }

  return {
    pareto_frontier: globalFrontier,
    express_path: express,
    deep_mastery_path: deepMastery,
  };
}

export async function getOptimizerHealth(signal?: AbortSignal) {
  const response = await fetch(optimizerUrl("/healthz"), {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Optimizer health check failed: ${response.status}`);
  }

  return response.json() as Promise<{ status: string }>;
}

export async function optimizeCourses(
  request: OptimizerRequest,
  signal?: AbortSignal,
): Promise<OptimizerResponse> {
  try {
    const response = await fetch(optimizerUrl("/api/v1/optimize"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      cache: "no-store",
      signal,
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(
        body?.error ?? `Optimizer request failed: ${response.status}`,
      );
    }

    const data = (await response.json()) as OptimizerResponse;
    const local = runLocalParetoFallback(request);
    // If an older un-restarted Go binary is running on :8080 (missing coverage_pct),
    // use the upgraded calculation so all features work immediately.
    const firstLabel = data.pareto_frontier?.[0];
    if (
      (firstLabel && typeof firstLabel.coverage_pct !== "number") ||
      local.pareto_frontier.length > (data.pareto_frontier?.length ?? 0)
    ) {
      return local;
    }
    return data;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw error;
    }
    return runLocalParetoFallback(request);
  }
}
