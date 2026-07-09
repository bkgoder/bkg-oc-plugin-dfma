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

function parseFrontmatter(content) {
  const firstSep = content.indexOf("---");
  if (firstSep !== 0) return { _body: content.trim() };
  const secondSep = content.indexOf("---", 3);
  if (secondSep === -1) return { _body: content.trim() };
  const raw = content.slice(3, secondSep).trim();
  const result = {};
  const lines = raw.split("\n");
  for (const line of lines) {
    const m = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (m) {
      result[m[1]] = m[2].trim();
    }
  }
  result._body = content.slice(secondSep + 3).trim();
  return result;
}

async function updateOpenCodeJson() {
  try {
    const raw = await fs.readFile(opencodeJsonPath, "utf8");
    const config = JSON.parse(raw);

    // Update plugin reference
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
    }

    // Register agents
    const agentsDir = path.join(target, "agents");
    config.agent = config.agent || {};
    try {
      const agentFiles = await fs.readdir(agentsDir);
      for (const file of agentFiles.filter((f) => f.endsWith(".md"))) {
        const agentId = path.basename(file, ".md");
        const content = await fs.readFile(path.join(agentsDir, file), "utf8");
        const fm = parseFrontmatter(content);
        if (!config.agent[agentId]) {
          config.agent[agentId] = {
            description: fm.description || `Agent ${agentId}`,
            mode: fm.mode || "subagent",
            temperature: typeof fm.temperature === "number" ? fm.temperature : 0.2,
          };
        }
      }
    } catch (error) {
      console.warn("Could not register agents:", error.message);
    }

    // Register skills
    const skillsDir = path.join(target, "skills");
    config.skill = config.skill || {};
    try {
      const skillDirs = await fs.readdir(skillsDir);
      for (const skillDir of skillDirs) {
        const skillPath = path.join(skillsDir, skillDir);
        try {
          const stat = await fs.stat(skillPath);
          if (stat.isDirectory()) {
            config.skill[skillDir] = {
              path: skillPath,
            };
          }
        } catch {}
      }
    } catch (error) {
      console.warn("Could not register skills:", error.message);
    }

    // Add permissions for BKG tools
    config.permission = config.permission || {};
    config.permission.bash = config.permission.bash || {};
    const bashRules = config.permission.bash;
    const bkgCommands = [
      "./bkg-zero*", "./bkg-brain*", "./bkg-hit*", "./bkg-some*", "./bkg-ever*", "./bkg-fucker*",
      "npm run typecheck*", "npm run test*", "npm run build*", "npm run ci*",
      "npm run install:assets*", "npm run dashboard:start*",
      "node scripts/install-assets.js*", "tsx scripts/install-assets.ts*",
    ];
    for (const cmd of bkgCommands) {
      if (!bashRules[cmd]) {
        bashRules[cmd] = "allow";
      }
    }

    await fs.writeFile(opencodeJsonPath, JSON.stringify(config, null, 2) + "\n", "utf8");
    console.log(`Updated ${opencodeJsonPath}`);
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
