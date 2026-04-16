import { NextRequest, NextResponse } from "next/server";
import { deleteRepo, deleteVercelProject } from "@/lib/github";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 1. Delete Vercel project (and its domains)
    try {
      await deleteVercelProject(slug);
      console.log(`[delete] Vercel project ${slug} deleted`);
    } catch (err) {
      console.error(`[delete] Vercel delete failed:`, err);
    }

    // 2. Delete GitHub repo
    await deleteRepo(slug);
    console.log(`[delete] GitHub repo ${slug} deleted`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
