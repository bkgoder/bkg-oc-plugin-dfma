import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const source = path.join(root, "assets", "opencode");
const target =
  process.env.OPENCODE_CONFIG_DIR ??
  path.join(os.homedir(), ".config", "opencode");

async function copyDir(src, dst) {
  await fs.mkdir(dst, { recursive: true });
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      await copyDir(from, to);
    } else {
      await fs.copyFile(from, to);
    }
  }
}

async function main() {
  try {
    await copyDir(source, target);
    console.log(`Installed BKG OpenCode assets to ${target}`);
    console.log("Restart OpenCode after installing assets.");
  } catch (error) {
    console.error("Failed to install OpenCode assets:", error);
    process.exit(1);
  }
}

main();
