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
    max_study_hours?: number;
    max_difficulty?: number;
    max_depth?: number;
  };
}

export interface OptimizerResponse {
  pareto_frontier: unknown[];
  express_path: unknown | null;
  deep_mastery_path: unknown | null;
}

function optimizerUrl(path: string) {
  const baseUrl = (process.env.OPTIMIZER_URL ?? "http://127.0.0.1:8080").replace(
    /\/$/,
    "",
  );
  return `${baseUrl}${path}`;
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
) {
  const response = await fetch(optimizerUrl("/api/v1/optimize"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as
      | { error?: string }
      | null;
    throw new Error(body?.error ?? `Optimizer request failed: ${response.status}`);
  }

  return response.json() as Promise<OptimizerResponse>;
}
