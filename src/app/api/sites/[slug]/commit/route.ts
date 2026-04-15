import { NextRequest, NextResponse } from "next/server";
import { commitFiles } from "@/lib/github";
import { redeploysite } from "@/lib/vercel";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { files, message } = await request.json();

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier a modifier" },
        { status: 400 }
      );
    }

    // 1. Commit to GitHub
    const commitSha = await commitFiles(
      slug,
      files,
      message || "Update via StudioPresto Admin"
    );
    console.log(`[commit] SHA: ${commitSha}`);

    // 2. Re-deploy to Vercel (clone, build, upload)
    let deployUrl = "";
    try {
      deployUrl = await redeploysite(slug);
      console.log(`[commit] Deployed: ${deployUrl}`);
    } catch (err) {
      console.error("[commit] Deploy failed:", err);
      // Return success for the commit even if deploy fails
      return NextResponse.json({
        sha: commitSha,
        success: true,
        deployed: false,
        error: "Commit OK mais le deploiement a echoue. Relancez manuellement.",
      });
    }

    return NextResponse.json({
      sha: commitSha,
      success: true,
      deployed: true,
      url: deployUrl,
    });
  } catch (error) {
    console.error("Commit error:", error);
    return NextResponse.json(
      { error: "Erreur lors du commit" },
      { status: 500 }
    );
  }
}
