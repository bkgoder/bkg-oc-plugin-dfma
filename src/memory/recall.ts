import type { ExternalRecallAdapter } from "./types.js"

const registeredAdapters: Map<string, ExternalRecallAdapter> = new Map()

export function registerRecallAdapter(adapter: ExternalRecallAdapter): void {
  registeredAdapters.set(adapter.name, adapter)
}

export function getRecallAdapter(name: string): ExternalRecallAdapter | undefined {
  return registeredAdapters.get(name)
}

export function listRecallAdapters(): ExternalRecallAdapter[] {
  return Array.from(registeredAdapters.values())
}

export async function recallFromExternal(query: string, adapterName?: string, context?: Record<string, unknown>): Promise<string | null> {
  if (adapterName) {
    const adapter = registeredAdapters.get(adapterName)
    if (!adapter) throw new Error(`Recall adapter "${adapterName}" not found`)
    return adapter.recall(query, context)
  }
  for (const adapter of registeredAdapters.values()) {
    const result = await adapter.recall(query, context)
    if (result) return result
  }
  return null
}
