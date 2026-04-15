import { NextResponse } from "next/server";
import { listRepos } from "@/lib/github";

export async function GET() {
  try {
    const repos = await listRepos();
    return NextResponse.json(repos);
  } catch (error) {
    console.error("Error listing repos:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des sites" },
      { status: 500 }
    );
  }
}
