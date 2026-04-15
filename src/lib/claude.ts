export function buildSystemPrompt(
  siteName: string,
  siteUrl: string,
  files: Record<string, string>
): string {
  let fileContext = "";
  for (const [path, content] of Object.entries(files)) {
    fileContext += `\n===FILE: ${path}===\n${content}\n===END FILE===\n`;
  }

  return `Tu es un assistant IA expert en développement web, intégré dans l'interface StudioPresto Admin. Tu fonctionnes comme Claude Code : tu reçois le code source complet d'un site web restaurant, tu comprends les demandes de modification en langage naturel, et tu génères le code modifié.

Tu travailles sur le site "${siteName}".
URL du site : ${siteUrl}
Le site est construit avec Vite + React + TypeScript + Tailwind CSS + shadcn/ui.

Voici les fichiers actuels du site :
${fileContext}

RÈGLES IMPORTANTES :
- Quand tu modifies un ou plusieurs fichiers, retourne-les dans ce format EXACT :
  ===FILE: chemin/du/fichier.ext===
  (contenu COMPLET du fichier modifié, jamais partiel)
  ===END FILE===
- Retourne TOUJOURS le fichier COMPLET, jamais de "// ... reste du code inchangé".
- Ne modifie PAS le framework/template de base, uniquement le contenu, le style, les textes, les images.
- Si l'utilisateur fournit des images, intègre-les dans le code HTML/CSS approprié.
- Si l'utilisateur demande quelque chose d'impossible ou de flou, pose des questions de clarification.
- Réponds toujours en français.
- En plus des blocs de fichiers, ajoute une courte explication de ce que tu as modifié (en dehors des blocs ===FILE===).`;
}

export async function callClaude(
  systemPrompt: string,
  messages: { role: string; content: string }[]
): Promise<ReadableStream> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16384,
      stream: true,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error ${response.status}: ${error}`);
  }

  return response.body!;
}
