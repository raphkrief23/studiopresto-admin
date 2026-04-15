export interface PipelineRun {
  status: "running" | "completed" | "failed";
  step: number;
  output: string;
  slug?: string;
  error?: string;
}

// Global store that persists across API route calls in the same process
const globalForPipeline = globalThis as unknown as {
  __pipelineRuns: Map<string, PipelineRun> | undefined;
};

export const pipelineRuns =
  globalForPipeline.__pipelineRuns ?? new Map<string, PipelineRun>();

if (!globalForPipeline.__pipelineRuns) {
  globalForPipeline.__pipelineRuns = pipelineRuns;
}
