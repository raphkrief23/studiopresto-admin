import { NextRequest, NextResponse } from "next/server";
import { pipelineRuns } from "@/lib/pipeline-store";

export async function GET(request: NextRequest) {
  const runId = request.nextUrl.searchParams.get("runId");

  if (!runId) {
    return NextResponse.json({ error: "runId manquant" }, { status: 400 });
  }

  const run = pipelineRuns.get(runId);

  if (!run) {
    return NextResponse.json({ error: "Run non trouve" }, { status: 404 });
  }

  return NextResponse.json({
    status: run.status,
    step: run.step,
    slug: run.slug,
    error: run.error,
  });
}
