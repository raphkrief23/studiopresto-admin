import type { FileChange } from "@/types";

/**
 * Parse Claude's response to extract file change blocks.
 * Format: ===FILE: path/to/file===\ncontent\n===END FILE===
 */
export function parseFileChanges(text: string): FileChange[] {
  const changes: FileChange[] = [];
  const regex = /===FILE:\s*(.+?)===\n([\s\S]*?)===END FILE===/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const path = match[1].trim();
    const content = match[2].trimEnd();
    changes.push({ path, content });
  }

  return changes;
}

/**
 * Remove file change blocks from Claude's response to get just the explanation text.
 */
export function extractExplanation(text: string): string {
  return text
    .replace(/===FILE:\s*.+?===\n[\s\S]*?===END FILE===/g, "")
    .trim();
}
