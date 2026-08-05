import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateManifest } from "../lib/manifest";

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error("Usage: npm run import:release -- <manifest.json> [--commit]");
  const manifest = validateManifest(JSON.parse(await readFile(resolve(path), "utf8")));
  const artifactCount = manifest.images.reduce((sum, image) => sum + image.artifacts.length, 0);
  console.log(`Validated ${manifest.collection.slug} v${manifest.release.version}`);
  console.log(`${manifest.images.length} image records · ${artifactCount} artifacts`);
  if (process.argv.includes("--commit")) {
    throw new Error("Commit requires the deployment storage adapter and DATABASE_URL; validation completed without writes.");
  }
  console.log("Dry run complete. No database or object-storage changes were made.");
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
