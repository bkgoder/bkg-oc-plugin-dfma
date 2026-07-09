import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const source = path.join(root, "assets", "opencode");
const target = process.env.OPENCODE_CONFIG_DIR ?? path.join(os.homedir(), ".config", "opencode");
const pluginPath = process.env.OPENCODE_PLUGIN_PATH ?? path.join(root, "dist", "src", "plugin.js");
const opencodeJsonPath = path.join(target, "opencode.json");

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

async function updateOpenCodeJson() {
  try {
    const raw = await fs.readFile(opencodeJsonPath, "utf8");
    const config = JSON.parse(raw);
    const pluginRef = `file://${pluginPath}`;
    const plugins = Array.isArray(config.plugin) ? config.plugin : [];
    const hasPlugin = plugins.some((p) => {
      if (typeof p === "string") return p === pluginRef;
      if (p && typeof p === "object" && p.path) return p.path === pluginRef;
      return false;
    });
    if (!hasPlugin) {
      plugins.push(pluginRef);
      config.plugin = plugins;
      await fs.writeFile(opencodeJsonPath, JSON.stringify(config, null, 2) + "\n", "utf8");
      console.log(`Updated ${opencodeJsonPath} with plugin reference: ${pluginRef}`);
    } else {
      console.log(`Plugin reference already present in ${opencodeJsonPath}`);
    }
  } catch (error) {
    console.error("Failed to update opencode.json:", error);
  }
}

async function main() {
  try {
    await copyDir(source, target);
    console.log(`Installed BKG OpenCode assets to ${target}`);
    await updateOpenCodeJson();
    console.log("Restart OpenCode after installing assets.");
  } catch (error) {
    console.error("Failed to install OpenCode assets:", error);
    process.exit(1);
  }
}

main();
