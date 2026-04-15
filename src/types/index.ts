export interface Site {
  name: string;
  slug: string;
  updatedAt: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  modifiedFiles?: FileChange[];
  timestamp: number;
}

export interface FileChange {
  path: string;
  content: string;
}

export interface PipelineRun {
  id: string;
  url: string;
  status: "running" | "completed" | "failed";
  step: number;
  output: string;
  slug?: string;
}
