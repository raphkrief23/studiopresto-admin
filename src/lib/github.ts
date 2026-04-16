import { Octokit } from "octokit";

function getOctokit() {
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

const GITHUB_USER = process.env.GITHUB_USER || "raphkrief23";

const EXCLUDED_REPOS = [
  "studiopresto-admin",
  "pipeline-restaurant",
];

export async function listRepos() {
  const octokit = getOctokit();
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "pushed",
    per_page: 100,
  });

  return data
    .filter((repo) => !EXCLUDED_REPOS.includes(repo.name) && !repo.archived)
    .map((repo) => ({
      name: repo.name,
      slug: repo.name,
      updatedAt: repo.pushed_at || repo.updated_at || "",
      url: `https://${repo.name}.agencepresto.com`,
    }));
}

export async function archiveRepo(slug: string): Promise<void> {
  const octokit = getOctokit();
  await octokit.rest.repos.update({
    owner: GITHUB_USER,
    repo: slug,
    archived: true,
  });
}

export async function deleteVercelProject(slug: string): Promise<void> {
  const teamId = process.env.VERCEL_TEAM_ID;
  const token = process.env.VERCEL_TOKEN;
  await fetch(
    `https://api.vercel.com/v9/projects/${slug}?teamId=${teamId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

export async function getRepoTree(slug: string): Promise<string[]> {
  const octokit = getOctokit();
  try {
    const { data } = await octokit.rest.git.getTree({
      owner: GITHUB_USER,
      repo: slug,
      tree_sha: "main",
      recursive: "1",
    });
    return data.tree
      .filter((item) => item.type === "blob" && item.path)
      .map((item) => item.path as string)
      .filter(
        (p) =>
          !p.includes("node_modules") &&
          !p.startsWith("dist/") &&
          !p.startsWith(".git/")
      );
  } catch {
    return [];
  }
}

const TEXT_EXTENSIONS = [
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".css",
  ".html",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".svg",
];

export async function getFileContent(
  slug: string,
  path: string
): Promise<string | null> {
  const octokit = getOctokit();
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: GITHUB_USER,
      repo: slug,
      path,
    });
    if ("content" in data && data.encoding === "base64") {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSiteFiles(
  slug: string
): Promise<Record<string, string>> {
  const tree = await getRepoTree(slug);
  const relevantFiles = tree.filter((p) => {
    const ext = "." + p.split(".").pop();
    return TEXT_EXTENSIONS.includes(ext) && !p.includes("node_modules");
  });

  // Prioritize component files and key config
  const priority = [
    "src/components/",
    "src/pages/",
    "src/index.css",
    "src/App.tsx",
    "tailwind.config.ts",
    "index.html",
  ];

  const sorted = relevantFiles.sort((a, b) => {
    const aPrio = priority.findIndex((p) => a.startsWith(p) || a === p);
    const bPrio = priority.findIndex((p) => b.startsWith(p) || b === p);
    return (bPrio >= 0 ? 1 : 0) - (aPrio >= 0 ? 1 : 0);
  });

  // Limit to ~30 files to stay within context limits
  const filesToFetch = sorted.slice(0, 30);

  const files: Record<string, string> = {};
  const results = await Promise.all(
    filesToFetch.map(async (path) => {
      const content = await getFileContent(slug, path);
      return { path, content };
    })
  );

  for (const { path, content } of results) {
    if (content !== null) {
      files[path] = content;
    }
  }

  return files;
}

export async function commitFiles(
  slug: string,
  files: { path: string; content: string }[],
  message: string
): Promise<string> {
  const octokit = getOctokit();

  // Get the latest commit SHA on main
  const { data: ref } = await octokit.rest.git.getRef({
    owner: GITHUB_USER,
    repo: slug,
    ref: "heads/main",
  });
  const latestCommitSha = ref.object.sha;

  // Get the tree SHA of the latest commit
  const { data: commit } = await octokit.rest.git.getCommit({
    owner: GITHUB_USER,
    repo: slug,
    commit_sha: latestCommitSha,
  });
  const baseTreeSha = commit.tree.sha;

  // Create blobs for each file
  const blobs = await Promise.all(
    files.map(async (file) => {
      const { data: blob } = await octokit.rest.git.createBlob({
        owner: GITHUB_USER,
        repo: slug,
        content: file.content,
        encoding: "utf-8",
      });
      return {
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      };
    })
  );

  // Create a new tree
  const { data: newTree } = await octokit.rest.git.createTree({
    owner: GITHUB_USER,
    repo: slug,
    base_tree: baseTreeSha,
    tree: blobs,
  });

  // Create the commit
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner: GITHUB_USER,
    repo: slug,
    message,
    tree: newTree.sha,
    parents: [latestCommitSha],
  });

  // Update the reference
  await octokit.rest.git.updateRef({
    owner: GITHUB_USER,
    repo: slug,
    ref: "heads/main",
    sha: newCommit.sha,
  });

  return newCommit.sha;
}
