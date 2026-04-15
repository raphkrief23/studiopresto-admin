import { createHash } from "crypto";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { execSync } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";

const VERCEL_TOKEN = process.env.VERCEL_TOKEN!;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID!;
const GITHUB_USER = process.env.GITHUB_USER || "raphkrief23";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const VERCEL_BASE_DOMAIN = "agencepresto.com";

interface FileMeta {
  file: string;
  data: Buffer;
  sha1: string;
  size: number;
}

function collectFiles(dir: string): FileMeta[] {
  const files: FileMeta[] = [];
  function walk(current: string) {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else {
        const data = readFileSync(full);
        const sha1 = createHash("sha1").update(data).digest("hex");
        files.push({
          file: relative(dir, full),
          data,
          sha1,
          size: data.length,
        });
      }
    }
  }
  walk(dir);
  return files;
}

export async function redeploysite(slug: string): Promise<string> {
  const headers = {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  };

  // 1. Clone repo into temp dir
  const tmpDir = mkdtempSync(join(tmpdir(), "sp-deploy-"));
  const repoUrl = `https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${slug}.git`;

  try {
    console.log(`[deploy] Cloning ${slug}...`);
    execSync(`git clone --depth 1 "${repoUrl}" "${tmpDir}/repo"`, {
      stdio: "pipe",
    });

    // 2. Install + build
    const repoDir = join(tmpDir, "repo");
    const bunBin = join(
      process.env.HOME || "/root",
      ".bun/bin/bun"
    );

    // Try bun first, fallback to npm
    try {
      console.log(`[deploy] Building with bun...`);
      execSync(
        `cd "${repoDir}" && ${bunBin} install --frozen-lockfile && ${bunBin} run build`,
        { stdio: "pipe", timeout: 180000 }
      );
    } catch {
      console.log(`[deploy] Bun failed, trying npm...`);
      execSync(
        `cd "${repoDir}" && npm install && npm run build`,
        { stdio: "pipe", timeout: 180000 }
      );
    }

    const distDir = join(repoDir, "dist");
    console.log(`[deploy] Build done, collecting files...`);

    // 3. Collect dist files
    const filesMeta = collectFiles(distDir);

    // 4. Create or get project
    let projectId: string | undefined;
    const projResp = await fetch(
      `https://api.vercel.com/v9/projects?teamId=${VERCEL_TEAM_ID}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ name: slug, framework: "vite" }),
      }
    );
    if (projResp.status === 409) {
      const getResp = await fetch(
        `https://api.vercel.com/v9/projects/${slug}?teamId=${VERCEL_TEAM_ID}`,
        { headers }
      );
      const getJson = await getResp.json();
      projectId = getJson.id;
    } else {
      const projJson = await projResp.json();
      projectId = projJson.id;
    }

    // 5. Upload files
    for (const fm of filesMeta) {
      await fetch(
        `https://api.vercel.com/v2/files?teamId=${VERCEL_TEAM_ID}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${VERCEL_TOKEN}`,
            "Content-Type": "application/octet-stream",
            "x-vercel-digest": fm.sha1,
            "Content-Length": String(fm.size),
          },
          body: new Uint8Array(fm.data),
        }
      );
    }

    // 6. Create deployment
    const deployFiles = filesMeta.map((fm) => ({
      file: fm.file,
      sha: fm.sha1,
      size: fm.size,
    }));

    const deployResp = await fetch(
      `https://api.vercel.com/v13/deployments?teamId=${VERCEL_TEAM_ID}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: slug,
          files: deployFiles,
          builds: [{ src: "**/*", use: "@vercel/static" }],
          routes: [
            { handle: "filesystem" },
            { src: "/(.*)", dest: "/index.html" },
          ],
          target: "production",
        }),
      }
    );

    if (!deployResp.ok) {
      const errText = await deployResp.text();
      throw new Error(`Vercel deploy failed: ${deployResp.status} — ${errText}`);
    }

    const deployJson = await deployResp.json();
    const deployUrl = deployJson.url;
    console.log(`[deploy] Deployed: https://${deployUrl}`);

    // 7. Ensure domain alias
    if (projectId) {
      const customDomain = `${slug}.${VERCEL_BASE_DOMAIN}`;
      await fetch(
        `https://api.vercel.com/v9/projects/${projectId}/domains?teamId=${VERCEL_TEAM_ID}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ name: customDomain }),
        }
      );
    }

    return `https://${slug}.${VERCEL_BASE_DOMAIN}`;
  } finally {
    // Cleanup
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}
