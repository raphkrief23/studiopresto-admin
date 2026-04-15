import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "octokit";

const GITHUB_USER = process.env.GITHUB_USER || "raphkrief23";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { images } = (await request.json()) as {
      images: { base64: string; mediaType: string }[];
    };

    if (!images?.length) {
      return NextResponse.json({ error: "No images" }, { status: 400 });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    // Find the next available photo number in src/assets/gallery/
    let existingFiles: string[] = [];
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: GITHUB_USER,
        repo: slug,
        path: "src/assets/gallery",
      });
      if (Array.isArray(data)) {
        existingFiles = data.map((f) => f.name);
      }
    } catch {
      // Gallery dir might not exist, that's OK
    }

    // Find next number
    const existingNumbers = existingFiles
      .map((f) => {
        const match = f.match(/photo(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((n) => n > 0);
    let nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

    const paths: string[] = [];

    for (const image of images) {
      const ext = image.mediaType.includes("png") ? "png" : "jpg";
      const filename = `photo${nextNumber}.${ext}`;
      const path = `src/assets/gallery/${filename}`;

      // Commit the image file to the repo
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: GITHUB_USER,
        repo: slug,
        path,
        message: `Add ${filename} via StudioPresto Admin`,
        content: image.base64,
        branch: "main",
      });

      paths.push(path);
      nextNumber++;
      console.log(`[upload-image] Committed ${path} to ${slug}`);
    }

    return NextResponse.json({ paths, success: true });
  } catch (error) {
    console.error("Upload image error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload de l'image" },
      { status: 500 }
    );
  }
}
