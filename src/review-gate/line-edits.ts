import type { ReviewLineEdit } from "./types.js"

export function withLineNumbers(content: string): string {
  return content
    .split(/\r?\n/)
    .map((line, index) => `${String(index + 1).padStart(4, " ")} | ${line}`)
    .join("\n")
}

export function validateLineEdits(edits: ReviewLineEdit[]): ReviewLineEdit[] {
  return edits.map((edit) => {
    const start = edit.start
    const end = edit.end ?? start
    if (!edit.target.trim()) throw new Error("Line edit target is required.")
    if (!edit.comment.trim()) throw new Error("Line edit comment is required.")
    if (start !== undefined && (!Number.isInteger(start) || start < 1)) {
      throw new Error(`Invalid start line for ${edit.target}.`)
    }
    if (end !== undefined && (!Number.isInteger(end) || end < (start ?? 1))) {
      throw new Error(`Invalid end line for ${edit.target}.`)
    }
    return { ...edit, start, end }
  })
}
