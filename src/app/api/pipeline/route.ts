import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { pipelineRuns } from "@/lib/pipeline-store";

const STEP_MARKERS = [
  { marker: "Recuperation des donnees", step: 0 },
  { marker: "Telechargement", step: 2 },
  { marker: "menu", step: 1 },
  { marker: "texte", step: 3 },
  { marker: "Vercel", step: 4 },
  { marker: "Pipeline terminee", step: 5 },
];

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL manquante" }, { status: 400 });
    }

    const runId = uuidv4();
    const pipelineDir =
      process.env.PIPELINE_DIR ||
      "/Users/raphaelkrief/Desktop/Pipeline restaurant";

    pipelineRuns.set(runId, { status: "running", step: 0, output: "" });

    const child = spawn("python3", ["pipeline.py", url], {
      cwd: pipelineDir,
      env: { ...process.env },
    });

    let fullOutput = "";

    child.stdout.on("data", (data: Buffer) => {
      const text = data.toString();
      fullOutput += text;
      const run = pipelineRuns.get(runId);
      if (run) {
        run.output = fullOutput;
        for (const { marker, step } of STEP_MARKERS) {
          if (fullOutput.includes(marker) && step > run.step) {
            run.step = step;
          }
        }
        const siteMatch = fullOutput.match(
          /Site\s*:\s*https?:\/\/([^.]+)\.agencepresto\.com/
        );
        if (siteMatch) run.slug = siteMatch[1];
      }
    });

    child.stderr.on("data", (data: Buffer) => {
      fullOutput += data.toString();
      const run = pipelineRuns.get(runId);
      if (run) run.output = fullOutput;
    });

    child.on("close", (code: number | null) => {
      const run = pipelineRuns.get(runId);
      if (run) {
        if (code === 0) {
          run.status = "completed";
          run.step = 5;
        } else {
          run.status = "failed";
          run.error = `Pipeline exited with code ${code}`;
        }
      }
    });

    child.on("error", (err: Error) => {
      const run = pipelineRuns.get(runId);
      if (run) {
        run.status = "failed";
        run.error = err.message;
      }
    });

    return NextResponse.json({ runId });
  } catch (error) {
    console.error("Pipeline error:", error);
    return NextResponse.json(
      { error: "Erreur lors du lancement de la pipeline" },
      { status: 500 }
    );
  }
}
