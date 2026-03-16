import path from "path";
import { fileURLToPath } from "url";
import { rm, mkdir, writeFile } from "fs/promises";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildAll() {
  const distDir = path.resolve(__dirname, "dist");
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  const root = path.resolve(__dirname, "..", "..");
  const pythonApiDir = path.resolve(root, "artifacts", "python-api");

  console.log("installing Python dependencies...");
  execSync("pip install -r requirements.txt", {
    cwd: pythonApiDir,
    stdio: "inherit",
  });

  console.log("writing production entry point...");
  const entryScript = `
const { execSync } = require("child_process");
const path = require("path");

const port = process.env.PORT || "8080";
const apiDir = path.resolve(__dirname, "..", "..", "python-api");

process.env.REPLIT_DEPLOYMENT = "1";

console.log("Starting WordSniffer API on port " + port + "...");
execSync(
  "uvicorn main:app --host 0.0.0.0 --port " + port,
  { cwd: apiDir, stdio: "inherit", env: { ...process.env, REPLIT_DEPLOYMENT: "1" } }
);
`.trim();

  await writeFile(path.resolve(distDir, "index.cjs"), entryScript);
  console.log("build complete");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
