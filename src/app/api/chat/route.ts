import { NextRequest } from "next/server";
import { getSiteFiles } from "@/lib/github";
import { buildSystemPrompt, callClaude } from "@/lib/claude";
import { slugToName } from "@/lib/utils";

interface ImagePayload {
  base64: string;
  mediaType: string;
}

export async function POST(request: NextRequest) {
  try {
    const { slug, messages, images } = (await request.json()) as {
      slug: string;
      messages: { role: string; content: string }[];
      images?: ImagePayload[];
    };

    if (!slug || !messages?.length) {
      return new Response("Missing slug or messages", { status: 400 });
    }

    // 1. Fetch site files from GitHub
    const files = await getSiteFiles(slug);
    const siteName = slugToName(slug);
    const siteUrl = `https://${slug}.agencepresto.com`;

    // 2. Build system prompt with all file contents
    const systemPrompt = buildSystemPrompt(siteName, siteUrl, files);

    console.log(`[chat] slug=${slug}, messages=${messages.length}, images=${images?.length ?? 0}`);
    if (images?.length) {
      console.log(`[chat] Image sizes: ${images.map((i) => Math.round(i.base64.length / 1024) + "KB").join(", ")}`);
    }

    // 3. Build the message list, adding images as base64 to the last user message
    const apiMessages = messages.map((m, i) => {
      if (
        i === messages.length - 1 &&
        m.role === "user" &&
        images &&
        images.length > 0
      ) {
        return {
          role: m.role,
          content: [
            ...images.map((img) => ({
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: img.mediaType,
                data: img.base64,
              },
            })),
            { type: "text" as const, text: m.content },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

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
