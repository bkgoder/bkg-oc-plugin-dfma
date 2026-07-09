import { describe, expect, it } from "vitest"
import { defaultUpdateNotifierConfig } from "../src/update-notifier/checker.js"
import { extractPinnedPluginsFromConfig, parsePinnedPlugin } from "../src/update-notifier/parser.js"

describe("parsePinnedPlugin", () => {
  it("parses unscoped pinned npm plugin refs", () => {
    expect(parsePinnedPlugin("octto@1.2.3")).toMatchObject({
      name: "octto",
      currentVersion: "1.2.3",
      kind: "npm",
    })
  })

  it("parses scoped pinned npm plugin refs", () => {
    expect(parsePinnedPlugin("@plannotator/opencode@0.22.0")).toMatchObject({
      name: "@plannotator/opencode",
      currentVersion: "0.22.0",
      kind: "npm",
    })
  })

  it("ignores unpinned and local refs", () => {
    expect(parsePinnedPlugin("octto")).toBeNull()
    expect(parsePinnedPlugin("./local-plugin")).toBeNull()
  })

  it("extracts pinned refs from plugin config", () => {
    const refs = extractPinnedPluginsFromConfig({
      plugin: ["octto@1.2.3", "local-plugin", "@scope/pkg@2.0.0"],
    })
    expect(refs).toHaveLength(2)
  })
})

describe("defaultUpdateNotifierConfig", () => {
  it("checks both opencode JSON config variants", () => {
    const config = defaultUpdateNotifierConfig({
      HOME: "/home/tester",
      OPENCODE_CONFIG_DIR: "/tmp/opencode-config",
    })

    expect(config.configPaths).toEqual([
      "/tmp/opencode-config/opencode.json",
      "/tmp/opencode-config/opencode.jsonc",
    ])
    expect(config.cachePath).toContain("bkg-oc-plugin-bkg-dfma")
  })
})
