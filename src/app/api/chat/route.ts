import { NextRequest } from "next/server";
import { getSiteFiles } from "@/lib/github";
import { buildSystemPrompt, callClaude } from "@/lib/claude";
import { slugToName } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { slug, messages, images } = await request.json();

    if (!slug || !messages?.length) {
      return new Response("Missing slug or messages", { status: 400 });
    }

    // 1. Fetch site files from GitHub
    const files = await getSiteFiles(slug);
    const siteName = slugToName(slug);
    const siteUrl = `https://${slug}.agencepresto.com`;

    // 2. Build system prompt with all file contents
    const systemPrompt = buildSystemPrompt(siteName, siteUrl, files);

    // 3. Build the message list, adding images to the last user message if present
    const apiMessages = messages.map(
      (m: { role: string; content: string }, i: number) => {
        if (
          i === messages.length - 1 &&
          m.role === "user" &&
          images?.length > 0
        ) {
          return {
            role: m.role,
            content: [
              ...images.map((url: string) => ({
                type: "image",
                source: { type: "url", url },
              })),
              { type: "text", text: m.content },
            ],
          };
        }
        return { role: m.role, content: m.content };
      }
    );

    // 4. Call Claude API with streaming
    const stream = await callClaude(systemPrompt, apiMessages);

    // 5. Return the stream directly
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erreur interne",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
